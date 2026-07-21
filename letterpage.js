/* ראש מילין — the letter page engine: one reusable system for every
   letter, the ש screen (עיצוב 222) applied as the master design to all.
   Content lives in content.js + letter-texts-reish-milin.json; this file
   is the machinery:
     0  construction — the outline holds first (the ש trace voice), then
     1  rest — the letter as pure stroke wrapped in its contour aura (drag
        to turn in place); nikud orbiting the wide hidden ellipse below;
        the 4-part reading flanking the letter on its midline
     2  tagin (only the tagin letters, from the designer's tagin assets,
        riding the letter's own rotation) — hover lights the crowns and
        swaps the four blocks to the letter's 4-part tagin reading
     3  nikud — hover lights the mark stroke->fill and opens the reading
        at the design's bottom-centre block.
   All geometry is authored in the design's 2880x1800 frame and mapped to
   a same-aspect stage, so every screen scales as one composition. */

import { letterGlyphs, nikudGlyphs, SVG_NS } from "./sphere.js?v=15";
import {
  PLACEHOLDER, TAGIN_LETTERS, TITLES, LETTER_TEXTS, TAGIN_TEXTS,
  TAGIN_TEXT_INHERIT, NIKUD_TEXTS, NIKUD_LABELS,
} from "./content.js?v=5";

/* ---- the design frame ---- */
const DW = 2880;
const DH = 1800;
const px = (x) => `${(x / DW) * 100}%`;
const py = (y) => `${(y / DH) * 100}%`;

/* ---- shared template geometry ----
   The ש master design (עיצוב 222, below) IS the shared template now: every
   letter builds inside the SHIN geometry. (The older shared boxes were
   retired with the pre-master screens.) */

/* ---- the ש screen's own designed composition (עיצוב 222) ----
   ש alone follows its new layout: a larger letter set higher in the frame;
   a wide, flat, VISIBLE orbit ellipse low on the stage with the nikud spread
   along it; a small cross in the letter's heart; a logo mark up top. All
   measured from the design's own 2880x1800 frame. Every OTHER letter keeps
   the shared geometry above — these values are only reached behind a
   `letter === "ש"` guard, so no other screen is touched. */
const SHIN = {
  box: { x: 894, y: 372, w: 1092, h: 872 }, // letter room (design's letter+crowns bbox)
  inkWidth: 1040,                           // target ink width in design-px (≈ design222)
  orbit: { cx: 1435, cy: 1330, rx: 536, ry: 60 },
  cross: { x: 1440, y: 900, w: 180, h: 78 },
  /* the 4-part text blocks, flanking the letter on its own midline —
     read right-to-left: part 1 rightmost -> part 4 leftmost. Positions and
     widths are the design's own text bboxes (right-aligned, ragged left). */
  quad: [
    { x: 2185, y: 863, w: 307 },
    { x: 1773, y: 867, w: 315 },
    { x: 791,  y: 863, w: 410 },
    { x: 333,  y: 862, w: 363 },
  ],
  /* the nikud reading text: the design's bottom-centre block */
  nikudPanel: { rule: { x: 890, y: 1536, w: 1098 }, block: { x: 890, y: 1553, w: 1098 } },
};

/* the tagin readings, 4-part — each tagin letter's TAGIN_TEXTS entry,
   minimally retouched so each of the four blocks sits in the same 3-line,
   no-widows system as the rest reading. The line breaks are AUTHORED
   (rendered via white-space: pre-line), so every block is exactly three
   controlled lines with no widows/orphans — deterministic, not left to the
   wrapper. Finals inherit their base letter's reading (ן->נ, ץ->צ). */
const TAGIN_QUAD = {
  "ג": [
    "הגימ״ל בתגין ממשיכה את\nרעיון הגמול, המידה והמשקל,\nומעלה אותו אל מקור גבוה יותר.",
    "אם הגימ״ל עוסקת ביחס שבין\nפעולה לתוצאה ובין נתינה לקבלה,\nהמשקל אינו רק חשבון קר וסגור.",
    "מעל לגוף האות יש עטרות\nהמושכות את הגמול אל מקום\nשל אמת, של יושר ושל חיים.",
    "הן מזכירות שכל דין ומידה\nקשורים לאור רחב יותר, שהצדק\nיישאר תנועה חיה של תיקון.",
  ],
  "ז": [
    "הזי״ן היא אות של עמידה,\nשל מלחמה ושל הגנה\nעל החיים עצמם.",
    "בתגין, כוח המלחמה שלה אינו\nרק התנגשות או הדיפה, אלא שורש\nעליון של קדושה ואידיאל.",
    "התגין שמעליה הופכים את נשקה\nלנשק של אור: לא מלחמה לחורבן,\nאלא שמירה על בניין העולם.",
    "הזי״ן בתגין מבינה שלשמירה\nעל חיים צריך לעיתים כוח, גבורה\nוהבחנה מול כל מה שמפרק.",
  ],
  "ט": [
    "הטי״ת נושאת בתוכה את הטוב\nהגנוז, החבוי בעומק, שאינו\nתמיד נראה מבחוץ.",
    "התגין מושכים את הטוב הזה\nכלפי מעלה, אל מקורו\nהרחב והכללי.",
    "הם מגלים שהטוב הפרטי, הטמון\nבתוך האות, אינו מנותק מן הטוב\nהעליון המקיף את הכול.",
    "לכן הטי״ת בתגין אינה רק סוד\nפנימי, אלא הוצאת הטוב מן\nהגניזה אל פעולה בעולם.",
  ],
  "נ": [
    "הנו״ן בתגין קשורה לכוח\nהחיים עצמו: חיים שנופלים,\nנבנים מחדש וממשיכים לזרום.",
    "התגין מביאים אליה כוח ממקור\nעליון, ממקום שבו החיים אינם\nמפורדים לצורות שבירות.",
    "לכן הם מחזקים את הנו״ן\nומעמידים אותה מחדש: לא נפילה,\nאלא כוח להחזיק את התחייה.",
    "התגין הם כוחות חיים עדינים\nוחזקים, המחברים את עומק החיים\nאל הופעתם הגלויה במציאות.",
  ],
  "ע": [
    "העי״ן היא אות של ראייה,\nאבל ראייה יכולה להיות חושית,\nחלקית ואפילו מטעה.",
    "התגין מרימים את פעולת הראייה\nאל מקור עליון, אל ראייה בהירה\nשאינה כלואה במבט המיידי.",
    "הם פועלים ככוח המנקה את המבט,\nשובר דימויים כוזבים ומאפשר\nלראות מעבר לצורה המצומצמת.",
    "העי״ן בתגין היא מבט שאינו\nמסתפק בחיצוניות, אלא חודר אל\nהאור שמאחורי הציור הנראה.",
  ],
  "צ": [
    "הצדי״ק עוסקת בצדק, ביחסים\nשבין דבר לדבר, ובהעמדת כל פרט\nבמקומו הנכון מול זולתו.",
    "התגין מראים שהצדק אינו נבנה\nרק מתוך הסתכלות צדדית\nוקרובה אל הדברים.",
    "כדי שהיחסים יהיו צודקים באמת,\nעליהם להתחבר אל מרכז עליון,\nאל צדק שאינו תלוי במפגש בלבד.",
    "התגין מעל הצדי״ק מעשירים את\nהצדק, נותנים לו עומק, וקושרים\nכל יחס אל שורש אמת רחב יותר.",
  ],
  "ש": [
    "השי״ן היא אות מורכבת,\nהבנויה מתנועות שונות\nשל ימין, שמאל ואמצע.",
    "היא נושאת בתוכה מערכות,\nכיוונים וכוחות המבקשים\nלהתאחד לצורה אחת.",
    "התגין שומרים שהמורכבות הזאת\nלא תתפרק, ומזכירים שכל מערכת\nנשארת קשורה לאור שמעליה.",
    "השי״ן בתגין היא ריבוי שמתארגן\nלאחדות: מבנה מורכב המקבל מלמעלה\nכוח להישאר חי, מדויק ומכוון.",
  ],
};

/* the 4-part letter texts (poured from the sheet into the project json) —
   fetched once; the ש screen reads its four rest-state blocks from here */
let quadCache = null;
function loadQuadTexts() {
  if (!quadCache) {
    quadCache = fetch("letter-texts-reish-milin.json")
      .then((r) => r.json())
      .catch(() => null);
  }
  return quadCache;
}
const NIKUD_ORDER = ["קמץ", "פתח", "סגול", "חיריק", "שורוק", "צירה", "שוא"];
export const hasLetterPage = (letter) => !!TITLES[letter] && letterGlyphs.has(letter);

function getPage(letter) {
  return {
    letter,
    title: TITLES[letter] || letter,
    body: LETTER_TEXTS[letter] || PLACEHOLDER,
    hasTagin: TAGIN_LETTERS.has(letter),
    // a final letter inherits its base letter's tagin text (ן->נ, ץ->צ)
    taginText: TAGIN_TEXTS[letter] || TAGIN_TEXTS[TAGIN_TEXT_INHERIT[letter]] || PLACEHOLDER,
    // the 4-part tagin reading for the quad swap, with the same inheritance
    taginQuad: TAGIN_QUAD[letter] || TAGIN_QUAD[TAGIN_TEXT_INHERIT[letter]] || null,
    // every letter builds in the ש master's voice (the outline holds first)
    motif: "trace",
  };
}

/* ---- no widows/orphans ----
   A single word must never sit alone on a line. Binding the LAST two words
   with a non-breaking space guarantees the final line always carries at
   least two words — and it holds no matter how the text is wrapped OR
   fragmented (the typewriter splits text into one span per character, which
   defeats CSS text-wrap:balance/pretty, so a purely-CSS fix is not enough). */
const NBSP = " ";
function noWidow(text) {
  const t = String(text).replace(/\s+$/, "");
  const i = t.lastIndexOf(" ");
  return i < 0 ? t : `${t.slice(0, i)}${NBSP}${t.slice(i + 1)}`;
}

/* ---- typewriter with a restrained futuristic voice ---- */
const SCAN_CHARS = "·:٠▪";
let typeTimers = [];

