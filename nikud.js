/* ראש מילין — the ניקוד section.
   A full screen of seven nikud strips (per the reference pair
   ניקוד.svg / ניקוד-1.svg): each strip carries its mark drawn in the
   bracket system + its name, and opens as an accordion onto the mark's
   reading. The field is FIXED (123.5..1530.5 = 1407u): an open strip
   grows to fit its text and the other six share the remainder equally —
   nothing ever moves past the bottom rule. */

import { openAbout } from "./about.js?v=7";

const SVG_NS = "http://www.w3.org/2000/svg";
const DW = 2850;
const u = () => innerWidth / DW; // design unit in px, live

/* ==== the field (all values in design units, measured from the SVGs) ==== */
const FIELD_H = 1407;      // 123.5 -> 1530.5
const CLOSED_H = 201;      // 1407 / 7
const TEXT_TOP = 71.6;     // text box top: its first ink line = the name's ink top (76.7)
const TEXT_BOTTOM = 38.3;  // paper under the last line

/* ==== the marks, drawn in the gem band ====
   Band: the space between the Lyon brackets — x 0..78.4, y 0..49 where
   y49 sits 27u above the name's baseline (kamatz ┬ fills the band; the
   flat marks sit at y17..33). Geometry traced 1:1 from the reference. */
const SYM = {
  kamatz: '<path d="M11.1 0H75.1V16.07H51.15V49H35.05V16.07H11.1Z"/>',
  patach: '<rect x="7.1" y="17" width="64" height="16"/>',
  segol:
    '<rect x="18.1" y="6" width="16.2" height="16.2"/>' +
    '<rect x="47.2" y="6" width="16.2" height="16.2"/>' +
    '<rect x="32.65" y="31.8" width="16.2" height="16.2"/>',
  kubutz:
    '<rect x="1.1" y="4" width="16.2" height="16.2"/>' +
    '<rect x="30.5" y="16.5" width="16.2" height="16.2"/>' +
    '<rect x="59.9" y="29" width="16.2" height="16.2"/>',
  tsere:
    '<rect x="17.1" y="17" width="16.1" height="16.1"/>' +
    '<rect x="46" y="17" width="16.1" height="16.1"/>',
  shva:
    '<rect x="34.1" y="3" width="16.1" height="16.1"/>' +
    '<rect x="34.1" y="31.9" width="16.1" height="16.1"/>',
  chirik: '<rect x="32.1" y="17" width="16" height="16"/>',
};

/* the strip arrow (ref ink: 79x79, stroke 2 round): ↙ closed; the open
   state is its exact horizontal mirror, so the flip is one scaleX(-1) */
const ARROW_D = "M79 0L0 79M0 7.9L0 79L71.1 79";

