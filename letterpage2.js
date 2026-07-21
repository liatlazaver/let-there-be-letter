/* ראש מילין — letter screen, system 2 (the ממשק 222 redesign).
   One reusable template, built from the designer's ש screens
   (assets/screens222): a cream research page; a black square letter
   field with a hairline frame and the letter's gematria; the letter
   standing DECONSTRUCTED into its components, each selectable (number ->
   name, stroke -> fill); research rows unfolding under the reading; and
   folded side columns that carousel to the previous / next letter.
   ש carries the full designed deconstruction; every other letter opens
   in the same template with its plain stroke glyph until its own
   deconstruction art arrives. */

import { letterGlyphs, SVG_NS, LETTER_SRC } from "./sphere.js?v=15";
import { LETTER_ORDER } from "./carousel.js?v=45";
import { TITLES, LETTER_TEXTS, FOUNDATIONS, TAGIN_LETTERS, TAGIN_READINGS } from "./content.js?v=6";
import { openNikud } from "./nikud.js?v=7";
import { openAbout } from "./about.js?v=7";
import { letterAccordionTransition } from "./letter-accordion.js?v=8";
import { playEntryMorph } from "./letter-morph.js?v=4";

/* every letter opens its own system-2 screen from the opening screen */
export const LP2_LETTERS = new Set(LETTER_ORDER);

/* ---- the design frame ---- */
const DW = 2850; // design width; --u in CSS mirrors this
const FIELD = { x: 124, y: 124, w: 1476, h: 1479 };       // the black square
const FRAME = { x: 312.5, y: 306.5, w: 1068, h: 1120 };   // hairline frame
const GEM_POS = { x: 1404, y: 337 };                       // "[300]" anchor
const LBL_Y = 743;                                         // component labels' baseline

/* The generic central letter is normalized to the SAME visual envelope the
   designed ש fills inside the frame, so every letter reads with the ש's
   presence — never the raw SVG size. Measured from the ש deconstruction:
   its ink spans ~961u wide × ~734u tall, centered on the frame. Each letter's
   own ink is cropped tight and fit (preserving proportions, never distorted)
   into this box: wide letters bound by width, narrow/tall letters bound by
   height — so they all share the ש's height and stay clear of the border. */
const GEN_TARGET = {
  cx: FRAME.x + FRAME.w / 2,   // frame centre-x (846.5) — the ש sits here
  cy: FRAME.y + FRAME.h / 2,   // frame centre-y (866.5)
  w: 980,                      // ≈ ש ink width, capped inside the 1068u frame
  h: 744,                      // ≈ ש ink height — the shared visual height
};

/* ==========================================================================
   the component carve
   --------------------------------------------------------------------------
   The ש is deconstructed by hand (assets/screens222/shin-parts.json). Every
   other letter is deconstructed from its OWN geometry: each source glyph is
   drawn as a set of construction strokes (the fill polygons), and the
   designer's helper file marks exactly which strokes form each foundational
   letter. That mapping is baked into letter-components.json; here we read a
   letter's real strokes and gather them per that map. No geometry is invented —
   the letter is only split along lines it is already drawn with.
   ========================================================================== */
const letterPartsCache = new Map(); // letter -> [fill-stroke elements]
function loadLetterParts(letter) {
  if (letterPartsCache.has(letter)) {
    return Promise.resolve(letterPartsCache.get(letter));
  }
  const path = LETTER_SRC.get(letter);
  if (!path) return Promise.resolve(null);
  return fetch(encodeURI(path))
    .then((r) => r.text())
    .then((text) => {
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const shapes = Array.from(
        doc.querySelectorAll("polygon, path, circle, ellipse, rect, polyline, line")
      );
      // the fill rendering (unclassed) is the solid, fillable letter; the
      // cls-1 duplicates are the stroke-only outline — we carve the fills.
      const parts = shapes
        .filter((el) => el.getAttribute("class") !== "cls-1")
        .map((el) => document.importNode(el, true));
      letterPartsCache.set(letter, parts);
      return parts;
    })
    .catch(() => null);
}

/* a point PROVEN inside a stroke's fill — so a component's bracket always
   lands on its ink (readable paper-on-black while outlined, ink-on-paper once
   filled), never in a concave notch. Tries the centre, then a small grid. */
function interiorPoint(el, b) {
  const svg = el.ownerSVGElement;
  if (!svg || !el.isPointInFill) return { x: b.cx, y: b.cy };
  const pt = svg.createSVGPoint();
  const test = (x, y) => { pt.x = x; pt.y = y; try { return el.isPointInFill(pt); } catch (e) { return false; } };
  if (test(b.cx, b.cy)) return { x: b.cx, y: b.cy };
  for (let gy = 0.5; gy <= 0.85; gy = gy + 0.35) {
    for (let gx = 0.35; gx <= 0.65; gx = gx + 0.15) {
      const x = b.x + b.w * gx, y = b.y + b.h * gy;
      if (test(x, y)) return { x, y };
    }
  }
  for (let gy = 0.15; gy <= 0.9; gy = gy + 0.1) {
    for (let gx = 0.15; gx <= 0.9; gx = gx + 0.1) {
      const x = b.x + b.w * gx, y = b.y + b.h * gy;
      if (test(x, y)) return { x, y };
    }
  }
  return { x: b.cx, y: b.cy };
}

/* measure every stroke once, in the glyph's own 595×842 user space: bbox,
   area, and a guaranteed interior point for the bracket. */
