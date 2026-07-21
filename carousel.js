/* Letter carousel: X-axis moves between letters (alphabet order, finals
   after ת, circular), Y-axis moves between visual variations of the
   current letter (fill -> stroke -> tagin variants, circular).

   Base fill/stroke variations are reused directly from the sphere's own
   already-loaded assets (sphere.js `letterGlyphs`) — never re-fetched, so
   there is no risk of a mismatched letter shape. Tagin variations are
   parsed on demand from the per-letter "y" reference files, which cleanly
   separate each tagin rendering into its own <g clip-path> group. */

import { SVG_NS, buildStateSvg, letterGlyphs } from "./sphere.js?v=6";

export const LETTER_ORDER = [
  "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ",
  "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת", "ך", "ם", "ן", "ף", "ץ",
];

// Back-side content for each letter's flip card. `text` is a placeholder —
// the real per-letter explanations (from Reish Milin) drop in here later.
const PLACEHOLDER_TEXT = "ההסבר על האות מתוך ״ראש מילין״ יתווסף כאן.";

export const LETTER_INFO = {
  "א": { name: "אָלֶף", text: PLACEHOLDER_TEXT },
  "ב": { name: "בֵּית", text: PLACEHOLDER_TEXT },
  "ג": { name: "גִּימֶל", text: PLACEHOLDER_TEXT },
  "ד": { name: "דָּלֶת", text: PLACEHOLDER_TEXT },
  "ה": { name: "הֵא", text: PLACEHOLDER_TEXT },
  "ו": { name: "וָו", text: PLACEHOLDER_TEXT },
  "ז": { name: "זַיִן", text: PLACEHOLDER_TEXT },
  "ח": { name: "חֵית", text: PLACEHOLDER_TEXT },
  "ט": { name: "טֵית", text: PLACEHOLDER_TEXT },
  "י": { name: "יוֹד", text: PLACEHOLDER_TEXT },
  "כ": { name: "כָּף", text: PLACEHOLDER_TEXT },
  "ל": { name: "לָמֶד", text: PLACEHOLDER_TEXT },
  "מ": { name: "מֵם", text: PLACEHOLDER_TEXT },
  "נ": { name: "נוּן", text: PLACEHOLDER_TEXT },
  "ס": { name: "סָמֶךְ", text: PLACEHOLDER_TEXT },
  "ע": { name: "עַיִן", text: PLACEHOLDER_TEXT },
  "פ": { name: "פֵּא", text: PLACEHOLDER_TEXT },
  "צ": { name: "צָדִי", text: PLACEHOLDER_TEXT },
  "ק": { name: "קוֹף", text: PLACEHOLDER_TEXT },
  "ר": { name: "רֵישׁ", text: PLACEHOLDER_TEXT },
  "ש": { name: "שִׁין", text: PLACEHOLDER_TEXT },
  "ת": { name: "תָּו", text: PLACEHOLDER_TEXT },
  "ך": { name: "כָּף סוֹפִית", text: PLACEHOLDER_TEXT },
  "ם": { name: "מֵם סוֹפִית", text: PLACEHOLDER_TEXT },
  "ן": { name: "נוּן סוֹפִית", text: PLACEHOLDER_TEXT },
  "ף": { name: "פֵּא סוֹפִית", text: PLACEHOLDER_TEXT },
  "ץ": { name: "צָדִי סוֹפִית", text: PLACEHOLDER_TEXT },
};

const TAGIN_LETTERS = new Set(["ג", "ז", "ט", "נ", "ן", "ע", "צ", "ש", "ץ"]);

const taginCache = new Map();

function classifyGroup(g) {
  const paths = Array.from(g.querySelectorAll("path"));
  const hasFill = paths.some((p) => {
    const fill = p.getAttribute("fill");
    return fill && fill !== "none";
  });
  return hasFill ? "fill" : "stroke";
}

// Tagin groups don't share one canvas across letters the way the base
// sphere assets do, so there's no single shared frame to reuse here. A
// tight per-glyph bbox would still look visually "zoomed in" compared to
// the base fill/stroke states (which carry generous shared-frame padding),
// so pad it out to roughly the same headroom instead of using it raw.
function measureBBox(paths) {
  const host = document.createElementNS(SVG_NS, "svg");
  host.style.position = "absolute";
  host.style.left = "-99999px";
  document.body.appendChild(host);
  const g = document.createElementNS(SVG_NS, "g");
  paths.forEach((p) => g.appendChild(p.cloneNode(true)));
  host.appendChild(g);
  const bbox = g.getBBox();
  document.body.removeChild(host);
  return bbox;
}

function paddedBox(bbox, ratio) {
  const padX = bbox.width * ratio;
  const padY = bbox.height * ratio;
  return {
    x: bbox.x - padX,
    y: bbox.y - padY,
    width: bbox.width + padX * 2,
    height: bbox.height + padY * 2,
  };
}

async function fetchTaginVariations(letter) {
  const res = await fetch(encodeURI(`assets/carousel/y-${letter}.svg`));
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const groups = Array.from(doc.querySelectorAll("g[clip-path]"));

  const found = { stroke: null, fill: null };
  groups.forEach((g) => {
    const type = classifyGroup(g);
    if (!found[type]) found[type] = Array.from(g.querySelectorAll("path"));
  });

  const out = [];
  if (found.stroke) {
    const box = paddedBox(measureBBox(found.stroke), 0.65);
    out.push({ key: "stroke-tagin", isStroke: true, svg: buildStateSvg(found.stroke, true, box) });
  }
  if (found.fill) {
    const box = paddedBox(measureBBox(found.fill), 0.65);
    out.push({ key: "fill-tagin", isStroke: false, svg: buildStateSvg(found.fill, false, box) });
  }
  return out;
}

function getTaginVariations(letter) {
  if (!TAGIN_LETTERS.has(letter)) return Promise.resolve([]);
  if (!taginCache.has(letter)) {
    taginCache.set(letter, fetchTaginVariations(letter).catch(() => []));
  }
  return taginCache.get(letter);
}

export function prefetchTagin(letter) {
  getTaginVariations(letter);
}

function cloneGlyph(svgEl) {
  if (!svgEl) return null;
  const clone = svgEl.cloneNode(true);
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  return clone;
}

// Returns the full ordered variation list for a letter: [fill, stroke, ...tagin].
// Always resolves fill/stroke synchronously (already in memory); tagin
// variations resolve async and are appended once loaded.
export async function getVariations(letter) {
  const glyph = letterGlyphs.get(letter);
  const variations = [];
  if (glyph && glyph.fillSvg) {
    variations.push({ key: "fill", isStroke: false, svg: cloneGlyph(glyph.fillSvg) });
  }
  if (glyph && glyph.strokeSvg) {
    variations.push({ key: "stroke", isStroke: true, svg: cloneGlyph(glyph.strokeSvg) });
  }
  const tagin = await getTaginVariations(letter);
  tagin.forEach((v) => variations.push(v));
  return variations;
}

export function nextLetterIndex(index, dir) {
  const n = LETTER_ORDER.length;
  return (index + dir + n) % n;
}

// Lightweight fill-only preview for X-axis neighbor slots — always the
// default fill rendering regardless of the active letter's current
// variation, since the Y-axis is an independent dimension.
export function getFillPreview(letter) {
  const glyph = letterGlyphs.get(letter);
  return glyph ? cloneGlyph(glyph.fillSvg) : null;
}
