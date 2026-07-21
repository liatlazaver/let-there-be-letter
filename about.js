/* ראש מילין — the אודות section (references: אודות ראש מילין.svg and
   על הפרויקט.svg — the ממשק 222 revision — plus the motion clip).
   A shelf of books on the black field: two selectable spines (על הפרויקט,
   על ראש מילין) and the leaning ויהי אות volume. Clicking a spine slides its
   COVER to the right edge of the shelf while the pages spread open behind
   it — the neighbours shift in the same single move (the clip's language).
   Each opened book is an internally scrolled reading with the hairline
   scroll track and its travelling dot. The readings follow the new scroll
   strips: centred Lyon-italic section titles over full-width hairlines,
   justified body columns, and letterspaced bracketed captions. */

import { openNikud } from "./nikud.js?v=7";

const DW = 2850;
const u = () => innerWidth / DW;

/* ==== the readings ==== */
const T = {
  aboutTitle: "אודות",
  aboutSub: "[ותודות]",
  vihi: "ויהי אות",
  project: {
    title: "על הפרויקט",
    label: "[תהליך]",
    h1: "על ויהי אות",
    intro:
      "״ויהי אות״ נולד מתוך הרצון לחקור כיצד טיפוגרפיה פוגשת את עולם הרוח דרך האות העברית, מה שהוביל אותי אל ספרו של הרב אברהם יצחק הכהן קוק, ״ראש מילין״. הפרויקט מבקש להנגיש את הרעיונות העמוקים של ראש מילין בשפה חזותית, פשוטה ואינטראקטיבית. במקום לפגוש את הספר רק כטקסט עיוני וסגור, הממשק מזמין את המשתמש להתבונן באותיות ולזהות את האותיות והצורות המרכיבות כל אות, ולראות כיצד רעיון רוחני יכול להפוך לצורה ויזואלית.",
    lettersLabel: "האותיות",
    h2: "כתב סת״ם אשכנזי",
    design:
      "כתב הסת״ם האשכנזי שימש בפרויקט כנקודת מוצא צורנית ורוחנית, משום שהוא נושא איתו זיקה ישירה למסורת הכתיבה המקודשת של האות העברית. בעיצוב האותיות בחרתי לשמור על המאפיינים המזוהים עם הכתב, אך להעניק להם מופע עכשווי יותר. הבחירה הזו מתחברת לרוחו של הרב קוק, המבקש לראות במסורת מקור חי ומתחדש, ולא צורה השייכת לעבר בלבד. כך האותיות בממשק נשארות מחוברות לשורשן המקודש, אך מקבלות בהירות, חדות ונוכחות המתאימות למרחב דיגיטלי של חקירה והתבוננות.",
    stamCaption: "[האותיות בכתב סת״ם אשכנזי במהדורה מחודשת]",
    thanksTitle: "[תודות]",
    thanks:
      "הפרויקט הזה נבנה מתוך תהליך ארוך של חיפוש, למידה והתבוננות, והוא לא היה יכול להתקיים ללא האנשים שליוו אותי בדרך. תודה למרצים ולמרצות שלי, שפתחו בפניי מרחב לשאול, לדייק, לטעות ולבנות מחדש. תודה למשפחה שלי, על תמיכה ואמון מתמשך לאורך כל הדרך. תודה לבן זוגי, שהיה עוגן מלא בסבלנות ואמונה תמידית. תודה לחברים ולחברות שהיו איתי לאורך התהליך, הקשיבו, העירו, האירו ותמכו. ותודה לכל מי שהיה שם לאורך הדרך, מי שעזר, הקשיב, שאל, העיר, עודד או פשוט האמין בי.",
  },
  milin: {
    title: "על ראש מילין",
    label: "[הרב קוק והספר]",
    h1: "הרב אברהם יצחק הכהן קוק",
    body1:
      "הרב אברהם יצחק הכהן קוק, הראי״ה, היה רב, הוגה, מקובל ומשורר, ואחת הדמויות הרוחניות המרכזיות ביהדות של העת החדשה. הוא נולד במזרח אירופה ועלה לארץ ישראל בראשית המאה ה־20, ובהמשך כיהן כרב הראשי האשכנזי הראשון בארץ ישראל. לצד תפקידיו הציבוריים והרבניים, פיתח הרב קוק הגות רחבה וייחודית שחיברה בין הלכה, קבלה, מוסר, שירה, חינוך ולאומיות.\nפועלו של הרב קוק לא הסתכם בפסיקה או בהנהגה דתית בלבד. הוא ביקש לראות את המציאות כולה כמערכת אחת חיה, שבה גם תהליכים היסטוריים, חברתיים ותרבותיים הם חלק מתנועה רוחנית עמוקה. מתוך כך הוא התבונן גם בעולם החדש, בתחיית השפה העברית, בבניין הארץ ובכוחות היצירה של הדור.\n\nהייחוד של הרב קוק נמצא ביכולת שלו להחזיק יחד עולמות שנדמים לפעמים כמנוגדים: קודש וחול, מסורת וחידוש, הלכה ודמיון, שורשיות עתיקה וחיים מודרניים. בעבורו, המסורת היא מקור פנימי שמתחדש בכל דור דרך מחשבה, שפה, יצירה וחיים. לכן כתביו נעים לא פעם בין עיון פילוסופי עמוק לבין לשון שירית, חזיונית ורוחנית.",
    cap1: "[מתוך מגזין הספריה הלאומית]",
    h2: "ראש מילין",
    body2:
      "ראש מילין הוא חיבור מיסטי־קבלי של הרב אברהם יצחק הכהן קוק, המתבונן באותיות העבריות כצורות חיות הנושאות בתוכן מחשבה, תנועה ומשמעות. הספר עוסק באות כסימן רוחני: מקום שבו רעיון פנימי מתחיל לקבל צורה, קול וכיוון.\nהספר נכתב ונדפס בלונדון בשנת תרע״ז, 1917, בזמן שהרב קוק שהה מחוץ לארץ ישראל בעקבות מלחמת העולם הראשונה. מתוך מציאות של ריחוק, אי־ודאות וגעגוע, הוא פונה דווקא אל המקום הראשוני ביותר של השפה: האות. במובן הזה, ראש מילין מנכיח ניסיון למצוא בתוך האותיות מקור של אור, סדר ומשמעות, גם בזמן שבו העולם שמסביב שרוי בכאוס.\nשמו המלא של הספר מגדיר אותו כ״רשמי מחשבה למדרש האותיות, התגין, הנקודות והטעמים״. כלומר, הרב קוק מתבונן גם בכל מה שמקיף ומפעיל את האות: הכתרים שמעליה, הניקוד שמעניק לה תנועה והטעמים שמעניקים לה קצב. כל אחד מן המרכיבים האלה מזין זה את זה ונתפס כחלק ממערכת שלמה.",
    cap2: "[ראש מילין, 1917, לונדון, מתוך הספריה הלאומית]",
    body3:
      "הרב קוק רואה באותיות מרחב פנימי של התגלות. כפי שהוא כותב: ״המחשבות הקודמות לכל האותיות הן משוטטות בנו פנימה תדיר.״ כלומר, האות אינה מתחילה רק על הדף, היא מתחילה במחשבה.\nמתוך כך, הקריאה בראש מילין היא קריאה שמבקשת להאט את המבט ואת הקצב. במקום לראות באות דבר מובן מאליו, הספר מזמין להתבונן בה מחדש: לשאול ממה היא בנויה, לאן היא נעה, מה היא מחזיקה בתוכה, וכיצד צורה קטנה אחת יכולה לשאת עולם שלם של רעיונות.",
  },
};

