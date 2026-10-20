/* IPT Feedback · Created by Ufuk Korkmaz, 2026. */
/* ==========================================================================
   WEATHER BACKGROUND
   A soft glow and a very light effect behind the page that follow the real weather:
   sun + a few birds, rain, snow that slowly piles up, wind, clouds, fog, a quiet night sky.
   Weather comes from Open-Meteo (free, no account). Settings live in config.js under "weather".
   Test any weather by adding ?wx=rain to the address (rain, snow, sun, wind, cloud, fog, storm, night).
   ========================================================================== */
(function () {
  "use strict";
  var CFG = (window.IPT_CONFIG || {}).weather || {};
  if (CFG.enabled === false) return;

  var PLACES = (Array.isArray(CFG.places) && CFG.places.length) ? CFG.places : [
    { name: "Istanbul", lat: 41.01, lon: 28.98 }, { name: "Ankara", lat: 39.93, lon: 32.86 },
    { name: "İzmir", lat: 38.42, lon: 27.14 }, { name: "Bursa", lat: 40.19, lon: 29.06 },
    { name: "Antalya", lat: 36.90, lon: 30.70 }, { name: "Kayseri", lat: 38.73, lon: 35.49 },
    { name: "İskenderun", lat: 36.59, lon: 36.17 }
  ];
  var WIND_KMH = CFG.windKmh || 32;                          // wind at or above this (km/h) counts as "windy"
  var K = typeof CFG.strength === "number" ? Math.max(0, Math.min(2, CFG.strength)) : 1;   // 1 = normal, 0.5 = fainter, 1.5 = stronger
  var KEY = { slow: "ipt-wx-slow", strikes: "ipt-wx-strikes", on: "ipt-wx-on", geo: "ipt-wx-geo", place: "ipt-wx-place", off: "ipt-wx-off", force: "ipt-wx-force", cache: "ipt-wx-cache", snow0: "ipt-wx-snow0" };
  var ICON = { sun: "☀️", night: "🌙", cloud: "☁️", fog: "🌫️", rain: "🌧️", storm: "⛈️", snow: "❄️", wind: "💨" };
  var NAME = { sun: "Sunny", night: "Clear night", cloud: "Cloudy", fog: "Foggy", rain: "Rainy", storm: "Stormy", snow: "Snowy", wind: "Windy" };
  var COLOR = {   // glow colour (r,g,b)
    sun: "255,208,84", night: "112,124,255", cloud: "160,178,205", fog: "176,190,210",
    rain: "40,100,225", storm: "70,72,175", snow: "236,244,255", wind: "126,150,190"
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  /* ---------- slow computers: switch the effect off by itself ---------- */
  var LOW_MODE = CFG.lowEndMode === "glow" ? "glow" : "off";          // "off" = nothing at all on a slow computer, "glow" = keep only the still glow
  var lite = false, sessionSlow = false;
  function userOff() { return lsGet(KEY.off) === "1"; }
  function staticLow() {                                              // what the browser tells us about the computer
    try {
      var n = navigator, c = n.connection || {};
      return !!((n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2) || c.saveData === true || /(^|slow-)2g$/.test(c.effectiveType || ""));
    } catch (e) { return false; }
  }
  function slowRecent() { var t = parseInt(lsGet(KEY.slow) || "0", 10); return !!t && Date.now() - t < 7 * 864e5; }   // measured slow within the last week
  function autoOff() { return CFG.autoLowEnd !== false && lsGet(KEY.on) !== "1" && (sessionSlow || slowRecent() || staticLow()); }
  function isOff() { return userOff() || (autoOff() && LOW_MODE === "off"); }
  var mon = { on: false, prev: 0, t0: 0, samples: [] };               // measures how smoothly the page really runs
  function monitor(ts) {
    if (!mon.on) return;
    if (mon.prev) {
      var d = ts - mon.prev;
      if (d > 1000) { mon.samples = []; mon.t0 = 0; }                  // the tab was asleep: start the count again
      else if (!mon.t0) { if (document.body.classList.contains("page-ready") || ts > 9000) mon.t0 = ts + 1500; }   // wait until the intro is over
      else if (ts >= mon.t0) {
        mon.samples.push(d);
        if (mon.samples.length >= 90) {
          mon.on = false; var a = mon.samples.slice().sort(function (x, y) { return x - y; });
          if (a[a.length >> 1] > 42) slowDown();                       // typical frame slower than 42 ms = under about 24 pictures a second
          else lsDel(KEY.strikes);
        }
      }
    }
    mon.prev = ts;
  }
  function slowDown() {
    sessionSlow = true;                                              // off for this visit right away; remembered for a week only if it happens on two visits
    var n = (parseInt(lsGet(KEY.strikes) || "0", 10) || 0) + 1; lsSet(KEY.strikes, String(n)); if (n >= 2) lsSet(KEY.slow, String(Date.now()));
    if (LOW_MODE === "off") clearFx(); else { lite = true; stop(); if (cv) cv.classList.remove("on"); if (glow) glow.classList.add("still"); }
    label();
  }
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var small = Math.min(window.innerWidth || 1200, window.innerHeight || 800) < 560;

  /* ---------- the weather → a "kind" ---------- */
  function kindFrom(c) {                                      // c = { code, wind, day }
    var code = c.code, wind = c.wind || 0, kind = "sun", inten = 1;
    if (code === 3) kind = "cloud";
    else if (code === 45 || code === 48) kind = "fog";
    else if ((code >= 51 && code <= 57)) { kind = "rain"; inten = .55; }
    else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { kind = "rain"; inten = code >= 65 || code === 82 ? 1.3 : 1; }
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) kind = "snow";
    else if (code >= 95) { kind = "storm"; inten = 1.4; }
    else kind = c.day === false ? "night" : "sun";
    if (wind >= WIND_KMH && (kind === "sun" || kind === "night" || kind === "cloud" || kind === "fog")) kind = "wind";
    return { kind: kind, inten: inten, wind: wind };
  }

  /* ---------- layers ---------- */
  var glow, cv, ctx, W = 0, H = 0, dpr = 1, raf = 0, last = 0, T = 0;
  var cur = null, seasonalSnow = false;
  var parts = [], ripples = [], blobSprite = null, pileCols = 0, pileSeed = [];

  function css() {
    if (document.getElementById("wx-css")) return;
    var s = document.createElement("style"); s.id = "wx-css";
    s.textContent =
      "#wx-glow,#wx-fx{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:-1}" +
      "#wx-glow{opacity:0;transition:opacity 1.6s ease;background:" +
        "radial-gradient(140% 64% at 50% 114%,rgba(var(--wx),calc(.62*var(--k))),transparent 72%)," +
        "radial-gradient(70% 40% at 50% -8%,rgba(var(--wx),calc(.13*var(--k))),transparent 72%)," +
        "var(--wx-extra,none)}" +
      "#wx-glow.on{opacity:1;animation:wxBreathe 9s ease-in-out infinite alternate}#wx-glow.on.still{animation:none}" +
      "@keyframes wxBreathe{from{filter:brightness(.88)}to{filter:brightness(1.12)}}" +
      "#wx-fx{opacity:0;transition:opacity 1.6s ease}#wx-fx.on{opacity:1}" +
      ".wx-wrap{position:relative;display:block;margin:.7rem auto 0;text-align:center}" +
      ".wx-chip{display:inline-flex;align-items:center;gap:.4rem;height:26px;padding:0 10px;border-radius:999px;" +
        "font:500 12.5px 'Work Sans',system-ui,sans-serif;color:#d6e2fb;background:rgba(6,22,60,.5);border:1px solid rgba(225,244,255,.24);" +
        "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;white-space:nowrap}" +
      ".wx-chip:hover{background:rgba(6,22,60,.72)}" +
      ".wx-pop{position:fixed;left:0;top:0;z-index:9601;width:200px;text-align:left;padding:.55rem;border-radius:16px;background:rgba(6,22,60,.9);" +
        "border:1px solid rgba(225,244,255,.28);box-shadow:0 14px 34px rgba(0,0,0,.4);color:#e6efff;font:500 13px 'Work Sans',system-ui,sans-serif;display:none}" +
      ".wx-pop.open{display:block}" +
      ".wx-pop h4{margin:.1rem .4rem .35rem;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#9decE5;font-weight:600}" +
      ".wx-pop button{display:flex;width:100%;align-items:center;justify-content:space-between;gap:.5rem;padding:.38rem .5rem;border:0;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left}" +
      ".wx-pop button:hover{background:rgba(255,255,255,.1);transform:none}" +
      ".wx-pop button[aria-pressed=true]{background:rgba(121,235,221,.18)}" +
      ".wx-pop button[aria-pressed=true]::after{content:'✓';color:#9decE5}" +
      ".wx-note{margin:.3rem .5rem .1rem;font-size:12px;line-height:1.35;color:#ffd9a8}.wx-pop hr{border:0;border-top:1px solid rgba(225,244,255,.18);margin:.4rem 0}" +
      "@media(max-width:560px){.wx-pop{width:min(220px,86vw)}}";
    document.head.appendChild(s);
  }

  function ensureLayers() {
    if (glow) return;
    glow = document.createElement("div"); glow.id = "wx-glow"; glow.setAttribute("aria-hidden", "true");
    cv = document.createElement("canvas"); cv.id = "wx-fx"; cv.setAttribute("aria-hidden", "true");
    var host = document.body, ref = host.querySelector(".orb-two") || host.firstChild;
    host.insertBefore(glow, ref ? ref.nextSibling : null); host.insertBefore(cv, glow.nextSibling);
    ctx = cv.getContext("2d");
    glow.style.setProperty("--k", K);
    resize(); window.addEventListener("resize", function () { resize(); if (cur) seed(); });
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    small = Math.min(W, H) < 560;
  }

  /* ---------- seeding the particles for a kind ---------- */
  function seed() {
    parts = []; ripples = []; var k = cur.kind, n, i, f = small ? .65 : 1;
    if (k === "rain" || k === "storm") {
      n = Math.round(clamp(W / 13, 34, 100) * cur.inten * f * K);
      for (i = 0; i < n; i++) parts.push({ x: rnd(-80, W + 80), y: rnd(0, H), l: rnd(9, 20), v: rnd(520, 820), a: rnd(.5, 1) });
    } else if (k === "snow") {
      n = seasonalSnow ? 0 : Math.round(clamp(W / 11, 45, 120) * f * K);
      for (i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(1, 2.8), v: rnd(24, 62), ph: rnd(0, 6.3), a: rnd(.4, .85) });
      pileCols = Math.ceil(W / 8) + 1; pileSeed = [];
      for (i = 0; i < pileCols; i++) pileSeed.push(.72 + .28 * (.5 + .5 * Math.sin(i * .21) * Math.cos(i * .067 + 1)));
    } else if (k === "sun") {
      n = small ? 3 : 5;
      for (i = 0; i < n; i++) parts.push({ x: rnd(-60, W), y: rnd(H * .1, H * .46), s: rnd(6.5, 11), v: rnd(16, 30), p: rnd(0, 6.3), bob: rnd(0, 6.3), a: rnd(.4, .62) });
    } else if (k === "wind") {
      n = Math.round((small ? 12 : 20) * K);
      for (i = 0; i < n; i++) parts.push({ x: rnd(-200, W), y: rnd(H * .25, H), l: rnd(90, 220), v: rnd(230, 420), a: rnd(.45, 1), ph: rnd(0, 6.3) });
      for (i = 0; i < (small ? 8 : 14); i++) parts.push({ dot: 1, x: rnd(0, W), y: rnd(H * .3, H), v: rnd(260, 480), ph: rnd(0, 6.3), a: rnd(.3, .6) });
    } else if (k === "cloud" || k === "fog") {
      n = k === "fog" ? 6 : 5; ensureSprite();
      for (i = 0; i < n; i++) parts.push({ x: rnd(-100, W), y: rnd(H * (k === "fog" ? .55 : .4), H * 1.02), r: rnd(200, 360), v: rnd(5, 13) * (i % 2 ? 1 : -1), a: rnd(.09, .16) * (k === "fog" ? 1.4 : 1) });
    } else if (k === "night") {
      n = small ? 28 : 46;
      for (i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H * .62), r: rnd(.5, 1.4), ph: rnd(0, 6.3), sp: rnd(.6, 1.8) });
    }
  }
  function ensureSprite() {
    if (blobSprite) return;
    blobSprite = document.createElement("canvas"); blobSprite.width = blobSprite.height = 256;
    var c = blobSprite.getContext("2d"), g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  }

  /* ---------- drawing ---------- */
  var bw = function (y) { return .35 + .65 * (y / H); };       // effects are a little stronger toward the bottom

  function snowPile() {
    var t0 = parseFloat(lsGet(KEY.snow0) || "0"), now = Date.now();
    if (!t0 || now - t0 > 6 * 3600e3) { t0 = now; lsSet(KEY.snow0, String(t0)); }
    var secs = (now - t0) / 1000, cap = small ? 20 : 30;
    return cap * (1 - Math.exp(-secs / 150)) * K;              // grows for a few minutes, then stays soft
  }
  function pileAt(x, base) { return base * pileSeed[clamp(Math.round(x / 8), 0, pileCols - 1)]; }

  function step(dt) {
    T += dt; var k = cur.kind, i, p;
    ctx.clearRect(0, 0, W, H);
    if (k === "rain" || k === "storm") {
      var slant = clamp(.1 + cur.wind / 90, .1, .6);
      ctx.lineWidth = 1; ctx.lineCap = "round";
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.y += p.v * dt; p.x += p.v * slant * dt;
        if (p.y > H) {
          if (ripples.length < 14 && Math.random() < .3) ripples.push({ x: p.x, y: H - rnd(3, 18), r: 1, life: 1 });
          p.y = -p.l; p.x = rnd(-80, W + 80);
        }
        ctx.strokeStyle = "rgba(170,205,255," + (p.a * .5 * bw(p.y) * K).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.l * slant, p.y - p.l); ctx.stroke();
      }
      ctx.lineWidth = 1;
      for (i = ripples.length - 1; i >= 0; i--) {
        var r = ripples[i]; r.r += 18 * dt; r.life -= dt * .9;
        if (r.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(170,205,255," + (r.life * .28 * K).toFixed(3) + ")";
        ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 2.2, r.r * .6, 0, 0, 6.283); ctx.stroke();
      }
    } else if (k === "snow") {
      var base = snowPile();
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.y += p.v * dt; p.x += Math.sin(T * .8 + p.ph) * 14 * dt + 5 * dt;
        if (p.x > W + 5) p.x = -5; if (p.x < -5) p.x = W + 5;
        if (p.y >= H - pileAt(p.x, base) - 1) { p.y = -4; p.x = rnd(0, W); }
        ctx.fillStyle = "rgba(244,249,255," + (p.a * .55 * (.5 + .5 * p.y / H) * K).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      if (!seasonalSnow && base > .4) {
        var g = ctx.createLinearGradient(0, H - base - 4, 0, H);
        g.addColorStop(0, "rgba(240,247,255," + (.34 * Math.min(1, K)).toFixed(3) + ")"); g.addColorStop(1, "rgba(240,247,255," + (.1 * Math.min(1, K)).toFixed(3) + ")");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
        for (i = 0; i < pileCols; i++) ctx.lineTo(i * 8, H - pileAt(i * 8, base));
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      }
    } else if (k === "sun") {
      ctx.lineCap = "round"; ctx.lineWidth = 1.4;
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.x += p.v * dt; if (p.x > W + 50) { p.x = -50; p.y = rnd(H * .1, H * .46); }
        var f = Math.sin(T * 5 + p.p), y = p.y + Math.sin(T * .7 + p.bob) * 8, s = p.s;
        ctx.strokeStyle = "rgba(255,246,214," + (p.a * K).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(p.x, y); ctx.quadraticCurveTo(p.x - s * .5, y - s * (.45 + .2 * f), p.x - s, y + s * (.12 - .45 * f));
        ctx.moveTo(p.x, y); ctx.quadraticCurveTo(p.x + s * .5, y - s * (.45 + .2 * f), p.x + s, y + s * (.12 - .45 * f));
        ctx.stroke();
      }
    } else if (k === "wind") {
      ctx.lineWidth = 1; ctx.lineCap = "round";
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.x += p.v * dt;
        if (p.x - (p.l || 0) > W) { p.x = -20; p.y = rnd(H * .25, H); }
        if (p.dot) { ctx.fillStyle = "rgba(190,205,230," + (p.a * .6 * bw(p.y) * K).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y + Math.sin(T * 3 + p.ph) * 5, 1.3, 0, 6.283); ctx.fill(); continue; }
        ctx.strokeStyle = "rgba(190,206,232," + (p.a * .36 * bw(p.y) * K).toFixed(3) + ")";
        ctx.beginPath();
        for (var j = 0; j <= 8; j++) { var xx = p.x - p.l * j / 8, yy = p.y + Math.sin(xx * .018 + p.ph + T) * 6; if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
    } else if (k === "cloud" || k === "fog") {
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; p.x += p.v * dt;
        if (p.x > W + p.r) p.x = -p.r; if (p.x < -p.r) p.x = W + p.r;
        ctx.globalAlpha = Math.min(1, p.a * K * (.7 + .5 * (p.y / H)));
        ctx.drawImage(blobSprite, p.x - p.r, p.y - p.r * .6, p.r * 2, p.r * 1.2);
      }
      ctx.globalAlpha = 1;
    } else if (k === "night") {
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; ctx.fillStyle = "rgba(225,232,255," + (((.5 + .5 * Math.sin(T * p.sp + p.ph)) * .5 + .12) * K).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    monitor(ts);
    if (ts - last < 32) return;                                // about 30 frames a second is plenty for something this soft
    var dt = Math.min(.1, (ts - last) / 1000); last = ts;
    if (cur) step(dt);
  }
  function start() { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { stop(); mon.prev = 0; mon.samples = []; mon.t0 = 0; } else if (cur && !lite && glow && glow.classList.contains("on")) start(); });

  /* ---------- apply a weather ---------- */
  function apply(w) {
    cur = w; ensureLayers();
    try { var o = window.IPTGreet && window.IPTGreet.today && window.IPTGreet.today(); seasonalSnow = !!(o && o.effect === "snow"); } catch (e) { seasonalSnow = false; }
    glow.style.setProperty("--wx", COLOR[w.kind]);
    glow.style.setProperty("--wx-extra", w.kind === "sun" ? "radial-gradient(circle at 90% 4%,rgba(255,222,110,calc(.22*var(--k))),transparent 30%)" : w.kind === "night" ? "radial-gradient(circle at 88% 8%,rgba(205,215,255,calc(.14*var(--k))),transparent 18%)" : "none");
    glow.classList.add("on"); glow.classList.toggle("still", !!(lite || reduce)); cv.classList.toggle("on", !(lite || reduce));
    if (lite || reduce) { ctx.clearRect(0, 0, W, H); return; }   // reduced motion or a slow computer: only the still glow
    seed();
    mon.on = CFG.autoLowEnd !== false && lsGet(KEY.on) !== "1" && !state.forced; mon.prev = 0; mon.t0 = 0; mon.samples = [];
    start();
  }
  function clearFx() { stop(); cur = null; if (glow) { glow.classList.remove("on"); cv.classList.remove("on"); } }

  /* ---------- fetching ---------- */
  var chip, pop, state = { temp: null, kind: null, forced: false };
  function geoNow() {
    try { var g = JSON.parse(lsGet(KEY.geo) || "null"); if (g && isFinite(g.lat) && isFinite(g.lon)) return { name: "My location", lat: g.lat, lon: g.lon, geo: true }; } catch (e) {}
    return null;
  }
  function placeNow() {
    var gp = geoNow(); if (gp) return gp;
    var n = lsGet(KEY.place), def = CFG.defaultPlace || "Istanbul";
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].name === n) return PLACES[i];
    for (i = 0; i < PLACES.length; i++) if (PLACES[i].name === def) return PLACES[i];
    return PLACES[0];
  }
  function forced() {
    var q = ""; try { q = new URLSearchParams(location.search).get("wx") || ""; } catch (e) {}
    var f = (q || lsGet(KEY.force) || "").toLowerCase();
    return COLOR[f] ? f : (f === "clear" ? "sun" : "");
  }
  function load() {
    if (userOff()) { clearFx(); label(); return; }
    var f = forced();
    if (f) { state = { temp: null, kind: f, forced: true }; apply({ kind: f, inten: f === "storm" ? 1.4 : 1, wind: f === "wind" || f === "storm" ? 40 : 0 }); label(); return; }
    lite = false;
    if (autoOff()) { if (LOW_MODE === "off") { clearFx(); label(); return; } lite = true; }   // slow computer: no moving effect, and no weather request at all
    var pl = placeNow(), cache = null;
    try { cache = JSON.parse(lsGet(KEY.cache) || "null"); } catch (e) {}
    var ck = pl.name + "|" + pl.lat + "|" + pl.lon;
    if (cache && cache.place === ck && Date.now() - cache.t < 30 * 60e3) { show(cache.c); return; }
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + pl.lat + "&longitude=" + pl.lon + "&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto";
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 7000);
    fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(to); var c = j && j.current; if (!c) throw 0;
      var data = { code: c.weather_code, wind: c.wind_speed_10m, day: c.is_day !== 0, temp: Math.round(c.temperature_2m) };
      lsSet(KEY.cache, JSON.stringify({ place: ck, t: Date.now(), c: data })); show(data);
    }).catch(function () {
      clearTimeout(to);
      if (cache && cache.place === ck && Date.now() - cache.t < 4 * 3600e3) show(cache.c); else { clearFx(); state = { temp: null, kind: null, forced: false }; label(); }
    });
  }
  function show(c) { var w = kindFrom(c); state = { temp: c.temp, kind: w.kind, forced: false }; apply(w); label(); }

  /* ---------- the small chip + place picker ---------- */
  function label() {
    if (!chip) return;
    var uo = userOff(), off = uo || (!state.forced && isOff()), pl = placeNow();
    chip.querySelector(".wx-t").textContent = off ? (uo ? "Weather off" : "Weather off · slow device") : (state.kind ? (state.forced ? NAME[state.kind] + " (test)" : (state.temp !== null ? state.temp + "°  " : "") + pl.name) : pl.name);
    chip.querySelector(".wx-i").textContent = (!off && state.kind) ? ICON[state.kind] : "🌤️";
    chip.setAttribute("aria-label", "Weather background: " + (off ? "off" : (state.kind ? NAME[state.kind] + " in " + pl.name : pl.name)) + ". Change");
    if (pop) [].forEach.call(pop.querySelectorAll("[data-place]"), function (b) { b.setAttribute("aria-pressed", String(!pl.geo && b.getAttribute("data-place") === pl.name)); });
    var gb = pop && pop.querySelector("[data-geo]"); if (gb) gb.setAttribute("aria-pressed", String(!!pl.geo));
    var t = pop && pop.querySelector("[data-toggle]"); if (t) { t.setAttribute("aria-pressed", String(!off)); t.firstChild.textContent = "Weather effects"; }
  }
  function buildChip() {
    chip = document.createElement("button"); chip.type = "button"; chip.className = "wx-chip"; chip.setAttribute("aria-haspopup", "true"); chip.setAttribute("aria-expanded", "false");
    chip.innerHTML = '<span class="wx-i" aria-hidden="true">🌤️</span><span class="wx-t"></span>';
    pop = document.createElement("div"); pop.className = "wx-pop"; pop.setAttribute("role", "group"); pop.setAttribute("aria-label", "Weather background");
    var h = '<h4>Your city</h4>';
    PLACES.forEach(function (p) { h += '<button type="button" data-place="' + p.name + '" aria-pressed="false"><span>' + p.name + '</span></button>'; });
    h += '<hr><button type="button" data-geo aria-pressed="false"><span>📍 Use my exact location</span></button><p class="wx-note" role="status" hidden></p>';
    h += '<hr><button type="button" data-toggle aria-pressed="true"><span>Weather effects</span></button>';
    pop.innerHTML = h;
    var wrap = document.createElement("div"); wrap.className = "wx-wrap"; wrap.appendChild(chip);
    var hub = document.querySelector("#menu-view .menu-hub"); (hub || document.body).appendChild(wrap); document.body.appendChild(pop);   // the menu sits on the page itself so no panel can cover it
    function close() { pop.classList.remove("open"); chip.setAttribute("aria-expanded", "false"); }
    function place() {
      var r = chip.getBoundingClientRect(), w = pop.offsetWidth || 200, h = pop.offsetHeight || 260;
      var x = clamp(r.left + r.width / 2 - w / 2, 8, window.innerWidth - w - 8), y = r.bottom + 6;
      if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 6);
      pop.style.left = x + "px"; pop.style.top = y + "px";
    }
    chip.addEventListener("click", function (e) { e.stopPropagation(); var o = pop.classList.toggle("open"); chip.setAttribute("aria-expanded", String(o)); if (o) place(); });
    window.addEventListener("scroll", function () { if (pop.classList.contains("open")) place(); }, true);
    pop.addEventListener("click", function (e) {
      e.stopPropagation(); var b = e.target.closest && e.target.closest("button"); if (!b) return;
      var note = pop.querySelector(".wx-note"); note.hidden = true;
      if (b.hasAttribute("data-geo")) {
        if (!navigator.geolocation) { note.textContent = "This browser can't share a location. Pick a city instead."; note.hidden = false; return; }
        note.textContent = "Asking your browser…"; note.hidden = false;
        navigator.geolocation.getCurrentPosition(function (pos) {
          lsSet(KEY.geo, JSON.stringify({ lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 }));   // rounded to ~1 km, kept only on this device
          lsDel(KEY.off); lsDel(KEY.cache); note.hidden = true; close(); load(); label();
        }, function () { note.textContent = "Location is blocked or unavailable. Pick a city instead."; note.hidden = false; }, { timeout: 10000, maximumAge: 600000 });
        return;
      }
      if (b.hasAttribute("data-toggle")) { if (isOff()) { lsDel(KEY.off); lsSet(KEY.on, "1"); lsDel(KEY.slow); lsDel(KEY.strikes); sessionSlow = false; } else lsSet(KEY.off, "1"); }   // turning it back on yourself overrides the automatic switch-off
      else if (b.getAttribute("data-place")) { lsSet(KEY.place, b.getAttribute("data-place")); lsDel(KEY.geo); lsDel(KEY.off); close(); }
      load(); label();
    });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    label();
  }

  function init() {
    css(); ensureLayers(); buildChip(); load();
    setInterval(function () { if (!document.hidden && !state.forced && !isOff()) load(); }, 30 * 60e3);   // refresh every half hour
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.IPTWeather = { reload: load };
})();