function measureParts(parts) {
  const host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("viewBox", "0 0 595.28 841.89");
  host.style.cssText = "position:absolute;left:-9999px;top:0;width:300px;height:420px;opacity:0;pointer-events:none";
  const clones = parts.map((p) => p.cloneNode(true));
  clones.forEach((c) => host.appendChild(c));
  document.body.appendChild(host);
  const boxes = clones.map((c) => {
    let b;
    try { b = c.getBBox(); } catch (e) { b = { x: 0, y: 0, width: 0, height: 0 }; }
    const box = { x: b.x, y: b.y, w: b.width, h: b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2, area: b.width * b.height };
    box.ip = interiorPoint(c, box);
    return box;
  });
  host.remove();
  return boxes;
}

function unionBox(boxes, idxs) {
  const minx = Math.min(...idxs.map((i) => boxes[i].x));
  const miny = Math.min(...idxs.map((i) => boxes[i].y));
  const maxx = Math.max(...idxs.map((i) => boxes[i].x + boxes[i].w));
  const maxy = Math.max(...idxs.map((i) => boxes[i].y + boxes[i].h));
  return { x: minx, y: miny, w: maxx - minx, h: maxy - miny, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 };
}

/* the corrected per-letter deconstruction, taken from the designer's helper
   file and baked into assets/screens222/letter-components.json. For each
   letter it gives its components — the exact source strokes that form each
   foundational letter, the letter's identity, its bracket number, and where
   the bracket sits — plus the base strokes (the skeleton, drawn as a hairline
   outline and never clickable, exactly like the ש's base). This REPLACES the
   old geometric guess for every letter the helper covers. */
let letterCompsCache = null;
function loadLetterComps() {
  if (letterCompsCache) return Promise.resolve(letterCompsCache);
  return fetch("assets/screens222/letter-components.json?v=2")
    .then((r) => r.json())
    .then((d) => { letterCompsCache = d; return d; })
    .catch(() => ({}));
}
const letterCompsReady = loadLetterComps(); // warm the cache at load
/* the letters with a component breakdown (ש keeps its own art; ד ו י ר stay
   whole). ת isn't in the designer's helper sheet, but it is a plain ד + ד
   (like ם), so it is mapped from its own two strokes. */
const MAPPED = new Set([
  "א", "ב", "ג", "ה", "ז", "ח", "ט", "כ", "ך", "ל", "מ", "ם",
  "נ", "ן", "ס", "ע", "פ", "ף", "צ", "ץ", "ק", "ת",
]);

/* ==========================================================================
   the tagin (crowns)
   --------------------------------------------------------------------------
   The tagin letters (שעטנז־גץ + finals ן ץ) carry a triple-crown. The old
   assets (assets/tagin/) drew each crown as a stem + a round head; the new
   design — from the ש reference — keeps the stem but swaps the round head for
   a small SQUARE, all in a fine paper stroke. tagin.json holds, per letter,
   the letter's own ink box and its crown stems (in the source glyph's own
   coordinates), extracted from those assets. We place the crowns by fitting
   that ink box onto wherever the letter is actually drawn on the panel, so
   they sit on the letterform exactly as the designer set them. */
const NEW_TAG_HEAD = 1.73; // square side ÷ old head radius (11.22 / 6.49)
let taginCache = null;
function loadTagin() {
  if (taginCache) return Promise.resolve(taginCache);
  return fetch("assets/screens222/tagin.json?v=2")
    .then((r) => r.json())
    .then((d) => { taginCache = d; return d; })
    .catch(() => ({}));
}
const taginReady = loadTagin();

/* draw a letter's tagin into its field SVG. `P` is the letter's drawn box on
   the panel {x,y,w,h}; the crowns are mapped from the glyph's own ink box
   (spec.bodyBox) onto P, so they ride the letter at any scale/position. */
function addTagin(letter, svg, P, screenEl) {
  const spec = taginCache && taginCache[letter];
  if (!spec || !P || !P.w || !P.h) return;
  const Ab = spec.bodyBox;
  const sx = P.w / Ab.w, sy = P.h / Ab.h;
  const mapX = (x) => P.x + (x - Ab.x) * sx;
  const mapY = (y) => P.y + (y - Ab.y) * sy;
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "lp2-tag");
  let hx1 = Infinity, hy1 = Infinity, hx2 = -Infinity, hy2 = -Infinity;
  spec.crowns.forEach((cr) => {
    const cx = mapX(cr.x), top = mapY(cr.topY), bot = mapY(cr.botY);
    const side = NEW_TAG_HEAD * cr.r * sx; // square head, on the stem's top
    const stem = document.createElementNS(SVG_NS, "line");
    stem.setAttribute("x1", cx.toFixed(2)); stem.setAttribute("y1", top.toFixed(2));
    stem.setAttribute("x2", cx.toFixed(2)); stem.setAttribute("y2", bot.toFixed(2));
    const head = document.createElementNS(SVG_NS, "rect");
    head.setAttribute("x", (cx - side / 2).toFixed(2));
    head.setAttribute("y", (top - side).toFixed(2));
    head.setAttribute("width", side.toFixed(2));
    head.setAttribute("height", side.toFixed(2));
    g.append(stem, head);
    hx1 = Math.min(hx1, cx - side / 2); hx2 = Math.max(hx2, cx + side / 2);
    hy1 = Math.min(hy1, top - side);    hy2 = Math.max(hy2, bot);
  });
  /* the crowns are clickable as ONE set (the reference fills all three):
     an invisible padded hit box makes the fine strokes easy to reach */
  if (screenEl && taginReadingOf(letter)) {
    const PAD = 24; // a generous reach — the crowns are fine strokes
    const hit = document.createElementNS(SVG_NS, "rect");
    hit.setAttribute("class", "lp2-tag-hit");
    hit.setAttribute("x", (hx1 - PAD).toFixed(2));
    hit.setAttribute("y", (hy1 - PAD).toFixed(2));
    hit.setAttribute("width", (hx2 - hx1 + PAD * 2).toFixed(2));
    hit.setAttribute("height", (hy2 - hy1 + PAD * 2).toFixed(2));
    /* interactivity carried on the element itself (attribute + inline),
       so no stylesheet state can ever leave the crowns inert */
    hit.setAttribute("pointer-events", "all");
    hit.setAttribute("fill", "none");
    hit.setAttribute("stroke", "none");
    hit.style.cursor = "none";
    g.appendChild(hit);
    g.addEventListener("click", () => toggleTagin(screenEl, letter, g));
  }
  svg.appendChild(g);
}