/* the reference's bracketed letter names, one under each grid window */
const LETTER_NAMES = {
  א: "אלף", ב: "בית", ג: "גימל", ד: "דלת", ה: "הא", ו: "ויו", ז: "זין",
  ח: "חית", ט: "טית", י: "יוד", כ: "כף", ל: "למד", מ: "מם", נ: "נון",
  ס: "סמך", ע: "עין", פ: "פא", צ: "צדי", ק: "קוף", ר: "ריש", ש: "שין",
  ת: "תיו", ך: "כף סופית", ם: "מם סופית", ן: "נון סופית",
  ף: "פא סופית", ץ: "צדי סופית",
};

/* the grid reads the plain alphabet with the finals gathered at its end
   (the reference's own order — not the interface's interleaved one) */
const GRID_ORDER = [..."אבגדהוזחטיכלמנסעפצקרשת", ..."ךםןףץ"];

/* ==========================================================================
   building
   ========================================================================== */
let root = null;
let openBook = null; // null | "milin" | "project"
let glyphsReady = null;

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}

function buildTopbar() {
  const top = el("header", "lp2-top");
  const mk = (label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lp2-pill";
    b.textContent = label;
    b.addEventListener("pointerenter", () => document.body.classList.add("lp2-pill-hot"));
    b.addEventListener("pointerleave", () => document.body.classList.remove("lp2-pill-hot"));
    return b;
  };
  const about = mk("אודות");
  about.classList.add("lp2-pill--active");
  const nikud = mk("ניקוד");
  nikud.addEventListener("click", () => {
    openNikud();
    setTimeout(closeAbout, 520);
  });
  const letters = mk("אותיות");
  letters.addEventListener("click", closeAbout);
  top.append(about, nikud, letters);
  return top;
}

