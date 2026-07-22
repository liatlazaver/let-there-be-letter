/* ראש מילין — version 12: the diagram direction.
   The opening is a framed, poster-like DIAGRAM (per the reference): the
   twenty-seven letters stand around the perimeter of the white-framed
   screen, every one joined to a single central convergence point by a thin
   white line. Flat, systematic, graphic. Each letter opens its own page.
   The letters, their order, the palette and the type system are the
   project's own. */

import { buildLettersSphere, letterGlyphs } from "./sphere.js?v=15";
import { LETTER_ORDER, LETTER_INFO } from "./carousel.js?v=45";
import { openLetterPage, closeLetterPage, hasLetterPage, isLetterPageOpen } from "./letterpage.js?v=103";
import { openLetterPage2, closeLetterPage2, isLetterPage2Open, LP2_LETTERS } from "./letterpage2.js?v=36";
import { createField } from "./field.js?v=1";
import { openNikud, closeNikud, isNikudOpen } from "./nikud.js?v=7";
import { openAbout, closeAbout, isAboutOpen } from "./about.js?v=7";
import { mountLogo } from "./logo.js?v=1";
import { startInactivityReset } from "./inactivity.js?v=1";

/* the brand mark stands in the top-right corner of every screen */
mountLogo();

/* ==== the inactivity reset ====
   Two quiet minutes with no interaction anywhere, and the interface folds
   itself home: every open screen (letter / ניקוד / אודות) closes through
   its own leaving wipe — no reload, no jump — and the opening letter
   composition stands ready for the next visitor. Each screen's internal
   states (selected components, tagin, opened books, scroll) live inside
   its root, so closing it clears them completely. */
function resetToOpening(attempt = 0) {
  const anyOpen = () =>
    isLetterPage2Open() || isLetterPageOpen() || isNikudOpen() || isAboutOpen();
  if (!anyOpen()) return;
  closeAbout();
  closeNikud();
  closeLetterPage2();
  closeLetterPage();
  /* the letter screen refuses to close mid-accordion (its `sliding` guard);
     in that rare race, try again shortly until everything is home */
  if (anyOpen() && attempt < 5) setTimeout(() => resetToOpening(attempt + 1), 1600);
}
/* dev convenience: ?idle=6 shortens the quiet period to 6s for testing */
const idleSecs = +(new URLSearchParams(location.search).get("idle") || 0);
startInactivityReset({
  timeoutMs: idleSecs > 0 ? idleSecs * 1000 : 120000,
  reset: resetToOpening,
});

const $ = (id) => document.getElementById(id);
const dustEl = $("dust");
const sphereEl = $("sphere");
const tiltEl = $("sphereTilt");
const sceneEl = $("scene");
const learnEl = $("learn");
const learnTitle = $("learnTitle");
const learnTabs = $("learnTabs");
const learnLetter = $("learnLetter");
const learnBody = $("learnBody");
const learnBack = $("learnBack");
const cursorDot = $("cursorDot");
const cursorRing = $("cursorRing");
const cursorLens = $("cursorLens");

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ==== the particle fields ====
   The opening sky and the letter screens carry NO particles anymore — the
   atmosphere lives entirely in the design (haze, glow, grain, type). Only
   the old light "learn" fallback page keeps its ink-dust field. */

const dust = createField(dustEl, {
  color: "#101010",
  density: 1 / 5200,
  spin: 0.01, // calm on the reading page
  twinkle: false,
  brightRatio: 0,
  rMin: 0.4,
  rSpan: 0.8,
  aMin: 0.16,
  aSpan: 0.4,
});

/* ==== the diagram of letters ==== */

/* The 27 letters stand around the PERIMETER of the framed screen at ONE
   systematic size, spaced evenly along the rectangle they share, each
   joined to the single central convergence point by a thin white line —
   the reference's radial diagram, drawn with our alphabet. The whole set
   slowly circulates around the frame (one refined radial system), and each
   letter is gently magnetic to the cursor. */