/* the finals wear their base letter's crown reading: ן -> נ, ץ -> צ */
const taginReadingOf = (letter) =>
  TAGIN_READINGS[letter] || TAGIN_READINGS[{ "ן": "נ", "ץ": "צ" }[letter]] || "";

/* ---- the crowns' selection: stroke -> fill, and the tagin reading enters
   under the letter's own reading — the same column, the next line of the
   same grid, arriving from the reading side with a fast modern typewrite
   (every character a span on a staggered fade; flattened to clean text
   once written, so wrapping and selection stay native). ---- */
function toggleTagin(screenEl, letter, g) {
  const wrap = screenEl.querySelector(".lp2-tagin");
  const p = screenEl.querySelector(".lp2-tagin-text");
  if (!wrap || !p) return;
  const on = !g.classList.contains("is-on");
  g.classList.toggle("is-on", on);
  screenEl.classList.toggle("tagin-on", on);
  clearTimeout(wrap._flatten);
  if (!on) {
    wrap.classList.remove("is-in");
    wrap.style.height = "0px";
    return;
  }
  const text = noWidow(taginReadingOf(letter));
  p.textContent = "";
  const frag = document.createDocumentFragment();
  [...text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch;
    s.style.transitionDelay = `${(180 + i * 2.8).toFixed(1)}ms`;
    frag.appendChild(s);
  });
  p.appendChild(frag);
  /* height measured once, kept in u-terms — scale-stable at any viewport */
  const h = p.offsetHeight / (innerWidth / DW);
  wrap.style.height = `calc(var(--u) * ${h.toFixed(2)})`;
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-in")));
  wrap._flatten = setTimeout(() => {
    if (screenEl.classList.contains("tagin-on")) p.textContent = text;
  }, 180 + text.length * 2.8 + 320);
}

