/* ============================================================================
   MONTHLY REPORT  -  every 4 weeks the admin page greets each admin with
   "Your monthly report is ready", and a button in the bottom-left corner
   (across from "What's new?") opens it any time.

   * The numbers and the "At a glance" lines are worked out here by simple rules.
   * AI overview (optional, config.js > admin > monthly > ai): when ON, the month's answers
     go to the same secure AI Summary service (e-mails and school names removed first)
     and the report shows the AI's overview and suggested actions. It starts by itself
     when the welcome window appears. When OFF (the default) nothing is sent anywhere.
     Open admin.html?aitest=1 to try it on made-up answers instead of teacher answers.
   * The first report covers the dates set in config.js (start and firstEnd). After that each report
     covers the next 4 FEEDBACK Mondays and ends on the 4th one. A Monday on a break or holiday
     (see "holidays" in config.js) is not counted, so the cycle pauses during a break and carries on
     afterwards where it left off. The last report of the year ends on the last school day.
     Every admin sees the same reports. A report is ready the day after its last day.
   * The welcome window shows once per report for each admin (until they open it).
   Settings (config.js > admin > monthly):  { start: "2026-10-19", firstEnd: "2026-11-09" }
   Turn it off:                            admin: { monthly: false }
   ========================================================================== */
(function () {
  "use strict";
  var A = (window.IPT_CONFIG && window.IPT_CONFIG.admin) || {};
  if (A.monthly === false) return;
  var M = A.monthly || {};
  var TZ = (window.IPT_CONFIG && window.IPT_CONFIG.timezone) || "Europe/Istanbul";
  var LEN = 28;

  /* ---------- tiny date helpers (same rules as the admin page) ---------- */
  function addDays(ymd, n) { var t = new Date(ymd + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
  function dayNo(ymd) { return Math.round(Date.parse(ymd + "T00:00:00Z") / 864e5); }
  function mondayOf(ymd) { var t = new Date(ymd + "T00:00:00Z"); return addDays(ymd, -((t.getUTCDay() + 6) % 7)); }
  function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
  function nice(ymd, year) { return new Date(ymd + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: year ? "numeric" : undefined }); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var YMD = /^\d{4}-\d{2}-\d{2}$/;
  var START = YMD.test(M.start || "") ? M.start : "2026-10-19", FIRST_END = YMD.test(M.firstEnd || "") ? M.firstEnd : "2026-11-09";
  if (FIRST_END < START) FIRST_END = addDays(START, LEN - 1);
  var SCHOOL_END = (window.IPT_CONFIG && YMD.test(window.IPT_CONFIG.schoolEnd || "")) ? window.IPT_CONFIG.schoolEnd : "";
  function offMonday(m) { return window.IPT_offReason ? window.IPT_offReason(m) : ""; }       // "" = a normal feedback Monday
  var PERIODS = null;
  function periods() {            // [{ s, e }]: the first one is set in config.js; each next one ends on its 4th feedback Monday
    if (PERIODS) return PERIODS;
    var P = [{ s: START, e: FIRST_END }];
    for (var guard = 0; guard < 40; guard++) {
      var s = addDays(P[P.length - 1].e, 1);
      if (SCHOOL_END && s > SCHOOL_END) break;
      var m = addDays(mondayOf(s), mondayOf(s) < s ? 7 : 0), n = 0, end = null;
      for (var i = 0; i < 80; i++, m = addDays(m, 7)) {
        if (SCHOOL_END && m > SCHOOL_END) break;
        if (offMonday(m)) continue;
        if (++n === 4) { end = m; break; }
      }
      if (!end) { if (SCHOOL_END && n > 0) end = SCHOOL_END; else break; }          // the last, shorter report ends on the last school day
      P.push({ s: s, e: end });
    }
    return (PERIODS = P);
  }
  window.IPTMonthlyPeriods = function () { return periods().map(function (p) { return { s: p.s, e: p.e }; }); };
  function pStart(k) { var P = periods(); return P[Math.max(0, Math.min(k, P.length - 1))].s; }
  function pEnd(k) { var P = periods(); return P[Math.max(0, Math.min(k, P.length - 1))].e; }
  function lastDone() { var t = today(), P = periods(), r = -1; for (var i = 0; i < P.length; i++) if (P[i].e < t) r = i; return r; }   // -1 = the first report is not ready yet
  function pauses(k) {            // names of the breaks / holidays whose Mondays were not counted in this report
    var out = [], seen = {}; for (var m = mondayOf(pStart(k)); m <= pEnd(k); m = addDays(m, 7)) { if (m < pStart(k)) continue; var r = offMonday(m); if (r && !seen[r]) { seen[r] = 1; out.push(r); } } return out;
  }
  function span(k) { var d = dayNo(pEnd(k)) - dayNo(pStart(k)) + 1; return d % 7 === 0 ? d / 7 + " weeks" : d + " days"; }

  /* ---------- numbers ---------- */
  var KEYS = ["overall", "resources", "engagement", "clarity"];
  var LABEL = { overall: "Overall", resources: "Resources", engagement: "Engagement", clarity: "Clarity" };
  function avg(list, k) { var v = list.map(function (x) { return x[k]; }).filter(function (n) { return typeof n === "number"; }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; }
  function f1(n) { return n === null ? "–" : (Math.round(n * 10) / 10).toFixed(1); }
  function inPeriod(rows, k) { var s = pStart(k), e = pEnd(k); return rows.filter(function (x) { return x._day && x._day >= s && x._day <= e; }); }
  function stats(list) {
    var o = { n: list.length, years: { 5: 0, 6: 0, 7: 0 }, schools: 0, avg: {}, yearOverall: {} }, sc = {};
    list.forEach(function (x) { if (o.years[x.year] !== undefined) o.years[x.year]++; if (x.school) sc[x.school] = 1; });
    o.schools = Object.keys(sc).length;
    KEYS.forEach(function (k) { o.avg[k] = avg(list, k); });
    [5, 6, 7].forEach(function (y) { var s = list.filter(function (x) { return x.year === y; }); o.yearOverall[y] = s.length >= 3 ? avg(s, "overall") : null; });
    return o;
  }
  function busiestWeek(list) {
    var w = {}; list.forEach(function (x) { if (x._mon) w[x._mon] = (w[x._mon] || 0) + 1; });
    var best = null; Object.keys(w).sort().forEach(function (m) { if (!best || w[m] > best.n) best = { mon: m, n: w[m] }; });
    return best;
  }

  /* ---------- the overview: plain sentences written from the numbers ---------- */
  function overview(s, p, list, k) {
    var out = [];
    var yrs = [5, 6, 7].filter(function (y) { return s.years[y]; }).map(function (y) { return "Year " + y + ": " + s.years[y]; }).join(", ");
    var t = "Between " + nice(pStart(k)) + " and " + nice(pEnd(k)) + ", " + s.n + (s.n === 1 ? " reflection" : " reflections") + " came in" + (s.schools ? " from " + s.schools + (s.schools === 1 ? " school" : " schools") : "") + (yrs ? " (" + yrs + ")" : "") + ".";
    if (p && p.n) { var d = s.n - p.n; t += d === 0 ? " That is the same as the previous report." : " That is " + Math.abs(d) + (d > 0 ? " more" : " fewer") + " than the previous report (" + p.n + ")."; }
    out.push(t);
    var cats = ["resources", "engagement", "clarity"].filter(function (c) { return s.avg[c] !== null; });
    if (cats.length >= 2) {
      var hi = cats.slice().sort(function (a, b) { return s.avg[b] - s.avg[a]; }), top = hi[0], low = hi[hi.length - 1];
      out.push(s.avg[top] - s.avg[low] < 0.15 ? "The three scores were very even, all close to " + f1(s.avg[top]) + "." : LABEL[top] + " scored highest (" + f1(s.avg[top]) + ") and " + LABEL[low] + " lowest (" + f1(s.avg[low]) + ").");
    }
    if (s.avg.overall !== null && p && p.avg.overall !== null) {
      var dv = s.avg.overall - p.avg.overall;
      out.push(Math.abs(dv) < 0.1 ? "The overall score held steady at " + f1(s.avg.overall) + " out of 5." : "The overall score " + (dv > 0 ? "rose" : "fell") + " by " + f1(Math.abs(dv)) + " to " + f1(s.avg.overall) + " out of 5.");
    } else if (s.avg.overall !== null) out.push("The overall score was " + f1(s.avg.overall) + " out of 5.");
    var ys = [5, 6, 7].filter(function (y) { return s.yearOverall[y] !== null; });
    if (ys.length >= 2) {
      ys.sort(function (a, b) { return s.yearOverall[b] - s.yearOverall[a]; });
      if (s.yearOverall[ys[0]] - s.yearOverall[ys[ys.length - 1]] >= 0.3) out.push("Year " + ys[0] + " rated the programme highest overall (" + f1(s.yearOverall[ys[0]]) + ") and Year " + ys[ys.length - 1] + " lowest (" + f1(s.yearOverall[ys[ys.length - 1]]) + ").");
    }
    var bw = busiestWeek(list);
    if (bw && s.n >= 4) out.push("The busiest week started on " + nice(bw.mon) + " with " + bw.n + " reflections.");
    return out;
  }

  /* ---------- look ---------- */
  var st = document.createElement("style");
  st.textContent =
    ":root{--mr-holo:linear-gradient(115deg,#ff9bd2,#9be7ff,#b8ffcf,#ffe69b,#c9a8ff,#ff9bd2)}" +
    "#mr-btn{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:1200;padding:.6rem 1.05rem;box-shadow:0 10px 28px rgba(1,8,30,.5);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);background:rgba(14,34,86,.88)}" +
    "#mr-btn[hidden]{display:none}@media print{#mr-btn,.mr-ov{display:none!important}}" +
    "#mr-btn .mr-dot{position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:50%;background:#ff2d2d;border:2px solid #fff;animation:mrPulse 1.8s infinite}" +
    "#mr-btn.seen .mr-dot{display:none}" +
    "@keyframes mrPulse{0%{box-shadow:0 0 0 0 rgba(255,45,45,.7)}70%,100%{box-shadow:0 0 0 9px rgba(255,45,45,0)}}" +
    "@keyframes mrHolo{to{background-position:300% 0}}@keyframes mrIn{from{opacity:0;transform:translateY(14px) scale(.97);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}" +
    "@keyframes mrRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes mrFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes mrRing{from{stroke-dashoffset:var(--circ)}to{stroke-dashoffset:var(--off)}}" +
    "@keyframes mrOrb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,-12px) scale(1.15)}}" +
    ".mr-ov{position:fixed;inset:0;z-index:1700;display:grid;place-items:center;padding:16px;background:rgba(2,12,39,.62);-webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px)}.mr-ov[hidden]{display:none}" +
    ".mr-card{position:relative;width:min(760px,100%);overflow:hidden;border-radius:26px;color:#eef5ff;background:linear-gradient(160deg,rgba(18,42,104,.9),rgba(7,20,56,.94));box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.18);animation:mrIn .55s cubic-bezier(.2,.8,.2,1) both}" +
    ".mr-frame{position:absolute;inset:0;border-radius:26px;padding:1.5px;pointer-events:none;background:var(--mr-holo);background-size:300% 100%;animation:mrHolo 7s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}" +
    ".mr-wrap{position:relative;max-width:100%;max-height:calc(100vh - 32px);overflow-y:auto;overflow-x:hidden;padding:24px 26px 22px}.mr-orb{position:absolute;top:-70px;right:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(155,231,255,.28),rgba(201,168,255,.12) 55%,transparent 70%);filter:blur(6px);pointer-events:none;animation:mrOrb 9s ease-in-out infinite}" +
    ".mr-top{position:relative;display:flex;align-items:center;gap:10px;margin-bottom:4px}.mr-top h2{margin:0;flex:1;font-size:25px;background:var(--mr-holo);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:mrHolo 8s linear infinite}" +
    ".mr-x{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0}" +
    ".mr-nav{position:relative;display:flex;align-items:center;gap:8px;margin:0 0 16px;color:#b7c7e6;font-size:14px}.mr-nav b{color:#eef5ff}" +
    ".mr-arrow{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:16px;cursor:pointer;padding:0}.mr-arrow:disabled{opacity:.3;cursor:default}" +
    ".mr-pause{position:relative;margin:-8px 0 14px;padding:.4rem .75rem;border-radius:12px;font-size:13px;color:#d9ccff;background:rgba(176,150,255,.16);border:1px solid rgba(190,170,255,.4)}" +
    ".mr-hero{position:relative;display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;margin-bottom:16px}" +
    ".mr-ring{position:relative;width:170px;height:170px;animation:mrRise .6s .15s both}.mr-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.mr-ring .bg{stroke:rgba(255,255,255,.12)}" +
    ".mr-ring .fg{stroke-linecap:round;animation:mrRing 1.5s .35s cubic-bezier(.2,.8,.2,1) both}.mr-ringtxt{position:absolute;inset:0;display:grid;place-content:center;text-align:center}" +
    ".mr-big{font-size:46px;font-weight:800;line-height:1;background:var(--mr-holo);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:mrHolo 8s linear infinite}.mr-ringtxt small{display:block;margin-top:4px;color:#b7c7e6;font-size:12px;letter-spacing:.06em;text-transform:uppercase}" +
    ".mr-tiles{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.mr-tile{grid-column:span 2;min-width:0}.mr-tile:nth-child(-n+2){grid-column:span 3}.mr-tile{padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);animation:mrRise .55s both}" +
    ".mr-tile .n{font-size:30px;font-weight:800;line-height:1.1}.mr-tile .l{font-size:12px;color:#b7c7e6;text-transform:uppercase;letter-spacing:.06em}.mr-tile .s{font-size:12.5px;color:#b7c7e6;margin-top:2px}" +
    ".mr-cats{position:relative;display:grid;gap:10px;margin-bottom:16px}.mr-cat{padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);animation:mrRise .55s both}" +
    ".mr-row{display:flex;align-items:baseline;gap:10px;margin-bottom:8px}.mr-row b{flex:1;font-size:15px}.mr-row .v{font-size:22px;font-weight:800}.mr-bar{height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}" +
    ".mr-bar i{display:block;height:100%;border-radius:inherit;transform-origin:left;background:var(--mr-holo);background-size:300% 100%;animation:mrFill 1.2s cubic-bezier(.2,.8,.2,1) both,mrHolo 6s linear infinite}" +
    ".mr-d{font-size:12.5px;font-weight:700;padding:.1rem .5rem;border-radius:999px;border:1px solid rgba(255,255,255,.2);color:#b7c7e6}.mr-d.up{color:#9cf0c8;border-color:rgba(156,240,200,.5)}.mr-d.dn{color:#ff9a9a;border-color:rgba(255,154,154,.5)}" +
    ".mr-ov-box{position:relative;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);animation:mrRise .6s .9s both}.mr-ov-box h3{margin:0 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#9be7ff}" +
    ".mr-ov-box p{margin:0 0 8px;font-size:15px;line-height:1.6;color:#e4eeff}.mr-note{margin:10px 0 0;font-size:12px;color:#b7c7e6}.mr-empty{padding:30px 10px;text-align:center;color:#b7c7e6;font-size:15.5px;line-height:1.6}" +
    ".mr-pop{position:relative;width:min(440px,100%);text-align:center;padding:30px 26px 24px;border-radius:26px;color:#eef5ff;background:linear-gradient(160deg,rgba(18,42,104,.92),rgba(7,20,56,.95));box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.18);animation:mrIn .6s cubic-bezier(.2,.8,.2,1) both;overflow:hidden}" +
    ".mr-pop h2{margin:6px 0 8px;font-size:26px;line-height:1.2;background:var(--mr-holo);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:mrHolo 8s linear infinite}.mr-pop p{margin:0 0 18px;color:#cfdcf5;line-height:1.55}" +
    ".mr-pop .mr-ico{font-size:40px;line-height:1;animation:mrOrb 4s ease-in-out infinite;display:inline-block}.mr-acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:relative}" +
    ".mr-go{padding:.7rem 1.3rem;border-radius:999px;border:0;cursor:pointer;font:800 15px/1.2 inherit;font-family:inherit;color:#10214f;background:var(--mr-holo);background-size:300% 100%;animation:mrHolo 6s linear infinite;box-shadow:0 8px 24px rgba(155,231,255,.28)}" +
    ".mr-later{padding:.7rem 1.1rem;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#eef5ff;cursor:pointer;font:600 15px/1.2 inherit;font-family:inherit}" +
    ".mr-aibox{animation-delay:.8s}.mr-aibox h3{display:flex;align-items:center;gap:6px;background:var(--mr-holo);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:mrHolo 8s linear infinite}.mr-aibox h3 svg{color:#9be7ff;-webkit-text-fill-color:currentColor}" +
    ".mr-aibox h4{margin:12px 0 6px;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:#ffe69b}.mr-alist{margin:0;padding-left:20px;display:grid;gap:6px;font-size:14.5px;line-height:1.5;color:#e4eeff}" +
    ".mr-aibadge{display:inline-block;margin-bottom:8px;padding:.1rem .6rem;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.06em;border:1px solid rgba(255,255,255,.25);color:#b7c7e6}.mr-aibadge.live{color:#9cf0c8;border-color:rgba(156,240,200,.5)}" +
    ".mr-aiload{display:flex;align-items:center;gap:10px;color:#cfdcf5;font-size:14.5px;margin-bottom:10px}.mr-aispin{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:#9be7ff;animation:mrSpin 1s linear infinite}@keyframes mrSpin{to{transform:rotate(360deg)}}" +
    ".mr-sk{display:grid;gap:8px}.mr-sk i{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,.08),rgba(255,255,255,.22),rgba(255,255,255,.08));background-size:200% 100%;animation:mrSh 1.4s linear infinite}@keyframes mrSh{to{background-position:-200% 0}}.mr-err{color:#ff9a9a}" +
    "@media(max-width:600px){.mr-hero{grid-template-columns:1fr;justify-items:center}.mr-wrap{padding:20px 16px}.mr-top h2{font-size:21px}.mr-ring{width:150px;height:150px}.mr-tiles{width:100%}}" +
    "@media(prefers-reduced-motion:reduce){.mr-aispin,.mr-sk i,.mr-aibox h3,.mr-card,.mr-pop,.mr-tile,.mr-cat,.mr-ring,.mr-ov-box,.mr-ring .fg,.mr-bar i,.mr-frame,.mr-big,.mr-top h2,.mr-pop h2,.mr-go,.mr-orb,.mr-ico,#mr-btn .mr-dot{animation:none!important}}";
  document.head.appendChild(st);

  /* ---------- window ---------- */
  var rows = [], email = "", k = -1, popped = false, popTimer = 0;
  var ov = document.createElement("div");
  ov.className = "mr-ov"; ov.hidden = true;
  document.body.appendChild(ov);
  var btn = document.createElement("button");
  btn.type = "button"; btn.id = "mr-btn"; btn.className = "btn ghost";
  btn.innerHTML = 'Monthly report<i class="mr-dot" aria-hidden="true"></i>'; btn.hidden = true;
  var ref = document.getElementById("refresh");
  if (!ref) return;
  document.body.appendChild(btn);

  var q = false;
  function sync() { q = false; btn.hidden = !ref.offsetParent; }      // only while the dashboard (not the sign-in page) is showing
  new MutationObserver(function () { if (!q) { q = true; requestAnimationFrame(sync); } }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style"] });
  sync();

  /* ---------- AI overview ---------- */
  var aiMem = {};
  function aiOn() { return !!(window.IPT_AI && window.IPT_AI.ready() && (M.ai === true || window.IPT_AI.test)); }
  function aiKey(n, n2) { return "ipt-monthly-ai:" + (window.IPT_AI && window.IPT_AI.test ? "t" : "r") + ":" + n + ":" + n2; }
  function aiGet(n) {
    var list = inPeriod(rows, n), key = aiKey(n, list.length);
    if (aiMem[key]) return aiMem[key];
    try { var c = localStorage.getItem(key); if (c) { var o = JSON.parse(c); return (aiMem[key] = Promise.resolve({ demo: false, data: o })); } } catch (e) {}
    var pr = window.IPT_AI.run(list, "Monthly report for " + nice(pStart(n)) + " to " + nice(pEnd(n), true)).then(function (res) {
      if (!res.demo) { try { localStorage.setItem(key, JSON.stringify(res.data)); } catch (e) {} }
      return res;
    });
    aiMem[key] = pr; pr.catch(function () { delete aiMem[key]; });      // a failure is not remembered, so "Try again" really tries again
    return pr;
  }
  var SPK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6zM19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z"/></svg>';
  function aiShell(inner) { return '<h3>' + SPK + ' AI overview</h3>' + inner; }
  function aiLoading() { return aiShell('<div class="mr-aiload" role="status" aria-live="polite"><span class="mr-aispin"></span><span>Reading the month\u2019s answers\u2026</span></div><div class="mr-sk"><i></i><i></i><i style="width:70%"></i></div>'); }
  function aiDone(res) {
    var d = res.data || {}, acts = Array.isArray(d.actions) ? d.actions : [];
    return aiShell('<span class="mr-aibadge' + (res.demo ? "" : " live") + '">' + (res.demo ? "PREVIEW \u00B7 sample text, no AI used" : (window.IPT_AI.test ? "TEST \u00B7 AI on made-up answers" : "Written by AI")) + "</span>" +
      "<p>" + esc(d.overview) + "</p>" +
      (acts.length ? '<h4>Suggested actions</h4><ol class="mr-alist">' + acts.slice(0, 5).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ol>" : "") +
      '<p class="mr-note">' + (d.meta && d.meta.model ? "Written by " + esc(d.meta.model) + (d.meta.provider ? " on " + esc(d.meta.provider) : "") + ". " : "") + "AI can miss detail, so open the responses before acting on it.</p>");
  }
  function aiFill(n) {
    var box = ov.querySelector("#mr-ai"); if (!box) return;
    box.innerHTML = aiLoading();
    aiGet(n).then(function (res) {
      var b = ov.querySelector("#mr-ai"); if (!b || k !== n) return;
      b.innerHTML = aiDone(res);
    }, function (err) {
      var b = ov.querySelector("#mr-ai"); if (!b || k !== n) return;
      b.innerHTML = aiShell('<p class="mr-err">' + esc((err && err.message) || "The AI overview could not be made.") + '</p><button type="button" class="mr-later" id="mr-ai-again">Try again</button>');
    });
  }

  var SKEY = function () { return "ipt-monthly-seen:" + String(email || "").toLowerCase(); };
  function seenK() { try { var v = localStorage.getItem(SKEY()); return v === null ? -1 : Number(v); } catch (e) { return -1; } }
  function markSeen(n) { try { if (n > seenK()) localStorage.setItem(SKEY(), String(n)); } catch (e) {} paintDot(); }
  function paintDot() { var ready = lastDone() >= 0 && inPeriod(rows, lastDone()).length > 0; btn.classList.toggle("seen", !ready || seenK() >= lastDone()); }

  function countUp(el, to, dec, ms) {
    if (!isFinite(to)) return;
    var fmt = function (v) { return dec ? v.toFixed(dec) : String(Math.round(v)); };
    if (window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches) { el.textContent = fmt(to); return; }
    var t0 = performance.now(); el.textContent = fmt(0);
    (function step(t) { var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1 && document.body.contains(el)) requestAnimationFrame(step); })(t0);
  }
  function delta(a, b, isCount) {
    if (a === null || b === null || b === undefined) return "";
    var d = a - b, tiny = isCount ? d === 0 : Math.abs(d) < 0.05;
    if (tiny) return '<span class="mr-d" title="Compared with the previous report">= same</span>';
    return '<span class="mr-d ' + (d > 0 ? "up" : "dn") + '" title="Compared with the previous report">' + (d > 0 ? "▲ " : "▼ ") + (isCount ? Math.abs(d) : f1(Math.abs(d))) + "</span>";
  }

  function show(n) {
    k = n;
    var done = lastDone(), list = inPeriod(rows, k), prevList = k > 0 ? inPeriod(rows, k - 1) : [], s = stats(list), p = prevList.length ? stats(prevList) : null;
    var body, withAI = aiOn() && list.length > 0;
    if (!list.length) {
      body = '<div class="mr-empty">No reflections were sent between ' + esc(nice(pStart(k))) + " and " + esc(nice(pEnd(k))) + ".<br>Once teachers send some, the report fills itself in.</div>";
    } else {
      var circ = 2 * Math.PI * 70, off = circ * (1 - (s.avg.overall === null ? 0 : s.avg.overall / 5));
      body =
        '<div class="mr-hero"><div class="mr-ring"><svg viewBox="0 0 170 170" aria-hidden="true"><defs><linearGradient id="mr-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9bd2"/><stop offset=".5" stop-color="#9be7ff"/><stop offset="1" stop-color="#b8ffcf"/></linearGradient></defs><circle class="bg" cx="85" cy="85" r="70" fill="none" stroke-width="13"/><circle class="fg" cx="85" cy="85" r="70" fill="none" stroke="url(#mr-g)" stroke-width="13" style="--circ:' + circ + ";--off:" + off + ";stroke-dasharray:" + circ + ";stroke-dashoffset:" + off + '"/></svg>' +
        '<div class="mr-ringtxt"><span class="mr-big" data-to="' + (s.avg.overall === null ? "" : s.avg.overall) + '" data-dec="1">' + f1(s.avg.overall) + "</span><small>Overall<br>out of 5</small></div></div>" +
        '<div class="mr-tiles"><div class="mr-tile" style="animation-delay:.3s"><div class="l">Responses</div><div class="n"><span data-to="' + s.n + '" data-dec="0">' + s.n + "</span></div><div class=\"s\">" + (p ? delta(s.n, p.n, true) + " vs previous report" : "first report") + "</div></div>" +
        '<div class="mr-tile" style="animation-delay:.4s"><div class="l">Schools</div><div class="n"><span data-to="' + s.schools + '" data-dec="0">' + s.schools + '</span></div><div class="s">that took part</div></div>' +
        [5, 6, 7].map(function (y, i) { return '<div class="mr-tile" style="animation-delay:' + (0.5 + i * 0.1) + 's"><div class="l">Year ' + y + '</div><div class="n"><span data-to="' + s.years[y] + '" data-dec="0">' + s.years[y] + '</span></div><div class="s">' + (s.yearOverall[y] === null ? "reflections" : "reflections · " + f1(s.yearOverall[y]) + " overall") + "</div></div>"; }).join("") + "</div></div>" +
        '<div class="mr-cats">' + ["resources", "engagement", "clarity"].map(function (c, i) {
          var v = s.avg[c];
          return '<div class="mr-cat" style="animation-delay:' + (0.6 + i * 0.12) + 's"><div class="mr-row"><b>' + LABEL[c] + '</b>' + (p ? delta(v, p.avg[c]) : "") + '<span class="v"><span data-to="' + (v === null ? "" : v) + '" data-dec="1">' + f1(v) + '</span><small style="font-size:13px;color:#b7c7e6;font-weight:600"> / 5</small></span></div><div class="mr-bar"><i style="width:' + (v === null ? 0 : Math.round(v / 5 * 100)) + "%;animation-delay:" + (0.7 + i * 0.12) + 's,0s"></i></div></div>';
        }).join("") + "</div>" +
        (withAI ? '<div class="mr-ov-box mr-aibox" id="mr-ai"></div>' : "") +
        (withAI ? "" : '<div class="mr-ov-box"' + (withAI ? ' style="animation-delay:1s"' : "") + '><h3>Overview</h3>' + overview(s, p, list, k).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
        '<p class="mr-note">' + ("Written automatically from the numbers above. No AI was used, and no teacher comments or names are shown here.") + "</p></div>");
    }
    ov.innerHTML = '<div class="mr-card" role="dialog" aria-modal="true" aria-labelledby="mr-t"><div class="mr-frame"></div><div class="mr-wrap"><div class="mr-orb"></div>' +
      '<div class="mr-top"><h2 id="mr-t">Monthly report</h2><button type="button" class="mr-x" aria-label="Close">&times;</button></div>' +
      '<div class="mr-nav"><button type="button" class="mr-arrow" id="mr-prev" aria-label="Earlier report"' + (k <= 0 ? " disabled" : "") + '>‹</button><span><b>' + esc(nice(pStart(k))) + " – " + esc(nice(pEnd(k), true)) + '</b> · ' + span(k) + '</span><button type="button" class="mr-arrow" id="mr-next" aria-label="Later report"' + (k >= done ? " disabled" : "") + '>›</button></div>' +
      (pauses(k).length ? '<div class="mr-pause">Includes a pause: ' + esc(pauses(k).join(", ")) + ". Those Mondays are not counted.</div>" : "") +
      body + "</div></div>";
    ov.hidden = false; document.body.style.overflow = "hidden";
    ov.querySelectorAll("[data-to]").forEach(function (el) { var to = parseFloat(el.getAttribute("data-to")); if (!isNaN(to)) countUp(el, to, Number(el.getAttribute("data-dec")), 1400); });
    ov.querySelector(".mr-x").focus();
    if (withAI) aiFill(k);
    if (k === done) markSeen(done);
  }
  function close() { ov.hidden = true; ov.innerHTML = ""; document.body.style.overflow = ""; }

  function openLatest() {
    var d = lastDone();
    if (d < 0) {
      ov.innerHTML = '<div class="mr-card" role="dialog" aria-modal="true"><div class="mr-frame"></div><div class="mr-wrap"><div class="mr-top"><h2>Monthly report</h2><button type="button" class="mr-x" aria-label="Close">&times;</button></div><div class="mr-empty">The first monthly report will be ready on <b>' + esc(nice(addDays(pEnd(0), 1), true)) + "</b>, when the first period is over.</div></div></div>";
      ov.hidden = false; document.body.style.overflow = "hidden"; ov.querySelector(".mr-x").focus(); return;
    }
    show(d);
  }

  /* the welcome window */
  function welcome() {
    var d = lastDone();
    if (popped || d < 0 || seenK() >= d || !inPeriod(rows, d).length) return;
    try { if (sessionStorage.getItem("ipt-monthly-later:" + String(email).toLowerCase()) === String(d)) return; } catch (e) {}
    popped = true;
    if (aiOn()) { try { aiGet(d).catch(function () {}); } catch (e) {} }      // the AI starts reading while the welcome window is open
    ov.innerHTML = '<div class="mr-pop" role="dialog" aria-modal="true" aria-labelledby="mr-pt"><div class="mr-frame"></div><div class="mr-orb"></div><span class="mr-ico" aria-hidden="true">📊</span><h2 id="mr-pt">Your monthly report is ready</h2><p>The period from <b>' + esc(nice(pStart(d))) + "</b> to <b>" + esc(nice(pEnd(d))) + '</b> is done. Click below to view it.</p><div class="mr-acts"><button type="button" class="mr-go" id="mr-view">Click here to view it</button><button type="button" class="mr-later" id="mr-later">Later</button></div></div>';
    ov.hidden = false; document.body.style.overflow = "hidden";
    ov.querySelector("#mr-view").focus();
  }

  btn.addEventListener("click", openLatest);
  ov.addEventListener("click", function (e) {
    var t = e.target;
    if (t === ov || t.closest(".mr-x")) { close(); return; }
    if (t.closest("#mr-view")) { openLatest(); return; }
    if (t.closest("#mr-later")) { try { sessionStorage.setItem("ipt-monthly-later:" + String(email).toLowerCase(), String(lastDone())); } catch (er) {} close(); return; }
    if (t.closest("#mr-ai-again")) { aiFill(k); return; }
    if (t.closest("#mr-prev") && k > 0) show(k - 1);
    if (t.closest("#mr-next") && k < lastDone()) show(k + 1);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) close(); });

  /* the admin page announces its rows after every load */
  function onRows(e) {
    var d = (e && e.detail) || {};
    rows = d.rows || []; email = d.email || email;
    paintDot();
    if (!popped && !popTimer) popTimer = setTimeout(function () { popTimer = 0; if (ov.hidden && ref.offsetParent) welcome(); }, 3800);   // after the welcome greeting has finished
  }
  window.addEventListener("ipt:rows", onRows);
  if (window.IPT_ROWS) onRows({ detail: window.IPT_ROWS });      // the rows may have arrived before this file ran
  window.addEventListener("ipt:signout", function () { popped = false; rows = []; clearTimeout(popTimer); popTimer = 0; close(); });
})();