function typeInto(el, text, cps, done) {
  text = noWidow(text);
  el.textContent = "";
  el.classList.add("lp-typing");
  const caret = document.createElement("span");
  caret.className = "lp-caret";
  el.appendChild(caret);
  const step = 1000 / cps;
  let i = 0;
  const tick = () => {
    if (i >= text.length) {
      el.classList.remove("lp-typing");
      // flatten the per-character spans back to contiguous text so the
      // block's final wrapping is clean (and text-wrap can settle it)
      el.textContent = text;
      if (done) done();
      return;
    }
    const ch = document.createElement("span");
    ch.className = "lp-ch";
    const real = text[i];
    i += 1;
    if (real !== " " && Math.random() < 0.09) {
      ch.textContent = SCAN_CHARS[(Math.random() * SCAN_CHARS.length) | 0];
      ch.classList.add("lp-ch--scan");
      typeTimers.push(setTimeout(() => {
        ch.textContent = real;
        ch.classList.remove("lp-ch--scan");
      }, 90 + Math.random() * 120));
    } else {
      ch.textContent = real;
    }
    el.insertBefore(ch, caret);
    typeTimers.push(setTimeout(tick, step * (0.6 + Math.random() * 0.8)));
  };
  tick();
}

function clearTimers() {
  typeTimers.forEach(clearTimeout);
  typeTimers = [];
}

/* ---- glyph windows: crop fill to its ink; identical-size window for the
   asset stroke so any swap stays registered ---- */
function inkWindow(svgOrShapes) {
  const host = document.createElementNS(SVG_NS, "svg");
  host.style.cssText = "position:absolute;left:-99999px;width:0;height:0";
  document.body.appendChild(host);
  const g = document.createElementNS(SVG_NS, "g");
  if (svgOrShapes instanceof SVGSVGElement || (svgOrShapes.querySelector && svgOrShapes.querySelector("g"))) {
    g.appendChild(svgOrShapes.querySelector("g").cloneNode(true));
  } else {
    svgOrShapes.forEach((s) => g.appendChild(s.cloneNode(true)));
  }
  host.appendChild(g);
  let bb = null;
  try { bb = g.getBBox(); } catch (err) { bb = null; }
  document.body.removeChild(host);
  return bb;
}

function windowedPair(glyph, padRatio = 0.03) {
  const fill = glyph.fillSvg.cloneNode(true);
  const stroke = glyph.strokeSvg ? glyph.strokeSvg.cloneNode(true) : null;
  [fill, stroke].forEach((s) => { if (s) { s.removeAttribute("class"); s.removeAttribute("style"); } });
  const fb = inkWindow(fill);
  let padFrac = 0;
  let win = null;
  if (fb) {
    const pad = Math.max(fb.width, fb.height) * padRatio;
    win = { x: fb.x - pad, y: fb.y - pad, w: fb.width + pad * 2, h: fb.height + pad * 2 };
    padFrac = pad / win.w;
    fill.setAttribute("viewBox", `${win.x} ${win.y} ${win.w} ${win.h}`);
    if (stroke) {
      const sb = inkWindow(stroke);
      if (sb) {
        stroke.setAttribute("viewBox",
          `${sb.x + sb.width / 2 - win.w / 2} ${sb.y + sb.height / 2 - win.h / 2} ${win.w} ${win.h}`);
      }
    }
  }
  return { fill, stroke, ink: fb, win, padFrac };
}

/* the hover state of the MAIN letter: the silhouette outline of its own
   filled geometry, via a bulge-minus-shape mask — complete by construction,
   free of internal seams, registered to the fill exactly. */
let outlineSeq = 0;
function outlineOfFill(fillSvg, strokeW = 3.4) {
  const s = fillSvg.cloneNode(true);
  const vb = (s.getAttribute("viewBox") || "0 0 1 1").split(" ").map(Number);
  const src = s.querySelector("g");
  const id = `lp-rim-${++outlineSeq}`;
  const m = vb[2] + vb[3];
  const region = (el) => {
    el.setAttribute("x", vb[0] - m);
    el.setAttribute("y", vb[1] - m);
    el.setAttribute("width", vb[2] + 2 * m);
    el.setAttribute("height", vb[3] + 2 * m);
  };
  const mask = document.createElementNS(SVG_NS, "mask");
  mask.setAttribute("id", id);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  region(mask);
  const bulge = src.cloneNode(true);
  Array.from(bulge.children).forEach((c) => {
    c.setAttribute("fill", "#fff");
    c.setAttribute("stroke", "#fff");
    c.setAttribute("stroke-width", String(strokeW));
    c.setAttribute("stroke-linejoin", "round");
    c.setAttribute("stroke-linecap", "round");
    c.setAttribute("vector-effect", "non-scaling-stroke");
  });
  const erase = src.cloneNode(true);
  Array.from(erase.children).forEach((c) => {
    c.setAttribute("fill", "#000");
    c.setAttribute("stroke", "none");
  });
  mask.append(bulge, erase);
  const rect = document.createElementNS(SVG_NS, "rect");
  region(rect);
  rect.setAttribute("fill", "currentColor");
  rect.setAttribute("mask", `url(#${id})`);
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.appendChild(mask);
  while (s.firstChild) s.removeChild(s.firstChild);
  s.append(defs, rect);
  return s;
}

/* ---- the tagin assets ----
   Each tagin file carries TWO renderings (stroke: upper half; fill: lower
   half) of the WHOLE crowned letter: the letter body redrawn plus the
   crowns (circles on stems). Only the CROWNS are ever shown — the letter
   body in the file serves purely as the coordinate reference: its bbox is
   mapped onto our rendered letter's ink box, and the crowns ride the same
   mapping. One letter on screen, crowns attached exactly where the
   designer put them — never a second ghost letter. */
const taginCache = new Map();

async function loadTagin(letter) {
  if (taginCache.has(letter)) return taginCache.get(letter);
  const p = (async () => {
    const res = await fetch(encodeURI(`assets/tagin/tagin-${letter}.svg`));
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const all = Array.from(doc.querySelectorAll("polygon, path, polyline, line, circle, rect, ellipse"));
    // the two renderings live in the upper/lower halves of the canvas
    const vbH = (doc.documentElement.getAttribute("viewBox") || "0 0 582 808").split(" ").map(Number)[3];
    const mid = vbH / 2;
    const cy = (el) => { const b = inkWindow([el]); return b ? b.y + b.height / 2 : 0; };
    const split = (shapes) => ({
      crowns: shapes.filter((s) => s.tagName === "circle" || s.tagName === "line"),
      body: shapes.filter((s) => s.tagName !== "circle" && s.tagName !== "line"),
    });
    const upper = all.filter((el) => cy(el) < mid);
    const lower = all.filter((el) => cy(el) >= mid);
    return { rest: split(upper), lit: split(lower) };
  })().catch(() => null);
  taginCache.set(letter, p);
  return p;
}

/* crowns svg: spans the letter's room; its viewBox maps the cluster's own
   letter-body bbox onto the rendered ink box, so the crowns land exactly
   in the designer's position relative to the letterform */
function buildCrownsSvg(cluster, mode, box, ink, strokeW = 1.2) {
  const bbL = inkWindow(cluster.body);
  const bbC = inkWindow(cluster.crowns);
  if (!bbL || !bbC || !cluster.crowns.length) return null;
  const sx = ink.w / bbL.width;
  const sy = ink.h / bbL.height;
  const vb = [
    bbL.x - (ink.left - box.x) / sx,
    bbL.y - (ink.top - box.y) / sy,
    box.w / sx,
    box.h / sy,
  ];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", vb.join(" "));
  svg.setAttribute("preserveAspectRatio", "none");
  const g = document.createElementNS(SVG_NS, "g");
  cluster.crowns.forEach((s) => {
    const c = s.cloneNode(true);
    const wasStrokeShape = c.getAttribute("class") === "cls-1" || c.tagName === "line";
    c.removeAttribute("class");
    if (mode === "stroke" || wasStrokeShape) {
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "currentColor");
      c.setAttribute("stroke-width", String(strokeW));
      c.setAttribute("vector-effect", "non-scaling-stroke");
    } else {
      c.setAttribute("fill", "currentColor");
      c.setAttribute("stroke", "none");
    }
    g.appendChild(c);
  });
  svg.appendChild(g);
  // the crowns' zone in room fractions (for the hover hit area)
  const zone = {
    left: ((bbC.x - 10 - vb[0]) * sx) / box.w,
    top: ((bbC.y - 10 - vb[1]) * sy) / box.h,
    w: ((bbC.width + 20) * sx) / box.w,
    h: ((bbC.height + 20) * sy) / box.h,
  };
  return { svg, zone };
}

/* one shared typographic scale for every letter, taken from ש (the master
   screen): its DESIGNED point size (עיצוב 222) in design-px per file-unit.
   A letter keeps its own natural size relative to the alphabet (י stays
   small, ל rises); only forms that would overflow the master's letter room
   (the long finals) are gently capped. */
let SCALE_REF = null;
function shinScale() {
  if (SCALE_REF) return SCALE_REF;
  const shin = letterGlyphs.get("ש");
  const bb = shin ? inkWindow(shin.fillSvg) : null;
  SCALE_REF = bb ? SHIN.inkWidth / bb.width : 5.23;
  return SCALE_REF;
}

/* ---- module state ---- */
let root = null;

/* ---- ש: the depth field (scroll-down spatial section) ----
   A scroll-driven journey in two phases, on one smoothed 0..2 variable:
     phase A (0..1, --dp): a dolly through the 4 reading blocks — the
       rightmost part nearest, each next part deeper, the letter farthest;
     phase B (1..2, --dc): past the text, the ש unfolds into its three
       foundation letters (י ו ז), each emerging from the arm it lives in.
   Everything is a pure function of the scroll position, so scrolling up
   reverses the whole journey exactly. */
/* Master switch for the whole ש spatial-scroll experiment (the text-depth
   dolly + the decompose/rebuild of ש into י ו ז). Set to false to keep the
   ש screen in its regular stable, non-spatial state; all the machinery
   below is retained, dormant, so it can be re-enabled later. */
const SHIN_DEPTH = false;

let depthT = 0;   // target (wheel), 0..2
let depthC = 0;   // current (smoothed in the loop)
let lastDc = -1;  // last decomposition phase applied (skip idle frames)

