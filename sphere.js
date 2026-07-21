/* Builds the 3D letters+nikud sphere for screen 2/3 from the provided
   glyph SVGs. Each source file contains two renderings of the same glyph:
   a filled group (default, no class) and a stroke group (class="cls-1").
   We split them apart at load time and normalize each to its own bbox so
   the fill/stroke states line up when the sphere is hovered. */

const LETTER_FILES = [
  "א-28", "ב-29", "ג-30", "ד-31", "ה-32", "ו-33", "ז-34", "ח-35", "ט-36",
  "י-37", "כ-38", "ך-50", "ל-40", "מ-41", "ם-54", "נ-42", "ן-53", "ס-43",
  "ע-44", "פ-45", "ף-52", "צ-46", "ץ-51", "ק-47", "ר-48", "ש-49", "ת-39",
].map((suffix) => `assets/letters/letter-${suffix}.svg`);

const NIKUD_NAMES = ["חיריק", "סגול", "פתח", "צירה", "קמץ", "שוא", "שורוק"];
const NIKUD_FILES = NIKUD_NAMES.map((name) => `assets/nikud/nikud-${name}.svg`);

function letterFromPath(path) {
  // "assets/letters/letter-ז-34.svg" -> "ז"
  const match = path.match(/letter-(.+)-\d+\.svg$/);
  return match ? match[1] : null;
}

const SPHERE_ASSETS = [
  ...LETTER_FILES.map((path) => ({ path, kind: "letter", letter: letterFromPath(path) })),
  ...NIKUD_FILES.map((path, i) => ({ path, kind: "nikud", letter: NIKUD_NAMES[i] })),
];

// letter -> its source SVG path, so other modules (the letter screen's
// component carve) can re-read a glyph's raw construction strokes.
export const LETTER_SRC = new Map(
  LETTER_FILES.map((path) => [letterFromPath(path), path])
);

// One consistent size for every letter — large enough to read clearly on
// the sphere, small enough to keep it airy. Nikud marks read at a fraction
// of that, like real diacritics, with a floor so they stay visible.
const LETTER_SIZE = 37;
const NIKUD_SIZE = Math.max(LETTER_SIZE * 0.45, 10);

export const SVG_NS = "http://www.w3.org/2000/svg";

// Populated as the sphere builds — lets other modules (the letter carousel)
// reuse the exact same fill/stroke assets already loaded for a letter,
// instead of re-fetching and re-parsing them a second time.
export const letterGlyphs = new Map();
export const nikudGlyphs = new Map(); // name -> { fillSvg, strokeSvg }

// All 27 letter source files share one design canvas (verified: every file
// is viewBox="0 0 595.28 841.89"). Cropping each letter to its OWN tight
// bounding box — as buildStateSvg does for nikud — makes sense for a single
// mark, but for a typeface it destroys the shared baseline: a short letter
// like ו and a descender like ק would each get centered on their own unique
// extent, so switching between letters visibly jumps. These two boxes are
// the union of every letter's fill/stroke ink (with margin), centered on
// the shared canvas's own centerline (x=297.64) — using the SAME box for
// every letter keeps every baseline, cap-height, and centerline aligned.
export const LETTER_FILL_BOX = { x: 120, y: 30, width: 355, height: 375 };
export const LETTER_STROKE_BOX = { x: 150, y: 380, width: 295, height: 420 };

/* ---- the shared baseline ----------------------------------------------
   One window per letter keeps the SCALE identical, but it cannot give the
   alphabet a baseline: the source files place each letter at its own
   arbitrary height on the canvas — measured, the ink bottoms of the
   twenty-two letters that should sit ON the line are spread over 121 units
   of a 375-unit body. Rendered in one window, that spread IS the vertical
   jitter: ק looks dropped as a whole instead of standing on the line with
   only its leg below it.

   So each letter's window is offset vertically to put ITS baseline on one
   line, leaving x, width and height untouched — identical scale, identical
   horizontal placement, only the registration corrected.

   The baseline of a letter that sits on the line is simply its ink bottom.
   The five that descend (ק ן ך ף ץ) cannot use their ink bottom — that is the
   foot of the leg, well under the line — and they split into two kinds that
   take the line differently:

   • BODY descenders — ק ף ץ — carry a full letter body that must SIT on the
     line, with only a thin leg reaching below it (ק beside ר, ה, ב, ד). Their
     seat — where the body meets the leg — is not their ink bottom and is not a
     shared cap height either (ץ's body is short and its tail long; a shared
     height floats it high). Each takes an explicit body depth: the measured
     distance from its ink top down to its seat, read off the rasterised glyph
     as the row where the ink narrows from body to leg. Added to the ink top,
     it lands the body on the line exactly like the letters that sit on it, and
     lets the leg hang into the room below — no per-letter centering anywhere.

   • THROUGH-STROKE descenders — ך ן — have no body that rests on the line; they
     fall straight through it. They take the alphabet's own cap height (the
     median of the letters that sit on the line) so their tops join the common
     band and the stroke descends below — which is what reads as a descender.
     ל is excluded from that median: it is an ascender, and its extra height is
     exactly what should not be averaged in.

   Ascenders and descenders may reach past the window; .glyph-face svg is
   overflow:visible, so they are drawn, not clipped. */
