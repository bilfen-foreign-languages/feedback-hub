/* ============================================================================
   HANDS-FREE WINDOW  -  while hands-free is running, the questions open in their own
   window as a row of glass cards. Saying "next question" slides to the next card,
   "previous question" slides back. The answers you speak appear live on the card.
   While you speak, the bottom of the screen glows in the site's colours and grows
   with your voice. When you submit (or stop), the window closes and everything is
   on the normal feedback form, exactly as before.

   This file only WATCHES the form: it never changes how hands-free works.

   Turn it off:       config.js -> handsFreeWindow: { enabled: false }
   Glow only off:     config.js -> handsFreeWindow: { glow: false }
   ========================================================================== */
(function () {
  "use strict";
  var CFG = (window.IPT_CONFIG && window.IPT_CONFIG.handsFreeWindow) || {};
  if (CFG.enabled === false) return;
  var GLOW = CFG.glow !== false;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  var KEYS = ["worked", "challenge", "plan", "pulse", "notes", "final"];      // the six cards, in order
  var NUMBER = [1, 2, 3, 4, 5, null];                                          // "Question n of 5"
  var SCORES = [["overall", "Overall rating"], ["resources", "Teaching resources"], ["engagement", "Student engagement"], ["clarity", "Objectives clarity"]];
  var ACCENT = { year5: ["#c4b5fd", "#7c3aed"], year6: ["#fff15d", "#35c9f4"], year7: ["#52d9ca", "#658ff1"] };
  var HINTS = {
    text:   [["next question", "go on"], ["previous question", "go back"], ["stop hands-free", "switch off"]],
    scores: [["overall four", ""], ["resources three", ""], ["engagement five", ""], ["clarity four", ""], ["next question", "when done"]],
    final:  [["submit feedback", "send it"], ["previous question", "review"], ["stop hands-free", ""]]
  };

  /* ---------- styles ---------- */
  var css =
    ".hfw{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;visibility:hidden;opacity:0;--lvl:.1;--a:#52d9ca;--b:#658ff1;" +
      "font-family:'Work Sans',system-ui,sans-serif;color:#eef5ff;transition:opacity .45s ease,visibility 0s linear .45s;overscroll-behavior:contain;touch-action:none}" +
    ".hfw.on{visibility:visible;opacity:1;transition:opacity .45s ease,visibility 0s}" +
    ".hfw-back{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,rgba(23,48,103,.94),rgba(3,12,40,.97) 70%);" +
      "-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}" +
    /* the voice glow along the bottom edge */
    ".hfw-glow{position:absolute;left:-8%;right:-8%;bottom:0;height:96vh;pointer-events:none;transform-origin:50% 100%;" +
      "transform:scaleY(calc(.4 + var(--lvl)*.8));opacity:calc(.3 + var(--lvl)*.42);will-change:transform,opacity;overflow:visible}" +
    ".hfw-glow i{position:absolute;inset:0;display:block;filter:blur(54px) saturate(1.25);mix-blend-mode:screen;animation:hfwDrift 9s ease-in-out infinite alternate;" +
      "background:radial-gradient(58% 92% at 14% 110%,#52d9ca 0,rgba(82,217,202,0) 78%),radial-gradient(56% 96% at 44% 114%,var(--b) 0,rgba(101,143,241,0) 78%)," +
      "radial-gradient(52% 90% at 74% 110%,#a183ee 0,rgba(161,131,238,0) 78%),radial-gradient(44% 84% at 94% 110%,var(--a) 0,rgba(255,243,123,0) 76%)}" +
    ".hfw-glow i+i{animation-duration:13s;animation-direction:alternate-reverse;opacity:.65;filter:blur(80px) saturate(1.3)}" +
    ".hfw-edge{position:absolute;left:0;right:0;bottom:0;height:calc(3px + var(--lvl)*7px);pointer-events:none;opacity:calc(.55 + var(--lvl)*.45);" +
      "background:linear-gradient(90deg,#52d9ca,var(--b),#a183ee,var(--a),#52d9ca);background-size:300% 100%;animation:hfwSlide 6s linear infinite;" +
      "box-shadow:0 0 calc(10px + var(--lvl)*34px) rgba(121,235,221,.8)}" +
    "@keyframes hfwDrift{from{transform:translateX(-7%) scaleX(1)}to{transform:translateX(7%) scaleX(1.12)}}" +
    "@keyframes hfwSlide{to{background-position:300% 0}}" +
    /* header, stage, footer */
    ".hfw-top{position:relative;display:flex;align-items:center;gap:.8rem;padding:calc(14px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px))}" +
    ".hfw-badge{display:inline-flex;align-items:center;gap:.55rem;padding:.4rem .85rem;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.26);font:700 12.5px/1 'Montserrat','Work Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase}" +
    ".hfw-dot{width:9px;height:9px;border-radius:50%;background:#ff6b73;animation:hfwPulse 1.5s infinite}" +
    "@keyframes hfwPulse{0%{box-shadow:0 0 0 0 rgba(255,107,115,.75)}70%,100%{box-shadow:0 0 0 10px rgba(255,107,115,0)}}" +
    ".hfw-step{flex:1;min-width:0;font-weight:600;font-size:15px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".hfw-stop{flex:none;padding:.5rem 1.05rem;border-radius:999px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.14);color:#fff;font:700 14px 'Work Sans',sans-serif;cursor:pointer;touch-action:manipulation}" +
    ".hfw-stop:hover{background:rgba(255,255,255,.26)}.hfw-stop:focus-visible{outline:2px solid var(--a);outline-offset:3px}" +
    ".hfw-stage{position:relative;flex:1;min-height:0;perspective:1400px}" +
    ".hfw-card{position:absolute;left:50%;top:50%;width:min(640px,86vw);max-height:68%;display:flex;flex-direction:column;gap:.7rem;padding:clamp(1.1rem,3vw,1.8rem);border-radius:28px;" +
      "background:linear-gradient(160deg,rgba(255,255,255,.17),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.28);" +
      "-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 24px 60px rgba(1,8,30,.5);will-change:transform,opacity;" +
      "transition:transform .65s cubic-bezier(.2,.8,.2,1),opacity .5s ease,filter .5s ease,box-shadow .5s ease,border-color .5s ease}" +
    ".hfw-card.now{border-color:var(--a);box-shadow:0 0 0 1.5px var(--a),0 0 calc(30px + var(--lvl)*60px) rgba(121,235,221,.35),0 24px 60px rgba(1,8,30,.5)}" +
    ".hfw-card.pre{transition:none}" +
    ".hfw-n{font:700 12.5px/1 'Montserrat','Work Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--a)}" +
    ".hfw-card h3{margin:0;font:700 clamp(20px,3.4vw,27px)/1.25 'Montserrat','Work Sans',sans-serif;color:#fff;text-wrap:balance}" +
    ".hfw-body{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;position:relative}" +
    ".hfw-card.t .hfw-body{min-height:7.5rem;max-height:34vh}" +
    ".hfw-text{margin:0;font-size:clamp(17px,2.6vw,20px);line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;color:#f4f8ff}" +
    ".hfw-text.empty{color:rgba(238,245,255,.5);font-style:italic}" +
    ".hfw-caret{display:inline-block;width:2px;height:1.15em;margin-left:3px;vertical-align:-.2em;background:var(--a);animation:hfwBlink 1s steps(2) infinite}" +
    "@keyframes hfwBlink{50%{opacity:0}}" +
    ".hfw-sc{display:grid;gap:.75rem}" +
    ".hfw-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.4rem .9rem}" +
    ".hfw-row b{font-weight:600;font-size:16px}" +
    ".hfw-pips{display:flex;gap:.35rem}" +
    ".hfw-pip{width:30px;height:12px;border-radius:999px;background:rgba(255,255,255,.16);transition:background .35s,box-shadow .35s,transform .35s}" +
    ".hfw-pip.on{background:linear-gradient(90deg,var(--a),var(--b));box-shadow:0 0 12px rgba(121,235,221,.55)}" +
    ".hfw-row.dflt .hfw-pip.on{opacity:.45;box-shadow:none}" +
    ".hfw-pip.pop{transform:scaleY(1.7)}" +
    ".hfw-list{margin:0;padding:0;list-style:none;display:grid;gap:.5rem}" +
    ".hfw-list li{display:flex;align-items:center;gap:.65rem;font-size:17px}" +
    ".hfw-tick{flex:none;width:22px;height:22px;border-radius:50%;display:inline-grid;place-items:center;font-size:13px;font-weight:800;border:1.5px solid rgba(255,255,255,.4);color:transparent;transition:all .35s}" +
    ".hfw-list li.ok .hfw-tick{background:linear-gradient(135deg,var(--a),var(--b));border-color:transparent;color:#06214e}" +
    ".hfw-warn{margin:.2rem 0 0;padding:.5rem .75rem;border-radius:12px;background:rgba(255,224,138,.14);border:1px solid rgba(255,224,138,.5);color:#ffeeb8;font-size:15px}" +
    ".hfw-sendbox{display:none;flex-direction:column;align-items:center;gap:.7rem;padding:.4rem 0;text-align:center}" +
    ".hfw-card.sending .hfw-list,.hfw-card.sending .hfw-warn,.hfw-card.sending .hfw-say{display:none}" +
    ".hfw-card.sending .hfw-sendbox{display:flex}" +
    ".hfw-spin{width:46px;height:46px;border-radius:50%;border:4px solid rgba(255,255,255,.2);border-top-color:var(--a);animation:hfwSpin .9s linear infinite}" +
    "@keyframes hfwSpin{to{transform:rotate(360deg)}}" +
    ".hfw-say{margin:0;font-size:16px;color:rgba(238,245,255,.85)}.hfw-say b{color:#fff}" +
    ".hfw-foot{position:relative;display:flex;flex-direction:column;align-items:center;gap:.7rem;padding:0 max(16px,env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}" +
    ".hfw-dots{display:flex;gap:.5rem}" +
    ".hfw-d{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.28);transition:all .4s}" +
    ".hfw-d.done{background:rgba(255,255,255,.7)}.hfw-d.now{width:30px;border-radius:999px;background:linear-gradient(90deg,var(--a),var(--b))}" +
    ".hfw-hint{display:flex;flex-wrap:wrap;justify-content:center;gap:.45rem;margin:0;padding:0;list-style:none}" +
    ".hfw-hint li{padding:.34rem .7rem;border-radius:12px;background:rgba(3,12,40,.55);border:1px solid rgba(255,255,255,.2);font-size:14px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}" +
    ".hfw-hint b{color:#fff;font-weight:700}.hfw-hint small{margin-left:.35rem;color:rgba(238,245,255,.65);font-size:12px}" +
    ".hfw-msg{min-height:1.4rem;margin:0;font-weight:600;font-size:15px;color:#9cf0c8;text-shadow:0 1px 8px rgba(0,0,0,.5);transition:opacity .3s}" +
    "@media(max-width:560px){.hfw-hint small{display:none}.hfw-pip{width:24px}.hfw-card{width:88vw;max-height:72%}}" +
    "@media(max-height:560px){.hfw-hint{display:none}}" +
    "@media(prefers-reduced-motion:reduce){.hfw,.hfw-card{transition:none}.hfw-glow i,.hfw-edge,.hfw-dot,.hfw-caret{animation:none}.hfw-glow{transform:scaleY(.55);opacity:.5}}" +
    "body.hfw-open .hfc{display:none!important}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- the window ---------- */
  var root = null, cards = [], dots = [], stepEl, hintEl, msgEl, glowEl;
  var cur = 0, y = null, isOpen = false, sending = false, sendTimer = 0, closeTimer = 0, msgTimer = 0, touchedClarity = false;
  var $ = function (id) { return document.getElementById(id); };
  var g = function (key) { return y ? $(y + "-" + key) : null; };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function labelOf(key) {
    var l = document.querySelector('label[for="' + y + "-" + key + '"]');
    return l ? l.textContent.replace(/\s*\*\s*$/, "").replace(/\s+/g, " ").trim() : "";
  }
  function build() {
    root = el("div", "hfw"); root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Hands-free feedback");
    root.appendChild(el("div", "hfw-back"));
    if (GLOW) {
      glowEl = el("div", "hfw-glow"); glowEl.setAttribute("aria-hidden", "true"); glowEl.append(el("i"), el("i")); root.appendChild(glowEl);
      var edge = el("div", "hfw-edge"); edge.setAttribute("aria-hidden", "true"); root.appendChild(edge);
    }
    var top = el("div", "hfw-top");
    var badge = el("span", "hfw-badge"); badge.append(el("span", "hfw-dot"), document.createTextNode("Hands-free"));
    stepEl = el("span", "hfw-step");
    var stop = el("button", "hf-btn hfw-stop", "Stop"); stop.type = "button";            // "hf-btn" keeps the site's own click rule from ending hands-free twice
    stop.addEventListener("click", stopHandsFree);
    top.append(badge, stepEl, stop); root.appendChild(top);

    var stage = el("div", "hfw-stage"); root.appendChild(stage);
    KEYS.forEach(function (k, i) {
      var c = el("div", "hfw-card" + (k === "pulse" || k === "final" ? "" : " t")); c.dataset.k = k;
      c.setAttribute("aria-hidden", "true");
      c.append(el("div", "hfw-n"), el("h3"), el("div", "hfw-body"));
      stage.appendChild(c); cards.push(c);
    });
    var foot = el("div", "hfw-foot");
    msgEl = el("p", "hfw-msg"); msgEl.setAttribute("aria-hidden", "true");
    var dwrap = el("div", "hfw-dots"); KEYS.forEach(function () { var d = el("span", "hfw-d"); dwrap.appendChild(d); dots.push(d); });
    hintEl = el("ul", "hfw-hint");
    foot.append(msgEl, dwrap, hintEl); root.appendChild(foot);

    root.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
    root.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    document.body.appendChild(root);
  }

  /* ---------- filling the cards from the real form ---------- */
  function val(key) { var e = g(key); return e ? String(e.value || "") : ""; }
  function fillStatic() {
    cards.forEach(function (c, i) {
      var k = KEYS[i], n = NUMBER[i];
      c.querySelector(".hfw-n").textContent = n ? "Question " + n + " of 5" : "All done";
      c.querySelector("h3").textContent = k === "pulse" ? "Quick pulse check" : k === "final" ? "Ready to submit" : labelOf(k);
      var body = c.querySelector(".hfw-body"); body.textContent = "";
      if (k === "pulse") {
        var wrap = el("div", "hfw-sc"); body.appendChild(wrap);
        SCORES.forEach(function (s) {
          var row = el("div", "hfw-row"); row.dataset.s = s[0];
          var pips = el("span", "hfw-pips"); for (var p = 1; p <= 5; p++) pips.appendChild(el("span", "hfw-pip"));
          row.append(el("b", null, s[1]), pips); wrap.appendChild(row);
        });
      } else if (k === "final") {
        var ul = el("ul", "hfw-list");
        [["worked", "What worked well"], ["challenge", "What didn’t work"], ["plan", "The next plan"], ["pulse", "The four scores"], ["notes", "One more thought"]].forEach(function (r) {
          var li = el("li"); li.dataset.r = r[0]; li.append(el("span", "hfw-tick", "✓"), el("span", null, r[1])); ul.appendChild(li);
        });
        body.append(ul, el("p", "hfw-warn"));
        var say = el("p", "hfw-say"); say.innerHTML = "Say <b>“submit feedback”</b> to send it, or <b>“previous question”</b> to look it over."; say.style.marginTop = ".5rem"; body.appendChild(say);
        var sb = el("div", "hfw-sendbox"); sb.append(el("div", "hfw-spin"), el("p", "hfw-say", "Submitting your feedback…")); body.appendChild(sb);
      } else {
        var p = el("p", "hfw-text empty", "Start speaking…"); body.appendChild(p);
      }
    });
  }
  function fillValues() {
    cards.forEach(function (c, i) {
      var k = KEYS[i];
      if (k === "pulse") {
        SCORES.forEach(function (s) {
          var row = c.querySelector('.hfw-row[data-s="' + s[0] + '"]'), v = parseInt(val(s[0]), 10) || 0;
          var dflt = s[0] === "clarity" && !touchedClarity;
          row.classList.toggle("dflt", dflt && !!v);
          var was = row.dataset.v; row.dataset.v = v;
          row.querySelectorAll(".hfw-pip").forEach(function (pp, n) {
            pp.classList.toggle("on", n < v);
            if (was !== String(v) && n === v - 1) { pp.classList.add("pop"); setTimeout(function () { pp.classList.remove("pop"); }, 260); }
          });
        });
      } else if (k === "final") {
        var done = {
          worked: val("worked").trim(), challenge: val("challenge").trim(), plan: val("plan").trim(), notes: val("notes").trim(),
          pulse: val("overall") && val("resources") && val("engagement")
        };
        c.querySelectorAll("li").forEach(function (li) { li.classList.toggle("ok", !!done[li.dataset.r]); });
        var warn = c.querySelector(".hfw-warn"), noWeek = !val("week").trim();
        warn.hidden = !noWeek; warn.textContent = noWeek ? "The Week box at the top of the form is still empty. Please fill it in first." : "";
      } else {
        var t = val(k).trim(), p = c.querySelector(".hfw-text");
        p.classList.toggle("empty", !t);
        p.textContent = t || (i === cur ? "Start speaking…" : "Not answered yet");
        if (t && i === cur) p.appendChild(el("span", "hfw-caret"));
        else if (!t && i === cur) p.appendChild(el("span", "hfw-caret"));
      }
    });
  }

  /* ---------- sliding between the cards ---------- */
  function layout() {
    cards.forEach(function (c, i) {
      var d = i - cur, ad = Math.abs(d);
      var tx = d * (innerWidth < 640 ? 70 : 64), s = ad === 0 ? 1 : .84, o = ad === 0 ? 1 : ad === 1 ? .34 : 0;
      c.style.transform = "translate(-50%,-50%) translateX(" + tx + "%) " + (reduce ? "" : "rotateY(" + (-d * 14) + "deg) ") + "scale(" + s + ")";
      c.style.opacity = o; c.style.filter = ad === 0 ? "none" : "blur(2.5px)"; c.style.zIndex = String(10 - ad);
      c.style.pointerEvents = "none";
      c.classList.toggle("now", ad === 0);
      c.setAttribute("aria-hidden", ad === 0 ? "false" : "true");
    });
    var k = KEYS[cur];
    stepEl.textContent = NUMBER[cur] ? "Question " + NUMBER[cur] + " of 5" : "Ready to submit";
    dots.forEach(function (dd, i) { dd.className = "hfw-d" + (i < cur ? " done" : i === cur ? " now" : ""); });
    var list = HINTS[k === "pulse" ? "scores" : k === "final" ? "final" : "text"];
    hintEl.textContent = "";
    list.forEach(function (h) { var li = el("li"); li.append(el("b", null, "“" + h[0] + "”")); if (h[1]) li.append(el("small", null, h[1])); hintEl.appendChild(li); });
    fillValues();
    var live = cards[cur].querySelector(".hfw-text"); if (live) live.parentNode.scrollTop = 1e6;
  }
  function currentStep() {
    var a = document.querySelector(".hf-active");
    if (!a) return -1;
    if (/-pulse$/.test(a.id)) return 3;
    if (/-final$/.test(a.id)) return 5;
    var ta = a.querySelector("textarea"); if (!ta) return -1;
    var i = KEYS.indexOf(ta.id.replace(/^year\d-/, "")); return i;
  }

  /* ---------- the voice glow ---------- */
  var A = { raf: 0, ctx: null, stream: null, an: null, data: null, lvl: 0, pulse: 0, t0: 0, dead: true };
  function startAudio() {
    stopAudio(); A.dead = false; A.t0 = performance.now(); A.lvl = 0; A.pulse = 0;
    if (!GLOW) return;
    if (reduce) { root.style.setProperty("--lvl", ".25"); return; }
    if (!isMobile && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {        // phones: the microphone is busy with speech recognition, so pulses stand in
      var me = A;
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        if (me.dead || me !== A) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        A.stream = stream; A.ctx = new AC();
        A.an = A.ctx.createAnalyser(); A.an.fftSize = 512; A.an.smoothingTimeConstant = .6;
        A.ctx.createMediaStreamSource(stream).connect(A.an); A.data = new Uint8Array(A.an.fftSize);
      }).catch(function () {});
    }
    (function tick(now) {
      if (A.dead) return;
      var target = 0;
      if (A.an) {
        A.an.getByteTimeDomainData(A.data);
        var sum = 0; for (var i = 0; i < A.data.length; i++) { var v = (A.data[i] - 128) / 128; sum += v * v; }
        target = Math.min(1, Math.sqrt(sum / A.data.length) * 7);
      }
      A.lvl += (target - A.lvl) * (target > A.lvl ? .5 : .12);
      A.pulse *= .93;
      var idle = .1 + .05 * Math.sin((now - A.t0) / 650);                                      // a calm breathing glow while it listens
      root.style.setProperty("--lvl", Math.max(A.lvl, A.pulse, idle).toFixed(3));
      A.raf = requestAnimationFrame(tick);
    })(performance.now());
  }
  function stopAudio() {
    A.dead = true; cancelAnimationFrame(A.raf);
    try { A.stream && A.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { A.ctx && A.ctx.close(); } catch (e) {}
    A = { raf: 0, ctx: null, stream: null, an: null, data: null, lvl: 0, pulse: 0, t0: 0, dead: true };
  }

  /* ---------- open / close ---------- */
  function say(text) {
    if (!msgEl) return; msgEl.textContent = text; msgEl.style.opacity = text ? 1 : 0;
    clearTimeout(msgTimer); if (text) msgTimer = setTimeout(function () { msgEl.style.opacity = 0; }, 3200);
  }
  function openWin(year) {
    clearTimeout(closeTimer); clearTimeout(sendTimer);
    y = year; sending = false; touchedClarity = false;
    if (!root) build();
    var ac = ACCENT[y] || ACCENT.year7;
    root.style.setProperty("--a", ac[0]); root.style.setProperty("--b", ac[1]);
    cards.forEach(function (c) { c.classList.remove("sending", "sent"); });
    fillStatic();
    var s = currentStep(); cur = s < 0 ? 0 : s;
    layout();                                                                                   // fills the cards, then they start low and faded and rise into place
    cards.forEach(function (c) { c.classList.add("pre"); c.style.opacity = 0; c.style.transform = "translate(-50%,-50%) translateY(70px) scale(.9)"; });
    void root.offsetWidth;
    cards.forEach(function (c, i) { c.classList.remove("pre"); c.style.transitionDelay = (Math.abs(i - cur) * 70) + "ms"; });
    layout();
    setTimeout(function () { cards.forEach(function (c) { c.style.transitionDelay = ""; }); }, 900);
    isOpen = true; document.body.classList.add("hfw-open"); root.classList.add("on");
    startAudio(); say("");
  }
  function closeNow() {
    clearTimeout(closeTimer); clearTimeout(sendTimer);
    if (!isOpen) return;
    isOpen = false; sending = false;
    root.classList.remove("on"); document.body.classList.remove("hfw-open");
    closeTimer = setTimeout(function () { stopAudio(); }, 500);
  }
  function requestClose() {
    if (!isOpen) return;
    if (sending) { cards[5].classList.add("sending"); cur = 5; layout(); return; }          // wait to see how the submit went
    closeNow();
  }
  function stopHandsFree() {
    var panel = y && $(y + "-hf"), btn = y && $(y + "-hf-toggle");
    if (panel && panel.classList.contains("hf-running") && btn) btn.click();                    // the site's own button ends hands-free
    else closeNow();
  }

  /* ---------- watching the form ---------- */
  var queued = false;
  function sync() {
    queued = false;
    var run = document.querySelector(".hf-panel.hf-running");
    if (run) {
      var yr = run.id.replace(/-hf$/, "");
      if (!isOpen) openWin(yr);
      else { var s = currentStep(); if (s >= 0 && s !== cur) { cur = s; layout(); if (s === 5) say(""); } }
    } else if (isOpen) requestClose();
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(sync); } }
  new MutationObserver(queue).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  function onValue(e) {
    if (!isOpen || !y || !e.target || !e.target.id || e.target.id.indexOf(y + "-") !== 0) return;
    if (e.target.id === y + "-clarity") touchedClarity = true;
    A.pulse = Math.max(A.pulse, .85);                                                         // speech arriving: the glow flares (this is also what drives it on phones)
    fillValues();
    var live = cards[cur] && cards[cur].querySelector(".hfw-text"); if (live) live.parentNode.scrollTop = 1e6;
  }
  document.addEventListener("input", onValue, true);
  document.addEventListener("change", onValue, true);

  // The site's own messages ("Set: overall 4", "Finish the questions first...") show up briefly in the window too
  var statusObs = null;
  function watchStatus() {
    var els = document.querySelectorAll(".hf-status");
    els.forEach(function (s) {
      new MutationObserver(function () {
        if (!isOpen) return;
        var t = s.textContent.replace(/\s*Stop$/, "").trim();
        var m = /^Set: ([^.]*)\./.exec(t);
        if (m) say("Set: " + m[1]);
        else if (/^Finish the questions first/.test(t)) say("Finish the questions first, then say “submit feedback”.");
        else if (/^Say exactly/.test(t)) say("Say exactly “submit feedback” to send.");
      }).observe(s, { childList: true, characterData: true, subtree: true });
    });
  }
  watchStatus();

  // Submitting: keep the window for a moment so it can show "Submitting…", then "Thank you", then close
  document.addEventListener("submit", function (e) {
    if (!isOpen || !e.target || e.target.id !== y + "-form") return;
    sending = true;
    var status = $(y + "-status"), me = y;
    var finish = function () { if (!sending) return; sending = false; closeNow(); };       // the site shows its own thank-you card right behind
    if (document.querySelector(".hf-panel.hf-running")) { sending = false; return; }           // hands-free still running: nothing to wrap up yet
    cards[5].classList.add("sending"); cur = 5; layout();
    var obs = new MutationObserver(function () {
      var t = status ? status.textContent.trim() : "";
      if (!t || !sending) return;
      obs.disconnect(); finish();
    });
    if (status) obs.observe(status, { childList: true, characterData: true, subtree: true });
    clearTimeout(sendTimer); sendTimer = setTimeout(function () { obs.disconnect(); finish(); }, 9000);
    void me;
  }, true);

  document.addEventListener("keydown", function (e) { if (isOpen && e.key === "Escape") { e.preventDefault(); stopHandsFree(); } });
  window.addEventListener("resize", function () { if (isOpen) layout(); });
  window.addEventListener("pagehide", stopAudio);
})();