function smooth01(t) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}

/* the decomposition, applied at phase dc in [0..1]: the ש recedes as its
   three foundations arrive — each drifts from the arm of the ש it lives
   in, down into its own upright stance, on its own depth layer */
function applyDecomp(dc) {
  if (!els.fnd || !els.fnd.length) return;
  const gone = smooth01(dc / 0.55);
  const shOp = (1 - gone).toFixed(3);
  els.holder.style.opacity = shOp;
  if (els.tagholder) els.tagholder.style.opacity = shOp;
  const wins = [[0.05, 0.62], [0.2, 0.78], [0.36, 0.94]];
  els.fnd.forEach((h, i) => {
    const [a, b] = wins[i];
    const p = smooth01((dc - a) / (b - a));
    const s = h._spec;
    const dx = (s.arm.x - s.cx) * SHIN.box.w * stageK;
    const dy = (s.arm.y - FND_REST_Y) * SHIN.box.h * stageK;
    h.style.opacity = p.toFixed(3);
    h.style.transform =
      `translate3d(${(dx * (1 - p)).toFixed(1)}px, ${(dy * (1 - p)).toFixed(1)}px, ${(s.z * p).toFixed(1)}px)` +
      ` scale(${(0.84 + 0.16 * p).toFixed(4)})`;
  });
}

/* where the foundations come to rest (fraction of the letter room), and
   the arms of the ש they emerge from — read right-to-left: י from the
   right arm, ו from the middle, ז from the left */
const FND_REST_Y = 0.54;
const FND_SPECS = [
  { ch: "י", cx: 0.78, arm: { x: 0.74, y: 0.3 }, z: 90 },
  { ch: "ו", cx: 0.5, arm: { x: 0.5, y: 0.3 }, z: 45 },
  { ch: "ז", cx: 0.22, arm: { x: 0.26, y: 0.28 }, z: 0 },
];

/* ---- ש only: the scroll-driven construction intro ----
   A dedicated opening section, shown BEFORE the regular ש screen. The
   source video (the ש building from its foundational forms) is baked into
   a preloaded image sequence and rendered on a canvas; the user's vertical
   scroll maps DIRECTLY to the frame (down = build forward, up = reverse),
   and the section stays pinned until the final frame, then dissolves into
   the settled ש screen. No autoplay: every frame is a pure function of the
   scroll position. Only ש carries this.
   Master switch: false keeps ש on the regular letter-screen template; all
   the machinery below stays intact, dormant, for later re-enabling. */
const SHIN_INTRO_ENABLED = false;
const SHIN_INTRO = {
  count: 122,        // frames in assets/shin-intro/f000.jpg … f121.jpg
  sens: 0.00085,     // wheel delta -> progress (a full build ≈ ~1200px scroll)
  cf: 0.82,          // progress at which the crossfade to the real screen starts
  ease: 4.2,         // how tightly the eased progress chases the scroll target
};
let introActive = false;   // true only while a ש page is the open one
let introTarget = 0;       // scroll target, 0..1
let introProg = 0;         // eased current, 0..1
let introLastFrame = -1;   // last drawn frame index (skip idle redraws)
let introReady = false;    // all frames preloaded
const introImgs = [];      // the preloaded Image objects

function sizeIntroCanvas() {
  if (!els.introCanvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = els.intro.clientWidth || window.innerWidth;
  const h = els.intro.clientHeight || window.innerHeight;
  els.introCanvas.width = Math.round(w * dpr);
  els.introCanvas.height = Math.round(h * dpr);
  introLastFrame = -1; // force a redraw at the new size
}

/* draw one frame "contained" (whole frame visible, original aspect, never
   cropped or stretched); the frames' own dark ground fills any letterbox */
function drawIntroFrame(idx) {
  const img = introImgs[idx];
  const ctx = els.introCtx;
  if (!ctx) return;
  const cw = els.introCanvas.width;
  const ch = els.introCanvas.height;
  ctx.clearRect(0, 0, cw, ch);
  if (!img || !img.complete || !img.naturalWidth) return;
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = cw / ch;
  let dw, dh;
  if (cr > ir) { dh = ch; dw = ch * ir; } else { dw = cw; dh = cw / ir; }
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

/* build the intro overlay (canvas + a small scroll cue) and preload frames */
function buildShinIntro(root) {
  const wrap = document.createElement("div");
  wrap.className = "lp-intro";
  wrap.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  canvas.className = "lp-intro-canvas";
  wrap.appendChild(canvas);
  const hint = document.createElement("div");
  hint.className = "lp-intro-hint";
  hint.innerHTML = "<span class='lp-intro-hint-line'></span><span class='lp-intro-hint-tip'>&#8595;</span>";
  wrap.appendChild(hint);
  root.appendChild(wrap);

  els.intro = wrap;
  els.introCanvas = canvas;
  els.introCtx = canvas.getContext("2d");
  els.introHint = hint;
  sizeIntroCanvas();
  window.addEventListener("resize", () => { sizeIntroCanvas(); drawIntroFrame(introLastFrame < 0 ? 0 : introLastFrame); });

  // preload the whole sequence up front, so scrubbing (both ways) is instant
  let loaded = 0;
  for (let i = 0; i < SHIN_INTRO.count; i++) {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      loaded++;
      if (loaded >= SHIN_INTRO.count) introReady = true;
      if (i === 0 && introActive) drawIntroFrame(0); // first frame ASAP
    };
    im.src = `assets/shin-intro/f${String(i).padStart(3, "0")}.jpg`;
    introImgs.push(im);
  }
}

/* ---- every letter: the point-trace construction intro ----
   Clicking a letter on the opening screen arrives here first: the letter's
   TRUE silhouette rim — the same union boundary its rendered stroke is
   built from — is laid out as an ordered run of numbered points, derived
   per letter from its own custom geometry (never copied between letters).
   The user draws the letter by hand: click point 1, then pull the line
   point to point in order. Both the committed line and the live line
   follow the REAL contour arc between the points (never straight chords),
   so the drawing is the final letterform itself, growing continuously
   under the hand; when the last point locks, the stage breathes away over
   the identical rim stroke standing beneath — no visible transformation.
   A quiet [דלג] button arrives after 2s for anyone who prefers to skip.
   Master switch: false opens every letter directly into its regular
   screen (current state) — all the machinery below stays intact,
   dormant, for later re-enabling. */
const TRACE_ENABLED = false;
const TRACE_TARGET_POINTS = 34; // across the full construction — clear, never cluttered
/* ONE size system for the whole alphabet — everything in the design
   frame's own pixels (2880x1800), converted per letter through its glyph
   scale, so a point on י is exactly the size of a point on ש */
const TR_DOT = 9;        // point radius
const TR_NUM = 28;       // number type size
const TR_LBL = 40;       // number offset from its point
const TR_LOCK = 52;      // reach radius that locks the next point
const TR_START = 68;     // reach radius for the very first click
const TR_SPACE = 150;    // minimum spacing between sampled points
const TR_THIN = 95;      // crowding distance for the thinning pass
const TR_TIGHT = 0.86;   // the rare-case slight reduction for crowded letters
let traceActive = false;   // a letter open and the trace stage not yet completed
let traceStarted = false;  // point 1 clicked
let traceNext = 0;         // index of the next point to reach
let tracePts = null;       // sampled points (lazy, first open)
let traceDoneD = "";       // the committed path
let traceCeremony = null;  // the held regular-open ceremony, run on completion
/* the live stroke is drawn by the loop, not by raw pointer events: the
   hand sets a goal, the tip glides toward it every frame — one flowing
   gesture instead of event-stepped jumps */
let traceLiveL = 0;        // eased arc position of the live tip
let traceLiveGoal = 0;     // where the hand is pulling it
let traceCursor = null;    // last pointer position (svg coords)

function traceShapeToD(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === "polygon" || tag === "polyline") {
    const raw = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
    if (raw.length < 4) return null;
    let d = `M ${raw[0]} ${raw[1]}`;
    for (let i = 2; i < raw.length - 1; i += 2) d += ` L ${raw[i]} ${raw[i + 1]}`;
    if (tag === "polygon") d += " Z";
    return d;
  }
  if (tag === "path") return el.getAttribute("d");
  return null;
}

/* Douglas-Peucker: reduce a traced pixel boundary to its true corners */
function dpSimplify(pts, eps) {
  if (pts.length < 4) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const seg = stack.pop();
    const a = seg[0], b = seg[1];
    const ax = pts[a][0], ay = pts[a][1];
    const dx = pts[b][0] - ax, dy = pts[b][1] - ay;
    const den = Math.hypot(dx, dy) || 1e-9;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dx * (ay - pts[i][1]) - (ax - pts[i][0]) * dy) / den;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* the TRUE silhouette of the letter: rasterize the union of the fill
   shapes, follow each component's boundary (Moore neighbourhood), and
   simplify — the exact centerline the rendered rim stroke sits on */
