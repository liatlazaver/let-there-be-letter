/* Stroke construction of a letter, driven by the provided "פירוק" SVG
   (assets/build/build-<letter>.svg) and the letter's own stroke form.

   The construction happens entirely inside the final letter's coordinate
   space — a construction svg sharing the exact viewBox and box of the final
   glyph overlay — so every position is structural, not approximate:

     beat 1  the base forms draw themselves in, one by one, in a quiet
             row at the heart of the stage (right to left; the composite
             form draws as its two strokes — its own breakdown)
     beat 2  each form glides precisely into the place of the arm it
             becomes inside the letter — the ש constellation stands,
             while the letter itself is still absent
     beat 3  the letter's true strokes ink along each standing form,
             which dissolves into them; the connecting stroke completes
             the letter — the finished ש is revealed only here, at the end

   Everything is stroke-based (dash draw-on); nothing decorative — only the
   base forms and the letter's own strokes ever appear. */

import { SVG_NS, letterGlyphs } from "./sphere.js?v=41";

const SVG_SOURCES = { "ש": "assets/build/build-ש.svg" };

/* The base letters each construction is made of, right to left. The intro
   row is scaled by the ALPHABET'S own proportions: each form is sized by
   its letter's natural ink height in the project typeface (the composite
   double-stroke form follows ו, whose strokes it is built from). */
const BASE_LETTERS = { "ש": ["י", "ו", "ו"] };

export function hasBuild(letter) {
  return Object.prototype.hasOwnProperty.call(SVG_SOURCES, letter);
}

/* natural ink height of a letter in the project's shared letter canvas —
   the typographic size system is derived from the designed alphabet itself */
const inkHeightCache = new Map();

function letterInkHeight(letter) {
  if (inkHeightCache.has(letter)) return inkHeightCache.get(letter);
  const glyph = letterGlyphs.get(letter);
  let h = null;
  if (glyph && glyph.fillSvg) {
    const host = document.createElementNS(SVG_NS, "svg");
    host.setAttribute("style", "position:absolute;left:-99999px;top:0;width:10px;height:10px;overflow:visible");
    const clone = glyph.fillSvg.cloneNode(true);
    host.appendChild(clone);
    document.body.appendChild(host);
    try {
      const bb = (clone.querySelector("g") || clone).getBBox();
      if (bb && bb.height) h = bb.height;
    } catch (err) {
      h = null;
    }
    host.remove();
  }
  inkHeightCache.set(letter, h);
  return h;
}

/* timing (ms) — unhurried, intentional */
const T = {
  stageIn: 500,
  introStart: 350,
  glideBreath: 300, // the row holds a breath before it rises
  glideDur: 1050,
  landBreath: 340, // the constellation stands before the writing begins
  fade: 300, // a standing form withdraws before its stroke is written
  baseBreath: 260, // breath before the base gathers the letter
};

/* One even writing hand for every stroke: duration follows the stroke's
   on-screen length (its path length times its rendered scale), so a long
   arm and a small intro letter are written at the same visible pace. */
const INK_PACE = 0.42; // svg-units per ms
const STROKE_OVERLAP = 160; // ms — the pen lifts and continues, one gesture

function drawDur(shape, scale = 1) {
  const len = shape.getTotalLength() * scale;
  return Math.min(1500, Math.max(520, len / INK_PACE));
}

const EASE = "cubic-bezier(0.3, 0.7, 0.2, 1)";
// The rise is one synchronized motion with NO overshoot: when every form
// moves on the same curve at the same moment, the gaps between them simply
// interpolate between the row's spacing and the letter's spacing — forms
// that never overlap at rest can never overlap in flight. An overshoot
// would break that guarantee exactly at the tightest moment.
const GLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const INTRO_HEIGHT = 0.28; // the base-form row's height, as a share of the glyph box
const INTRO_GAP = 0.06; // gap between base forms — tight, like letters set in a word

