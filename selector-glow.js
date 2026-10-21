/* IPT Feedback · Created by Ufuk Korkmaz, 2026. */
/* ==========================================================================
   SOFT GLOW AROUND THE YEAR 5 / 6 / 7 SELECTOR
   For a brand-new visitor the selector softly glows to say "you can tap here". Pressing Year 5, 6 or 7 makes the glow
   fade away for good (on this device). People who already use the site never see it.
   Test it any time: add ?glow=1 to the site address. Switch it off in config.js (selectorGlow: { enabled: false }).
   ========================================================================== */
(function () {
  "use strict";
  var CFG = window.IPT_CONFIG || {}, G = CFG.selectorGlow || {};
  if (G.enabled === false) return;
  var SEEN = "ipt-yp-seen", FLAG = "ipt-yp-dots";               // (same names as the earlier red-dot idea, so nothing is shown twice)
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var test = false; try { test = new URLSearchParams(location.search).get("glow") === "1"; } catch (e) {}

  if (!test) {
    if (lsGet(SEEN) === "1") return;
    if (lsGet(FLAG) !== "1") {                                    // first ever visit: only people with no saved name count as new
      if (lsGet("ipt-name")) return;
      lsSet(FLAG, "1");
    }
  }

  function init() {
    var seg = document.querySelector(".yp-seg"); if (!seg) return;
    var s = document.createElement("style");
    s.textContent =
      ".yp-seg.yp-hint::after{content:'';position:absolute;inset:-4px;border-radius:999px;pointer-events:none;z-index:0;" +
        "box-shadow:0 0 0 1.5px var(--dg,rgba(121,235,221,.6)),0 0 18px 3px var(--dg,rgba(121,235,221,.5));opacity:.85;" +
        "animation:ypHint 2.8s ease-in-out infinite alternate;transition:opacity .7s ease}" +
      ".yp-seg.yp-hint.yp-hint-off::after{opacity:0;animation:none}" +
      "@keyframes ypHint{from{opacity:.35;transform:scale(.995)}to{opacity:1;transform:scale(1.012)}}" +
      "@media(prefers-reduced-motion:reduce){.yp-seg.yp-hint::after{animation:none;opacity:.7}}";
    document.head.appendChild(s);
    seg.classList.add("yp-hint");
    function clear() {
      seg.removeEventListener("click", clear, true);
      if (!test) lsSet(SEEN, "1");
      seg.classList.add("yp-hint-off");                           // fades out, then the effect is removed completely
      setTimeout(function () { seg.classList.remove("yp-hint", "yp-hint-off"); }, 800);
    }
    seg.addEventListener("click", clear, true);                   // keyboard use (Enter / Space) also counts as a click
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