function traceUnionLoops(fillSvg) {
  const vb = (fillSvg.getAttribute("viewBox") || "0 0 1 1").split(" ").map(Number);
  const W = 720;
  const scale = W / vb[2];
  const H = Math.max(2, Math.round(vb[3] * scale));
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.setTransform(scale, 0, 0, scale, -vb[0] * scale, -vb[1] * scale);
  ctx.fillStyle = "#fff";
  fillSvg.querySelectorAll("g > *").forEach((el) => {
    const d = traceShapeToD(el);
    if (d) ctx.fill(new Path2D(d));
  });
  const img = ctx.getImageData(0, 0, W, H).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && img[(y * W + x) * 4 + 3] > 127;

  /* label the connected components (stack flood fill) */
  const comp = new Int32Array(W * H).fill(-1);
  const comps = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!solid(x, y) || comp[y * W + x] >= 0) continue;
      const id = comps.length;
      const start = [x, y];
      let size = 0;
      const stack = [y * W + x];
      comp[y * W + x] = id;
      while (stack.length) {
        const i = stack.pop();
        size++;
        const cx = i % W, cy = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (solid(nx, ny) && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id; stack.push(ny * W + nx); }
        }
      }
      comps.push({ start, size });
    }
  }

  /* Moore boundary tracing, per component (skip specks) */
  const NB = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const loops = [];
  comps.forEach(({ start, size }) => {
    if (size < 140) return;
    const sx = start[0], sy = start[1];
    const b = [[sx, sy]];
    let cx = sx, cy = sy, back = 0; // came from W (empty by construction)
    for (let step = 0; step < 80000; step++) {
      let found = -1;
      for (let k = 0; k < 8; k++) {
        const j = (back + 1 + k) % 8;
        const nx = cx + NB[j][0], ny = cy + NB[j][1];
        if (solid(nx, ny)) { found = j; cx = nx; cy = ny; break; }
      }
      if (found < 0) break;
      if (cx === sx && cy === sy) break;
      b.push([cx, cy]);
      back = (found + 4) % 8;
    }
    if (b.length < 24) return;
    // simplify the closed loop — split at the farthest point first, so
    // neither half is degenerate (a closed loop's two ends coincide)
    let far = 0, fd = -1;
    for (let i = 0; i < b.length; i++) {
      const dd = (b[i][0] - sx) * (b[i][0] - sx) + (b[i][1] - sy) * (b[i][1] - sy);
      if (dd > fd) { fd = dd; far = i; }
    }
    const h1 = dpSimplify(b.slice(0, far + 1), 1.5);
    const h2 = dpSimplify(b.slice(far).concat([[sx, sy]]), 1.5);
    const simp = h1.concat(h2.slice(1, -1));
    if (simp.length < 3) return;
    // back to viewBox coordinates, on the pixel centers
    let loop = simp.map(([x, y]) => [(x + 0.5) / scale + vb[0], (y + 0.5) / scale + vb[1]]);
    // start at the loop's top-right vertex (the RTL reading corner)...
    let minX = 1e9, maxX = -1e9, minY = 1e9;
    loop.forEach(([x, y]) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; });
    let si = 0, best = 1e18;
    loop.forEach(([x, y], i) => {
      const c = (maxX - x) + (y - minY);
      if (c < best) { best = c; si = i; }
    });
    loop = loop.slice(si).concat(loop.slice(0, si));
    // ...and run DOWNWARD first, the natural first pull of the pen
    const a = loop[1], z = loop[loop.length - 1];
    if ((a[1] - loop[0][1]) < (z[1] - loop[0][1])) loop = [loop[0]].concat(loop.slice(1).reverse());
    loops.push(loop);
  });
  loops.sort((p, q) => q.length - p.length);
  return loops;
}

/* the letter's FULL construction: every designer fill shape as its own
   complete closed contour, in the file's drawing order — internal
   structural lines included (ח reads as its two ז forms, ס keeps its
   inner ring), never flattened to the outer silhouette.
   (traceUnionLoops above is kept dormant — the silhouette-only variant.) */
function traceShapeLoops(fillSvg) {
  const loops = [];
  fillSvg.querySelectorAll("g > *").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "polygon" || tag === "polyline") {
      const raw = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
      if (raw.length < 6) return;
      let pts = [];
      for (let i = 0; i + 1 < raw.length; i += 2) pts.push([raw[i], raw[i + 1]]);
      const f = pts[0], l = pts[pts.length - 1];
      if (Math.hypot(f[0] - l[0], f[1] - l[1]) < 0.01) pts.pop(); // drop a doubled closing vertex
      if (pts.length < 3) return;
      // start each piece at its top-right vertex, first pull downward —
      // the natural hand for an RTL letterform
      let minX = 1e9, maxX = -1e9, minY = 1e9;
      pts.forEach(([x, y]) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; });
      let si = 0, best = 1e18;
      pts.forEach(([x, y], i) => { const c = (maxX - x) + (y - minY); if (c < best) { best = c; si = i; } });
      pts = pts.slice(si).concat(pts.slice(0, si));
      if (pts[1][1] - pts[0][1] < pts[pts.length - 1][1] - pts[0][1]) {
        pts = [pts[0]].concat(pts.slice(1).reverse());
      }
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
      loops.push(d + " Z");
    } else if (tag === "path") {
      const d = el.getAttribute("d");
      if (d) loops.push(d);
    }
  });
  return loops;
}

/* sample the numbered points evenly along the letter's full construction */
function initTracePoints() {
  if (tracePts || !els.traceSvg) return;
  const ds = traceShapeLoops(els.traceFill);
  let probes = ds.map((d) => {
    const probe = document.createElementNS(SVG_NS, "path");
    probe.setAttribute("d", d);
    probe.setAttribute("fill", "none");
    probe.setAttribute("stroke", "none");
    els.traceSvg.appendChild(probe);
    return { probe, len: probe.getTotalLength(), closed: /z\s*$/i.test(d) };
  }).filter((pr) => pr.len > 1);
  /* keep every structural piece; drop only true specks that would read
     as noise rather than construction */
  const rawTotal = probes.reduce((s, pr) => s + pr.len, 0);
  probes.forEach((pr) => { if (pr.len < rawTotal * 0.03) pr.probe.remove(); });
  els.traceProbes = probes.filter((pr) => pr.len >= rawTotal * 0.03);

  const total = els.traceProbes.reduce((s, pr) => s + pr.len, 0);
  /* one metric for the whole alphabet: k converts the shared design-px
     sizes into this letter's own glyph units */
  const k = 1 / (els.traceScale || 1);
  const spacing = Math.max(total / TRACE_TARGET_POINTS, TR_SPACE * k);
  tracePts = [];
  els.traceProbes.forEach((pr, shapeIdx) => {
    const n = Math.max(3, Math.round(pr.len / spacing));
    let cx = 0, cy = 0;
    for (let i = 0; i < 12; i++) {
      const q = pr.probe.getPointAtLength((pr.len * i) / 12);
      cx += q.x / 12; cy += q.y / 12;
    }
    for (let i = 0; i < n; i++) {
      const L = (pr.len * i) / n;
      const p = pr.probe.getPointAtLength(L);
      const p2 = pr.probe.getPointAtLength(Math.min(L + 1.5, pr.len));
      let nx = -(p2.y - p.y), ny = p2.x - p.x;
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl; ny /= nl;
      if (nx * (p.x - cx) + ny * (p.y - cy) < 0) { nx = -nx; ny = -ny; }
      tracePts.push({ x: p.x, y: p.y, nx, ny, shape: shapeIdx, L, edge: i === 0 });
    }
  });

  /* thin any shoulder-to-shoulder pairs (where construction pieces meet);
     even a shape's anchor point yields when it lands virtually on top of
     a mark that is already there (pieces often share corner vertices) */
  const minD = TR_THIN * k;
  const dupD = TR_DOT * 2.6 * k;
  const thinned = [];
  tracePts.forEach((p, idx) => {
    if (idx > 0) {
      const near = thinned.reduce((s, q) => Math.min(s, Math.hypot(q.x - p.x, q.y - p.y)), 1e9);
      if (near < (p.edge ? dupD : minD)) return;
    }
    thinned.push(p);
  });
  tracePts = thinned;

  /* the rare-case rule: if a letter still reads crowded after thinning
     (many neighbours closer than the label footprint), the marks step
     down slightly — one small, deliberate adjustment, never per-point */
  let close = 0;
  for (let i = 0; i < tracePts.length; i++) {
    for (let j = i + 1; j < tracePts.length; j++) {
      const a = tracePts[i], b = tracePts[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < TR_LBL * 2.2 * k) { close++; break; }
    }
  }
  const tight = close / tracePts.length > 0.3 ? TR_TIGHT : 1;

  /* draw the markers: a small circle + its order number, in the quiet
     interface voice — ONE size across the alphabet. Each number takes the
     outward side of its point, but steps to the free side (or further
     out) when that spot would collide with a neighbour. */
  const lblOff = TR_LBL * k * tight;
  const r = TR_DOT * k * tight;
  /* a two-digit label is a wide little box, not a dot — collide as one */
  const lblW = TR_NUM * k * tight * 0.72; // half-width of "00"
  const lblH = TR_NUM * k * tight * 0.58; // half-height
  const placedLbl = [];
  els.tracePoints = tracePts.map((p, i) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "lp-trace-pt");
    const halo = document.createElementNS(SVG_NS, "circle");
    halo.setAttribute("cx", p.x); halo.setAttribute("cy", p.y);
    halo.setAttribute("r", r * 3.4);
    halo.setAttribute("class", "lp-trace-halo");
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
    c.setAttribute("r", r);
    c.setAttribute("class", "lp-trace-dot");
    const cands = [
      [p.x + p.nx * lblOff, p.y + p.ny * lblOff],
      [p.x - p.nx * lblOff, p.y - p.ny * lblOff],
      [p.x + p.nx * lblOff * 1.8, p.y + p.ny * lblOff * 1.8],
      [p.x - p.nx * lblOff * 1.8, p.y - p.ny * lblOff * 1.8],
    ];
    let lx = cands[0][0], ly = cands[0][1];
    for (const cand of cands) {
      const hitPt = tracePts.some((q) =>
        Math.abs(q.x - cand[0]) < lblW + r * 1.4 && Math.abs(q.y - cand[1]) < lblH + r * 1.4);
      const hitLbl = placedLbl.some((q) =>
        Math.abs(q[0] - cand[0]) < lblW * 2.1 && Math.abs(q[1] - cand[1]) < lblH * 2.1);
      if (!hitPt && !hitLbl) { lx = cand[0]; ly = cand[1]; break; }
    }
    placedLbl.push([lx, ly]);
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", lx);
    t.setAttribute("y", ly);
    t.setAttribute("class", "lp-trace-num");
    t.setAttribute("font-size", (TR_NUM * k * tight).toFixed(2));
    t.textContent = String(i + 1).padStart(2, "0");
    g.append(halo, c, t);
    els.traceMarks.appendChild(g);
    return g;
  });
}

function traceSvgPoint(e) {
  const pt = els.traceSvg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(els.traceSvg.getScreenCTM().inverse());
}

function setTraceCursorState() {
  els.tracePoints.forEach((g, i) => {
    g.classList.toggle("is-reached", i < traceNext);
    g.classList.toggle("is-next", traceStarted ? i === traceNext : i === 0);
  });
}

/* the true contour between two arc positions, densely sampled — the drawn
   line is the letter's own geometry, never a straight shortcut */