/* the letters share ONE size, but it is RESPONSIVE: as large as the target
   on a wide screen, and automatically stepped down on a narrow one so the
   27 letters never collide along the shorter perimeter. faceSize is solved
   from the available spacing in measureFrame; every letter uses it. */
const MAX_FACE_PX = 112; // the target size — bigger, dominant (wide screens)
const MIN_FACE_PX = 50;  // never smaller than this (narrow viewports)
let faceSize = MAX_FACE_PX; // the current uniform letter size (set per layout)
const NIKUD_FACE_PX = 16; // (no nikud in the opening — kept for safety)
/* the letters' rectangle, measured inward from the screen edges. Pushed
   OUTWARD (closer to the frame) so the perimeter is long enough that the
   bigger letters keep clear spacing, while still clearing the frame, the
   hint at the bottom, and never colliding. */
/* the letters' rectangle, measured inward from the screen edges. The top
   edge clears the system-2 bar (124 design-px, so 124*W/2850 real px —
   computed per layout in measureFrame) and then leaves a margin equal to
   the bottom's, so the composition sits evenly between the bar and the
   lower edge; EDGE_X is pulled in so the line structure spreads WIDE
   (the letters keep their size — only the composition widens). */
const barHeight = () => (124 * (innerWidth || 1280)) / 2850; // the .lp2-top height
const EDGE_BOTTOM = 128;        // a 72px breath above the lower edge (at faceSize 112)
const EDGE_X = 90;              // widened (was 108): a broader, more horizontal field
const lineTrim = () => faceSize * 0.72; // the line stops short of the glyph

/* the circular motion: the whole ring drifts around the frame's perimeter
   at a slow, even pace — smooth and continuous, never fast. It eases to a
   near-stop when the cursor approaches a letter, so the system feels
   attentive and a letter is easy to read and choose, then resumes. */
const PERIM_SPEED = 15; // px along the perimeter per second — stately
const SLOW_RADIUS = 150; // within this of the nearest letter, the ring slows
const SLOW_MIN = 0.05; // ...down to a near-stop right under the cursor
/* the magnetic response: a letter leans toward the cursor when it is near,
   the pull falling off with distance — delicate, never exaggerated */
const MAG_RADIUS = 170; // px of influence around each letter
const MAG_MAX = 15; // px — the most a letter ever leans

function decorateLetters() {
  nodesMeta.forEach((m) => {
    if (!m.isLetter) {
      // the nikud shrink with the letters — small marks at the centers
      // of their own equal cells
      m.face.style.width = `${NIKUD_FACE_PX}px`;
      m.face.style.height = `${NIKUD_FACE_PX}px`;
      return;
    }
    m.face.style.width = `${faceSize}px`; // one responsive size for all
    m.face.style.height = `${faceSize}px`;
    const fill = m.face.querySelector(".glyph-fill");
    const stroke = m.face.querySelector("svg.glyph-stroke");
    if (!fill) return;

    /* perfect centering on the node: the shared typographic box keeps all
       letters at the same SCALE, but each letter's ink sits at its own
       natural place inside that box (י hangs high, ק descends). Measure
       this letter's ink and shift every state by the same offset so the
       ink's center is exactly the node's center. Registration between
       fill and stroke is preserved — both receive the identical shift. */
    let dx = 0;
    let dy = 0;
    try {
      const vb = fill.viewBox.baseVal;
      const ink = fill.querySelector("g").getBBox();
      const scale = faceSize / Math.max(vb.width, vb.height);
      dx = ((vb.x + vb.width / 2) - (ink.x + ink.width / 2)) * scale;
      dy = ((vb.y + vb.height / 2) - (ink.y + ink.height / 2)) * scale;
    } catch (err) { /* unrendered — keep the box position */ }
    const shift = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
    fill.style.transform = shift;
    if (stroke) stroke.style.transform = shift;
  });
}

let nodesMeta = [];

