/* ============================================================================
   HANDS-FREE CHEAT SHEET  -  a small card that lists the voice commands while
   hands-free is running. It follows the current question: on the scores it shows
   the score phrases, at the end it highlights "submit feedback".
   Can be folded down to a small pill (and opened again) with its button.

   Turn it off: config.js -> handsFreeCheat: { enabled: false }
   ========================================================================== */
(function () {
  "use strict";
  var CFG = (window.IPT_CONFIG && window.IPT_CONFIG.handsFreeCheat) || {};
  if (CFG.enabled === false) return;

  var st = document.createElement("style");
  st.textContent =
    ".hfc{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9300;width:min(600px,calc(100vw - 2rem));transform:translate(-50%,16px);opacity:0;pointer-events:none;" +
      "transition:opacity .25s ease,transform .3s cubic-bezier(.2,.8,.2,1);font-family:'Work Sans',system-ui,sans-serif;color:#eef5ff}" +
    ".hfc.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}" +
    ".hfc-card{border-radius:20px;padding:.8rem .95rem .85rem;background:rgba(8,22,60,.9);border:1px solid rgba(255,255,255,.22);" +
      "-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 16px 40px rgba(1,8,30,.5)}" +
    ".hfc-top{display:flex;align-items:center;gap:.6rem;margin-bottom:.55rem}" +
    ".hfc-dot{width:9px;height:9px;border-radius:50%;background:#ff6b6b;box-shadow:0 0 0 0 rgba(255,107,107,.7);animation:hfcPulse 1.6s infinite}" +
    ".hfc-title{flex:1;font:700 13px/1 'Montserrat','Work Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase}" +
    ".hfc-fold{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:inherit;border-radius:999px;padding:.28rem .7rem;font:600 12.5px 'Work Sans',sans-serif;cursor:pointer}" +
    ".hfc-fold:hover{background:rgba(255,255,255,.18);transform:none}" +
    ".hfc-list{display:flex;flex-wrap:wrap;gap:.45rem}" +
    ".hfc-c{display:inline-flex;align-items:baseline;gap:.4rem;padding:.38rem .7rem;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);font-size:14px;line-height:1.2}" +
    ".hfc-c b{font-weight:800;color:#fff}" +
    ".hfc-c small{font-size:12px;color:rgba(238,245,255,.65)}" +
    ".hfc-c.hot{background:rgba(121,235,221,.2);border-color:rgba(121,235,221,.7);box-shadow:0 0 14px rgba(121,235,221,.3)}" +
    ".hfc-c.dim{opacity:.5}" +
    ".hfc.min .hfc-list{display:none}.hfc.min .hfc-top{margin-bottom:0}" +
    ".hfc.min{width:auto}" +
    "@keyframes hfcPulse{0%{box-shadow:0 0 0 0 rgba(255,107,107,.7)}70%,100%{box-shadow:0 0 0 9px rgba(255,107,107,0)}}" +
    "@media(max-width:560px){.hfc-c{font-size:13px;padding:.32rem .55rem}.hfc-c small{display:none}}" +
    "@media(prefers-reduced-motion:reduce){.hfc{transition:none}.hfc-dot{animation:none}}";
  document.head.appendChild(st);

  var box = document.createElement("div");
  box.className = "hfc"; box.setAttribute("role", "region"); box.setAttribute("aria-label", "Voice commands");
  box.innerHTML =
    '<div class="hfc-card"><div class="hfc-top"><span class="hfc-dot" aria-hidden="true"></span><span class="hfc-title">Say&hellip;</span>' +
    '<button type="button" class="hfc-fold" aria-expanded="true">Fold</button></div><div class="hfc-list"></div></div>';
  document.body.appendChild(box);
  var list = box.querySelector(".hfc-list"), fold = box.querySelector(".hfc-fold"), title = box.querySelector(".hfc-title");

  var COMMANDS = {
    text:   [["next question", "go on", 1], ["previous question", "go back"], ["stop hands-free", "switch off"]],
    scores: [["overall four", "set a score", 1], ["resources three", ""], ["engagement five", ""], ["clarity four", ""], ["next question", "when done"], ["stop hands-free", ""]],
    final:  [["submit feedback", "send it", 1], ["previous question", "review"], ["stop hands-free", ""]]
  };
  var shown = "";
  function render(mode) {
    if (mode === shown) return; shown = mode;
    list.innerHTML = "";
    COMMANDS[mode].forEach(function (c) {
      var s = document.createElement("span"); s.className = "hfc-c" + (c[2] ? " hot" : "");
      var b = document.createElement("b"); b.textContent = "“" + c[0] + "”"; s.appendChild(b);
      if (c[1]) { var m = document.createElement("small"); m.textContent = c[1]; s.appendChild(m); }
      list.appendChild(s);
    });
  }
  function mode() {
    var a = document.querySelector(".hf-active");
    if (!a) return "text";
    if (/-pulse$/.test(a.id)) return "scores";
    if (/-final$/.test(a.id)) return "final";
    return "text";
  }
  var queued = false;
  function update() {
    queued = false;
    var running = !!document.querySelector(".hf-running");
    box.classList.toggle("on", running);
    if (running) render(mode()); else shown = "";
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  new MutationObserver(queue).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  fold.addEventListener("click", function () {
    var m = box.classList.toggle("min");
    fold.textContent = m ? "Show commands" : "Fold"; fold.setAttribute("aria-expanded", String(!m));
  });
  update();
})();