function traceArcD(pr, L0, L1) {
  const span = L1 - L0;
  if (span <= 0.01) return "";
  const steps = Math.min(60, Math.max(3, Math.round(span / 5)));
  let d = "";
  for (let i = 1; i <= steps; i++) {
    const q = pr.probe.getPointAtLength(Math.min(L0 + (span * i) / steps, pr.len));
    d += ` L ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }
  return d;
}

function closeTraceShape(lastPt) {
  const pr = els.traceProbes[lastPt.shape];
  traceDoneD += traceArcD(pr, lastPt.L, pr.len) + (pr.closed ? " Z" : "");
}

function commitTracePoint() {
  const p = tracePts[traceNext];
  const prev = tracePts[traceNext - 1];
  if (!prev || p.shape !== prev.shape) {
    // a new rim component: the finished one closes along its own arc,
    // the pen lifts, and begins anew
    if (prev) closeTraceShape(prev);
    traceDoneD += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  } else {
    traceDoneD += traceArcD(els.traceProbes[p.shape], prev.L, p.L);
  }
  els.traceDone.setAttribute("d", traceDoneD);
  /* the tip continues from exactly here — locking is seamless, the next
     pull simply keeps drawing */
  traceLiveL = p.L;
  traceLiveGoal = p.L;
  traceNext++;
  if (traceNext >= tracePts.length) {
    closeTraceShape(p);
    els.traceDone.setAttribute("d", traceDoneD);
    finishTrace();
  }
  setTraceCursorState();
}

/* the hand sets a goal for the live tip: the cursor's progress toward
   the next point, mapped onto the true contour's arc */
function setTraceLiveGoal(sp) {
  traceCursor = sp;
  if (!traceStarted || traceNext >= tracePts.length) return;
  const from = tracePts[traceNext - 1];
  const to = tracePts[traceNext];
  if (!from || from.shape !== to.shape) return;
  const dx = to.x - from.x, dy = to.y - from.y;
  const t = Math.max(0, Math.min(1, ((sp.x - from.x) * dx + (sp.y - from.y) * dy) / (dx * dx + dy * dy || 1e-9)));
  traceLiveGoal = from.L + t * (to.L - from.L);
}

/* rendered every frame from the loop: the contour grows from the last
   locked point, its tip gliding smoothly toward the hand's goal — one
   continuous drawn gesture, never event-stepped */
function renderTraceLive(dt) {
  if (!traceActive || !traceStarted || !tracePts || !els.traceLive) return;
  if (traceNext >= tracePts.length) return;
  const from = tracePts[traceNext - 1];
  const to = tracePts[traceNext];
  if (!from || from.shape !== to.shape) {
    els.traceLive.setAttribute("d", "");
    els.traceThread.setAttribute("opacity", "0");
    return;
  }
  traceLiveL += (traceLiveGoal - traceLiveL) * Math.min(1, dt * 14);
  traceLiveL = Math.max(from.L, Math.min(to.L, traceLiveL));
  const pr = els.traceProbes[to.shape];
  els.traceLive.setAttribute(
    "d",
    `M ${from.x.toFixed(1)} ${from.y.toFixed(1)}` + traceArcD(pr, from.L, traceLiveL)
  );
  if (traceCursor) {
    const tip = pr.probe.getPointAtLength(Math.min(traceLiveL, pr.len));
    const off = Math.hypot(traceCursor.x - tip.x, traceCursor.y - tip.y);
    if (off > 14 / (els.traceScale || 1)) {
      els.traceThread.setAttribute("x1", tip.x);
      els.traceThread.setAttribute("y1", tip.y);
      els.traceThread.setAttribute("x2", traceCursor.x);
      els.traceThread.setAttribute("y2", traceCursor.y);
      els.traceThread.setAttribute("opacity", "1");
    } else {
      els.traceThread.setAttribute("opacity", "0");
    }
  }
}

function handleTracePointer(e, isDown) {
  if (!traceActive || !tracePts) return;
  const sp = traceSvgPoint(e);
  const k = 1 / (els.traceScale || 1);
  const lockR = TR_LOCK * k;
  const startR = TR_START * k;
  if (!traceStarted) {
    if (isDown && Math.hypot(sp.x - tracePts[0].x, sp.y - tracePts[0].y) < startR) {
      traceStarted = true;
      traceDoneD = `M ${tracePts[0].x.toFixed(1)} ${tracePts[0].y.toFixed(1)}`;
      els.traceDone.setAttribute("d", traceDoneD);
      traceNext = 1;
      traceLiveL = tracePts[0].L;
      traceLiveGoal = tracePts[0].L;
      setTraceCursorState();
    }
    return;
  }
  // reaching the correct next point locks its arc; anything else is
  // simply not locked — no error states, the ritual stays calm
  while (
    traceNext < tracePts.length &&
    Math.hypot(sp.x - tracePts[traceNext].x, sp.y - tracePts[traceNext].y) < lockR
  ) {
    commitTracePoint();
  }
  if (traceActive) setTraceLiveGoal(sp);
}

function finishTrace() {
  traceActive = false;
  els.traceLive.setAttribute("d", "");
  els.traceThread.setAttribute("opacity", "0");
  /* the resolve: the numbers and points breathe out first, then the whole
     stage dissolves — beneath it the real letter's rim is already standing
     in the same geometry, so the traced line simply becomes the letter */
  els.trace.classList.add("lp-trace-resolving");
  if (traceCeremony) { traceCeremony(); traceCeremony = null; }
  later(() => { els.trace.classList.remove("is-active", "lp-trace-resolving"); }, 1500);
}

/* build the overlay: an exact mirror of the letter room's geometry, so
   the traced line sits precisely over the real stroke beneath */
function buildLetterTrace(root, pair, roomBox, holderStyle, glyphScale) {
  const wrap = document.createElement("div");
  wrap.className = "lp-trace";
  wrap.setAttribute("aria-hidden", "true");
  const st = document.createElement("div");
  st.className = "lp-trace-stage";
  const rm = document.createElement("div");
  rm.className = "lp-trace-room";
  rm.style.left = px(roomBox.x);
  rm.style.top = py(roomBox.y);
  rm.style.width = px(roomBox.w);
  rm.style.height = py(roomBox.h);
  const vb = (pair.fill.getAttribute("viewBox") || "0 0 1 1").split(" ").map(Number);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", vb.join(" "));
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.left = holderStyle.left;
  svg.style.top = holderStyle.top;
  svg.style.width = holderStyle.width;
  svg.style.height = holderStyle.height;
  const done = document.createElementNS(SVG_NS, "path");
  done.setAttribute("class", "lp-trace-done");
  const live = document.createElementNS(SVG_NS, "path");
  live.setAttribute("class", "lp-trace-live");
  const thread = document.createElementNS(SVG_NS, "line");
  thread.setAttribute("class", "lp-trace-thread");
  thread.setAttribute("opacity", "0");
  const marks = document.createElementNS(SVG_NS, "g");
  svg.append(done, live, thread, marks);
  rm.appendChild(svg);
  st.appendChild(rm);
  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "lp-trace-skip";
  skip.textContent = "[דלג]";
  st.appendChild(skip);
  wrap.appendChild(st);
  root.appendChild(wrap);

  els.trace = wrap;
  els.traceSvg = svg;
  els.traceDone = done;
  els.traceLive = live;
  els.traceThread = thread;
  els.traceMarks = marks;
  els.traceSkip = skip;
  els.traceWin = { w: vb[2], h: vb[3] };
  els.traceFill = pair.fill;
  els.traceScale = glyphScale || 1; // design-px per glyph unit
  els.tracePoints = [];
  els.traceProbes = [];
  tracePts = null; // a new letter brings its own geometry — never reuse

  skip.addEventListener("pointerdown", (e) => e.stopPropagation());
  skip.addEventListener("click", (e) => {
    e.stopPropagation();
    if (traceActive) finishTrace(); // straight to the letter's own screen
  });

  wrap.addEventListener("pointerdown", (e) => handleTracePointer(e, true));
  wrap.addEventListener("pointermove", (e) => handleTracePointer(e, false));
}

/* ---- ת only: the circular text carousel ----
   The 4-part reading keeps its parts, widths and wraps, but instead of
   standing in the master's fixed slots the blocks ride a slow, wide orbit
   around the central letter (the reference's construction logic: a centre
   object with an organized system of panels arranged around it). The ring
   is driven exactly like the nikud orbit — a gentle ellipse, depth-scaled
   and depth-dimmed, calm enough to read.
   Master switch: false keeps ת on the regular letter-screen template (the
   4 parts sit in the shared static slots); the ring machinery stays
   intact, dormant, for later re-enabling. */
const TAV_RING_ENABLED = false;
const TAV_RING = {
  cx: 1440,  // ring centre in the design frame (the letter's own axis)
  cy: 900,   // the reading midline the blocks already live on
  rx: 920,   // wide — the side extremes match the old outer slots
  ry: 90,    // nearly straight-on (per the correction): only a whisper of
             // vertical drift betrays the depth — no tilted-disc look
  speed: 0.04, // rad/s — one slow revolution ≈ 2.5min: calm, fully readable
};
let ringAngle = 0;

let stage = null;
let els = {};
let builtLetter = null;
let yaw = 0;
let yawVel = 0;
let dragging = false;
let dragX = 0;
let roomMoved = 0;
let rafId = null;
let lastT = null;
let openTimers = [];
let pinned = false;
let activeLetter = null;
let activePage = null;

/* orbit + selection state */
let orbitAngle = 0;
let orbitSpeed = 0;
let activeOrbit = SHIN.orbit; // the ellipse the nikud ride (the master's)
let stageK = 0.5; // design-px -> screen-px, cached by fit() (no per-frame reads)
const ORBIT_BASE = 0.34;
let orbitPaused = false;
let activeNikud = null;
let taginHover = false;
let leaveTimer = null;

/* (the letter screens carry no particle field — their atmosphere lives in
   the design: mist, aura, grain, glow) */

const later = (fn, ms) => openTimers.push(setTimeout(fn, ms));

/* window-level drag listeners registered ONCE (the page rebuilds per letter) */
let windowBound = false;
function bindWindowDrag() {
  if (windowBound) return;
  windowBound = true;
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragX;
    dragX = e.clientX;
    roomMoved += Math.abs(dx);
    yaw -= dx * 0.0038;
    yawVel = -dx * 0.0038;
  });
  window.addEventListener("pointerup", () => { dragging = false; });
}

function buildDom(page) {
  root = document.createElement("section");
  root.className = "lp";
  root.id = "lp";
  root.setAttribute("aria-hidden", "true");
  root.dataset.letter = page.letter; // lets styling address a single screen
  builtLetter = page.letter;

  const back = document.createElement("button");
  back.type = "button";
  back.className = "lp-back lp-hot";
  back.innerHTML = "<span class='back-arrow'>→</span><span>חזרה</span>";
  back.addEventListener("click", closeLetterPage);
  root.appendChild(back);

  stage = document.createElement("div");
  stage.className = "lp-stage";
  root.appendChild(stage);

  const fit = () => {
    const h = Math.min(innerHeight, innerWidth * (DH / DW));
    stageK = h / DH; // cached for the loop's px math
    stage.style.setProperty("--k", stageK.toFixed(5));
  };
  window.addEventListener("resize", fit);
  fit();

  /* title + body (top right) */
  els.title = document.createElement("h2");
  els.title.className = "lp-title";
  els.body = document.createElement("p");
  els.body.className = "lp-body";
  stage.append(els.title, els.body);

  /* the letter — pure stroke in a 3D room, per the ש master design */
  const box = SHIN.box;
  const room = document.createElement("div");
  room.className = "lp-room lp-hot";
  room.style.left = px(box.x);
  room.style.top = py(box.y);
  room.style.width = px(box.w);
  room.style.height = py(box.h);
  const holder = document.createElement("div");
  holder.className = "lp-letter";
  const pair = windowedPair(letterGlyphs.get(page.letter));
  /* every letter lives as pure stroke — no fill, no extrusion, no fill
     reveals (the ש master language); its presence is an aura that hugs the
     CONTOUR: blurred copies of the letter's outline rim (never its filled
     silhouette), so the mist wraps the boundary from both sides and the
     inside of the letter stays hollow and clean, per the reference. The
     aura lives OUTSIDE the turning 3D holder in a static wrap, so its blur
     is rasterized once and cached. */
  const auraWrap = document.createElement("div");
  auraWrap.setAttribute("aria-hidden", "true");
  auraWrap.className = "lp-aura-wrap";
  [["lp-aura lp-aura--wide", 14], ["lp-aura lp-aura--tight", 8]].forEach(([cls, w]) => {
    const a = outlineOfFill(pair.fill, w);
    a.setAttribute("class", cls);
    auraWrap.appendChild(a);
  });
  // the ש master's thin, elegant, airy rim — one weight for every letter
  const strokeState = outlineOfFill(pair.fill, 2.4);
  strokeState.setAttribute("class", "lp-stroke");
  holder.appendChild(strokeState);

  /* size by the SHARED typographic scale — the ש master's own designed
     point size (עיצוב 222), so every letter carries the same typographic
     presence while keeping its true proportions in the alphabet (י stays
     small, ל rises); forms that would overflow the master's letter room
     (the long finals, the ל ascender) are gently capped to stay inside. */
  const fb = pair.ink;
  // ש takes its designed size EXACTLY (it is the master — the caps are
  // derived from its own room and must never alter it)
  const scale = page.letter === "ש"
    ? shinScale()
    : Math.min(shinScale(), box.w / fb.width, box.h / fb.height);
  const ink = {
    left: box.x + (box.w - fb.width * scale) / 2,
    top: box.y + (box.h - fb.height * scale) / 2,
    w: fb.width * scale,
    h: fb.height * scale,
  };
  const winW = pair.win.w * scale;
  const winH = pair.win.h * scale;
  holder.style.left = `${((((box.w - winW) / 2) / box.w) * 100).toFixed(4)}%`;
  holder.style.top = `${((((box.h - winH) / 2) / box.h) * 100).toFixed(4)}%`;
  holder.style.width = `${((winW / box.w) * 100).toFixed(4)}%`;
  holder.style.height = `${((winH / box.h) * 100).toFixed(4)}%`;

  if (auraWrap) {
    // the static aura mirrors the holder's window exactly, behind it
    auraWrap.style.left = holder.style.left;
    auraWrap.style.top = holder.style.top;
    auraWrap.style.width = holder.style.width;
    auraWrap.style.height = holder.style.height;
    room.appendChild(auraWrap);
  }

  room.appendChild(holder);
  stage.appendChild(room);
  els.room = room;
  els.holder = holder;
  els.inkBox = ink; // the crowns map onto this

  /* the point-trace intro mirrors the holder's exact geometry, so the
     traced line stands precisely where the real rim stroke stands —
     every letter carries its own trace, from its own custom shape.
     The glyph scale (design-px per glyph unit) travels along, so the
     points, numbers and reach radii are ONE size across the alphabet. */
  if (TRACE_ENABLED) {
    buildLetterTrace(root, pair, box, {
      left: holder.style.left,
      top: holder.style.top,
      width: holder.style.width,
      height: holder.style.height,
    }, scale);
  } else {
    els.trace = null;
  }

  room.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragX = e.clientX;
    yawVel = 0;
    roomMoved = 0;
    try { room.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
  });
  bindWindowDrag();

  room.addEventListener("pointerenter", () => stage.classList.add("lp-reveal"));
  room.addEventListener("pointerleave", () => { if (!pinned) stage.classList.remove("lp-reveal"); });
  room.addEventListener("click", () => {
    if (roomMoved > 6) return; // a turn is not a choice
    pinned = !pinned;
    stage.classList.toggle("lp-reveal", pinned);
  });

  /* the tagin's mirror 3D room — same box, same perspective, driven by the
     same yaw, so the crowns turn with the letter as one form */
  const tagroom = document.createElement("div");
  tagroom.className = "lp-tagroom";
  tagroom.style.left = px(box.x);
  tagroom.style.top = py(box.y);
  tagroom.style.width = px(box.w);
  tagroom.style.height = py(box.h);
  const tagholder = document.createElement("div");
  tagholder.className = "lp-tagholder";
  tagroom.appendChild(tagholder);
  stage.appendChild(tagroom);
  els.tagholder = tagholder;
  els.taginSet = null;

  if (page.hasTagin) {
    loadTagin(page.letter).then((tg) => {
      if (!tg || builtLetter !== page.letter || !els.inkBox) return;
      const setEl = document.createElement("div");
      setEl.className = "lp-tagset";
      const crownW = 0.9; // the ש master's crown weight — thin, like the letters
      const rest = buildCrownsSvg(tg.rest, "stroke", box, els.inkBox, crownW);
      if (!rest) return;
      rest.svg.setAttribute("class", "lp-tagsvg lp-tag-rest");
      setEl.appendChild(rest.svg);
      const lit = buildCrownsSvg(tg.lit, "fill", box, els.inkBox, crownW);
      if (lit) {
        lit.svg.setAttribute("class", "lp-tagsvg lp-tag-lit");
        setEl.appendChild(lit.svg);
      }
      // the hover hit-zone: the crowns' own zone over the letter
      const z = rest.zone;
      const hit = document.createElement("div");
      hit.className = "lp-tag-hit lp-hot";
      hit.style.left = `${(z.left * 100).toFixed(3)}%`;
      hit.style.top = `${(z.top * 100).toFixed(3)}%`;
      hit.style.width = `${(z.w * 100).toFixed(3)}%`;
      hit.style.height = `${(z.h * 100).toFixed(3)}%`;
      hit.addEventListener("pointerenter", () => setTagin(true));
      hit.addEventListener("pointerleave", () => scheduleTaginOff());
      setEl.appendChild(hit);
      tagholder.appendChild(setEl);
      els.taginSet = setEl;
    });
  }

  /* the nikud, orbiting the hidden ellipse; every mark keeps its natural
     proportions under one shared scale */
  els.nikud = [];
  const n = NIKUD_ORDER.length;
  const nkItems = [];
  NIKUD_ORDER.forEach((name, i) => {
    const g = nikudGlyphs.get(name);
    if (!g) return;
    const p2 = windowedPair(g, 0.08);
    const vb2 = (p2.fill.getAttribute("viewBox") || "0 0 1 1").split(" ").map(Number);
    nkItems.push({ name, i, p2, vw: vb2[2], vh: vb2[3] });
  });
  const NK_MAX_W = 60;
  const maxVw = Math.max(...nkItems.map((it) => it.vw));
  nkItems.forEach(({ name, i, p2, vw, vh }) => {
    const holder2 = document.createElement("div");
    holder2.className = "lp-nikud lp-hot";
    holder2.dataset.name = name;
    holder2.baseAngle = (Math.PI * 2 * i) / n + Math.PI / 2;
    const wPx = NK_MAX_W * (vw / maxVw);
    const hPx = wPx * (vh / vw);
    holder2.style.width = `calc(var(--k, 0.5) * ${wPx.toFixed(1)}px)`;
    holder2.style.height = `calc(var(--k, 0.5) * ${hPx.toFixed(1)}px)`;
    p2.fill.setAttribute("class", "lp-nk-fill");
    if (p2.stroke) p2.stroke.setAttribute("class", "lp-nk-stroke");
    holder2.append(p2.fill, ...(p2.stroke ? [p2.stroke] : []));
    holder2.addEventListener("pointerenter", () => selectNikud(holder2));
    holder2.addEventListener("pointerleave", () => scheduleNikudOff());
    stage.appendChild(holder2);
    els.nikud.push(holder2);
  });

  /* (the foundations section is retired across the system, per the ש
     master — it will be redesigned later) */

  /* reading panels — every letter reads its nikud at the master design's
     bottom-centre block, and carries no tagin side-panel: the tagin
     reading lives in the quad (hover the crowns -> the four blocks swap) */
  els.taginPanel = null;
  els.nikudPanel = buildPanel("lp-panel--nikud", SHIN.nikudPanel);

  /* the quad: the 4-part reading, flanking the letter per the master design */
  els.quad = null;
  els.quadBlocks = [];
  {
    const quad = document.createElement("div");
    quad.className = "lp-quad";
    SHIN.quad.forEach((spec) => {
      const b = document.createElement("p");
      b.className = "lp-quad-block";
      if (TAV_RING_ENABLED && page.letter === "ת") {
        /* ת: every block anchors on the ring's centre — the loop places it
           on the orbit by transform alone. The width keeps the master's
           own measure, so the tuned 3-line wraps stay exactly as designed. */
        b.style.left = px(TAV_RING.cx);
        b.style.top = py(TAV_RING.cy);
      } else {
        b.style.left = px(spec.x);
        b.style.top = py(spec.y);
      }
      b.style.width = px(spec.w);
      quad.appendChild(b);
      els.quadBlocks.push(b);
    });
    stage.appendChild(quad);
    els.quad = quad;
    loadQuadTexts().then((data) => {
      const parts = data && data.letters && data.letters[page.letter];
      els.quadRest = parts || [];
      if (builtLetter === page.letter && !taginHover) setQuadTexts(els.quadRest);
    });
  }

  /* every screen follows the ש master's designed composition (עיצוב 222)
     and its art direction: first the structural marks of the design (the
     cross in the letter's heart), then a soft, purple, misty
     "old-photograph" atmosphere around the same living mechanism. Purely
     additive — every added layer is pointer-transparent and none uses a
     CSS filter on the 3D letter, so drag/hover/orbit behave as before. */
  buildShinAtmosphere(stage, root);

  /* ---- ש only: the depth field — wheel drives the dolly, a small cue
     at the bottom invites the scroll (disabled for now via SHIN_DEPTH) ---- */
  if (SHIN_DEPTH && page.letter === "ש") {
    root.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        depthT = Math.min(2, Math.max(0, depthT + e.deltaY * 0.0009));
        root.classList.add("lp-depth-live");
      },
      { passive: false }
    );

    const cue = document.createElement("button");
    cue.type = "button";
    cue.className = "lp-scrollcue lp-hot";
    cue.setAttribute("aria-label", "גלילה אל מרחב העומק");
    cue.innerHTML = "<span class='lp-scrollcue-line'></span><span class='lp-scrollcue-tip'>&#8595;</span>";
    cue.addEventListener("click", () => { depthT = 1; root.classList.add("lp-depth-live"); });
    root.appendChild(cue);
    els.depthCue = cue;

    /* the decomposition layer: the three foundations, built in the same
       stroke voice as the letter, waiting unseen over the letter room */
    els.fnd = [];
    {
      const dbox = SHIN.box;
      const dec = document.createElement("div");
      dec.className = "lp-decomp";
      dec.setAttribute("aria-hidden", "true");
      dec.style.left = px(dbox.x);
      dec.style.top = py(dbox.y);
      dec.style.width = px(dbox.w);
      dec.style.height = py(dbox.h);
      FND_SPECS.forEach((spec) => {
        const g = letterGlyphs.get(spec.ch);
        if (!g) return;
        const fp = windowedPair(g);
        const sc = Math.min(shinScale(), (dbox.w * 0.3) / fp.ink.width, (dbox.h * 0.8) / fp.ink.height);
        const winW = fp.win.w * sc;
        const winH = fp.win.h * sc;
        const fh = document.createElement("div");
        fh.className = "lp-fnd";
        fh.style.left = `${((spec.cx - winW / dbox.w / 2) * 100).toFixed(4)}%`;
        fh.style.top = `${((FND_REST_Y - winH / dbox.h / 2) * 100).toFixed(4)}%`;
        fh.style.width = `${((winW / dbox.w) * 100).toFixed(4)}%`;
        fh.style.height = `${((winH / dbox.h) * 100).toFixed(4)}%`;
        const st = outlineOfFill(fp.fill, 2.4);
        st.setAttribute("class", "lp-stroke");
        fh.appendChild(st);
        fh._spec = spec;
        dec.appendChild(fh);
        els.fnd.push(fh);
      });
      stage.appendChild(dec);
      els.decomp = dec;
    }
  } else {
    els.depthCue = null;
    els.fnd = [];
  }

  /* ---- ש only: the scroll-driven construction intro (its own opening
     section, in front of the regular screen) ---- */
  if (SHIN_INTRO_ENABLED && page.letter === "ש") {
    buildShinIntro(root);
    root.addEventListener(
      "wheel",
      (e) => {
        if (!introActive) return;
        // engaged while building, or while reversing back from the end;
        // once complete, a further downward scroll simply releases control
        if (introTarget >= 1 && e.deltaY > 0) return;
        e.preventDefault();
        introTarget = Math.min(1, Math.max(0, introTarget + e.deltaY * SHIN_INTRO.sens));
      },
      { passive: false }
    );
  } else {
    els.intro = null;
  }

  document.body.appendChild(root);
}

/* ---- ש: the atmosphere (mist, masked grain) ----
   Kept deliberately light: two drifting mist banks behind the composition;
   one static grain layer on top, masked so it lives on the letter/glow zone
   and fades smoothly into the interface's own clean black. The letter's
   aura itself is built with the letter (its blurred silhouette), not here.
   All layers are aria-hidden, pointer-transparent. */
function buildShinAtmosphere(stage, root) {
  const bg = document.createElement("div");
  bg.className = "lp-atmos";
  bg.setAttribute("aria-hidden", "true");
  bg.innerHTML = `
    <div class="lp-mist lp-mist--a"></div>
    <div class="lp-mist lp-mist--b"></div>`;
  stage.insertBefore(bg, stage.firstChild); // first child => painted behind

  const grain = document.createElement("div");
  grain.className = "lp-grain";
  grain.setAttribute("aria-hidden", "true");
  root.appendChild(grain);
}

function buildPanel(cls, spec) {
  const panel = document.createElement("div");
  panel.className = `lp-panel ${cls}`;
  const rule = document.createElement("div");
  rule.className = "lp-rule";
  rule.style.left = px(spec.rule.x);
  rule.style.top = py(spec.rule.y);
  rule.style.width = px(spec.rule.w);
  const wrap = document.createElement("div");
  wrap.className = "lp-panel-wrap";
  wrap.style.left = px(spec.block.x);
  wrap.style.top = py(spec.block.y);
  wrap.style.width = px(spec.block.w);
  const h = document.createElement("h3");
  h.className = "lp-panel-label";
  const p = document.createElement("p");
  p.className = "lp-panel-text";
  wrap.append(h, p);
  panel.append(rule, wrap);
  stage.appendChild(panel);
  return { panel, rule, label: h, text: p, spec };
}

/* ---- the ש quad: filling and the tagin swap ---- */
function setQuadTexts(parts) {
  // each 3-line block also gets its last two words bound (no lone last word)
  els.quadBlocks.forEach((b, i) => { b.textContent = noWidow((parts && parts[i]) || ""); });
}

/* hover the crowns -> the four blocks breathe out (blur + fade), swap to the
   tagin reading, and breathe back in; leaving swaps home the same way */
let quadSwapTimer = null;
function swapQuad(toTagin) {
  if (!els.quad) return;
  if (quadSwapTimer) { clearTimeout(quadSwapTimer); quadSwapTimer = null; }
  els.quad.classList.add("is-swapping");
  quadSwapTimer = setTimeout(() => {
    quadSwapTimer = null;
    const tagin = (activePage && activePage.taginQuad) || els.quadRest || [];
    setQuadTexts(toTagin ? tagin : (els.quadRest || []));
    els.quad.classList.remove("is-swapping");
  }, 430);
  openTimers.push(quadSwapTimer);
}

/* ---- tagin: hover -> the crowns light to fill, the reading opens ----
   (ש swaps its quad; every other tagin letter opens its side panel) */
function setTagin(on) {
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
  if (taginHover === on) return;
  if (!els.taginPanel && !els.quad) return;
  taginHover = on;
  if (els.taginSet) els.taginSet.classList.toggle("is-lit", on);
  if (els.quad) { swapQuad(on); return; }
  const pnl = els.taginPanel;
  if (on) {
    pnl.panel.classList.add("is-open");
    pnl.label.textContent = "";
    pnl.text.textContent = "";
    later(() => typeInto(pnl.label, "תגין", 16), 200);
    later(() => typeInto(pnl.text, activePage.taginText, 90), 560);
  } else {
    pnl.panel.classList.remove("is-open");
  }
}
function scheduleTaginOff() {
  if (leaveTimer) clearTimeout(leaveTimer);
  leaveTimer = setTimeout(() => setTagin(false), 90);
}

/* ---- nikud: hover -> pause orbit, mark fills, its panel opens ---- */
function selectNikud(holder) {
  if (holder._offTimer) { clearTimeout(holder._offTimer); holder._offTimer = null; }
  if (activeNikud === holder) return;
  if (activeNikud) activeNikud.classList.remove("is-lit");
  activeNikud = holder;
  orbitPaused = true;
  holder.classList.add("is-lit");
  const name = holder.dataset.name;
  const pnl = els.nikudPanel;
  pnl.panel.classList.add("is-open");
  pnl.label.textContent = "";
  const fullText = NIKUD_TEXTS[name] || PLACEHOLDER;
  /* reserve the reading's FINAL height before a single character types, so
     a bottom-anchored block (the ש screen) never climbs while writing —
     the text is born in its resting place and simply fills in */
  pnl.text.textContent = fullText;
  pnl.text.style.minHeight = `${pnl.text.offsetHeight}px`;
  pnl.text.textContent = "";
  later(() => typeInto(pnl.label, NIKUD_LABELS[name] || name, 16), 200);
  later(() => typeInto(pnl.text, fullText, 90), 560);
}
function scheduleNikudOff() {
  const holder = activeNikud;
  if (!holder) return;
  holder._offTimer = setTimeout(() => {
    if (activeNikud !== holder) return;
    holder.classList.remove("is-lit");
    activeNikud = null;
    orbitPaused = false;
    els.nikudPanel.panel.classList.remove("is-open");
  }, 140);
}

/* ---- the loop: the letter's own turn + the nikud orbit ----
   Tuned for lightness: every style is written only when it actually
   changes; the nikud ride composited transforms (never left/top layout —
   each mark is anchored once at the ellipse centre and offset in px via
   the cached design->screen scale); settled motion writes nothing. */
let lastSpin = null;
function loop(now) {
  rafId = requestAnimationFrame(loop);
  if (lastT === null) { lastT = now; return; }
  const dt = Math.min(50, now - lastT) / 1000;
  lastT = now;

  /* ש intro: ease the eased progress toward the scroll target, draw the
     matching frame, and dissolve into the real screen near the end */
  if (introActive) {
    introProg += (introTarget - introProg) * Math.min(1, dt * SHIN_INTRO.ease);
    if (Math.abs(introTarget - introProg) < 0.0006) introProg = introTarget;
    const idx = Math.round(introProg * (SHIN_INTRO.count - 1));
    if (idx !== introLastFrame) { drawIntroFrame(idx); introLastFrame = idx; }
    const cf = SHIN_INTRO.cf;
    const op = introProg <= cf ? 1 : Math.max(0, 1 - (introProg - cf) / (1 - cf));
    els.intro.style.opacity = op.toFixed(3);
    els.intro.classList.toggle("lp-intro--gone", introProg >= 0.999);
    if (els.introHint) els.introHint.style.opacity = introProg > 0.05 ? "0" : "";
  }

  /* the trace's live stroke glides toward the hand every frame */
  renderTraceLive(dt);

  if (!dragging) {
    yawVel *= 0.94;
    if (Math.abs(yawVel) < 0.00004) yawVel = 0; // settled: stop invalidating
    if (yawVel) yaw += yawVel;
  }
  /* ש: ease the journey toward its target — phase A (--dp) is the text
     dolly, phase B (--dc) the decomposition; both live on the root */
  if (SHIN_DEPTH && activePage && activePage.letter === "ש") {
    depthC += (depthT - depthC) * Math.min(1, dt * 3.2);
    if (Math.abs(depthT - depthC) < 0.0004) depthC = depthT;
    const dp = Math.min(1, depthC);
    const dc = Math.max(0, depthC - 1);
    root.style.setProperty("--dp", dp.toFixed(4));
    root.style.setProperty("--dc", dc.toFixed(4));
    if (dc !== lastDc) { applyDecomp(dc); lastDc = dc; }
    if (els.depthCue) els.depthCue.classList.toggle("is-away", depthT > 0.12);
  }

  const spin = `rotateY(${yaw.toFixed(4)}rad)`;
  if (spin !== lastSpin) {
    lastSpin = spin;
    els.holder.style.transform = spin;
    if (els.tagholder) els.tagholder.style.transform = spin;
  }

  /* ת: the reading ring — four panels riding a slow, wide orbit around
     the central letter; front panels nearer/brighter, back ones recede
     behind the letter (the room sits mid-stack via CSS) */
  if (TAV_RING_ENABLED && activePage && activePage.letter === "ת" && els.quadBlocks.length) {
    ringAngle += TAV_RING.speed * dt;
    els.quadBlocks.forEach((b, i) => {
      const a = (Math.PI / 2) * (1 - i) - ringAngle; // block 1 front-right, RTL order around the ring
      const depth = (Math.sin(a) + 1) / 2;           // 1 = nearest the viewer
      const x = TAV_RING.rx * Math.cos(a) * stageK;
      const y = TAV_RING.ry * Math.sin(a) * stageK;
      const s = 0.84 + 0.24 * depth;
      b.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      b.style.setProperty("--ro", (0.34 + 0.66 * depth).toFixed(3));
      const z = depth > 0.5 ? 30 : 2;
      if (b._z !== z) { b._z = z; b.style.zIndex = String(z); }
    });
  }

  const target = orbitPaused ? 0 : ORBIT_BASE;
  orbitSpeed += (target - orbitSpeed) * Math.min(1, dt * 6);
  if (Math.abs(orbitSpeed - target) < 0.0004) orbitSpeed = target;
  if (orbitSpeed === 0) return; // paused and settled — nothing moves
  orbitAngle += orbitSpeed * dt;
  for (const h of els.nikud) {
    const a = h.baseAngle + orbitAngle;
    const depth = (Math.sin(a) + 1) / 2;
    const x = activeOrbit.rx * Math.cos(a) * stageK;
    const y = activeOrbit.ry * Math.sin(a) * stageK;
    const s = 0.78 + 0.34 * depth;
    h.style.transform =
      `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    const z = 20 + Math.round(depth * 40);
    if (h._z !== z) { h._z = z; h.style.zIndex = String(z); }
  }
}