function snapshotNodes() {
  nodesMeta = Array.from(sphereEl.querySelectorAll(".sphere-node")).map((el) => ({
    el,
    face: el.querySelector(".glyph-face"),
    isLetter: el.classList.contains("sphere-node--letter"),
    x: 0,
    y: 0,
    mox: 0, // the current magnetic offset, eased toward its target each frame
    moy: 0,
    line: null,
    stagger: Math.random(),
  }));
  // every face sits flat, centred on its node — a printed mark; --z must be
  // set explicitly (the node's translate3d needs all three axes)
  nodesMeta.forEach((m) => {
    m.face.style.transform = "translate(-50%, -50%)";
    m.el.style.setProperty("--z", "0px");
  });
}

/* the framed rectangle the letters ride, measured inward from the screen
   edges — recomputed on resize so the composition always holds the frame */
let geom = null;
let perimOffset = 0;
let minCursorDist = 9999; // nearest cursor→letter distance (previous frame)
let speedFactor = 1; // eased circulation speed multiplier (slows near cursor)
function measureFrame() {
  const W = innerWidth || 1280;
  const H = innerHeight || 720;
  const edgeTop = barHeight() + EDGE_BOTTOM; // clear the bar, then equal margins
  const hw = W / 2 - EDGE_X;
  const topY = -(H / 2 - edgeTop);
  const bottomY = H / 2 - EDGE_BOTTOM;
  const rectW = hw * 2;
  const rectH = bottomY - topY;
  const P = 2 * (rectW + rectH);
  geom = { hw, topY, bottomY, rectW, rectH, P };
  /* solve the uniform letter size from the spacing between neighbours:
     ink advances at ~0.85 of the face box, so to keep ~18px of clear air
     (room for the magnetic lean too) face <= (spacing - 18) / 0.85, capped
     at the target and floored so it always stays legible. */
  const spacing = P / 27;
  faceSize = Math.round(
    Math.max(MIN_FACE_PX, Math.min(MAX_FACE_PX, (spacing - 18) / 0.85))
  );
}

/* the point at perimeter-distance d, walking from the top-right corner
   leftward along the top (Hebrew's reading direction), down the left, along
   the bottom, and up the right — so the alphabet flows around the frame */
function perimPoint(d) {
  const g = geom;
  if (d < g.rectW) return { x: g.hw - d, y: g.topY };
  if (d < g.rectW + g.rectH) return { x: -g.hw, y: g.topY + (d - g.rectW) };
  if (d < g.rectW * 2 + g.rectH) return { x: -g.hw + (d - g.rectW - g.rectH), y: g.bottomY };
  return { x: g.hw, y: g.bottomY - (d - g.rectW * 2 - g.rectH) };
}

/* one frame of the living diagram: advance the whole ring around the
   perimeter, add each letter's eased magnetic lean toward the cursor, and
   re-aim its line so the structure stays connected to the centre. The line
   scales via transform (no per-frame layout). */