const DESCENDERS = new Set(["ק", "ן", "ך", "ף", "ץ"]);
/* ink-top → seat, in source units, for the three body descenders (measured) */
const BODY_DESCENDER_DEPTH = { "ק": 149, "ף": 157, "ץ": 81 };
/* where the baseline sits inside the window, from its top. Chosen to clear
   the tallest ascender (ל) so the common band sits high in the frame and
   the legs hang into the room below it. */
const BASELINE_IN_BOX = 262;
const letterBaselines = new Map(); // letter -> baseline y, in source coords

function registerBaselines(loaded) {
  const ink = new Map();
  loaded.forEach((g) => {
    if (g.kind !== "letter" || !g.fillInk) return;
    ink.set(g.letter, g.fillInk);
  });
  if (!ink.size) return;
  const caps = [...ink.entries()]
    .filter(([ch]) => !DESCENDERS.has(ch) && ch !== "ל")
    .map(([, b]) => b.height)
    .sort((a, b) => a - b);
  const capHeight = caps.length ? caps[Math.floor(caps.length / 2)] : 166;
  ink.forEach((b, ch) => {
    let baseline;
    if (BODY_DESCENDER_DEPTH[ch] != null) {
      baseline = b.y + BODY_DESCENDER_DEPTH[ch];   // body sits on the line, leg below
    } else if (DESCENDERS.has(ch)) {
      baseline = b.y + capHeight;                  // through-stroke: top on the band
    } else {
      baseline = b.y + b.height;                   // sits on the line: ink bottom
    }
    letterBaselines.set(ch, baseline);
  });
}

/** the fill window for one letter: the shared box, slid so its baseline lands */
function fillBoxFor(letter) {
  const base = letterBaselines.get(letter);
  if (base == null) return LETTER_FILL_BOX;
  return { ...LETTER_FILL_BOX, y: base - BASELINE_IN_BOX };
}

/* v12: the fill and the stroke renderings live at DIFFERENT places on the
   shared canvas (fill in the upper region, stroke in the lower one), so no
   single window can align them — and two windows of different sizes scale
   them differently. The registration rule: each state gets its own window
   of IDENTICAL dimensions (the fill box's), each placed so its own ink
   center sits at the same relative point of its window. Same scale, same
   anchor — the fill->stroke hover swap cannot move by construction. */
export function measureInk(shapeEls) {
  const host = document.createElementNS(SVG_NS, "svg");
  host.style.position = "absolute";
  host.style.left = "-99999px";
  host.style.width = "0";
  host.style.height = "0";
  document.body.appendChild(host);
  const g = document.createElementNS(SVG_NS, "g");
  shapeEls.forEach((el) => g.appendChild(el.cloneNode(true)));
  host.appendChild(g);
  let bb = null;
  try {
    bb = g.getBBox();
  } catch (err) {
    bb = null;
  }
  document.body.removeChild(host);
  return bb && bb.width && bb.height ? bb : null;
}

export function buildStateSvg(shapeEls, isStroke, fixedBox) {
  let box = fixedBox;

  if (!box) {
    const measureHost = document.createElementNS(SVG_NS, "svg");
    measureHost.style.position = "absolute";
    measureHost.style.left = "-99999px";
    measureHost.style.width = "0";
    measureHost.style.height = "0";
    document.body.appendChild(measureHost);

    const measureG = document.createElementNS(SVG_NS, "g");
    shapeEls.forEach((el) => measureG.appendChild(el.cloneNode(true)));
    measureHost.appendChild(measureG);

    const bbox = measureG.getBBox();
    document.body.removeChild(measureHost);
    if (!bbox.width || !bbox.height) return null;
    box = bbox;
  }

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const g = document.createElementNS(SVG_NS, "g");
  shapeEls.forEach((el) => g.appendChild(el.cloneNode(true)));
  g.setAttribute("fill", isStroke ? "none" : "currentColor");
  g.setAttribute("stroke", isStroke ? "currentColor" : "none");
  g.removeAttribute("class");
  Array.from(g.children).forEach((child) => {
    child.removeAttribute("class");
    if (isStroke) {
      child.setAttribute("stroke-width", "1.4");
      child.setAttribute("vector-effect", "non-scaling-stroke");
    }
  });
  svg.appendChild(g);
  return svg;
}

async function loadGlyph(path, kind, letter) {
  const res = await fetch(encodeURI(path));
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const shapes = Array.from(
    doc.querySelectorAll("polygon, path, circle, ellipse, rect, polyline, line")
  );

  const strokeShapes = shapes.filter((el) => el.getAttribute("class") === "cls-1");
  const fillShapes = shapes.filter((el) => el.getAttribute("class") !== "cls-1");

  const isLetter = kind === "letter";
  /* a letter's window cannot be decided yet: the baseline is a property of
     the WHOLE alphabet (see registerBaselines), so the shapes and their ink
     are carried out and the glyph is drawn once every letter is measured */
  if (isLetter) {
    return {
      kind, letter, fillShapes, strokeShapes,
      fillInk: measureInk(fillShapes),
      strokeInk: measureInk(strokeShapes),
    };
  }
  return {
    kind, letter,
    fillSvg: buildStateSvg(fillShapes, false, null),
    strokeSvg: buildStateSvg(strokeShapes, true, null),
  };
}

