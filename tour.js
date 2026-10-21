/* IPT Feedback · Created by Ufuk Korkmaz, 2026. */
/* ==========================================================================
   FIRST-VISIT TOUR
   A short guided tour of the home page for people who open the site for the first time (right after they have
   given their name). It highlights the calendar, the meetings, this week's schools, the year buttons and Help.
   It never shows again once finished or skipped, and can be replayed from the Help window.
   Test it any time: add ?tour=1 to the site address. Switch it off in config.js (tour: { enabled: false }).
   ========================================================================== */
(function () {
  "use strict";
  var CFG = window.IPT_CONFIG || {}, T = CFG.tour || {};
  if (T.enabled === false) return;

  var KEY = "ipt-tour";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var force = false; try { force = new URLSearchParams(location.search).get("tour") === "1"; } catch (e) {}
  var isNew = !lsGet("ipt-name") && lsGet(KEY) !== "1";      // nobody who already has a saved name is bothered

  /* The steps. sel = what to highlight (a step is skipped when it is not on screen); optional = true is fine to miss. */
  var DEF = [
    { title: "Welcome to IPT Feedback", text: "Here is a 30-second tour of the page. You can skip it at any time, and find it again in Help." },
    { sel: "#schedule .cal-panel", title: "The feedback calendar", text: "Highlighted Mondays are feedback days. Hover or tap one to see which schools give feedback that week." },
    { sel: ".meet-card", title: "Online meetings", text: "The meeting times, a live clock, and a Join Meeting button that lights up 15 minutes before each meeting." },
    { sel: "#feedback-week", title: "Schools this week", text: "Which schools give feedback on the coming Monday, for Year 5, Year 6 and Year 7." },
    { sel: ".menu-buttons.yp", title: "Give your feedback", text: "Choose your year, press the big button, then enter your school email (ending @bilfen.k12.tr) to open the questions. You can type, or press Speak and talk." },
    { sel: ".help-fab", title: "Help is always here", text: "Questions about dictating, hands-free mode or lost answers? Tap Help at any time." },
    { sel: ".ws-whoami", title: "That's you", text: "Not your name? Hover over or tap this dot to change it." },
    { sel: ".wx-chip", title: "Weather background", text: "A soft background that follows the weather. Pick your city here, or switch it off." },
    { title: "You're all set", text: "That is everything. Press Done. You can replay this tour from the Help window." }
  ];

  var steps = [], idx = 0, ov, spot, dark, darkPath, card, els = {}, raf = 0, prevFocus = null;
  var cur = { x: 0, y: 0, w: 0, h: 0 }, tw = 0;

  /* The dark layer is a full-screen shape with a rounded hole, so every corner of the screen is always covered. */
  function draw() {
    var W = window.innerWidth, H = window.innerHeight, x = cur.x, y = cur.y, w = Math.max(0, cur.w), h = Math.max(0, cur.h), r = Math.min(20, w / 2, h / 2);
    dark.setAttribute("viewBox", "0 0 " + W + " " + H);
    darkPath.setAttribute("d", "M0 0H" + W + "V" + H + "H0Z M" + (x + r) + " " + y + "H" + (x + w - r) + "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) + "V" + (y + h - r) +
      "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) + "H" + (x + r) + "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) + "V" + (y + r) + "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "Z");
    spot.style.left = x + "px"; spot.style.top = y + "px"; spot.style.width = w + "px"; spot.style.height = h + "px";
    spot.className = "tour-spot" + (w < 2 ? " none" : "");
  }
  function setRect(t, animate) {
    cancelAnimationFrame(tw);
    if (!animate || reduce) { cur = { x: t.x, y: t.y, w: t.w, h: t.h }; draw(); return; }
    var from = { x: cur.x, y: cur.y, w: cur.w, h: cur.h }, t0 = performance.now();
    (function f(now) {
      var k = Math.min(1, (now - t0) / 320), e = 1 - Math.pow(1 - k, 3);
      cur = { x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, w: from.w + (t.w - from.w) * e, h: from.h + (t.h - from.h) * e };
      draw(); if (k < 1) tw = requestAnimationFrame(f);
    })(t0);
  }

  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  }

  function css() {
    if (document.getElementById("tour-css")) return;
    var s = document.createElement("style"); s.id = "tour-css";
    s.textContent =
      ".tour-ov{position:fixed;inset:0;z-index:9985}" +
      ".tour-dark{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9984;pointer-events:none}" +
      ".tour-spot{position:fixed;left:0;top:0;width:0;height:0;z-index:9985;border-radius:20px;pointer-events:none;box-shadow:0 0 0 2px rgba(121,235,221,.85),0 0 28px 4px rgba(121,235,221,.45)}" +
      ".tour-spot.none{opacity:0}" +
      ".tour-card{position:fixed;z-index:9986;width:min(340px,calc(100vw - 24px));padding:1rem 1.1rem 1rem;border-radius:20px;color:#eef5ff;background:rgba(6,22,60,.96);" +
        "border:1px solid rgba(225,244,255,.3);box-shadow:0 18px 50px rgba(0,0,0,.5);font:400 15px/1.5 'Work Sans',system-ui,sans-serif;" +
        (reduce ? "" : "transition:opacity .2s ease;") + "}" +
      ".tour-card.m{left:12px!important;right:12px;width:auto;top:auto!important;bottom:calc(12px + env(safe-area-inset-bottom,0px))}" +
      ".tour-card.m.t{top:calc(12px + env(safe-area-inset-top,0px))!important;bottom:auto}" +
      ".tour-card h2{margin:.1rem 0 .35rem;font-size:19px;line-height:1.25;color:#fff}" +
      ".tour-card p{margin:0;color:#d6e4f7}" +
      ".tour-count{margin:0 0 .35rem;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9decE5}" +
      ".tour-dots{display:flex;gap:5px;margin:.7rem 0 .2rem}" +
      ".tour-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.28)}" +
      ".tour-dots i.on{background:#79ebdd}" +
      ".tour-row{display:flex;align-items:center;gap:.5rem;margin-top:.8rem}" +
      ".tour-row .sp{flex:1}" +
      ".tour-btn{border:1px solid rgba(225,244,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:.42rem 1rem;font:600 14px 'Work Sans',system-ui,sans-serif;cursor:pointer}" +
      ".tour-btn:hover{background:rgba(255,255,255,.2);transform:none}" +
      ".tour-btn.go{border-color:transparent;color:#06214e;background:linear-gradient(135deg,#52d9ca,#658ff1)}" +
      ".tour-btn.go:hover{filter:brightness(1.08);background:linear-gradient(135deg,#52d9ca,#658ff1)}" +
      ".tour-skip{border:0;background:none;color:#c5d5ee;font:500 13.5px 'Work Sans',system-ui,sans-serif;text-decoration:underline;cursor:pointer;padding:.3rem .2rem}" +
      ".tour-skip:hover{color:#fff;transform:none;filter:none}" +
      ".tour-btn:focus-visible,.tour-skip:focus-visible{outline:3px solid #79ebdd;outline-offset:2px}" +
      ".tour-replay{display:block;width:100%;margin:.2rem 0 .8rem;padding:.6rem .9rem;border-radius:14px;border:1px solid rgba(121,235,221,.5);background:rgba(121,235,221,.12);color:inherit;font:600 15px 'Work Sans',system-ui,sans-serif;text-align:left;cursor:pointer}" +
      ".tour-replay:hover{background:rgba(121,235,221,.22);transform:none}";
    document.head.appendChild(s);
  }

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function start() {
    if (ov) return;
    css();
    steps = DEF.filter(function (s) { return !s.sel || visible(document.querySelector(s.sel)); });
    if (steps.length < 2) return;
    idx = 0; prevFocus = document.activeElement;
    ov = el("div", "tour-ov"); spot = el("div", "tour-spot none");
    var NS = "http://www.w3.org/2000/svg"; dark = document.createElementNS(NS, "svg"); dark.setAttribute("class", "tour-dark"); dark.setAttribute("aria-hidden", "true");
    darkPath = document.createElementNS(NS, "path"); darkPath.setAttribute("fill", "rgba(3,10,34,.74)"); darkPath.setAttribute("fill-rule", "evenodd"); dark.appendChild(darkPath);
    cur = { x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0 };
    card = el("div", "tour-card"); card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "tour-h"); card.tabIndex = -1;
    els.count = el("p", "tour-count"); els.h = el("h2"); els.h.id = "tour-h"; els.p = el("p"); els.dots = el("div", "tour-dots");
    els.back = el("button", "tour-btn", "Back"); els.back.type = "button";
    els.next = el("button", "tour-btn go", "Next"); els.next.type = "button";
    els.skip = el("button", "tour-skip", "Skip tour"); els.skip.type = "button";
    var row = el("div", "tour-row"); row.append(els.skip, el("span", "sp"), els.back, els.next);
    card.append(els.count, els.h, els.p, els.dots, row);
    document.body.append(dark, ov, spot, card);
    els.back.addEventListener("click", function () { go(idx - 1); });
    els.next.addEventListener("click", function () { if (idx >= steps.length - 1) finish(); else go(idx + 1); });
    els.skip.addEventListener("click", finish);
    window.addEventListener("resize", queue); window.addEventListener("scroll", queue, true);
    document.addEventListener("keydown", onKey, true);
    go(0);
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); els.next.click(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (idx > 0) go(idx - 1); }
    else if (e.key === "Tab") {                              // keep the focus inside the tour card
      var f = [els.skip, els.back, els.next].filter(function (b) { return b.offsetParent !== null; });
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    }
  }

  function go(i) {
    idx = Math.max(0, Math.min(steps.length - 1, i));
    var s = steps[idx];
    els.count.textContent = "Step " + (idx + 1) + " of " + steps.length;
    els.h.textContent = s.title; els.p.textContent = s.text;
    els.dots.textContent = ""; steps.forEach(function (_, k) { els.dots.append(el("i", k === idx ? "on" : "")); });
    els.back.hidden = idx === 0;
    els.next.textContent = idx === steps.length - 1 ? "Done" : (idx === 0 ? "Start" : "Next");
    els.skip.hidden = idx === steps.length - 1;
    var target = s.sel ? document.querySelector(s.sel) : null;
    if (target) bring(target);
    place(true);
    els.next.focus({ preventScroll: true });
  }

  /* scroll so the highlighted thing is visible and not hidden behind the card */
  function bring(t) {
    var vh = window.innerHeight, vw = window.innerWidth, r = t.getBoundingClientRect();
    if (t.classList.contains("help-fab") || getComputedStyle(t).position === "fixed") return;   // fixed things never need scrolling
    var band0 = 56, band1 = vw < 640 ? vh - (card.offsetHeight || 190) - 20 : vh - 20;
    var y;
    if (r.height > band1 - band0) y = r.top - band0;                      // too tall to fit: show its top
    else if (r.top < band0 || r.bottom > band1) y = r.top - (band0 + (band1 - band0 - r.height) / 2);
    else return;
    window.scrollBy({ top: y, left: 0, behavior: "auto" });
  }

  function place(animate) {
    if (!ov) return;
    var s = steps[idx], t = s.sel ? document.querySelector(s.sel) : null, vw = window.innerWidth, vh = window.innerHeight;
    var mobile = vw < 640, cw = card.offsetWidth, ch = card.offsetHeight;
    card.classList.toggle("m", mobile); card.classList.remove("t");
    if (!t || !visible(t)) {
      setRect({ x: vw / 2, y: vh / 2, w: 0, h: 0 }, animate);
      if (!mobile) { card.style.left = Math.round((vw - cw) / 2) + "px"; card.style.top = Math.round((vh - ch) / 2) + "px"; }
      return;
    }
    var r = t.getBoundingClientRect(), pad = 8;
    setRect({ x: Math.round(r.left - pad), y: Math.round(r.top - pad), w: Math.round(r.width + pad * 2), h: Math.round(r.height + pad * 2) }, animate);
    if (mobile) { if (getComputedStyle(t).position === "fixed" && r.top > vh * 0.45) card.classList.add("t"); return; }   // things pinned to the bottom of the screen: card goes to the top
    var x = Math.max(12, Math.min(vw - cw - 12, r.left + r.width / 2 - cw / 2)), y;
    if (r.bottom + pad + 14 + ch <= vh - 12) y = r.bottom + pad + 14;                          // below
    else if (r.top - pad - 14 - ch >= 12) y = r.top - pad - 14 - ch;                            // above
    else if (r.right + pad + 14 + cw <= vw - 12) { x = r.right + pad + 14; y = Math.max(12, Math.min(vh - ch - 12, r.top)); }   // to the right
    else if (r.left - pad - 14 - cw >= 12) { x = r.left - pad - 14 - cw; y = Math.max(12, Math.min(vh - ch - 12, r.top)); }      // to the left
    else y = vh - ch - 12;
    card.style.left = Math.round(x) + "px"; card.style.top = Math.round(y) + "px";
  }
  function queue() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; place(); }); }

  function finish() {
    lsSet(KEY, "1");
    window.removeEventListener("resize", queue); window.removeEventListener("scroll", queue, true);
    document.removeEventListener("keydown", onKey, true);
    cancelAnimationFrame(tw);
    [dark, ov, spot, card].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    ov = spot = card = dark = darkPath = null;
    try { if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---------- automatic start for first-time visitors ---------- */
  function homeActive() { var m = document.getElementById("menu-view"); return !m || m.classList.contains("active"); }
  function when() {
    var n = 0, t = setInterval(function () {
      n++;
      var ok = document.body && document.body.classList.contains("page-ready") && !document.getElementById("intro") &&
        !document.querySelector(".ws-overlay,.help-overlay,.thanks-overlay") && homeActive();
      if (ok) { clearInterval(t); setTimeout(function () { if (homeActive()) start(); }, 1000); }
      else if (n > 100) clearInterval(t);
    }, 400);
  }
  if ((T.autoStart !== false && isNew) || force) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", when); else when();
  }

  /* ---------- "Take the quick tour" inside the Help window ---------- */
  new MutationObserver(function () {
    var list = document.querySelector(".help-overlay .help-list");
    if (!list || list.parentNode.querySelector(".tour-replay") || !homeActive()) return;
    var b = el("button", "tour-replay", "▶  Take the quick tour"); b.type = "button";
    list.parentNode.insertBefore(b, list);
    b.addEventListener("click", function () {
      var x = document.querySelector(".help-overlay .help-close"); if (x) x.click();
      setTimeout(start, 450);
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.IPTTour = { start: start };
})();