/* ---- the construction ----
   One voice for every letter, the ש master's own: the silhouette outline
   holds first (CSS keeps the stroke visible during lp-constructing) and
   the page settles around it — no per-letter motion variants. */
function runConstruction() {
  /* the trace voice is deliberate stillness — the timed classes in
     openLetterPage carry the whole ceremony */
}

/* ---- open: the construction ceremony, then the living page ---- */
export function openLetterPage(letter) {
  if (!hasLetterPage(letter)) return;
  const page = getPage(letter);
  activeLetter = letter;
  activePage = page;

  if (root && builtLetter !== letter) {
    root.remove();
    root = null;
    els = {};
  }
  if (!root) buildDom(page);

  clearTimers();
  openTimers.forEach(clearTimeout);
  openTimers = [];
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
  yaw = 0; yawVel = 0; pinned = false;
  depthT = 0; depthC = 0; lastDc = -1;
  root.style.setProperty("--dp", "0");
  root.style.setProperty("--dc", "0");
  root.classList.remove("lp-depth-live");
  applyDecomp(0);
  if (els.depthCue) els.depthCue.classList.remove("is-away");

  /* ש: arrive at the construction intro (pinned, frame 0) — every other
     letter opens straight into its regular screen */
  introActive = SHIN_INTRO_ENABLED && letter === "ש";
  introTarget = 0; introProg = 0; introLastFrame = -1;
  if (introActive && els.intro) {
    els.intro.classList.remove("lp-intro--gone");
    els.intro.style.opacity = "1";
    if (els.introHint) els.introHint.style.opacity = "";
    sizeIntroCanvas();
    drawIntroFrame(0);
  }
  orbitAngle = 0; orbitSpeed = 0; orbitPaused = false; activeNikud = null; taginHover = false;
  ringAngle = 0; // ת: the reading ring opens from its designed stance
  activeOrbit = SHIN.orbit; // every screen rides the master's wide ellipse
  /* anchor every mark ONCE at the ellipse centre — from here on the loop
     moves them purely by composited transform, never by left/top layout */
  els.nikud.forEach((h) => {
    h.style.left = px(activeOrbit.cx);
    h.style.top = py(activeOrbit.cy);
    h._z = undefined;
  });
  lastSpin = null;
  stage.classList.remove("lp-reveal");
  if (els.taginSet) els.taginSet.classList.remove("is-lit");
  els.nikud.forEach((u) => u.classList.remove("is-lit"));
  if (els.taginPanel) els.taginPanel.panel.classList.remove("is-open");
  els.nikudPanel.panel.classList.remove("is-open");
  els.title.textContent = "";
  els.body.textContent = "";
  if (els.quad) {
    if (quadSwapTimer) { clearTimeout(quadSwapTimer); quadSwapTimer = null; }
    els.quad.classList.remove("is-swapping");
    setQuadTexts(els.quadRest || []);
  }
  root.classList.remove("lp-built", "lp-marks-in", "lp-quad-in", "lp-ring-live");
  root.classList.add("lp-constructing");

  document.body.classList.add("lp-open");
  root.setAttribute("aria-hidden", "false");
  if (rafId === null) { lastT = null; rafId = requestAnimationFrame(loop); }

  /* the full opening ceremony, held as one piece so the ש trace stage can
     delay it until the letter has been built by hand */
  const ceremony = () => {
    /* the letter builds itself in its own voice... */
    runConstruction(page.motif);

    /* ...the body blooms, marks settle... */
    later(() => root.classList.add("lp-built"), 1650);
    later(() => root.classList.remove("lp-constructing"), 2400);
    els.nikud.forEach((u, i) => { u.style.transitionDelay = `${2350 + i * 60}ms`; });
    later(() => root.classList.add("lp-marks-in"), 60);
    later(() => els.nikud.forEach((u) => { u.style.transitionDelay = "0ms"; }), 3400);

    /* ...and only now, the words. The ש quad breathes in (staggered, in the
       new language) instead of the typewriter title+body of the shared page */
    if (els.quad) {
      later(() => root.classList.add("lp-quad-in"), 2750);
      /* ת: once the entry breath has finished, hand the blocks' opacity to
         the ring loop (the entry's staggered transitions would otherwise
         keep restarting against the per-frame --ro updates and freeze) */
      if (TAV_RING_ENABLED && letter === "ת") later(() => root.classList.add("lp-ring-live"), 4100);
    } else {
      later(() => typeInto(els.title, page.title, 8), 2750);
      later(() => typeInto(els.body, page.body, 80), 3350);
    }
  };

  /* first, the trace stage — the ceremony waits for the user's hand */
  traceActive = TRACE_ENABLED && !!els.trace;
  traceStarted = false; traceNext = 0; traceDoneD = "";
  traceLiveL = 0; traceLiveGoal = 0; traceCursor = null;
  if (traceActive) {
    els.trace.classList.remove("lp-trace-resolving");
    els.trace.classList.add("is-active");
    initTracePoints();
    els.traceDone.setAttribute("d", "");
    els.traceLive.setAttribute("d", "");
    els.traceThread.setAttribute("opacity", "0");
    setTraceCursorState();
    traceCeremony = ceremony;
    /* the quiet way out — [דלג] arrives only after a beat */
    els.traceSkip.classList.remove("is-visible");
    later(() => { if (traceActive) els.traceSkip.classList.add("is-visible"); }, 2000);
  } else {
    traceCeremony = null;
    ceremony();
  }
}

export function closeLetterPage() {
  if (!root) return;
  clearTimers();
  openTimers.forEach(clearTimeout);
  openTimers = [];
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
  document.body.classList.remove("lp-open");
  root.setAttribute("aria-hidden", "true");
  root.classList.remove("lp-marks-in", "lp-built", "lp-constructing", "lp-quad-in", "lp-ring-live");
  els.nikud.forEach((u) => { u.style.transitionDelay = "0ms"; });
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  introActive = false;
  traceActive = false; traceCeremony = null;
  if (els.trace) els.trace.classList.remove("is-active", "lp-trace-resolving");
  activeLetter = null;
}

export const isLetterPageOpen = () => document.body.classList.contains("lp-open");
