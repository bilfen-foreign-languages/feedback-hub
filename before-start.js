/* ============================================================================
   BEFORE YOU START  -  a short guide card with a looping animated clip.
   It appears in the middle of the screen (page behind it blurred) the FIRST time
   a teacher opens a feedback form, and never again once they press "Got it".
   It can be watched again from the Help window.

   Turn it off: config.js -> beforeStart: { enabled: false }
   See it again yourself: add ?guide=1 to the site address, then open a form.
   ========================================================================== */
(function () {
  "use strict";
  var CFG = (window.IPT_CONFIG && window.IPT_CONFIG.beforeStart) || {};
  if (CFG.enabled === false) return;

  var KEY = "ipt-bys-seen";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  if (/[?&]guide=1/.test(location.search)) lsDel(KEY);

  var COLORS = {
    year5: ["#c4b5fd", "#7c3aed"],
    year6: ["#fff15d", "#35c9f4"],
    year7: ["#52d9ca", "#658ff1"]
  };

  /* ---------- styles ---------- */
  var st = document.createElement("style");
  st.textContent =
    ".bs-ov{position:fixed;inset:0;z-index:9700;display:grid;place-items:center;padding:1rem;background:rgba(2,12,39,.55);" +
      "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;transition:opacity .3s ease}" +
    "@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.bs-ov{background:rgba(2,12,39,.88)}}" +
    ".bs-ov.show{opacity:1}" +
    ".bs-card{position:relative;width:min(780px,100%);max-height:calc(100vh - 2rem);max-height:calc(100dvh - 2rem);overflow:auto;" +
      "border-radius:26px;padding:1.5rem 1.6rem 1.4rem;color:#eef5ff;font-family:'Work Sans',system-ui,sans-serif;" +
      "background:linear-gradient(160deg,rgba(14,34,86,.97),rgba(7,20,56,.97));border:1px solid rgba(255,255,255,.2);" +
      "box-shadow:0 30px 80px rgba(1,8,30,.6);transform:translateY(14px) scale(.97);transition:transform .35s cubic-bezier(.2,.8,.2,1)}" +
    ".bs-ov.show .bs-card{transform:none}" +
    ".bs-x{position:absolute;top:.7rem;right:.8rem;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);" +
      "color:#fff;font-size:22px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}" +
    ".bs-x:hover{background:rgba(255,255,255,.18);transform:none}" +
    ".bs-eyebrow{margin:0;font:700 12px/1 'Montserrat','Work Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--bs-a)}" +
    ".bs-card h2{margin:.45rem 2.4rem .3rem 0;font:800 clamp(24px,4.2vw,32px)/1.1 'Montserrat','Work Sans',sans-serif;color:#fff;text-wrap:balance}" +
    ".bs-lede{margin:0 0 1.1rem;font-size:15px;line-height:1.5;color:rgba(238,245,255,.8)}" +
    ".bs-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:1.4rem;align-items:start}" +
    "@media(max-width:720px){.bs-grid{grid-template-columns:minmax(0,1fr);gap:1rem}.bs-card{padding:1.25rem 1.1rem 1.2rem}.bs-go{position:sticky;bottom:0;box-shadow:0 -12px 18px 4px rgba(7,20,56,.97),0 10px 26px rgba(0,0,0,.3)}}" +
    ".bs-list{list-style:none;margin:0;padding:0;display:grid;gap:.85rem;counter-reset:bs}" +
    ".bs-list li{position:relative;padding-left:2.4rem;font-size:14.5px;line-height:1.45;color:rgba(238,245,255,.82);counter-increment:bs}" +
    ".bs-list li::before{content:counter(bs);position:absolute;left:0;top:.05rem;width:1.7rem;height:1.7rem;border-radius:50%;display:grid;place-items:center;" +
      "font:800 13px/1 'Montserrat',sans-serif;color:#06163f;background:linear-gradient(135deg,var(--bs-a),var(--bs-b))}" +
    ".bs-list b{display:block;color:#fff;font-size:15.5px;margin-bottom:.1rem}" +
    ".bs-list em{font-style:normal;color:var(--bs-a);font-weight:700}" +
    ".bs-go{display:block;width:100%;margin-top:1.2rem;padding:.85rem 1.2rem;border-radius:16px;border:0;cursor:pointer;font:800 16px 'Work Sans',system-ui,sans-serif;" +
      "color:#06163f;background:linear-gradient(135deg,var(--bs-a),var(--bs-b));box-shadow:0 10px 26px rgba(0,0,0,.3)}" +
    ".bs-go:hover{filter:brightness(1.07);transform:translateY(-1px)}" +
    ".bs-go:focus-visible,.bs-x:focus-visible{outline:3px solid #fff;outline-offset:3px}" +

    /* ---- the animated clip ---- */
    ".bs-clipwrap{--bs-d:15s;min-width:0}" +
    ".bs-clip{position:relative;width:100%;aspect-ratio:16/10;border-radius:18px;overflow:hidden;" +
      "background:radial-gradient(120% 100% at 20% 0%,rgba(255,255,255,.12),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.2)}" +
    ".bs-scene{position:absolute;inset:0;animation:bsScene var(--bs-d) linear infinite}" +
    ".bs-track{position:absolute;left:6%;right:6%;top:7%;height:4.5%;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden}" +
    ".bs-fill{position:absolute;inset:0 auto 0 0;width:0;border-radius:999px;background:linear-gradient(90deg,var(--bs-a),var(--bs-b));animation:bsFill var(--bs-d) linear infinite}" +
    ".bs-box{position:absolute;left:6%;top:19%;width:70%;height:50%;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2)}" +
    ".bs-ln{position:absolute;left:6%;height:11%;width:0;border-radius:999px;background:rgba(255,255,255,.62)}" +
    ".bs-l1{top:14%;animation:bsL1 var(--bs-d) linear infinite}" +
    ".bs-l2{top:38%;animation:bsL2 var(--bs-d) linear infinite}" +
    ".bs-l3{top:62%;background:var(--bs-a);animation:bsL3 var(--bs-d) linear infinite}" +
    ".bs-mic{position:absolute;left:80%;top:19%;width:14%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.14);" +
      "border:1px solid rgba(255,255,255,.3);animation:bsMic var(--bs-d) linear infinite}" +
    ".bs-mic svg{width:52%;height:52%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
    ".bs-rings{position:absolute;inset:0;opacity:0;animation:bsRingsOn var(--bs-d) linear infinite;pointer-events:none}" +
    ".bs-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--bs-a);animation:bsPulse 1.3s ease-out infinite}" +
    ".bs-ring:nth-child(2){animation-delay:.65s}" +
    ".bs-eq{position:absolute;left:80%;top:44%;width:14%;height:12%;display:flex;align-items:flex-end;justify-content:center;gap:9%;opacity:0;animation:bsRingsOn var(--bs-d) linear infinite}" +
    ".bs-eq i{display:block;width:13%;height:100%;border-radius:3px;background:var(--bs-a);transform-origin:bottom;animation:bsEq .7s ease-in-out infinite}" +
    ".bs-eq i:nth-child(2){animation-delay:.12s}.bs-eq i:nth-child(3){animation-delay:.24s}.bs-eq i:nth-child(4){animation-delay:.06s}" +
    ".bs-submit{position:absolute;right:6%;bottom:8%;width:36%;height:15%;border-radius:999px;display:grid;place-items:center;" +
      "background:linear-gradient(135deg,var(--bs-a),var(--bs-b));animation:bsSubmit var(--bs-d) linear infinite}" +
    ".bs-sl{position:absolute;width:56%;height:24%;border-radius:999px;background:rgba(6,22,63,.7);animation:bsLabel var(--bs-d) linear infinite}" +
    ".bs-ok{position:absolute;width:26%;opacity:0;color:#06163f;animation:bsOk var(--bs-d) linear infinite}" +
    ".bs-ok svg{display:block;width:100%;fill:none;stroke:currentColor;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}" +
    ".bs-sp{position:absolute;right:24%;bottom:15%;width:3%;aspect-ratio:1;border-radius:50%;background:var(--bs-a);opacity:0;animation:bsSpark var(--bs-d) linear infinite}" +
    ".bs-sp:nth-of-type(2n){background:#fff}.bs-sp:nth-of-type(3n){background:var(--bs-b)}" +
    ".bs-cur{position:absolute;left:40%;top:34%;width:7%;opacity:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));animation:bsCur var(--bs-d) linear infinite}" +
    ".bs-cur svg{display:block;width:100%}" +
    ".bs-caps{position:relative;height:3.3rem;margin-top:.7rem}" +
    ".bs-cap{position:absolute;inset:0;display:flex;gap:.6rem;align-items:flex-start;opacity:0;font-size:14.5px;line-height:1.4;color:#fff;animation:bsCap var(--bs-d) linear infinite backwards}" +
    ".bs-cap b{flex:none;width:1.5rem;height:1.5rem;border-radius:50%;display:grid;place-items:center;font:800 12px/1 'Montserrat',sans-serif;color:#06163f;background:var(--bs-a)}" +
    ".bs-cap:nth-child(2){animation-delay:calc(var(--bs-d) * .25)}" +
    ".bs-cap:nth-child(3){animation-delay:calc(var(--bs-d) * .5)}" +
    ".bs-cap:nth-child(4){animation-delay:calc(var(--bs-d) * .75)}" +
    ".bs-dots{display:flex;gap:.4rem;margin-top:.35rem}" +
    ".bs-dots i{flex:1;height:4px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;position:relative}" +
    ".bs-dots i::after{content:'';position:absolute;inset:0;background:var(--bs-a);transform:scaleX(0);transform-origin:left;animation:bsDot var(--bs-d) linear infinite backwards}" +
    ".bs-dots i:nth-child(2)::after{animation-delay:calc(var(--bs-d) * .25)}" +
    ".bs-dots i:nth-child(3)::after{animation-delay:calc(var(--bs-d) * .5)}" +
    ".bs-dots i:nth-child(4)::after{animation-delay:calc(var(--bs-d) * .75)}" +

    "@keyframes bsScene{0%{opacity:0}2%{opacity:1}95%{opacity:1}99%{opacity:0}100%{opacity:0}}" +
    "@keyframes bsL1{0%,2%{width:0}9%{width:88%}100%{width:88%}}" +
    "@keyframes bsL2{0%,9%{width:0}17%{width:62%}100%{width:62%}}" +
    "@keyframes bsL3{0%,31%{width:0}47%{width:74%}100%{width:74%}}" +
    "@keyframes bsFill{0%{width:0}22%{width:30%}50%{width:62%}74%{width:100%}100%{width:100%}}" +
    "@keyframes bsMic{0%,29%{background:rgba(255,255,255,.14);transform:scale(1)}31%{transform:scale(.9)}34%{background:var(--bs-b);transform:scale(1)}47%{background:var(--bs-b)}50%,100%{background:rgba(255,255,255,.14)}}" +
    "@keyframes bsRingsOn{0%,31%{opacity:0}34%,47%{opacity:1}50%,100%{opacity:0}}" +
    "@keyframes bsPulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.9);opacity:0}}" +
    "@keyframes bsEq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}" +
    "@keyframes bsSubmit{0%,79%{transform:scale(1)}81%{transform:scale(.92)}84%{transform:scale(1)}100%{transform:scale(1)}}" +
    "@keyframes bsLabel{0%,82%{opacity:1}84%,100%{opacity:0}}" +
    "@keyframes bsOk{0%,82%{opacity:0;transform:scale(.5)}86%,100%{opacity:1;transform:scale(1)}}" +
    "@keyframes bsSpark{0%,81%{opacity:0;transform:translate(0,0)}83%{opacity:1}93%{opacity:0;transform:translate(var(--x),var(--y))}100%{opacity:0}}" +
    "@keyframes bsCur{0%{left:40%;top:34%;opacity:0;transform:scale(1)}" +
      "3%{opacity:1}22%{left:50%;top:40%}27%{left:86%;top:29%}31%{left:86%;top:29%;transform:scale(.8)}34%{left:86%;top:29%;transform:scale(1)}" +
      "50%{left:62%;top:52%}73%{left:60%;top:60%}78%{left:73%;top:82%;transform:scale(1)}81%{left:73%;top:82%;transform:scale(.8)}84%{left:73%;top:82%;transform:scale(1)}" +
      "92%{opacity:1}96%{opacity:0;left:73%;top:82%}100%{opacity:0}}" +
    "@keyframes bsCap{0%{opacity:0;transform:translateY(6px)}2%{opacity:1;transform:none}22%{opacity:1;transform:none}25%{opacity:0}100%{opacity:0}}" +
    "@keyframes bsDot{0%{transform:scaleX(0)}25%{transform:scaleX(1)}26%{transform:scaleX(1);opacity:.35}100%{transform:scaleX(1);opacity:.35}}" +

    /* gentle: still picture, no movement */
    "@media(prefers-reduced-motion:reduce){" +
      ".bs-ov,.bs-card{transition:none}.bs-card{transform:none}" +
      ".bs-clip *{animation:none!important}" +
      ".bs-scene{opacity:1}.bs-l1{width:88%}.bs-l2{width:62%}.bs-l3{width:74%}.bs-fill{width:100%}.bs-cur,.bs-sp,.bs-caps,.bs-dots{display:none}" +
    "}" +
    ".bs-replay{display:block;width:100%;margin:.2rem 0 .8rem;padding:.6rem .9rem;border-radius:14px;border:1px solid rgba(121,235,221,.5);background:rgba(121,235,221,.12);" +
      "color:inherit;font:600 15px 'Work Sans',system-ui,sans-serif;text-align:left;cursor:pointer}" +
    ".bs-replay:hover{background:rgba(121,235,221,.22);transform:none}";
  document.head.appendChild(st);

  /* ---------- the card ---------- */
  var overlay = null, lastFocus = null, prevOverflow = "";

  var CLIP =
    '<div class="bs-clip" aria-hidden="true"><div class="bs-scene">' +
      '<div class="bs-track"><div class="bs-fill"></div></div>' +
      '<div class="bs-box"><div class="bs-ln bs-l1"></div><div class="bs-ln bs-l2"></div><div class="bs-ln bs-l3"></div></div>' +
      '<div class="bs-mic"><div class="bs-rings"><span class="bs-ring"></span><span class="bs-ring"></span></div>' +
        '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v4"></path></svg></div>' +
      '<div class="bs-eq"><i></i><i></i><i></i><i></i></div>' +
      '<div class="bs-submit"><span class="bs-sl"></span><span class="bs-ok"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"></path></svg></span></div>' +
      '<i class="bs-sp" style="--x:-34px;--y:-30px"></i><i class="bs-sp" style="--x:6px;--y:-40px"></i><i class="bs-sp" style="--x:30px;--y:-26px"></i>' +
      '<i class="bs-sp" style="--x:-18px;--y:-44px"></i><i class="bs-sp" style="--x:42px;--y:-8px"></i>' +
      '<div class="bs-cur"><svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-2 6z" fill="#fff" stroke="#0a1c48" stroke-width="1.5" stroke-linejoin="round"></path></svg></div>' +
    '</div></div>' +
    '<div class="bs-caps" aria-hidden="true">' +
      '<div class="bs-cap"><b>1</b><span>Type your answer in any box&hellip;</span></div>' +
      '<div class="bs-cap"><b>2</b><span>&hellip;or press <em style="font-style:normal;font-weight:800">Speak</em> and just talk. It is written for you.</span></div>' +
      '<div class="bs-cap"><b>3</b><span>The bar at the top fills as you answer.</span></div>' +
      '<div class="bs-cap"><b>4</b><span>Press <em style="font-style:normal;font-weight:800">Submit feedback</em> at the end. Only then is anything sent.</span></div>' +
    '</div>' +
    '<div class="bs-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';

  function close() {
    if (!overlay) return;
    var el = overlay; overlay = null;
    lsSet(KEY, "1");
    document.removeEventListener("keydown", onKey, true);
    document.body.style.overflow = prevOverflow;
    el.classList.remove("show");
    setTimeout(function () { el.remove(); }, 320);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  function onKey(e) {
    if (!overlay) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === "Tab") {
      var f = overlay.querySelectorAll("button");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function show(year) {
    if (overlay) return;
    var col = COLORS[year] || COLORS.year7;
    lastFocus = document.activeElement;
    overlay = document.createElement("div"); overlay.className = "bs-ov";
    overlay.style.setProperty("--bs-a", col[0]); overlay.style.setProperty("--bs-b", col[1]);
    var mins = CFG.minutes ? " It takes about " + CFG.minutes + " minutes." : "";
    overlay.innerHTML =
      '<div class="bs-card" role="dialog" aria-modal="true" aria-labelledby="bs-title">' +
        '<button type="button" class="bs-x" aria-label="Close">&times;</button>' +
        '<p class="bs-eyebrow">First time here?</p>' +
        '<h2 id="bs-title">Before you start</h2>' +
        '<p class="bs-lede">A quick look at how this form works.' + mins + ' You will only see this once, and you can watch it again from Help.</p>' +
        '<div class="bs-grid">' +
          '<div class="bs-clipwrap">' + CLIP + '</div>' +
          '<ol class="bs-list">' +
            '<li><b>Use your school email</b>Type your <em>@bilfen.k12.tr</em> address, then pick your school and the week number. The questions open as soon as the email is right.</li>' +
            '<li><b>Eight answers, all required</b>Four written answers and four quick scores. The bar at the top shows how far you are.</li>' +
            '<li><b>Type or talk</b>Press <em>Speak</em> in any answer box, or try <em>Hands-free</em> to answer the whole form by voice.</li>' +
            '<li><b>Nothing is sent until you submit</b>Your draft is kept on this device while you work, so a refresh will not lose it.</li>' +
          '</ol>' +
        '</div>' +
        '<button type="button" class="bs-go">Got it, let&rsquo;s start</button>' +
      '</div>';
    prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(overlay);
    var go = overlay.querySelector(".bs-go");
    go.addEventListener("click", close);
    overlay.querySelector(".bs-x").addEventListener("click", close);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (overlay) { overlay.classList.add("show"); go.focus({ preventScroll: true }); } }); });
  }

  /* ---------- show it the first time a form opens ---------- */
  var IDS = ["year5", "year6", "year7"];
  function firstOpen(year) {
    if (lsGet(KEY) || overlay) return;
    setTimeout(function () {
      var v = document.getElementById(year + "-view");
      if (v && v.classList.contains("active") && !lsGet(KEY) && !overlay) show(year);
    }, 450);
  }
  IDS.forEach(function (y) {
    var v = document.getElementById(y + "-view"); if (!v) return;
    new MutationObserver(function () { if (v.classList.contains("active")) firstOpen(y); })
      .observe(v, { attributes: true, attributeFilter: ["class"] });
  });

  /* ---------- "Watch the guide" inside the Help window ---------- */
  function activeYear() {
    for (var i = 0; i < IDS.length; i++) {
      var v = document.getElementById(IDS[i] + "-view"); if (v && v.classList.contains("active")) return IDS[i];
    }
    return "year7";
  }
  new MutationObserver(function () {
    var list = document.querySelector(".help-overlay .help-list");
    if (!list || list.parentNode.querySelector(".bs-replay")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "bs-replay"; b.textContent = "▶  Watch “Before you start”";
    list.parentNode.insertBefore(b, list);
    b.addEventListener("click", function () {
      var x = document.querySelector(".help-overlay .help-close"); if (x) x.click();
      setTimeout(function () { show(activeYear()); }, 350);
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.IPTGuide = { show: function (y) { show(y || activeYear()); } };
})();