/* ---- letter meta ---- */
const GEMATRIA = {
  "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9,
  "י": 10, "כ": 20, "ל": 30, "מ": 40, "נ": 50, "ס": 60, "ע": 70, "פ": 80,
  "צ": 90, "ק": 100, "ר": 200, "ש": 300, "ת": 400,
  "ך": 500, "ם": 600, "ן": 700, "ף": 800, "ץ": 900,
};
/* the design writes component names without gershayim: יו״ד -> יוד */
const plainName = (letter) => (TITLES[letter] || letter).replace(/[״"]/g, "");

/* the lower-panel foundational glyphs: cropped to their own ink and scaled
   by ONE factor, so they keep their natural relative sizes (יו״ד small,
   וי״ו/זי״ן taller) yet all sit LEFT-aligned on the same edge, at the
   design's size (the yod's 104-unit ink -> 58 design-px). */
const ROW_GLYPH_SC = 58 / 104; // design-units per stroke-svg unit
function inkBBoxOf(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("style", "position:absolute;opacity:0;pointer-events:none;left:-9999px");
  document.body.appendChild(clone);
  const g = clone.querySelector("g") || clone;
  let bb;
  try { bb = g.getBBox(); } catch (e) { bb = { x: 0, y: 0, width: 1, height: 1 }; }
  clone.remove();
  return bb;
}
/* size a foundational glyph to the design: cropped viewBox, ink-left at the
   panel's 71u edge, uniform scale, top aligned with the row name */
function sizeRowGlyph(s) {
  const bb = inkBBoxOf(s);
  const pad = bb.height * 0.04;
  s.setAttribute("viewBox", `${bb.x - pad} ${bb.y - pad} ${bb.width + 2 * pad} ${bb.height + 2 * pad}`);
  s.setAttribute("preserveAspectRatio", "xMinYMin meet");
  s.style.width = `calc(var(--u) * ${((bb.width + 2 * pad) * ROW_GLYPH_SC).toFixed(2)})`;
  s.style.height = `calc(var(--u) * ${((bb.height + 2 * pad) * ROW_GLYPH_SC).toFixed(2)})`;
}

/* running-text rule for every letter screen: never a lone word on a line.
   Binding the final two words with a non-breaking space guarantees the
   last line always carries at least two words (mid-lines fill by wrapping,
   so they never orphan a single word in this column). */
const NBSP = " ";
function noWidow(text) {
  /* a reading may carry several paragraphs: each one ends a line of its
     own, so each one needs its own last two words bound */
  return String(text)
    .replace(/\s+$/, "")
    .split("\n")
    .map((para) => {
      const t = para.replace(/\s+$/, "");
      const i = t.lastIndexOf(" ");
      return i < 0 ? t : `${t.slice(0, i)}${NBSP}${t.slice(i + 1)}`;
    })
    .join("\n");
}

const ORDINALS = [
  "הראשונה", "השנייה", "השלישית", "הרביעית", "החמישית", "השישית",
  "השביעית", "השמינית", "התשיעית", "העשירית", "האחת־עשרה", "השתים־עשרה",
  "השלוש־עשרה", "הארבע־עשרה", "החמש־עשרה", "השש־עשרה", "השבע־עשרה",
  "השמונה־עשרה", "התשע־עשרה", "העשרים", "העשרים ואחת", "העשרים ושתיים",
];

/* the subtitle: the letter's foundational letters, per FOUNDATIONS —
   "אותיות יסוד: יו״ד, וי״ו וזי״ן" for ש. Atomic letters (no breakdown)
   fall back to their place in the alphabet. */
function foundationSubtitle(letter) {
  const f = FOUNDATIONS[letter];
  if (f && f.length) {
    const names = [...new Set(f)].map((x) => TITLES[x] || x);
    const list = names.length > 1
      ? `${names.slice(0, -1).join(", ")} ו${names[names.length - 1]}`
      : names[0];
    return `אותיות יסוד: ${list}`;
  }
  const i = LETTER_ORDER.indexOf(letter);
  return i >= 0 && i < 22 ? `האות ${ORDINALS[i]} באלף־בית` : "צורה סופית";
}

/* ---- the ש deconstruction (from the design SVG, exact coordinates) ---- */
let shinParts = null; // fetched once: { yod, vav, zayinA, zayinB, base }
function loadShinParts() {
  if (shinParts) return Promise.resolve(shinParts);
  return fetch("assets/screens222/shin-parts.json")
    .then((r) => r.json())
    .then((data) => { shinParts = data; return data; });
}
/* component order is the letter's own reading order, right to left */
const SHIN_COMPS = [
  { ch: "י", lblX: 1198, parts: ["yod"] },
  { ch: "ו", lblX: 902, parts: ["vav"] },
  { ch: "ז", lblX: 544, parts: ["zayinA", "zayinB"] },
];

/* ---- the 4-part reading (the project's own texts) ---- */
let textsCache = null;
function loadTexts() {
  if (!textsCache) {
    textsCache = fetch("letter-texts-reish-milin.json")
      .then((r) => r.json())
      .catch(() => null);
  }
  return textsCache;
}

/* ---- state ---- */
let root = null;
let currentLetter = null;
let sliding = false;

const prevOf = (letter) => {
  const i = LETTER_ORDER.indexOf(letter);
  return LETTER_ORDER[(i - 1 + LETTER_ORDER.length) % LETTER_ORDER.length];
};
const nextOf = (letter) => {
  const i = LETTER_ORDER.indexOf(letter);
  return LETTER_ORDER[(i + 1) % LETTER_ORDER.length];
};

/* ==========================================================================
   building one screen
   ========================================================================== */
function buildScreen(letter) {
  const el = document.createElement("section");
  el.className = "lp2";
  el.dataset.letter = letter;

  /* ---- top bar ---- */
  const top = document.createElement("header");
  top.className = "lp2-top";
  /* the global bar: [אודות][ניקוד][אותיות] — the letter screens belong to
     the אותיות section, so its pill wears the active fill and doubles as
     the way home */
  const pillAbout = document.createElement("button");
  pillAbout.type = "button";
  pillAbout.className = "lp2-pill";
  pillAbout.textContent = "אודות";
  pillAbout.addEventListener("click", () => {
    openAbout();
    setTimeout(closeLetterPage2, 520);
  });
  const pillNikud = document.createElement("button");
  pillNikud.type = "button";
  pillNikud.className = "lp2-pill";
  pillNikud.textContent = "ניקוד";
  pillNikud.addEventListener("click", () => {
    /* the overlay wipes in above; the letter page retires quietly
       beneath it once covered, so closing it lands on the playground */
    openNikud();
    setTimeout(closeLetterPage2, 520);
  });
  const pillLetters = document.createElement("button");
  pillLetters.type = "button";
  pillLetters.className = "lp2-pill lp2-pill--active";
  pillLetters.textContent = "אותיות";
  pillLetters.addEventListener("click", closeLetterPage2);
  /* the reference's nav hover: the cursor swells over a pill (the
     interface's own cursor-hot grow, reached further) */
  [pillAbout, pillNikud, pillLetters].forEach((pill) => {
    pill.addEventListener("pointerenter", () => document.body.classList.add("lp2-pill-hot"));
    pill.addEventListener("pointerleave", () => document.body.classList.remove("lp2-pill-hot"));
  });
  top.append(pillAbout, pillNikud, pillLetters);
  el.appendChild(top);

  /* ---- main row ---- */
  const main = document.createElement("div");
  main.className = "lp2-main";
  el.appendChild(main);

  /* side columns: the LEFT edge folds toward the NEXT letter (deeper into
     the alphabet, the RTL direction of travel), the RIGHT edge toward the
     PREVIOUS one */
  const nx = nextOf(letter);
  const pv = prevOf(letter);
  const sideL = buildSide("l", nx);
  const sideR = buildSide("r", pv);

  /* ---- the black letter field ---- */
  const field = document.createElement("div");
  field.className = "lp2-field";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "lp2-art");
  svg.setAttribute("viewBox", `${FIELD.x} ${FIELD.y} ${FIELD.w} ${FIELD.h}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const frame = document.createElementNS(SVG_NS, "rect");
  frame.setAttribute("class", "lp2-frame");
  frame.setAttribute("x", FRAME.x); frame.setAttribute("y", FRAME.y);
  frame.setAttribute("width", FRAME.w); frame.setAttribute("height", FRAME.h);
  svg.appendChild(frame);
  const gem = document.createElementNS(SVG_NS, "text");
  gem.setAttribute("class", "lp2-gem");
  gem.setAttribute("x", GEM_POS.x); gem.setAttribute("y", GEM_POS.y);
  gem.textContent = `[${GEMATRIA[letter] || ""}]`;
  svg.appendChild(gem);
  field.appendChild(svg);
  main.append(sideL, field, buildInfo(letter, el), sideR);

  /* ---- the letter itself ---- */
  if (letter === "ש") {
    loadShinParts().then((parts) => {
      if (!parts || el.dataset.letter !== "ש") return;
      SHIN_COMPS.forEach((spec) => {
        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("class", "lp2-comp");
        g.dataset.comp = spec.ch;
        spec.parts.forEach((key) => {
          const p = document.createElementNS(SVG_NS, "path");
          p.setAttribute("d", parts[key]);
          g.appendChild(p);
        });
        svg.appendChild(g);
        const lbl = document.createElementNS(SVG_NS, "text");
        lbl.setAttribute("class", "lp2-lbl");
        lbl.setAttribute("x", spec.lblX);
        lbl.setAttribute("y", LBL_Y);
        lbl.textContent = `[${GEMATRIA[spec.ch]}]`;
        svg.appendChild(lbl);
        g.addEventListener("click", () => toggleComp(el, spec.ch, g, lbl));
      });
      const base = document.createElementNS(SVG_NS, "path");
      base.setAttribute("class", "lp2-base");
      base.setAttribute("d", parts.base);
      svg.appendChild(base);

      // the ש's tagin — mapped onto the drawn shin (its rendered ink box)
      let P = null;
      svg.querySelectorAll(".lp2-comp, .lp2-base").forEach((e) => {
        let b; try { b = e.getBBox(); } catch (err) { return; }
        if (!b.width && !b.height) return;
        if (!P) P = { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height };
        else { P.x = Math.min(P.x, b.x); P.y = Math.min(P.y, b.y); P.x2 = Math.max(P.x2, b.x + b.width); P.y2 = Math.max(P.y2, b.y + b.height); }
      });
      if (P) {
        const box = { x: P.x, y: P.y, w: P.x2 - P.x, h: P.y2 - P.y };
        taginReady.then(() => addTagin("ש", svg, box, el));
      }
    });
  } else if (MAPPED.has(letter)) {
    /* every letter the helper maps: its components are the exact strokes the
       helper marked, with the helper's own identities — the ש behaviour, the
       corrected data (see letter-components.json) */
    buildMappedLetter(letter, svg, el);
  } else {
    /* whole-letter letters (ד ו י ר — true foundational; ת — not in the
       helper, so left undecomposed rather than invented): the whole glyph,
       normalized to the ש's envelope and centered (see GEN_TARGET). */
    const glyph = letterGlyphs.get(letter);
    if (glyph && glyph.strokeSvg) {
      const src = glyph.strokeSvg.cloneNode(true);
      const g = src.querySelector("g");
      const bb = inkBBoxOf(src); // ink bbox in the glyph's own user space
      if (g && bb.width && bb.height) {
        const scale = Math.min(GEN_TARGET.w / bb.width, GEN_TARGET.h / bb.height);
        const inkCx = bb.x + bb.width / 2;
        const inkCy = bb.y + bb.height / 2;
        const tx = GEN_TARGET.cx - inkCx * scale;
        const ty = GEN_TARGET.cy - inkCy * scale;
        g.setAttribute("class", "lp2-gen");
        g.setAttribute("transform", `translate(${tx} ${ty}) scale(${scale})`);
        // hairline in field units (scale converts back from the local space)
        Array.from(g.querySelectorAll("*")).forEach((el) => {
          el.removeAttribute("class");
          el.removeAttribute("vector-effect");
          el.setAttribute("stroke-width", (1 / scale).toFixed(4));
        });
        svg.appendChild(g);
      }
    }
  }

  return el;
}

/* the side arrows: the design's own diagonal corner arrows (traced from the
   reference), pointing up-and-outward toward the neighbouring letter */
const SIDE_ARROW_D = {
  l: "M38 38L0 0M34.2 0H0V34.2",  // ↖ (ref: M76 213L38 175M72.2 175H38V209.2)
  r: "M0 38L38 0M3.8 0H38V34.2",  // ↗ (ref: M2773 213L2811 175M2776.8 175H2811V209.2)
};

function buildSide(which, target) {
  const side = document.createElement("aside");
  side.className = `lp2-side lp2-side--${which}`;
  side.dataset.letter = target;
  const a = document.createElementNS(SVG_NS, "svg");
  a.setAttribute("class", "lp2-side-arrow");
  a.setAttribute("viewBox", "0 0 38 38");
  a.setAttribute("aria-hidden", "true");
  const ap = document.createElementNS(SVG_NS, "path");
  ap.setAttribute("d", SIDE_ARROW_D[which]);
  a.appendChild(ap);
  const n = document.createElement("span");
  n.className = "lp2-side-name";
  n.textContent = `[${plainName(target)}]`;
  side.append(a, n);
  side.addEventListener("click", () => {
    /* the left column travels to the next letter (slides in from the
       left), the right column to the previous (from the right) */
    goToLetter(target, which === "l" ? "left" : "right");
  });
  return side;
}

/* a research-row name per the design: "[10] יו״ד" — the gematria reads
   first (rightmost), a small raised superscript in the italic serif, then
   the plain name in the sans (no brackets around the name anymore) */
function buildRowName(nameText, gem) {
  const name = document.createElement("span");
  name.className = "lp2-row-name";
  const g = document.createElement("span");
  g.className = "lp2-row-gem";
  g.textContent = `[${gem ?? ""}]`;
  const t = document.createElement("span");
  t.className = "lp2-row-name-txt";
  t.textContent = nameText;
  name.append(g, t);
  return name;
}

function buildInfo(letter, screenEl) {
  const info = document.createElement("div");
  info.className = "lp2-info";

  /* the title line pairs the letter's name with its gematria — "[300] שי״ן"
     per the design: the number reads FIRST (rightmost), a small raised
     superscript in the italic serif, then the name */
  const title = document.createElement("h1");
  title.className = "lp2-title";
  const tGem = document.createElement("span");
  tGem.className = "lp2-title-gem";
  tGem.textContent = `[${GEMATRIA[letter] || ""}]`;
  title.append(tGem, document.createTextNode(TITLES[letter] || letter));

  const sub = document.createElement("p");
  sub.className = "lp2-sub";
  sub.textContent = foundationSubtitle(letter);
  /* mapped letters name their CORRECTED foundational letters (from the helper),
     not the old table — updated once the map loads */
  if (MAPPED.has(letter)) {
    letterCompsReady.then((comps) => {
      const spec = comps && comps[letter];
      if (!spec || screenEl.dataset.letter !== letter) return;
      const names = [...new Set(spec.components.map((c) => TITLES[c.letter] || c.letter))];
      const list = names.length > 1
        ? `${names.slice(0, -1).join(", ")} ו${names[names.length - 1]}`
        : names[0];
      sub.textContent = `אותיות יסוד: ${list}`;
    });
  }

  const spacer = document.createElement("div");
  spacer.className = "lp2-spacer";

  /* the reading is the letter's own body text (the design's paragraph),
     with its last two words bound so no line ever ends on a lone word */
  const body = document.createElement("p");
  body.className = "lp2-body";
  body.textContent = noWidow(LETTER_TEXTS[letter] || "");

  const rows = document.createElement("div");
  rows.className = "lp2-rows";
  if (letter === "ש") {
    SHIN_COMPS.forEach((spec) => {
      const row = document.createElement("div");
      row.className = "lp2-row";
      row.dataset.comp = spec.ch;
      const inner = document.createElement("div");
      inner.className = "lp2-row-inner";
      const name = buildRowName(plainName(spec.ch), GEMATRIA[spec.ch]);
      const glyphBox = document.createElement("span");
      glyphBox.className = "lp2-row-glyph";
      const glyph = letterGlyphs.get(spec.ch);
      if (glyph && glyph.strokeSvg) {
        const s = glyph.strokeSvg.cloneNode(true);
        s.removeAttribute("class"); s.removeAttribute("style");
        sizeRowGlyph(s);
        glyphBox.appendChild(s);
      }
      inner.append(name, glyphBox);
      row.appendChild(inner);
      /* the opened row is the doorway to that component's own screen */
      row.addEventListener("click", () => goToLetter(spec.ch, "right"));
      rows.appendChild(row);
    });
  } else if (MAPPED.has(letter)) {
    /* every mapped letter: one row per component, in the helper's order.
       Keyed by INDEX (a component may repeat, e.g. ם = ד + ד), so a clicked
       component opens exactly its own row. Populated once the map loads. */
    letterCompsReady.then((comps) => {
      const spec = comps && comps[letter];
      if (!spec || screenEl.dataset.letter !== letter) return;
      spec.components.forEach((cm, i) => {
        const row = document.createElement("div");
        row.className = "lp2-row";
        row.dataset.idx = String(i);
        row.dataset.comp = cm.letter;
        const inner = document.createElement("div");
        inner.className = "lp2-row-inner";
        const name = buildRowName(plainName(cm.letter), cm.gem ?? GEMATRIA[cm.letter]);
        const glyphBox = document.createElement("span");
        glyphBox.className = "lp2-row-glyph";
        const glyph = letterGlyphs.get(cm.letter);
        if (glyph && glyph.strokeSvg) {
          const s = glyph.strokeSvg.cloneNode(true);
          s.removeAttribute("class"); s.removeAttribute("style");
          sizeRowGlyph(s);
          glyphBox.appendChild(s);
        }
        inner.append(name, glyphBox);
        row.appendChild(inner);
        row.addEventListener("click", () => goToLetter(cm.letter, "right"));
        rows.appendChild(row);
      });
    });
  }

  /* the tagin reading: enters UNDER the regular reading when the crowns are
     selected — the same column, the very next line of the same grid (the ש
     reference), so the two read as one continued breath. Collapsed to
     nothing while the crowns rest. */
  const taginWrap = document.createElement("div");
  taginWrap.className = "lp2-tagin";
  const taginP = document.createElement("p");
  taginP.className = "lp2-tagin-text";
  taginWrap.appendChild(taginP);

  info.append(title, sub, spacer, body, taginWrap, rows);
  return info;
}

/* ---- component selection: stroke -> fill, number -> name, row unfolds.
   Multiple components can stand selected together (the design's third
   screen); rows keep the letter's own component order. ---- */
function toggleComp(screenEl, ch, g, lbl) {
  const on = !g.classList.contains("is-on");
  g.classList.toggle("is-on", on);
  lbl.classList.toggle("is-on", on);
  lbl.textContent = on ? `[${plainName(ch)}]` : `[${GEMATRIA[ch]}]`;
  const row = screenEl.querySelector(`.lp2-row[data-comp="${ch}"]`);
  if (row) row.classList.toggle("is-open", on);
  /* the reading's bottom margin tightens (66 -> 48) once rows are open,
     per the design's open states */
  screenEl.classList.toggle("has-open-rows", !!screenEl.querySelector(".lp2-row.is-open"));
}

/* is a point inside any of these strokes' fill? (used to keep a bracket on
   its component's ink so it stays readable once the component fills white) */
/* the on-ink point nearest a target. If the target already sits on the
   component's ink it is returned unchanged; otherwise we spiral outward and
   return the closest point that IS on the ink — so a bracket whose ideal spot
   falls in a component's concave gap (e.g. a ד's open elbow) snaps to the
   nearest stroke and stays visually centred, never off in a far corner. */
function nearestInkPoint(parts, idxs, tx, ty, rmax) {
  const host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("viewBox", "0 0 595.28 841.89");
  host.style.cssText = "position:absolute;left:-9999px;top:0;width:300px;height:420px;opacity:0;pointer-events:none";
  const clones = idxs.map((pi) => parts[pi].cloneNode(true));
  clones.forEach((c) => host.appendChild(c));
  document.body.appendChild(host);
  const pt = host.createSVGPoint();
  const inFill = (x, y) => {
    pt.x = x; pt.y = y;
    for (const c of clones) { try { if (c.isPointInFill && c.isPointInFill(pt)) return true; } catch (e) {} }
    return false;
  };
  let found = inFill(tx, ty) ? { x: tx, y: ty } : null;
  const step = Math.max(3, rmax / 24);
  for (let r = step; !found && r <= rmax; r += step) {
    for (let a = 0; a < 360; a += 10) {
      const x = tx + r * Math.cos(a * Math.PI / 180), y = ty + r * Math.sin(a * Math.PI / 180);
      if (inFill(x, y)) { found = { x, y }; break; }
    }
  }
  host.remove();
  return found;
}

/* ---- build a helper-mapped letter: its components are the exact strokes the
   designer marked, each carrying its corrected identity, bracket number, and
   bracket placement (letter-components.json). The whole letter is fit into the
   ש's envelope; base strokes ride along as a non-clickable outline. ---- */
function buildMappedLetter(letter, svg, screenEl) {
  Promise.all([loadLetterParts(letter), letterCompsReady]).then(([parts, comps]) => {
    // guard: the screen may have carouselled away while we were fetching
    if (!parts || !parts.length || screenEl.dataset.letter !== letter) return;
    const spec = comps && comps[letter];
    if (!spec) return;
    const boxes = measureParts(parts);
    if (!boxes.some((b) => b.w && b.h)) return;

    // fit the WHOLE letter (every stroke) into the ש envelope, proportions
    // preserved; every component and the base ride the SAME transform.
    const whole = unionBox(boxes, boxes.map((_, i) => i));
    let scale = Math.min(GEN_TARGET.w / whole.w, GEN_TARGET.h / whole.h);
    // a letter like ק (or ץ) is a normal body with a long, thin descender
    // hanging well below it. Fitting the WHOLE height to the envelope shrinks
    // that body far below the other letters. So when a thin tail hangs below
    // the wide body, we size the BODY to the envelope instead, capping the
    // whole letter to a frame-safe height so the tail still hangs inside.
    const wideIdxs = boxes.map((_, i) => i).filter((i) => boxes[i].w > 0.5 * whole.w);
    if (wideIdxs.length) {
      const body = unionBox(boxes, wideIdxs);
      const tailBelow = (whole.y + whole.h) - (body.y + body.h);
      // Enlarge ONLY when the descender is long enough that the body would
      // otherwise read markedly smaller than the other letters (like ק). A
      // letter such as ץ, whose body is only mildly compressed, keeps the
      // normal fit so it sits at the same scale as the rest of the alphabet.
      const BODY_FLOOR = 340; // ~46% of the 744 envelope height
      if (tailBelow > 0.30 * whole.h && body.h * scale < BODY_FLOOR) {
        const FRAME_SAFE_H = 1000; // the frame is ~1120 tall — keep a margin
        scale = Math.min(GEN_TARGET.w / whole.w, GEN_TARGET.h / body.h, FRAME_SAFE_H / whole.h);
      }
    }
    const tx = GEN_TARGET.cx - whole.cx * scale;
    const ty = GEN_TARGET.cy - whole.cy * scale;
    const xf = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(5)})`;
    const clean = (p) => {
      p.removeAttribute("class"); p.removeAttribute("style"); p.removeAttribute("fill");
      p.setAttribute("vector-effect", "non-scaling-stroke");
    };

    // the base skeleton — outline only, never clickable (like the ש's base)
    if (spec.base && spec.base.length) {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "lp2-base");
      g.setAttribute("transform", xf);
      spec.base.forEach((pi) => { if (parts[pi]) { const p = parts[pi].cloneNode(true); clean(p); g.appendChild(p); } });
      svg.appendChild(g);
    }

    spec.components.forEach((cm, i) => {
      const idxs = cm.polys.filter((pi) => parts[pi]);
      if (!idxs.length) return;
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "lp2-comp");
      g.dataset.idx = String(i);
      g.dataset.comp = cm.letter;
      g.setAttribute("transform", xf);
      idxs.forEach((pi) => { const p = parts[pi].cloneNode(true); clean(p); g.appendChild(p); });
      svg.appendChild(g);

      /* the bracket: the helper's own placement, kept EXACTLY when it already
         sits on the component's ink. When it falls in open space (a ד's
         concave gap), the bracket sits CENTRED inside the component's main
         stroke (its proven interior point) — never snapped sideways to the
         nearest stroke edge, which parked it awkwardly on a hairline (the
         shifted [4]s of the ת). Centred on ink it reads correctly both
         outlined (paper on black) and selected (ink on the white fill). */
      let ax = whole.x + cm.label.x * whole.w;
      let ay = whole.y + cm.label.y * whole.h;
      const onInk = nearestInkPoint(parts, idxs, ax, ay, 0);
      if (onInk) { ax = onInk.x; ay = onInk.y; }
      else {
        const anchor = idxs.reduce((a, k) => (boxes[k].area > boxes[a].area ? k : a), idxs[0]);
        ax = boxes[anchor].ip.x; ay = boxes[anchor].ip.y;
      }
      const lbl = document.createElementNS(SVG_NS, "text");
      lbl.setAttribute("class", "lp2-lbl");
      lbl.setAttribute("x", (ax * scale + tx).toFixed(1));
      lbl.setAttribute("y", (ay * scale + ty).toFixed(1));
      lbl.dataset.gem = String(cm.gem);
      lbl.textContent = `[${cm.gem}]`;
      svg.appendChild(lbl);

      g.addEventListener("click", () => toggleCompGen(screenEl, i, g, lbl, cm.letter));
    });

    // the crowns, if this letter carries tagin — mapped onto the drawn letter
    if (TAGIN_LETTERS.has(letter)) {
      const P = { x: whole.x * scale + tx, y: whole.y * scale + ty, w: whole.w * scale, h: whole.h * scale };
      taginReady.then(() => addTagin(letter, svg, P, screenEl));
    }
  });
}