/* ==== the readings (the project's own texts) ==== */
const NIKUD = [
  { key: "kamatz", name: "קמץ", texts: [
    "הקמץ הוא נקודה של סוד מכונס. הוא מורה על תעלומה עליונה, על אור גדול כל כך שהוא אינו נפתח מיד ונשמר בתוך קמיצה וצמצום. הצורה שלו מחזיקה יחד נקודה וקו: נקודה סתומה מתחת, ומעליה פתיחה מרומזת. לכן הקמץ אינו סגירה מוחלטת, אלא מקור נסתר של פתחים. הוא כמו אוצר שנמצא לפני ההתגלות, מקום שבו האור עדיין נאסף פנימה, אבל דווקא משם עתידים להיפתח חיים, חסד, גבורה, תפארת ושפע של דיבור.",
  ]},
  { key: "patach", name: "פתח", texts: [
    "הפתח הוא רגע ההיפתחות. אם הקמץ שומר את האור בתוך עומק מכונס, הפתח כבר מתחיל לגלות אותו. הוא קו פשוט, ברור, אופקי, שמסמן פתיחה של הכרה, של נשימה ושל דיבור. הפתח מאפשר לתוכן להיכנס אל שדה המילים, להאיר את האות ולהוציא אותה מן הסתום אל הגלוי. משהו שהיה חבוי מתחיל להופיע, להתרחב, ולתת לאות כוח של חיים, רוממות וזוהר.",
  ]},
  { key: "segol", name: "סגול", texts: [
    "הסגול מופיע אחרי הפתיחה הכללית, כאשר האור שכבר נפתח מתחיל להתחלק. שלוש הנקודות שלו יוצרות מבנה של יחס: שני קצוות ונקודת מרכז. לכן הוא סימן של הבחנה, סגולה וייחוד. הוא לא מסתפק בהארה כללית אחת, אלא מפריד את המערכות, נותן לכל פרט את מקומו ואת צבעו, ומאפשר להבין את העושר הפנימי של הדברים. הסגול הוא ניקוד של ריבוי מאורגן: שלושה מוקדי אור שמחזיקים יחד עולם שלם של ניואנסים.",
  ]},
  { key: "kubutz", name: "קובוץ", texts: [
    "הקובוץ, הנקרא גם מלאפום, בנוי משלוש נקודות הנעות באלכסון. הוא מבטא תהליך של קיבוץ: אורות, רצונות, שאיפות וכוחות שהיו מפוזרים מתחילים להיאסף לחטיבה אחת. התנועה שלו היא מן הצד השלילי אל החיובי, מן הפיזור אל הבניין, מן הריבוי אל כוח פעולה מרוכז. לכן הקובוץ הוא ניקוד של איסוף והתגבשות. הוא ממלא את הפה בשפע ומראה כיצד ריבוי נקודות יכול להפוך למערכה אחת עשירה, מאירה ופועלת.",
  ]},
  { key: "tsere", name: "צירה", texts: [
    "הצירי בנוי משתי נקודות זו לצד זו, ולכן הוא מבטא מפגש, דיוק והשלמת צורה. הוא אינו נקודה בודדת של פעולה, ואינו שלוש נקודות של מערכת; הוא יחס בין שני מוקדים שמאירים זה את זה. הספר קושר אותו לכוח הציור, להשלמת הדיוקן ולשכלול התמונה הרוחנית. הצירי יוצר תנועה של התאמה: בין כוח מחייב לכוח שולל, בין אור לאור, בין צורה פנימית לפעולה חיצונית. לכן הוא ניקוד של הבהרה, איזון והעמדת הדברים בצורה מדויקת.",
  ]},
  { key: "shva", name: "שוא", texts: [
    "השווא הנח מסמן כוח עליון מהיר מדי, חזק מדי, שאינו מתיישב לגמרי בתוך תנועה מלאה. הוא מסמן רגע שבו האור עבר, השאיר סימן, ונאסף חזרה אל שתיקה. השווא הנח נותן לאות מקום לעצור, להחזיק בתוכה אפשרות כמוסה, ולא למהר להיפתח.",
    "השווא הנע הוא ראשית התנועה. הוא בא מן השקיקה העליונה להתגלות, אבל עדיין בצורה דקה, מהירה, כמעט בלתי נתפסת. הוא אינו תנועה מלאה כמו פתח או חולם, אלא רעד ראשון של חיים בתוך האות. לכן הוא מסמן את הרגע שבו הסוד מתחיל לזוז, לפני שהוא מקבל צורה ברורה.",
  ]},
  { key: "chirik", name: "חיריק", texts: [
    "החיריק הוא נקודה אחת מתחת לאות, ולכן הוא מבטא כוח מרוכז, חד ופועל. הוא אינו מתפשט לרוחב כמו הפתח, ואינו מתחלק כמו הסגול; הוא יורד אל נקודת פעולה אחת, אל מקום שבו החיים מתכנסים כדי לפעול בעוצמה. הספר מתאר בו כוח שמרעיש, משנה ומטביע חותם. לכן החיריק הוא ניקוד של פעולה פנימית חזקה: נקודה קטנה שמסוגלת להזיז, לחרוק, לחדור אל התוכן שמתחת לפני השטח ולשנות את צורתו.",
  ]},
];

/* ==== the drifting marks ====
   The reference leaves the band under the last strip (1530.5 -> 1603)
   as bare paper. It carries the marks themselves: one row in the
   accordion's own order, moving right to left.

   The row holds TWO identical groups and travels exactly one group per
   cycle, so the frame at the end of a cycle is pixel-identical to the
   frame at its start — the loop point can't be seen. A group is built
   wide enough to outrun the widest screen, so the row is never short.

   שווא נח and שווא נע share one mark, so the sequence carries the seven
   distinct marks the strips are built from. */
const MQ_GROUP_REPEATS = 3; // marks per group = 7 * 3 = 21 — always > one screen

function buildMarquee() {
  const strip = document.createElement("div");
  strip.className = "nk-marquee";
  strip.setAttribute("aria-hidden", "true"); // decoration: never announced
  const track = document.createElement("div");
  track.className = "nk-marquee-track";
  for (let group = 0; group < 2; group++) {
    for (let rep = 0; rep < MQ_GROUP_REPEATS; rep++) {
      NIKUD.forEach((spec) => {
        const sym = document.createElementNS(SVG_NS, "svg");
        sym.setAttribute("class", "nk-mq-sym");
        sym.setAttribute("viewBox", "0 0 78.4 49"); // the shared gem band
        sym.innerHTML = SYM[spec.key];
        track.appendChild(sym);
      });
    }
  }
  strip.appendChild(track);
  return strip;
}

/* the last two words of a paragraph bind with an NBSP so no line ever
   ends on a lone word (the interface's own widow rule) */
const noWidow = (t) => {
  const i = t.lastIndexOf(" ");
  return i > 0 ? t.slice(0, i) + " " + t.slice(i + 1) : t;
};

