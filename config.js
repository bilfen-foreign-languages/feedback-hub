/* IPT Feedback · Created by Ufuk Korkmaz, 2026. */
/* ==========================================================================
   IPT FEEDBACK SETTINGS
   This is the one file you edit for everyday changes. Save it, upload it to
   GitHub, and the whole site follows: the meetings box, the calendar,
   the "Feedback this week" box, the form, and the Help & FAQ window.
   Keep the quotes " " and commas , exactly as they are.
   ========================================================================== */
window.IPT_CONFIG = {

  /* ----- Where feedback is sent (your Formspree form address) ----- */
  // Your own database (Supabase). Fill these in after the set-up steps; while they are empty, Formspree is still used.
  supabaseUrl: "https://hceltuncmajojiyhzlcl.supabase.co",
  supabaseKey: "sb_publishable_AewQ2fT439tNreacQXUKYg_RRXBA2Xq",
  emailCopy: true,                                    // true = every saved feedback is also e-mailed through Formspree (free plan: about 50 a month). false = database only.
  formEndpoint: "https://formspree.io/f/xbglqzql",

  /* ----- Only school emails ending with this can open the questions ----- */
  emailDomain: "bilfen.k12.tr",

  /* ----- "Need a boost?" mirror on the thank-you screen ----- */
  boost: {
    enabled: true,                                    // false = hide the button
    // Each line is either a message or the file name of a hand-lettered picture (.png) kept next to index.html.
    // They are shown one after another over the camera picture.
    messages: [
      "you-make-it-happen.png",
      "you-are-the-best.png",
      "Your students are lucky to have you",
      "Small steps, big impact",
      "You are doing great work",
      "Thank you for showing up",
      "Look at that smile. Keep going!",
      "Teachers change the world, one lesson at a time"
    ]
  },

  /* ----- Online meetings ----- */
  timezone: "Europe/Istanbul",                        // the time zone the meeting times below are written in
  meetingLink: "https://meet.google.com/ohd-bjdt-bdo", // the Join Meeting button opens this
  // One line per meeting.  year: 5, 6 or 7   day: Mon Tue Wed Thu Fri Sat Sun   times: 24-hour "HH:MM"
  // link (optional): a meeting with its own link gets its own Join button; without it, meetingLink above is used.
  // Meetings at the same time (Year 5 and Year 6) are shown together in the banner.
  meetings: [
    { year: 7, day: "Mon", start: "16:45", end: "17:15" },
    { year: 5, day: "Mon", start: "17:40", end: "18:10", link: "https://meet.google.com/ove-dzhk-srb" },
    { year: 6, day: "Mon", start: "17:40", end: "18:10" }
  ],

  /* ----- School rotation (calendar and "Feedback this week") ----- */
  rotation: {
    cycleStart: "2026-10-05",                         // the Monday when the first group starts (YYYY-MM-DD, must be a Monday)
    // Year 6: one group of schools per Monday, repeating forever. Year 7 uses the same list from the bottom up.
    year6: [
      ["Antalya", "Esenşehir"],
      ["Ataşehir", "Halkalı"],
      ["Bahçeşehir", "İskenderun"],
      ["Bornova", "Kayseri"],
      ["Bursa", "Kurtköy"],
      ["Çamlıca", "Maslak"],
      ["İncek", "Sancaktepe"],
      ["Çayyolu", "İskenderun"]
    ]
    ,
    // Year 5: ONE school per Monday, in this order, starting on year5Start. It does not repeat: after the last
    // school the Year 5 rows simply stop. A Monday listed in year5Skip (holiday) is skipped, and the list waits
    // so no school is lost: every school after it moves one Monday later.
    year5Start: "2026-10-19",                         // the Monday the first Year 5 school gives feedback
    year5Skip: [],                                    // holiday Mondays to skip, e.g. ["2026-12-28", "2027-01-04"]
    year5: [
      ["Bursa"],
      ["Çamlıca"],
      ["Çayyolu"],
      ["Esenşehir"],
      ["Halkalı"],
      ["İskenderun"],
      ["Kayseri"],
      ["Koşuyolu"],
      ["Kurtköy"],
      ["Maslak"],
      ["Sancaktepe"],
      ["Ataşehir"],
      ["Antalya"],
      ["Bahçeşehir"],
      ["Bursa"],
      ["Çamlıca"],
      ["Çayyolu"],
      ["Esenşehir"],
      ["Halkalı"],
      ["İskenderun"],
      ["Kayseri"],
      ["Koşuyolu"],
      ["Kurtköy"],
      ["Maslak"],
      ["Sancaktepe"],
      ["Ataşehir"],
      ["Antalya"],
      ["Bahçeşehir"]
    ]
  },

  /* ----- Special days (greeting on the welcome screen, a message on the home page, optional effect) -----
     date: "MM-DD" repeats every year, or "YYYY-MM-DD" for one year only. to: (optional) the last day of a range.
     greet: replaces the welcome line that day, e.g. "Happy Teachers' Day," (keep the comma at the end).
     banner: the message shown on the home page.   effect: "confetti" (once a day) or "snow" (while the home page is open).
     colors: (optional) confetti colours.   solemn: true = quiet day: no effect and a calm tone.
     noName: true = the welcome screen shows only the greeting, without the person's name.
     The first matching line decides the greeting and the message, so put the specific days above season lines.
     Holidays that move every year need their dates added when you know them (use the full YYYY-MM-DD form). */
  occasions: [
    { date: "10-05", greet: "Happy World Teachers' Day,", banner: "Happy World Teachers' Day! Thank you for everything you do. 🍎", effect: "confetti" },
    { date: "10-29", greet: "Happy Republic Day,", banner: "Happy Republic Day! Cumhuriyet Bayramımız kutlu olsun! 🎉", effect: "confetti", colors: ["#e30a17", "#ffffff", "#f5c542"] },
    { date: "11-10", greet: "In remembrance,", banner: "Today we remember Mustafa Kemal Atatürk with respect and gratitude.", solemn: true, noName: true },
    { date: "11-24", greet: "Happy Teachers' Day,", banner: "Happy Teachers' Day! Thank you for inspiring our students every day. 🍎", effect: "confetti" },
    { date: "12-31", to: "01-01", greet: "Happy New Year,", banner: "Happy New Year! Wishing you a wonderful year ahead. 🎆", effect: "confetti" },
    { date: "12-20", to: "01-03", effect: "snow" },
    { date: "03-08", greet: "Happy Women's Day,", banner: "Happy International Women's Day! 💐", effect: "confetti", colors: ["#a183ee", "#ff9ec7", "#ffffff", "#52d9ca"], noName: true },
    { date: "03-18", greet: "In remembrance,", banner: "Today we remember the heroes of Çanakkale with respect and gratitude.", solemn: true, noName: true },
    { date: "04-23", greet: "Happy Children's Day,", banner: "Happy Children's Day! 23 Nisan kutlu olsun! 🎈", effect: "confetti" },
    { date: "05-01", greet: "Happy Labour Day,", banner: "Happy Labour and Solidarity Day! 🌷", effect: "confetti" },
    { date: "05-19", greet: "Happy 19 Mayıs,", banner: "Happy Atatürk Commemoration, Youth and Sports Day! 19 Mayıs kutlu olsun! ⚽", effect: "confetti" }
  ],

  /* ----- Weather background (a soft glow and a very light effect behind the home page that follow the real weather) -----
     Data comes from Open-Meteo (free, no account). Each visitor can pick their city with the small weather chip (bottom right).
     enabled: false switches it off for everyone.   defaultPlace: the city used until a visitor picks another.
     strength: 1 = normal, 0.6 = fainter, 1.4 = stronger (rain, snow, birds, wind and the glow together).   glowStrength: only the soft colour glow.   windKmh: wind speed (km/h) from which it counts as windy.
     places: add or remove cities; lat and lon are the map coordinates.
     autoLowEnd: true = a slow computer (little memory, few cores, data saver, or a page that really runs slowly) switches the effect off by itself.
     lowEndMode: "off" = nothing at all on slow computers, "glow" = keep only the still soft glow. A visitor can always turn it back on from the chip.
     To test a weather without waiting for it, add ?wx=rain to the site address (rain, snow, sun, wind, cloud, fog, storm, night). */
  weather: {
    enabled: true,
    defaultPlace: "Istanbul",
    strength: 1,
    glowStrength: 0.65,                               // only the colour glow: 0.65 = gentle, 1 = stronger, 0.4 = barely there
    windKmh: 32,
    autoLowEnd: true,
    lowEndMode: "off",
    places: [
      { name: "Istanbul", lat: 41.01, lon: 28.98 },
      { name: "Ankara", lat: 39.93, lon: 32.86 },
      { name: "İzmir", lat: 38.42, lon: 27.14 },
      { name: "Bursa", lat: 40.19, lon: 29.06 },
      { name: "Antalya", lat: 36.90, lon: 30.70 },
      { name: "Kayseri", lat: 38.73, lon: 35.49 },
      { name: "İskenderun", lat: 36.59, lon: 36.17 }
    ]
  },

  /* ----- First-visit tour (a short guided tour of the home page for people opening the site for the first time) -----
     enabled: false removes it completely.   autoStart: false = never shows by itself, only from the Help window.
     To see it again yourself: add ?tour=1 to the site address. */
  tour: {
    enabled: true,
    autoStart: true
  },

  /* ----- Soft glow around the Year 5 / 6 / 7 selector (a hint for brand-new visitors that it can be tapped) -----
     It fades away as soon as the visitor presses a year. enabled: false removes the feature. To see it yourself: add ?glow=1 to the site address. */
  selectorGlow: {
    enabled: true
  },

  /* ----- "Before you start" card (shown once, the first time a teacher opens a feedback form, with an animated clip) -----
     enabled: false removes it completely.   minutes: 6 adds "It takes about 6 minutes." to the card (leave it out to say nothing).
     To see it again yourself: add ?guide=1 to the site address, then open a form. It can also be replayed from the Help window. */
  beforeStart: {
    enabled: true
    // minutes: 6
  },

  /* ----- Hands-free cheat sheet (a small card listing the voice commands while hands-free is running) -----
     enabled: false removes it. */
  handsFreeCheat: {
    enabled: true
  },

  /* ----- Admin page -----
     thinWords: an answer with fewer words than this (or "n/a", "good", a copy of another answer...) is flagged "Thin" on the admin page. */
  admin: {
    thinWords: 6
  },

  /* ----- Help & FAQ window (the "Help" button). Add, remove or reword any question. ----- */
  faq: [
    { q: "How do I give my feedback?",
      a: "Choose Year 5, Year 6 or Year 7, then type your school email. The questions open as soon as your email ends with @bilfen.k12.tr. Answer them, then press Submit feedback." },
    { q: "Which email should I use?",
      a: "Your Bilfen school address, the one ending with @bilfen.k12.tr. Other addresses cannot open the questions." },
    { q: "Which schools are giving feedback this week?",
      a: "The Feedback this week box on the main page shows the schools for the coming Monday. The calendar shows every feedback Monday: tap or hover a highlighted Monday to see its schools." },
    { q: "Can I speak my answers instead of typing?",
      a: "Yes. Press Speak in the corner of any answer box, talk, and press Stop. You can say comma, full stop or question mark to add punctuation. Or use Hands-free: say next question to move on, previous question to go back, scores like overall four, and submit feedback to send. Your browser will ask for microphone permission the first time. Chrome works best." },
    { q: "I refreshed the page. Did I lose my answers?",
      a: "No. Your answers are saved on this device while you write and come back when you reopen the page. Use Clear draft to remove them, especially on a shared computer." },
    { q: "My internet dropped when I pressed Submit.",
      a: "Your reflection is kept on this device and sent automatically when the connection returns. A small note at the bottom right shows it is waiting, with a Send now button. Keep the page open until it says it was sent." },
    { q: "When are the online meetings?",
      a: "The Online meetings box lists the times. The Join Meeting button and the Next meeting banner shine from 15 minutes before a meeting until it ends." },
    { q: "Who receives my feedback?",
      a: "It is saved securely and only the IPT team can read it, together with the school email address you entered, so they can follow up if needed." }
  ]
};

/* Year 5 schedule helper (used by the calendar and the admin page). Give it a Monday as "YYYY-MM-DD";
   it returns that Monday's school list, or null when Year 5 has no feedback that day. */
window.IPT_year5For = function (iso) {
  var R = (window.IPT_CONFIG || {}).rotation || {};
  if (!Array.isArray(R.year5) || !R.year5.length || !R.year5Start) return null;
  var day = function (t) { return Math.round(Date.parse(t + "T00:00:00Z") / 864e5); };
  var w = day(iso) - day(R.year5Start);
  if (!(w >= 0) || w % 7) return null;
  var skip = (R.year5Skip || []).map(day), d = day(iso);
  if (skip.indexOf(d) > -1) return null;
  var k = w / 7 - skip.filter(function (x) { return x >= day(R.year5Start) && x < d && (x - day(R.year5Start)) % 7 === 0; }).length;
  return R.year5[k] || null;
};