function stepDiagram(dt) {
  if (!geom) return;
  const ease = Math.min(1, dt * 0.012);
  // ease the circulation speed toward its target: full pace when the cursor
  // is clear of the letters, near-stop when it is right on one
  const targetFactor = minCursorDist < SLOW_RADIUS
    ? Math.max(SLOW_MIN, minCursorDist / SLOW_RADIUS)
    : 1;
  speedFactor += (targetFactor - speedFactor) * ease;
  perimOffset += PERIM_SPEED * speedFactor * (dt / 1000);
  if (perimOffset >= geom.P) perimOffset -= geom.P;

  const cx = mx - innerWidth / 2; // cursor in the diagram's centred frame
  const cy = my - innerHeight / 2;
  const n = nodesMeta.length || 1;
  let nearest = 9999;
  for (let i = 0; i < nodesMeta.length; i++) {
    const m = nodesMeta[i];
    let d = (geom.P * i) / n + perimOffset;
    d %= geom.P;
    const b = perimPoint(d);
    m.x = b.x;
    m.y = b.y;
    // magnetic: lean toward the cursor, pull falling off to nothing at MAG_RADIUS
    let tox = 0;
    let toy = 0;
    const ddx = cx - b.x;
    const ddy = cy - b.y;
    const dist = Math.hypot(ddx, ddy);
    if (dist < nearest) nearest = dist;
    if (dist < MAG_RADIUS && dist > 0.01) {
      const fall = 1 - dist / MAG_RADIUS;
      const pull = MAG_MAX * fall * fall;
      tox = (ddx / dist) * pull;
      toy = (ddy / dist) * pull;
    }
    m.mox += (tox - m.mox) * ease;
    m.moy += (toy - m.moy) * ease;
    const fx = b.x + m.mox;
    const fy = b.y + m.moy;
    m.el.style.setProperty("--x", `${fx.toFixed(1)}px`);
    m.el.style.setProperty("--y", `${fy.toFixed(1)}px`);
    if (m.line) {
      const len = Math.max(0, Math.hypot(fx, fy) - lineTrim());
      m.line.style.transform =
        `rotate(${Math.atan2(fy, fx).toFixed(4)}rad) scaleX(${len.toFixed(1)})`;
    }
  }
  minCursorDist = nearest; // feeds next frame's speed easing
}

/* ==== the cursor: a point and its following ring ==== */
let mx = innerWidth / 2;
let my = innerHeight / 2;
let rx = mx;
let ry = my;

window.addEventListener("pointermove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursorDot.style.transform = `translate(${mx}px, ${my}px)`;
});

document.addEventListener("pointerover", (e) => {
  // the ש foundational letters (.lp2-comp) join the clickable family, so
  // the custom cursor swells over them exactly as over the opening letters
  const hot = e.target.closest("button, .sphere-node, .lp-hot, .lp-room, .lp2-comp");
  document.body.classList.toggle("cursor-hot", !!hot);
});

/* the top-bar pills carry the same inversion-lens hover as the letter
   screens — the identical lp2-pill-hot state (cursor swell + inversion) */
document.querySelectorAll(".os-topbar .lp2-pill").forEach((pill) => {
  pill.addEventListener("pointerenter", () => document.body.classList.add("lp2-pill-hot"));
  pill.addEventListener("pointerleave", () => document.body.classList.remove("lp2-pill-hot"));
});

/* the bar's sections: אודות opens the about shelf, ניקוד the nikud screen;
   אותיות is this screen itself (the active pill) */
const pillNikud = document.getElementById("pillNikud");
if (pillNikud) pillNikud.addEventListener("click", openNikud);
const pillAboutTop = document.getElementById("pillAboutTop");
if (pillAboutTop) pillAboutTop.addEventListener("click", openAbout);

/* ==== choosing a letter ====
   The diagram is static (the reference is a printed composition) — there
   is nothing to drag. A press that barely moves is a CHOICE; movement is
   simply ignored. Selection resolves on pointerup with a hit-test. */
let pressed = false;
let pressX = 0;
let pressY = 0;
const CLICK_SLOP = 6; // px of travel under which a press-release is a click

sceneEl.addEventListener("pointerdown", (e) => {
  if (document.body.classList.contains("learn-open")) return;
  pressed = true;
  pressX = e.clientX;
  pressY = e.clientY;
});
window.addEventListener("pointerup", (e) => {
  if (!pressed) return;
  pressed = false;
  if (Math.hypot(e.clientX - pressX, e.clientY - pressY) > CLICK_SLOP) return;
  if (document.body.classList.contains("learn-open") || isLetterPageOpen()) return;
  selectGlyphAt(e.clientX, e.clientY);
});

/* ==== the main loop ====
   The cursor ring follows its point; the opening diagram circulates and
   responds to the cursor while it is the visible screen; the old learn
   page's dust draws only when that page is open. */