function tightNormalize(svgEl, pad = 0.1) {
  const host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("style", "position:absolute;left:-99999px;top:0;width:10px;height:10px;overflow:visible");
  const probe = svgEl.cloneNode(true);
  host.appendChild(probe);
  document.body.appendChild(host);
  let bb = null;
  try {
    const g = probe.querySelector("g") || probe;
    bb = g.getBBox();
  } catch (err) {
    bb = null;
  }
  host.remove();
  const clone = svgEl.cloneNode(true);
  if (bb && bb.width && bb.height) {
    const side = Math.max(bb.width, bb.height) * (1 + pad * 2);
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;
    clone.setAttribute("viewBox", `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
    clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
  return clone;
}

/* Un-drawn strokes are BOTH dash-hidden and fully transparent. Dash-hiding
   alone leaves artifacts on closed contours (a dot or sliver can bleed at
   the seam of a polygon whose rendered length rounds differently from
   getTotalLength) — the opacity gate guarantees a clean, empty stage. */
function prepDraw(shape) {
  const len = shape.getTotalLength();
  shape.style.strokeDasharray = String(len);
  shape.style.strokeDashoffset = String(len);
  shape.style.opacity = "0";
  return len;
}

function gateIn(shape, delay) {
  return shape.animate([{ opacity: 0 }, { opacity: 1 }], {
    delay,
    duration: 140,
    fill: "both",
  });
}

function drawOn(shape, delay, duration) {
  const len = shape.getTotalLength();
  return shape.animate(
    [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { delay, duration, easing: "ease-in-out", fill: "both" }
  );
}

/* Draw-on for the letter's own strokes: once the draw completes, the dash
   styling is removed entirely so every closed contour truly closes — with
   the dash pattern left in place, the seam of a closed polygon can keep a
   hairline gap (dasharray == measured length never wraps exactly). */
function drawOnFinal(shape, delay, duration) {
  const gate = gateIn(shape, delay);
  const anim = drawOn(shape, delay, duration);
  anim.finished
    .then(() => {
      shape.style.strokeDasharray = "none";
      shape.style.strokeDashoffset = "0";
      shape.style.opacity = "1";
      try {
        anim.cancel();
      } catch (err) { /* disposed */ }
      try {
        gate.cancel();
      } catch (err) { /* disposed */ }
    })
    .catch(() => {
      /* canceled by dispose */
    });
  return [gate, anim];
}

/* ---- pen tip ----
   A small point of light leads every stroke while it draws — the letter is
   written, not merely displayed. The dot rides the same geometry as the
   stroke (CSS motion path), synchronized with the dash reveal, and fades
   the moment the stroke completes. */
function shapeToPathD(el) {
  if (el.tagName.toLowerCase() === "path") return el.getAttribute("d");
  const nums = el.getAttribute("points").trim().split(/[\s,]+/);
  let d = `M ${nums[0]} ${nums[1]}`;
  for (let i = 2; i + 1 < nums.length; i += 2) d += ` L ${nums[i]} ${nums[i + 1]}`;
  return el.tagName.toLowerCase() === "polygon" ? `${d} Z` : d;
}

function penTip(host, shape, delay, duration) {
  const dot = document.createElementNS(SVG_NS, "circle");
  dot.setAttribute("r", "2.4");
  dot.setAttribute("fill", "currentColor");
  dot.style.opacity = "0";
  dot.style.offsetPath = `path("${shapeToPathD(shape)}")`;
  dot.style.offsetRotate = "0deg";
  host.appendChild(dot);
  return [
    dot.animate(
      [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
      { delay, duration, easing: "ease-in-out", fill: "both" }
    ),
    dot.animate(
      [
        { opacity: 0 },
        { opacity: 0.95, offset: 0.06 },
        { opacity: 0.95, offset: 0.92 },
        { opacity: 0 },
      ],
      { delay, duration: duration + 140, fill: "both" }
    ),
  ];
}

const bbCx = (bb) => bb.x + bb.width / 2;
const bbCy = (bb) => bb.y + bb.height / 2;

function unionBox(boxes) {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.width));
  const btm = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: r - x, height: btm - y };
}

/* Group shapes into visual forms: sorted right-to-left, neighbors whose
   centers sit closer than ~18% of the ink width belong to one form (the
   two-stroke composite in ש, for example — in both the פירוק file and the
   letter itself). */
function groupForms(items, inkWidth) {
  const sorted = [...items].sort((a, b) => b.cx - a.cx);
  const forms = [];
  sorted.forEach((it) => {
    const last = forms[forms.length - 1];
    if (last && Math.abs(last.cx - it.cx) < inkWidth * 0.18) {
      last.parts.push(it);
      last.cx = (last.cx + it.cx) / 2;
      last.cy = (last.cy + it.cy) / 2;
    } else {
      forms.push({ parts: [it], cx: it.cx, cy: it.cy });
    }
  });
  forms.forEach((f) => {
    f.box = unionBox(f.parts.map((p) => p.bb));
  });
  return forms;
}

// transform that maps a part so its form's box lands on the target box
// (translate + scale around the part's own center, CSS px == svg user units)
function partTransform(part, formBox, target) {
  const sx = target.width / formBox.width;
  const sy = target.height / formBox.height;
  const dx = bbCx(target) + (bbCx(part.bb) - bbCx(formBox)) * sx - bbCx(part.bb);
  const dy = bbCy(target) + (bbCy(part.bb) - bbCy(formBox)) * sy - bbCy(part.bb);
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

/* ---- THE SIZING RULE for every decomposition animation ----
   The raw פירוק files draw their letters at inconsistent sizes, so raw
   sizes are never displayed. Every component letter is sized by the
   DESIGNED ALPHABET's own ink proportions (letterInkHeight over the
   project typeface): a י is genuinely smaller than a ו, the same base
   letter always appears at the same size, and nothing is ever forced into
   one shared box. The intro row sets the letters in these proportions —
   and the rise may only ZOOM that whole alphabet by ONE shared factor,
   never resize one letter against another, so the system holds at every
   moment of the animation. The standing form never has to match the final
   contour line-for-line, because the writing that follows always replaces
   it: the form withdraws first, and only then is the true stroke written
   in its place. */

/* createBuildStage(letter, mountEl) -> { dispose } — parses the פירוק file,
   mounts the layered stage into mountEl and runs the full timeline. */
export async function createBuildStage(letter, mountEl) {
  const res = await fetch(encodeURI(SVG_SOURCES[letter]));
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const strokePaths = Array.from(doc.querySelectorAll("path")).filter((p) =>
    p.getAttribute("stroke")
  );
  const glyph = letterGlyphs.get(letter);
  if (!mountEl.isConnected || !strokePaths.length || !glyph || !glyph.strokeSvg) {
    return { dispose() {} };
  }

  /* ---- final letter overlay: hidden (un-drawn) until the reveal ---- */
  const finalSvg = tightNormalize(glyph.strokeSvg.cloneNode(true));
  finalSvg.setAttribute("class", "build-final");
  finalSvg.removeAttribute("style");
  mountEl.appendChild(finalSvg);
  const finalShapes = Array.from(
    finalSvg.querySelectorAll("path, polygon, polyline, line")
  ).map((el) => {
    const bb = el.getBBox();
    return { el, bb, cx: bbCx(bb), cy: bbCy(bb) };
  });
  const inkBox = unionBox(finalShapes.map((s) => s.bb));

  // the letter's arms (tall strokes, right to left) vs connecting strokes
  const arms = finalShapes.filter((s) => s.bb.height >= inkBox.height * 0.55);
  let armForms = groupForms(arms, inkBox.width);
  let completionShapes = finalShapes
    .filter((s) => !arms.includes(s))
    .map((s) => s.el);

  /* ---- construction svg: same viewBox, same box — one coordinate space,
     so the base forms live inside the letter's exact geometry ---- */
  const conSvg = document.createElementNS(SVG_NS, "svg");
  conSvg.setAttribute("class", "build-construction");
  conSvg.setAttribute("viewBox", finalSvg.getAttribute("viewBox"));
  conSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  mountEl.appendChild(conSvg);

  // base forms from the פירוק file (its top row — the component letterforms)
  const measured = strokePaths.map((p) => {
    const g = document.createElementNS(SVG_NS, "g");
    const path = p.cloneNode(true);
    path.removeAttribute("class");
    g.appendChild(path);
    conSvg.appendChild(g);
    const bb = path.getBBox();
    return { g, path, bb, cx: bbCx(bb), cy: bbCy(bb) };
  });
  const srcBox = unionBox(measured.map((it) => it.bb));
  const srcMidY = srcBox.y + srcBox.height / 2;
  const componentItems = measured.filter((it) => it.cy < srcMidY);
  // the lower row (the further breakdown) stays unrendered — its story is
  // told by the composite form drawing as its separate strokes
  measured
    .filter((it) => it.cy >= srcMidY)
    .forEach((it) => it.g.remove());
  const compForms = groupForms(componentItems, srcBox.width);

  if (armForms.length !== compForms.length) armForms = []; // safe fallback

  /* ---- intro row layout: the base letters presented as a clean
     typographic line, right to left.
     Sizes come from the DESIGNED ALPHABET itself: each form is scaled so
     the letters relate by their natural ink heights in the project
     typeface (י genuinely smaller than ו, and so on) — never forced into
     one bounding box. All heads hang from one shared top line, the way
     Hebrew letters hang in a font, with equal gaps between letters and
     the whole row centered on the stage. ---- */
  const side = finalSvg.viewBox.baseVal.width; // square
  const gap = side * INTRO_GAP;
  const unitH = side * INTRO_HEIGHT; // the tallest base letter's height
  const baseLetters = BASE_LETTERS[letter] || [];
  const inkHeights = compForms.map((f, i) =>
    baseLetters[i] ? letterInkHeight(baseLetters[i]) : null
  );
  const knownInk = inkHeights.filter((h) => h);
  const refInk = knownInk.length ? Math.max(...knownInk) : null;
  const maxSrcH = Math.max(...compForms.map((f) => f.box.height));
  const targetHs = compForms.map((f, i) =>
    refInk && inkHeights[i]
      ? (inkHeights[i] / refInk) * unitH // the alphabet's own proportion
      : (f.box.height / maxSrcH) * unitH // fallback: the file's proportion
  );
  const widths = compForms.map((f, i) => f.box.width * (targetHs[i] / f.box.height));
  const rowW = widths.reduce((a, b) => a + b, 0) + gap * (compForms.length - 1);
  // the letters are written on a foundation line LOW in the glyph's space,
  // below the arms they will become — the whole row then rises into place,
  // so the construction flows upward into the letter's true position
  const rowTop = inkBox.y + inkBox.height * 0.88 - unitH / 2;
  let cursor = bbCx(inkBox) + rowW / 2; // rightmost edge, walking leftward
  const introTargets = compForms.map((f, i) => {
    const box = {
      x: cursor - widths[i],
      y: rowTop, // one shared top line — Hebrew letters hang from it
      width: widths[i],
      height: targetHs[i],
    };
    cursor -= widths[i] + gap;
    return box;
  });

  /* ---- prime: strokes un-drawn, forms placed at the intro row ---- */
  const anims = [];
  finalShapes.forEach((s) => prepDraw(s.el));
  compForms.forEach((form, i) => {
    form.parts.forEach((p) => {
      prepDraw(p.path);
      p.g.style.transformBox = "fill-box";
      p.g.style.transformOrigin = "center";
      p.g.style.transform = partTransform(p, form.box, introTargets[i]);
    });
  });
  conSvg.style.opacity = "0";
  anims.push(conSvg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T.stageIn, fill: "both" }));

  /* beat 1 — the base letters write themselves in as one continuous
     gesture, right to left: each stroke begins as the previous one ends,
     every stroke at the same even writing pace */
  let penCursor = T.introStart;
  compForms.forEach((form, i) => {
    const introScale = targetHs[i] / form.box.height;
    [...form.parts]
      .sort((a, b) => b.cx - a.cx)
      .forEach((p) => {
        const dur = drawDur(p.path, introScale);
        anims.push(gateIn(p.path, penCursor));
        anims.push(drawOn(p.path, penCursor, dur));
        anims.push(...penTip(p.g, p.path, penCursor, dur));
        penCursor += dur - STROKE_OVERLAP;
      });
  });
  const introEnd = penCursor + STROKE_OVERLAP;

  /* beat 2 — the rise: the whole row lifts as ONE synchronized motion,
     each form opening toward the arm it becomes; the ש constellation
     stands while the letter itself is still absent. One shared curve, one
     shared moment — the forms grow together and can never collide. The
     growth is ONE shared zoom of the whole alphabet (the sizing rule
     above): the largest factor at which every grown letter still fits the
     height of its arm, each standing head-on-the-head-line, centered. */
  const glideStart = introEnd + T.glideBreath;
  const landTime = glideStart + T.glideDur;
  const growth =
    armForms.length === compForms.length && compForms.length
      ? Math.min(...compForms.map((f, i) => armForms[i].box.height / targetHs[i]))
      : 1;
  compForms.forEach((form, i) => {
    let target = null;
    if (armForms[i]) {
      const h = targetHs[i] * growth;
      const w = form.box.width * (h / form.box.height);
      target = {
        x: bbCx(armForms[i].box) - w / 2,
        y: armForms[i].box.y,
        width: w,
        height: h,
      };
    }
    form.parts.forEach((p) => {
      const from = partTransform(p, form.box, introTargets[i]);
      const to = target ? partTransform(p, form.box, target) : from;
      anims.push(
        p.g.animate([{ transform: from }, { transform: to }], {
          delay: glideStart,
          duration: T.glideDur,
          easing: GLIDE_EASE,
          fill: "both",
        })
      );
    });
  });

  /* beat 3 — the writing: arm by arm, right to left, the standing form
     withdraws and the letter's true stroke is written in its place — the
     pen never writes over a standing line, so nothing ever piles up */
  let inkCursor = landTime + T.landBreath;
  let totalMs = introEnd;
  compForms.forEach((form, i) => {
    const start = Math.max(inkCursor, landTime + T.fade);
    form.parts.forEach((p) => {
      anims.push(
        p.g.animate([{ opacity: 1 }, { opacity: 0 }], {
          delay: start,
          duration: T.fade,
          easing: "ease-in",
          fill: "both",
        })
      );
    });
    // the pen picks up just as the form finishes dissolving
    let pen = start + T.fade - 60;
    if (armForms[i]) {
      [...armForms[i].parts]
        .sort((a, b) => b.cx - a.cx)
        .forEach((s) => {
          const dur = drawDur(s.el);
          anims.push(...drawOnFinal(s.el, pen, dur));
          anims.push(...penTip(finalSvg, s.el, pen, dur));
          pen += dur - STROKE_OVERLAP;
        });
    }
    totalMs = Math.max(totalMs, pen + STROKE_OVERLAP);
    inkCursor = pen + STROKE_OVERLAP - 120; // the next arm follows the hand
  });

  /* the base stroke gathers the standing arms into one letter (or, with no
     structural match, the whole letter is written here in one gesture) */
  let basePen = totalMs + T.baseBreath;
  const closing = armForms.length
    ? completionShapes
    : finalShapes.map((s) => s.el);
  closing.forEach((el) => {
    const dur = drawDur(el);
    anims.push(...drawOnFinal(el, basePen, dur));
    anims.push(...penTip(finalSvg, el, basePen, dur));
    basePen += dur - STROKE_OVERLAP;
    totalMs = Math.max(totalMs, basePen + STROKE_OVERLAP);
  });

  return {
    totalMs,
    dispose() {
      anims.forEach((a) => {
        try {
          a.cancel();
        } catch (err) {
          /* already done */
        }
      });
      conSvg.remove();
      finalSvg.remove();
    },
  };
}
