/* IPT Feedback · Created by Ufuk Korkmaz, 2026. */
/* ==========================================================================
   GREETINGS AND SPECIAL DAYS
   - Changing greetings: the welcome screen says things like "Happy Monday," or "Good evening," instead of always
     "Welcome back,". On a special day it uses that day's own greeting.
   - Special days: a small message on the home page and, if you like, a burst of confetti (once a day) or gentle
     snow. The days themselves are written in config.js under "occasions". You do not need to edit this file.
   ========================================================================== */
(function () {
  var CFG = window.IPT_CONFIG || {}, TZ = CFG.timezone || "Europe/Istanbul";
  var reduce = function () { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; };
  function read(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /* "now" in the meeting time zone */
  function now() {
    var d = new Date(), p, g, t = {};
    try {
      p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
      g = function (k) { return p.filter(function (x) { return x.type === k; })[0].value; };
      t.y = g("year"); t.m = g("month"); t.d = g("day"); t.wd = DAYS.indexOf(g("weekday")); t.min = (Number(g("hour")) % 24) * 60 + Number(g("minute"));
    } catch (e) {
      t.y = String(d.getFullYear()); t.m = ("0" + (d.getMonth() + 1)).slice(-2); t.d = ("0" + d.getDate()).slice(-2); t.wd = (d.getDay() + 6) % 7; t.min = d.getHours() * 60 + d.getMinutes();
    }
    t.iso = t.y + "-" + t.m + "-" + t.d; t.md = t.m + "-" + t.d; return t;
  }

  /* which special days are today (a day can be one date, a range, yearly "MM-DD" or one-off "YYYY-MM-DD") */
  function inRange(o, t) {
    var a = String(o.date || ""), b = String(o.to || a);
    if (/^\d{4}-/.test(a)) return t.iso >= a && t.iso <= b;
    return a <= b ? (t.md >= a && t.md <= b) : (t.md >= a || t.md <= b);      // a range may run across New Year
  }
  function today() { var t = now(); return (Array.isArray(CFG.occasions) ? CFG.occasions : []).filter(function (o) { return o && o.date && inRange(o, t); }); }
  function first(list, key) { for (var i = 0; i < list.length; i++) if (list[i][key]) return list[i]; return null; }

  /* ---------- changing greetings ---------- */
  function pool(t) {
    var h = Math.floor(t.min / 60), out = ["Welcome back,", "Welcome back,", "Hello again,", "Great to see you,"];
    out.push(h >= 5 && h < 12 ? "Good morning," : h >= 12 && h < 18 ? "Good afternoon," : h >= 18 && h < 22 ? "Good evening," : "Hello, night owl,");
    var wk = [["Happy Monday,", "Fresh week ahead,"], ["Happy Tuesday,"], ["Happy Wednesday,", "Halfway there,"], ["Happy Thursday,", "Almost Friday,"], ["Happy Friday,", "Friday feeling,"], ["Happy weekend,", "Enjoy your weekend,"], ["Happy weekend,", "Lovely Sunday,"]][t.wd] || [];
    out = out.concat(wk, wk);                                                   // the day of the week is picked a little more often
    var soon = null;                                                            // an IPT meeting later today
    (CFG.meetings || []).forEach(function (m) {
      if (m && m.day === DAYS[t.wd] && /^\d\d:\d\d$/.test(m.start || "")) { var mm = Number(m.start.slice(0, 2)) * 60 + Number(m.start.slice(3)); if (mm > t.min && (!soon || mm < soon.mm)) soon = { mm: mm, s: m.start }; }
    });
    if (soon) out.push("Meeting today at " + soon.s + ",", "Meeting today at " + soon.s + ",");
    return out;
  }
  /* the line shown on the welcome screen: { hello, tail } */
  function line(back) {
    var occ = first(today(), "greet");
    if (occ) return { hello: occ.greet, tail: occ.solemn ? "." : "!" };
    if (!back) return { hello: "Welcome,", tail: "!" };
    var t = now(), p = pool(t), last = read("ipt-greet"), pick;
    var opts = p.filter(function (x) { return x !== last; }); if (!opts.length) opts = p;
    pick = opts[Math.floor(Math.random() * opts.length)];
    write("ipt-greet", pick);
    return { hello: pick, tail: "!" };
  }

  /* ---------- the message on the home page ---------- */
  function pill() {
    var list = today(), occ = first(list, "banner"), hub = document.querySelector("#menu-view .menu-hub");
    if (!occ || !hub || hub.querySelector(".occ-pill")) return;
    if (!document.getElementById("occ-css")) {
      var st = document.createElement("style"); st.id = "occ-css";
      st.textContent =
        ".occ-pill{margin:.9rem auto 0;max-width:34rem;padding:.6rem 1.1rem;border-radius:999px;font-size:15px;font-weight:600;line-height:1.35;color:#f4f9ff;text-align:center;" +
        "background:linear-gradient(135deg,rgba(82,217,202,.22),rgba(161,131,238,.22));border:1px solid rgba(255,255,255,.3);box-shadow:0 10px 30px rgba(1,10,37,.28),inset 0 1px 0 rgba(255,255,255,.2)}" +
        ".occ-pill.solemn{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.25);font-weight:500}" +
        ".occ-pill{animation:occIn .7s cubic-bezier(.2,.8,.2,1) .35s backwards}@keyframes occIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}" +
        "@media(prefers-reduced-motion:reduce){.occ-pill{animation:none}}" +
        ".occ-fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9400}";
      document.head.appendChild(st);
    }
    var d = document.createElement("div"); d.className = "occ-pill" + (occ.solemn ? " solemn" : ""); d.setAttribute("role", "note");
    d.textContent = occ.banner; hub.appendChild(d);
  }

  /* ---------- effects: confetti once a day, snow while the home page is open ---------- */
  function canvas() {
    var c = document.createElement("canvas"); c.className = "occ-fx"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c); var x = c.getContext("2d"); if (!x) { c.remove(); return null; }
    function size() { var r = window.devicePixelRatio || 1; c.width = innerWidth * r; c.height = innerHeight * r; x.setTransform(r, 0, 0, r, 0, 0); }
    size(); addEventListener("resize", size); return { c: c, x: x };
  }
  function confetti(colors) {
    var cv = canvas(); if (!cv) return;
    var W = innerWidth, H = innerHeight, n = W < 600 ? 90 : 150, ps = [], t0 = performance.now(), cols = colors && colors.length ? colors : ["#52d9ca", "#658ff1", "#fff37b", "#a183ee", "#ffffff", "#ff9ec7"];
    for (var i = 0; i < n; i++) ps.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .35, c: cols[i % cols.length] });
    (function frame(t) {
      var life = (t - t0) / 3200; cv.x.clearRect(0, 0, W, H);
      ps.forEach(function (p) { p.vy += .22; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr; cv.x.save(); cv.x.globalAlpha = Math.max(0, 1 - Math.max(0, life - .6) / .4); cv.x.translate(p.x, p.y); cv.x.rotate(p.r); cv.x.fillStyle = p.c; cv.x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); cv.x.restore(); });
      if (life < 1) requestAnimationFrame(frame); else { cv.c.remove(); }
    })(t0);
  }
  function snow() {
    var cv = canvas(); if (!cv) return;
    var W = innerWidth, H = innerHeight, n = W < 600 ? 45 : 80, fl = [];
    for (var i = 0; i < n; i++) fl.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.6, v: .35 + Math.random() * .9, p: Math.random() * 6 });
    (function frame() {
      var home = document.querySelector("#menu-view.active");
      cv.c.style.display = home ? "" : "none";
      if (home && !document.hidden) {
        W = innerWidth; H = innerHeight; cv.x.clearRect(0, 0, W, H); cv.x.fillStyle = "rgba(255,255,255,.85)";
        fl.forEach(function (f) { f.y += f.v; f.p += .012; f.x += Math.sin(f.p) * .4; if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; } cv.x.beginPath(); cv.x.arc(f.x, f.y, f.r, 0, 6.283); cv.x.fill(); });
      }
      requestAnimationFrame(frame);
    })();
  }
  function effects() {
    var list = today(); if (!list.length || reduce()) return;
    if (list.some(function (o) { return o.solemn; })) return;                   // quiet days stay quiet
    var conf = first(list.filter(function (o) { return o.effect === "confetti"; }), "effect");
    var iso = now().iso;
    if (conf && read("ipt-occ-fx") !== iso) { write("ipt-occ-fx", iso); setTimeout(function () { confetti(conf.colors); }, 700); }
    if (list.some(function (o) { return o.effect === "snow"; })) snow();
  }

  window.IPTGreet = { line: line, today: today };

  var started = false;
  function start() { if (started) return; started = true; pill(); effects(); }
  function whenReady() {
    if (document.body.classList.contains("page-ready")) { start(); return; }
    var mo = new MutationObserver(function () { if (document.body.classList.contains("page-ready")) { mo.disconnect(); start(); } });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setTimeout(function () { mo.disconnect(); start(); }, 9000);     // safety net
  }
  if (document.body) whenReady(); else document.addEventListener("DOMContentLoaded", whenReady);
})();
