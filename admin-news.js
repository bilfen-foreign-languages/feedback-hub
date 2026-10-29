/* ============================================================================
   WHAT'S NEW  -  a button on the admin page that lists recent changes.
   To add news: put a new block at the TOP of the list below and upload this file.
   (Only this file changes. A small dot shows on the button until someone opens it.)
   Turn it off: config.js -> admin: { whatsNew: false }
   ========================================================================== */
(function () {
  "use strict";
  var NEWS = [
    { id: "2026-10-30-holidays", date: "30 Oct 2026", title: "Holidays and breaks on the calendar", tag: "Ufuk",
      text: "The calendar now shows school breaks, official holidays, Bayram days and half days, with the dates in config.js. A Monday that falls on a break has no feedback: the Feedback this week box says so and shows the next feedback Monday, and every school after it moves one Monday later (Year 5, 6 and 7, and the Schools yet to respond list on this page)." },
    { id: "2026-10-28-next", date: "28 Oct 2026", title: "Thank-you card shows the next feedback Monday", tag: "Ufuk",
      text: "After a teacher presses Submit, the thank-you card now also says when their school\u2019s next feedback Monday is, for example \u201CMonday 14 December \u00B7 in 47 days\u201D. It uses the same school rotation as the calendar." },
    { id: "2026-10-28-scroll", date: "28 Oct 2026", title: "New scroll bar", tag: "Ufuk",
      text: "Every scrolling area on the site and this admin page has a slim glass scroll bar with a teal-to-blue gradient on a dark track. It works exactly as before, and Firefox shows the same colours without the gradient." },
    { id: "2026-10-25-monthly", date: "25 Oct 2026", title: "Monthly report (new)", tag: "Ufuk",
      text: "Every 4 weeks, a window greets each admin with \u201CYour monthly report is ready\u201D. It shows the responses, the overall score, resources, engagement and clarity, how they changed since the previous 4 weeks, and a short overview. The new Monthly report button in the bottom-left corner opens it any time, and the arrows go back to earlier reports. It also has an AI overview with suggested actions that starts by itself (switched on in config.js once approved; open admin.html?aitest=1 to try it on made-up answers). The numbers are worked out automatically and no teacher comments are shown." },
    { id: "2026-10-24-secure", date: "24 Oct 2026", title: "AI Summary is live and locked to this site", tag: "Ufuk",
      text: "AI Summary now runs through our own secure service. It only answers requests that come from this admin page, and only for signed-in admins. Emails and school names are removed before anything is sent, and quotes are checked against the real answers." },
    { id: "2026-10-24-welcome", date: "24 Oct 2026", title: "A personal welcome", tag: "Ufuk",
      text: "After signing in, the page says \u201CSigned in as \u2026\u201D for 3 seconds and then greets you by first name with a shimmering \u201CWelcome back\u201D. The What\u2019s new? button now floats in the bottom-right corner, with a red dot when there is something new." },
    { id: "2026-10-24-ui", date: "24 Oct 2026", title: "AI Summary: new look, and pages for the table", tag: "Ufuk",
      text: "The AI Summary window has a glass, holographic design with a loading animation. Suggested actions open from a glowing pill next to Overview and appear at the top. The response table shows 5 at a time with page numbers, and the AI Summary button now sits on the same row as the stats." },
    { id: "2026-10-23-ai", date: "23 Oct 2026", title: "AI summary (new)", tag: "Ufuk",
      text: "The glowing AI Summary button (next to the stats, on the right) writes a short summary of the responses on screen: what worked, what didn’t, the next plan and suggested actions. You see exactly what will be sent and press “Create summary” yourself. Emails and school names are removed first, and quotes are checked against the real answers. Use admin.html?aitest=1 to try it with made-up answers only." },
    { id: "2026-10-weak", date: "October 2026", title: "“Thin” is now “Weak”", tag: "Ufuk",
      text: "Weak answers are labelled “Weak”. “What didn’t work” and “Shape the next plan” are no longer marked weak for being short; empty, one-word, filler or copied answers are still flagged." },
    { id: "2026-10-pdf", date: "October 2026", title: "PDF reports keep charts and comments whole", tag: "Ufuk",
      text: "One click still downloads the PDF, and charts and comment boxes are no longer cut in half at the end of a page." },
    { id: "2026-10-guide", date: "October 2026", title: "“Before you start” card and voice-command cheat sheet", tag: "Ufuk",
      text: "Teachers see a short guide the first time they open a form, and a small card lists the voice commands while hands-free is running." },
    { id: "2026-10-images", date: "October 2026", title: "Lighter images", tag: "Ufuk",
      text: "Logos and images are much smaller, so the pages open faster, especially on school Wi-Fi." }
  ];

  var CFG = (window.IPT_CONFIG && window.IPT_CONFIG.admin) || {};
  if (CFG.whatsNew === false || !NEWS.length) return;
  var KEY = "ipt-news-seen";
  function seen() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function mark() { try { localStorage.setItem(KEY, NEWS[0].id); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var st = document.createElement("style");
  st.textContent =
    "#news-btn{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:1200;padding:.6rem 1.05rem;box-shadow:0 10px 28px rgba(1,8,30,.5);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);background:rgba(14,34,86,.88)}" +
    "#news-btn[hidden]{display:none}" +
    "@media print{#news-btn{display:none!important}}" +
    "#news-btn .nw-dot{position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:50%;background:#ff2d2d;border:2px solid #fff;box-shadow:0 0 0 0 rgba(255,45,45,.7);animation:nwPulse 1.8s infinite}" +
    "@keyframes nwPulse{0%{box-shadow:0 0 0 0 rgba(255,45,45,.7)}70%,100%{box-shadow:0 0 0 9px rgba(255,45,45,0)}}" +
    "@media(prefers-reduced-motion:reduce){#news-btn .nw-dot{animation:none}}" +
    "#news-btn.seen .nw-dot{display:none}" +
    ".nw-ov{position:fixed;inset:0;z-index:1600;display:grid;place-items:center;padding:16px;background:rgba(2,12,39,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}" +
    ".nw-ov[hidden]{display:none}" +
    ".nw-card{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:24px;padding:22px 24px;background:linear-gradient(160deg,rgba(14,34,86,.98),rgba(7,20,56,.98));border:1px solid var(--edge,rgba(255,255,255,.2));box-shadow:0 30px 80px rgba(1,8,30,.6);color:var(--txt,#eef5ff)}" +
    ".nw-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}.nw-head h2{margin:0;font-size:20px;flex:1}" +
    ".nw-x{width:36px;height:36px;border-radius:50%;border:1px solid var(--edge,rgba(255,255,255,.2));background:rgba(255,255,255,.08);color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0}" +
    ".nw-item{padding:14px 0;border-top:1px solid rgba(255,255,255,.12)}.nw-item:first-of-type{border-top:0}" +
    ".nw-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12.5px;color:var(--dim,#b7c7e6);margin-bottom:4px}" +
    ".nw-tag{padding:.1rem .55rem;border-radius:999px;background:rgba(82,217,202,.16);border:1px solid rgba(82,217,202,.5);color:#9ff2e8;font-weight:700;font-size:11.5px}" +
    ".nw-new{padding:.1rem .5rem;border-radius:999px;background:linear-gradient(135deg,#ff4fa3,#7b5cff);color:#fff;font-weight:800;font-size:10.5px;letter-spacing:.08em}" +
    ".nw-item h3{margin:0 0 4px;font-size:16px}.nw-item p{margin:0;font-size:14.5px;line-height:1.55;color:#dbe7ff}";
  document.head.appendChild(st);

  var ov = document.createElement("div");
  ov.className = "nw-ov"; ov.hidden = true;
  ov.innerHTML = '<div class="nw-card" role="dialog" aria-modal="true" aria-labelledby="nw-t"><div class="nw-head"><h2 id="nw-t">What’s new</h2><button type="button" class="nw-x" aria-label="Close">&times;</button></div><div class="nw-list"></div></div>';
  document.body.appendChild(ov);
  var btn = document.createElement("button");
  btn.type = "button"; btn.id = "news-btn"; btn.className = "btn ghost";
  btn.innerHTML = 'What’s new?<i class="nw-dot" aria-hidden="true"></i>';
  var ref = document.getElementById("refresh");
  if (!ref) return;
  document.body.appendChild(btn);      // floats in the corner, so the page layout is untouched
  btn.hidden = true;
  var q = false;
  function sync() { q = false; btn.hidden = !ref.offsetParent; }     // only while the dashboard (not the sign-in page) is showing
  function queue() { if (!q) { q = true; requestAnimationFrame(sync); } }
  new MutationObserver(queue).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style"] });
  sync();

  function open() {
    var last = seen(), fresh = true;
    ov.querySelector(".nw-list").innerHTML = NEWS.map(function (n) {
      if (n.id === last) fresh = false;
      return '<div class="nw-item"><div class="nw-meta">' + (fresh ? '<span class="nw-new">NEW</span>' : "") + '<span class="nw-tag">' + esc(n.tag || "") + "</span><span>" + esc(n.date || "") + "</span></div><h3>" + esc(n.title) + "</h3><p>" + esc(n.text) + "</p></div>";
    }).join("");
    ov.hidden = false; document.body.style.overflow = "hidden"; mark(); btn.classList.add("seen");
    ov.querySelector(".nw-x").focus();
  }
  function close() { ov.hidden = true; document.body.style.overflow = ""; btn.focus(); }
  if (seen() === NEWS[0].id) btn.classList.add("seen");
  btn.addEventListener("click", open);
  ov.querySelector(".nw-x").addEventListener("click", close);
  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) close(); });
})();