let last = null;
function frame(now) {
  requestAnimationFrame(frame);
  if (last === null) {
    last = now;
    return;
  }
  const dt = Math.min(50, now - last);
  last = now;
  const t = now / 1000;

  // the ring follows its point, swelling on hover (the CSS scale can't win
  // against this per-frame inline transform, so the grow lives here — the
  // ring's own CSS transition smooths it). A pill reaches further.
  rx = lerp(rx, mx, 0.16);
  ry = lerp(ry, my, 0.16);
  const ringScale = document.body.classList.contains("lp2-pill-hot")
    ? 2.6
    : document.body.classList.contains("cursor-hot")
    ? 1.55
    : 1;
  cursorRing.style.transform = `translate(${rx}px, ${ry}px) scale(${ringScale})`;
  // the inversion lens rides the same body/swell as the ring
  if (cursorLens) cursorLens.style.transform = `translate(${rx}px, ${ry}px) scale(${ringScale})`;

  if (document.body.classList.contains("learn-open")) {
    dust.draw(dt / 1000, t);
    return; // the world rests behind the learn page
  }
  if (document.body.classList.contains("lp-open")) return; // ...and the letter page
  if (nodesMeta.length) stepDiagram(dt);
}
requestAnimationFrame(frame);

/* ==== interaction feedback — a restrained spatial "activation" ====
   Every feeling here lives in overlay layers kept entirely separate from
   the ink, so the fill<->stroke registration is never touched: no jump,
   no shift, by construction. Letters and nikud share the same language. */

/* the scan ping — a thin ring pulses outward from the glyph and dissipates
   the instant it is selected, like a detection confirmed in a field */
function emitPing(node) {
  const ping = node.querySelector(".glyph-ping");
  if (!ping) return;
  ping.animate(
    [
      { transform: "scale(0.6)", opacity: 0.55 },
      { transform: "scale(2.4)", opacity: 0 },
    ],
    { duration: 640, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
}

/* build the two feedback overlays for one glyph: an orbital satellite that
   engages while the glyph is targeted, and the scan-ping ring above. Both
   sit behind the ink so the glyph itself stays the focal point. */
function addFocusLayers(m) {
  const r = m.isLetter ? faceSize : NIKUD_FACE_PX;

  const orbit = document.createElement("div");
  orbit.className = "glyph-orbit";
  orbit.style.setProperty("--orbit-r", `${(r * 0.82).toFixed(1)}px`);
  const dot = document.createElement("div");
  dot.className = "glyph-orbit-dot";
  orbit.appendChild(dot);

  const ping = document.createElement("div");
  ping.className = "glyph-ping";

  m.face.insertBefore(ping, m.face.firstChild);
  m.face.insertBefore(orbit, m.face.firstChild);
}

/* the structure step equips every glyph with its feedback overlays, and
   draws one thin line from the central convergence point out to every
   letter (the reference's radial structure). The lines are plain rules
   anchored at the centre, aimed and length-scaled by stepDiagram each
   frame. They are inserted BEFORE the nodes so they paint behind the
   letters. */
function buildStructure() {
  nodesMeta.forEach((m) => {
    addFocusLayers(m);
    if (!m.isLetter) return;
    const line = document.createElement("div");
    line.className = "radial-line";
    line.setAttribute("aria-hidden", "true");
    sphereEl.insertBefore(line, sphereEl.firstChild);
    m.line = line;
  });
}

/* ---- the arrival ----
   The diagram prints itself: the letters resolve in around the frame,
   then the lines draw their convergence, then the top bar, the frame and
   the hint arrive. Timed classes and WAAPI — no per-frame work. */
function startStructureCeremony() {
  nodesMeta.forEach((m) => {
    window.setTimeout(() => {
      m.el.style.setProperty("--dim", "1");
    }, 300 + m.stagger * 900);
  });
  nodesMeta.forEach((m) => {
    if (!m.line) return;
    const a = m.line.animate([{ opacity: 0 }, { opacity: 1 }], {
      delay: 1250 + m.stagger * 700,
      duration: 900,
      easing: "ease-out",
      fill: "both",
    });
    a.finished
      .catch(() => {})
      .then(() => {
        m.line.style.opacity = "1";
        try { a.cancel(); } catch (err) { /* fine */ }
      });
  });
  window.setTimeout(() => {
    document.body.classList.add("world-ready");
    document.body.classList.add("brand-in");
  }, 2500);
}

/* ==== the learn space ==== */
const TABS = ["הצורה", "המהות", "הבנייה", "ההתבוננות"];
let activeLetter = null;
let activeTab = 0;

function buildTabs() {
  TABS.forEach((name, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "learn-tab";
    tab.setAttribute("role", "tab");
    tab.textContent = name;
    tab.addEventListener("click", () => setTab(i));
    learnTabs.appendChild(tab);
  });
}

function setTab(i) {
  activeTab = i;
  Array.from(learnTabs.children).forEach((el, k) =>
    el.classList.toggle("is-active", k === i)
  );
  renderBody();
}

function renderBody() {
  const info = LETTER_INFO[activeLetter] || {};
  learnBody.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = TABS[activeTab];
  const p = document.createElement("p");
  p.textContent = info.text || "";
  const note = document.createElement("p");
  note.className = "learn-note";
  note.textContent = "התוכן מתוך ״ראש מילין״ יתווסף בהמשך.";
  learnBody.append(h, p, note);
}

function openLearn(letter) {
  activeLetter = letter;
  const info = LETTER_INFO[letter] || {};
  learnTitle.textContent = info.name || letter;
  learnLetter.innerHTML = "";
  const glyph = letterGlyphs.get(letter);
  if (glyph && glyph.fillSvg) {
    const svg = glyph.fillSvg.cloneNode(true);
    svg.removeAttribute("class");
    svg.removeAttribute("style");
    learnLetter.appendChild(svg);
  }
  setTab(0);
  document.body.classList.add("learn-open");
  learnEl.setAttribute("aria-hidden", "false");
  learnBack.focus({ preventScroll: true });
}

function closeLearn() {
  document.body.classList.remove("learn-open");
  learnEl.setAttribute("aria-hidden", "true");
  activeLetter = null;
}

learnBack.addEventListener("click", closeLearn);
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (document.body.classList.contains("learn-open")) closeLearn();
  else if (isLetterPageOpen()) closeLetterPage();
});