/* ==========================================================================
   building the screen
   ========================================================================== */
let root = null;
let openIdx = -1;

function buildTopbar() {
  const top = document.createElement("header");
  top.className = "lp2-top";
  const mk = (label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lp2-pill";
    b.textContent = label;
    b.addEventListener("pointerenter", () => document.body.classList.add("lp2-pill-hot"));
    b.addEventListener("pointerleave", () => document.body.classList.remove("lp2-pill-hot"));
    return b;
  };
  /* the global bar: [אודות][ניקוד][אותיות] — this screen is the ניקוד
     section, so its pill wears the active fill */
  const about = mk("אודות");
  about.addEventListener("click", () => {
    openAbout();
    setTimeout(closeNikud, 520);
  });
  const self = mk("ניקוד");
  self.classList.add("lp2-pill--active"); // the design's active state: ink fill, paper text
  const letters = mk("אותיות");
  letters.addEventListener("click", closeNikud);
  top.append(about, self, letters);
  return top;
}

function buildStrip(spec, i) {
  const strip = document.createElement("div");
  strip.className = "nk-strip";
  strip.dataset.nikud = spec.key;

  const arrow = document.createElementNS(SVG_NS, "svg");
  arrow.setAttribute("class", "nk-arrow");
  arrow.setAttribute("viewBox", "0 0 79 79");
  arrow.setAttribute("aria-hidden", "true");
  const ap = document.createElementNS(SVG_NS, "path");
  ap.setAttribute("d", ARROW_D);
  arrow.appendChild(ap);

  const name = document.createElement("h2");
  name.className = "nk-name";
  const gem = document.createElement("span");
  gem.className = "nk-gem";
  const sym = document.createElementNS(SVG_NS, "svg");
  sym.setAttribute("class", "nk-sym");
  sym.setAttribute("viewBox", "0 0 78.4 49");
  sym.setAttribute("aria-hidden", "true");
  sym.innerHTML = SYM[spec.key];
  gem.append(document.createTextNode("["), sym, document.createTextNode("]"));
  name.append(gem, document.createTextNode(spec.name));

  const text = document.createElement("div");
  text.className = "nk-text";
  spec.texts.forEach((t) => {
    const p = document.createElement("p");
    p.textContent = noWidow(t);
    text.appendChild(p);
  });

  strip.append(arrow, name, text);
  strip.addEventListener("click", () => toggle(i));
  return strip;
}

/* ==== the accordion ====
   All heights live on the strips as inline px (u-scaled) so the height
   transition carries the whole motion; the open strip's height is its
   own text's, the rest share the remaining field. */
function layout() {
  if (!root) return;
  const strips = root.querySelectorAll(".nk-strip");
  const H = (n) => `calc(var(--u) * ${n.toFixed(2)})`; // u-terms: resize-proof
  if (openIdx < 0) {
    strips.forEach((s) => { s.style.height = H(CLOSED_H); });
    return;
  }
  const open = strips[openIdx];
  // measured px -> design units; the text wraps identically at any viewport
  // (its width and type are both u-scaled), so this height is scale-stable
  const textH = open.querySelector(".nk-text").offsetHeight / u();
  const openH = Math.max(CLOSED_H, TEXT_TOP + textH + TEXT_BOTTOM);
  const restH = (FIELD_H - openH) / (strips.length - 1);
  strips.forEach((s, i) => { s.style.height = H(i === openIdx ? openH : restH); });
}

function toggle(i) {
  if (!root) return;
  const strips = root.querySelectorAll(".nk-strip");
  openIdx = openIdx === i ? -1 : i;
  strips.forEach((s, j) => {
    s.classList.toggle("is-open", j === openIdx);
    s.classList.toggle("is-dim", openIdx >= 0 && j !== openIdx);
  });
  layout();
}

/* ==========================================================================
   open / close (the interface's own wipe)
   ========================================================================== */
export function openNikud() {
  if (root) return;
  root = document.createElement("section");
  root.className = "nikud";
  root.appendChild(buildTopbar());
  const list = document.createElement("div");
  list.className = "nk-list";
  NIKUD.forEach((spec, i) => list.appendChild(buildStrip(spec, i)));
  root.appendChild(list);
  root.appendChild(buildMarquee()); // the paper band under the last strip
  document.body.appendChild(root);
  document.body.classList.add("nikud-open");
  openIdx = -1;
  layout();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-open")));
  window.addEventListener("keydown", onKey);
}

export function closeNikud() {
  if (!root) return;
  const el = root;
  root = null;
  openIdx = -1;
  window.removeEventListener("keydown", onKey);
  document.body.classList.remove("nikud-open", "lp2-pill-hot");
  el.classList.add("is-leaving");
  setTimeout(() => el.remove(), 520);
}

export const isNikudOpen = () => !!root;

function onKey(e) {
  if (e.key === "Escape") closeNikud();
}