/* mapped-component selection — index-keyed twin of toggleComp, so repeated
   components (א = yod + yod) each open their own row. The bracket flips
   between the helper's number and the component letter's name. */
function toggleCompGen(screenEl, idx, g, lbl, ch) {
  const on = !g.classList.contains("is-on");
  g.classList.toggle("is-on", on);
  lbl.classList.toggle("is-on", on);
  lbl.textContent = on ? `[${plainName(ch)}]` : `[${lbl.dataset.gem || GEMATRIA[ch] || ""}]`;
  const row = screenEl.querySelector(`.lp2-row[data-idx="${idx}"]`);
  if (row) row.classList.toggle("is-open", on);
  screenEl.classList.toggle("has-open-rows", !!screenEl.querySelector(".lp2-row.is-open"));
}

/* ==========================================================================
   open / close / carousel
   ========================================================================== */
export function openLetterPage2(letter) {
  if (root) return;
  currentLetter = letter;
  root = buildScreen(letter);
  document.body.appendChild(root);
  /* entering from the opening screen: the letter's construction morph plays
     once in the black field, landing exactly on the static letter (the
     accordion moves between letters keep their current behaviour) */
  playEntryMorph(root);
  document.body.classList.add("lp2-open");
  // the wipe needs one frame at its start state before it can run
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-open")));
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointermove", trackCursorContrast);
}