/** draw a letter into its own baseline-registered window */
function buildLetterSvgs(g) {
  const F = fillBoxFor(g.letter);
  g.fillSvg = buildStateSvg(g.fillShapes, false, F);
  let strokeBox = LETTER_STROKE_BOX;
  if (g.fillInk && g.strokeInk) {
    const fbb = g.fillInk, sbb = g.strokeInk;
    // place a fill-box-sized window around the stroke ink so its center
    // maps to exactly where the fill ink's center sits in the fill box
    strokeBox = {
      x: (sbb.x + sbb.width / 2) - ((fbb.x + fbb.width / 2) - F.x),
      y: (sbb.y + sbb.height / 2) - ((fbb.y + fbb.height / 2) - F.y),
      width: F.width,
      height: F.height,
    };
  }
  g.strokeSvg = buildStateSvg(g.strokeShapes, true, strokeBox);
  return g;
}

/* the opening is a LETTER CAROUSEL — in the spirit of the nikud carousel,
   but for the alphabet: one small glowing white core at the centre, the 27
   letters riding a single ring around it (in their own order), and all the
   nikud on a smaller secondary ring inside. A thin white line joins every
   letter back to the core, so the whole reads as one connected, organised,
   rotating wheel — never a sphere, cluster, or scatter. The ring is built
   flat (y=0) and the world tilts it into an ellipse (see BASE_TILT), so it
   turns as a clean carousel with real depth. */
const RING_LETTER = 0.98; // the single letter ring (fraction of the base radius)

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export async function buildLettersSphere(sphereEl) {
  const glyphs = (
    await Promise.all(
      SPHERE_ASSETS.map(({ path, kind, letter }) => loadGlyph(path, kind, letter).catch(() => null))
    )
  ).filter(Boolean);

  /* the alphabet is measured as a whole, then each letter is drawn into its
     own baseline-registered window */
  registerBaselines(glyphs);
  glyphs.forEach((g) => { if (g.kind === "letter") buildLetterSvgs(g); });

  /* the glyph maps carry BOTH letters and nikud — the letter pages still
     need the nikud assets even though the opening carousel shows none */
  glyphs.forEach((g) => {
    if (g.kind === "letter") letterGlyphs.set(g.letter, { fillSvg: g.fillSvg, strokeSvg: g.strokeSvg });
    else if (g.letter) nikudGlyphs.set(g.letter, { fillSvg: g.fillSvg, strokeSvg: g.strokeSvg });
  });

  /* the opening carousel is LETTERS ONLY — the 27 letters ride one ring in
     their own order (an organised wheel). Nikud are not part of the opening
     composition. Everything is flat (y=0); the world tilts it into a
     rotating ellipse and the centre (0,0,0) is the glowing core, with a
     clean line out to each letter. */
  const letters = glyphs.filter((g) => g.kind === "letter");

  /* the build can be reached while the sphere has no layout yet (a
     zero-sized viewport during load — embedded previews do this): wait for
     real dimensions, otherwise the ring collapses to radius 0 forever */
  if (!sphereEl.clientWidth) {
    await new Promise((resolve) => {
      const ro = new ResizeObserver(() => {
        if (sphereEl.clientWidth) {
          ro.disconnect();
          resolve();
        }
      });
      ro.observe(sphereEl);
    });
  }
  const radius = (sphereEl.clientWidth / 2) * 1.02;

  letters.forEach((glyph, i) => {
    const a = (i / letters.length) * Math.PI * 2;
    const p = { x: Math.cos(a) * RING_LETTER, y: 0, z: Math.sin(a) * RING_LETTER };

    const node = document.createElement("div");
    node.className = "sphere-node sphere-node--letter";
    node.style.setProperty("--x", `${(p.x * radius).toFixed(2)}px`);
    node.style.setProperty("--y", `${(p.y * radius).toFixed(2)}px`);
    node.style.setProperty("--z", `${(p.z * radius).toFixed(2)}px`);
    node.dataset.letter = glyph.letter;

    const inner = document.createElement("div");
    inner.className = "sphere-node-inner";

    const face = document.createElement("div");
    face.className = "glyph-face";
    face.style.width = `${LETTER_SIZE}px`;
    face.style.height = `${LETTER_SIZE}px`;

    if (glyph.fillSvg) {
      glyph.fillSvg.classList.add("glyph-fill");
      face.appendChild(glyph.fillSvg);
    }
    if (glyph.strokeSvg) {
      glyph.strokeSvg.classList.add("glyph-stroke");
      face.appendChild(glyph.strokeSvg);
    }

    inner.appendChild(face);
    node.appendChild(inner);
    sphereEl.appendChild(node);
  });
}