/* a rotated spine text pair: the title near the floor, the bracketed
   label near the ceiling (the lp2 side-name language) */
function spineTexts(parent, title, label) {
  const t = el("span", "ab-spine-title", parent);
  t.textContent = title;
  const l = el("span", "ab-spine-label", parent);
  l.textContent = label;
}

/* ==== the milin reading (אודות ראש מילין.svg) — the 1668-wide strip ==== */
function buildMilinContent(host) {
  const c = el("div", "ab-content ab-content--milin", host);
  const h1 = el("h2", "ab-h ab-m-h1", c); h1.textContent = T.milin.h1;
  el("div", "ab-rule ab-m-rule1", c);
  const p1 = el("p", "ab-body ab-m-body1", c); p1.textContent = T.milin.body1;
  const img1 = el("img", "ab-img ab-m-portrait", c); img1.src = "assets/about/rav-kook.jpg"; img1.alt = "";
  const cap1 = el("p", "ab-cap ab-m-cap1", c); cap1.textContent = T.milin.cap1;
  const h2 = el("h2", "ab-h ab-m-h2", c); h2.textContent = T.milin.h2;
  el("div", "ab-rule ab-m-rule2", c);
  const p2 = el("p", "ab-body ab-m-body2", c); p2.textContent = T.milin.body2;
  /* the cover photograph is cropped inside its frame (pattern1's matrix) */
  const cover = el("div", "ab-m-cover", c);
  const img2 = el("img", "", cover); img2.src = "assets/about/rosh-milin-cover-2.jpg"; img2.alt = "";
  const cap2 = el("p", "ab-cap ab-m-cap2", c); cap2.textContent = T.milin.cap2;
  const p3 = el("p", "ab-body ab-m-body3", c); p3.textContent = T.milin.body3;
  /* the open spread: two page photographs standing side by side */
  const img3 = el("img", "ab-img ab-m-page-left", c); img3.src = "assets/about/rosh-milin-pages-left.jpg"; img3.alt = "";
  const img4 = el("img", "ab-img ab-m-page-right", c); img4.src = "assets/about/rosh-milin-pages-right.jpg"; img4.alt = "";
  /* the second spread, reading right-to-left: התגין (page מ) then הנקודות (page נ) */
  const img5 = el("img", "ab-img ab-m-page2-right", c); img5.src = "assets/about/rosh-milin-page-tagin.jpg"; img5.alt = "";
  const img6 = el("img", "ab-img ab-m-page2-left", c); img6.src = "assets/about/rosh-milin-page-nikud.jpg"; img6.alt = "";
  el("div", "ab-rule ab-m-rule3", c);
}