/* the cursor's contrast follows the panel under it: paper over the black
   field, ink everywhere on the cream page */
function trackCursorContrast(e) {
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const onInk = !!(under && under.closest && under.closest(".lp2-field"));
  document.body.classList.toggle("lp2-on-ink", onInk);
}

export function closeLetterPage2() {
  if (!root || sliding) return;
  const el = root;
  root = null;
  currentLetter = null;
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("pointermove", trackCursorContrast);
  document.body.classList.remove("lp2-on-ink", "lp2-pill-hot");
  el.classList.add("is-leaving");
  document.body.classList.remove("lp2-open");
  setTimeout(() => el.remove(), 520);
}

export const isLetterPage2Open = () => !!root;

function onKey(e) {
  if (e.key === "Escape") closeLetterPage2();
}

/* the carousel: the accordion move (letter-accordion.js) — the standing
   screen folds shut to a spine, the spine steps toward the side the
   navigation came from, and the next letter's screen opens from it */
function goToLetter(letter, fromSide) {
  if (sliding || !root || letter === currentLetter) return;
  sliding = true;
  const oldEl = root;
  const newEl = buildScreen(letter);
  document.body.appendChild(newEl); // above the standing screen
  root = newEl;
  currentLetter = letter;
  /* the arriving letter builds itself: the morph arms now (so the incoming
     panel unfolds clean, letter hidden) and starts playing only once the
     accordion has settled — accordion → construction → interactive screen */
  let accordionSettled;
  const settled = new Promise((r) => { accordionSettled = r; });
  playEntryMorph(newEl, { after: settled });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    letterAccordionTransition(oldEl, newEl, fromSide, () => {
      sliding = false;
      accordionSettled();
    });
  }));
}