/* selecting a glyph: a scan ping confirms the choice; a letter then opens
   its own page (the full letter experience where one exists, the light
   learn page otherwise), a nikud simply acknowledges the selection.
   IMPORTANT: selection happens on pointerup with an explicit hit-test —
   never via the browser's `click` event. The drag uses pointer capture on
   the scene, and a captured pointer RETARGETS the derived click to the
   scene itself, so a click listener on the sphere (its descendant) simply
   never hears real clicks. elementFromPoint is immune to capture. */
function selectGlyphAt(x, y) {
  const el = document.elementFromPoint(x, y);
  const node = el && el.closest(".sphere-node");
  if (!node) return;
  emitPing(node);
  if (!node.dataset.letter) return;
  /* the system-2 prototype letters open the redesigned screen */
  if (LP2_LETTERS.has(node.dataset.letter)) openLetterPage2(node.dataset.letter);
  else if (hasLetterPage(node.dataset.letter)) openLetterPage(node.dataset.letter);
  else openLearn(node.dataset.letter);
}

/* ==== entry ====
   The diagram prints itself onto the framed page: letters resolve in
   around the perimeter, the lines draw their convergence to the centre,
   and the top bar arrives. The layout re-measures on resize, so the
   composition always holds the frame. */
buildTabs();
buildLettersSphere(sphereEl).then(() => {
  snapshotNodes();
  measureFrame();     // solve the responsive letter size first...
  decorateLetters();  // ...then apply it to every letter
  buildStructure();
  window.addEventListener("resize", () => {
    measureFrame();
    decorateLetters(); // re-size the letters when the viewport changes
  });
  nodesMeta.forEach((m) => m.el.style.setProperty("--dim", "0"));
  stepDiagram(0); // place the letters and lines before they fade in
  startStructureCeremony();
});