/* ==== the project reading (על הפרויקט.svg) — the 1667-wide strip ==== */
function buildProjectContent(host) {
  const c = el("div", "ab-content ab-content--project", host);
  const h1 = el("h2", "ab-h ab-p-h1", c); h1.textContent = T.project.h1;
  el("div", "ab-rule ab-p-rule1", c);
  const p1 = el("p", "ab-body ab-p-intro", c); p1.textContent = T.project.intro;
  const lbl = el("h2", "ab-h ab-p-letters-label", c); lbl.textContent = T.project.lettersLabel;
  el("div", "ab-rule ab-p-rule2", c);
  const grid = el("div", "ab-grid", c);
  GRID_ORDER.forEach((ch, i) => {
    const card = el("div", "ab-card", grid);
    /* RTL flow from the grid's top-right corner, six to a row */
    const col = i % 6, row = Math.floor(i / 6);
    card.style.left = `calc(var(--u) * ${((5 - col) * 207.0).toFixed(1)})`;
    card.style.top = `calc(var(--u) * ${(row * 273.35).toFixed(2)})`;
    const inner = el("div", "ab-card-inner", card);
    inner.dataset.letter = ch;
    const cap = el("span", "ab-card-cap", card);
    cap.textContent = `[${LETTER_NAMES[ch] || ""}]`;
  });
  fillGridGlyphs(grid);
  const h2 = el("h2", "ab-h ab-p-h2", c); h2.textContent = T.project.h2;
  el("div", "ab-rule ab-p-rule3", c);
  const body = el("p", "ab-body ab-p-design", c); body.textContent = T.project.design;
  const stam = el("div", "ab-stam", c);
  const stamImg = el("img", "", stam); stamImg.src = "assets/about/stam-panel-2.jpg"; stamImg.alt = "";
  const cap = el("p", "ab-cap ab-p-cap", c); cap.textContent = T.project.stamCaption;
  const th = el("p", "ab-mark ab-p-thanks-title", c); th.textContent = T.project.thanksTitle;
  el("div", "ab-rule ab-p-rule4", c);
  const thanks = el("p", "ab-body ab-p-thanks", c); thanks.textContent = T.project.thanks;
  el("div", "ab-rule ab-p-rule5", c);
}

/* the grid letters are the interface's own fill glyphs, paper on the card's
   black window, each letter's ink centred (the opening screen's rule) */
function fillGridGlyphs(grid) {
  if (!glyphsReady) {
    glyphsReady = import("./sphere.js?v=15").then((m) => m.letterGlyphs);
  }
  glyphsReady.then((letterGlyphs) => {
    grid.querySelectorAll(".ab-card-inner").forEach((inner) => {
      const glyph = letterGlyphs.get(inner.dataset.letter);
      if (!glyph || !glyph.fillSvg) return;
      const s = glyph.fillSvg.cloneNode(true);
      s.removeAttribute("class"); s.removeAttribute("style");
      s.setAttribute("class", "ab-card-glyph");
      inner.appendChild(s);
      requestAnimationFrame(() => {
        try {
          const vb = s.viewBox.baseVal;
          const ink = s.querySelector("g").getBBox();
          const box = 111; // the glyph band inside the 157x185.8 window (design u)
          const k = box / Math.max(ink.width, ink.height);
          const w = vb.width * k, h = vb.height * k;
          s.style.width = `calc(var(--u) * ${w.toFixed(1)})`;
          s.style.height = `calc(var(--u) * ${h.toFixed(1)})`;
          const dx = ((vb.x + vb.width / 2) - (ink.x + ink.width / 2)) * k;
          const dy = ((vb.y + vb.height / 2) - (ink.y + ink.height / 2)) * k;
          s.style.transform = `translate(calc(var(--u) * ${dx.toFixed(1)}), calc(var(--u) * ${dy.toFixed(1)}))`;
        } catch (err) { /* unrendered — keep as-is */ }
      });
    });
  });
}

function buildScreen() {
  const rootEl = el("section", "about");
  rootEl.appendChild(buildTopbar());

  const field = el("div", "ab-field", rootEl);
  field.dataset.state = "shelf";

  /* the resting composition */
  const title = el("div", "ab-title", field);
  const t1 = el("div", "ab-title-main", title); t1.textContent = T.aboutTitle;
  const t2 = el("div", "ab-title-sub", title); t2.textContent = T.aboutSub;

  /* the pages (one panel per book, closed to nothing at rest) */
  const panelP = el("div", "ab-panel ab-panel--project", field);
  const scrollP = el("div", "ab-scroll", panelP);
  buildProjectContent(scrollP);
  const trackP = el("div", "ab-track", panelP);
  el("div", "ab-dot", trackP);

  const panelM = el("div", "ab-panel ab-panel--milin", field);
  const scrollM = el("div", "ab-scroll", panelM);
  buildMilinContent(scrollM);
  const trackM = el("div", "ab-track", panelM);
  el("div", "ab-dot", trackM);

  /* the spines (each is also its book's sliding cover) */
  const spineP = el("div", "ab-spine ab-spine--project", field);
  spineTexts(spineP, T.project.title, T.project.label);
  spineP.addEventListener("click", () => toggleBook("project"));

  const spineM = el("div", "ab-spine ab-spine--milin", field);
  spineTexts(spineM, T.milin.title, T.milin.label);
  spineM.addEventListener("click", () => toggleBook("milin"));

  /* the leaning ויהי אות volume, on its own clip stage so its fall can never
     paint past the shelf's white stroke */
  const tiltClip = el("div", "ab-tilted-clip", field);
  const tilted = el("div", "ab-tilted", tiltClip);
  const tl = el("span", "ab-tilted-label", tilted);
  tl.textContent = T.vihi;

  /* the shelf's right-edge hairline */
  el("div", "ab-edge", field);

  /* scroll -> the travelling dot (rest heights read off the two strips) */
  [scrollP, scrollM].forEach((sc) => {
    sc.addEventListener("scroll", () => {
      const panel = sc.parentElement;
      const dot = panel.querySelector(".ab-dot");
      const base = panel.classList.contains("ab-panel--project") ? 64 : 67;
      const max = sc.scrollHeight - sc.clientHeight;
      const p = max > 0 ? sc.scrollTop / max : 0;
      dot.style.top = `calc(var(--u) * ${(base + p * (1479 - 2 * base - 36)).toFixed(1)})`;
    }, { passive: true });
  });

  return rootEl;
}

/* ==== the shelf states ==== */
function toggleBook(book) {
  if (!root) return;
  const field = root.querySelector(".ab-field");
  const current = field.dataset.state;
  if (current === "open-" + book) { closeBookState(); return; }
  if (current !== "shelf") {
    closeBookState();
    setTimeout(() => openBookState(book), 400);
  } else {
    openBookState(book);
  }
}

function openBookState(book) {
  const field = root.querySelector(".ab-field");
  field.dataset.state = "open-" + book;
  openBook = book;
  const sc = root.querySelector(`.ab-panel--${book} .ab-scroll`);
  if (sc) sc.scrollTop = 0;
  const dot = root.querySelector(`.ab-panel--${book} .ab-dot`);
  if (dot) dot.style.top = "";
}

function closeBookState() {
  const field = root.querySelector(".ab-field");
  field.dataset.state = "shelf";
  openBook = null;
}

/* ==== open / close (the interface's wipe) ==== */
function trackInk(e) {
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const onInk = !!(under && under.closest && under.closest(".ab-field"));
  document.body.classList.toggle("ab-on-ink", onInk);
}

export function openAbout() {
  if (root) return;
  root = buildScreen();
  document.body.appendChild(root);
  document.body.classList.add("about-open");
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-open")));
  /* the [ותודות] subtitle waits ~1s, then writes itself in (the clip sweep) —
     never on immediate entry. Guarded by the current root so a quick
     close/reopen can't fire a stale reveal. */
  const armed = root;
  setTimeout(() => {
    if (root !== armed) return;
    const sub = armed.querySelector(".ab-title-sub");
    if (sub) sub.classList.add("is-writing");
  }, 1000);
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointermove", trackInk);
}

export function closeAbout() {
  if (!root) return;
  const elx = root;
  root = null;
  openBook = null;
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("pointermove", trackInk);
  document.body.classList.remove("about-open", "ab-on-ink", "lp2-pill-hot");
  elx.classList.add("is-leaving");
  setTimeout(() => elx.remove(), 520);
}

export const isAboutOpen = () => !!root;

function onKey(e) {
  if (e.key !== "Escape") return;
  if (openBook) closeBookState();
  else closeAbout();
}
