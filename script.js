import { buildLettersSphere, SVG_NS } from "./sphere.js?v=41";
import {
  LETTER_ORDER,
  LETTER_INFO,
  getVariations,
  getFillPreview,
  prefetchTagin,
  nextLetterIndex,
} from "./carousel.js?v=41";
import { createLetter3D, has3DLetter } from "./letter3d.js?v=41";
import { createBuildStage, hasBuild } from "./build.js?v=41";

const logoPath = document.getElementById("logo-path");
const scrollCue = document.getElementById("scroll-cue");

const DRAW_DURATION_MS = 2600;
const SCROLL_CUE_LEAD_MS = 2000;

function drawLogo() {
  const length = logoPath.getTotalLength();

  logoPath.style.strokeDasharray = `${length}`;
  logoPath.style.strokeDashoffset = `${length}`;

  const drawing = logoPath.animate(
    [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
    { duration: DRAW_DURATION_MS, easing: "ease-in-out", fill: "forwards" }
  );

  window.setTimeout(() => {
    scrollCue.style.transition = "opacity 900ms ease-out";
    scrollCue.style.opacity = "1";
  }, DRAW_DURATION_MS - SCROLL_CUE_LEAD_MS);

  drawing.onfinish = () => {
    logoPath.style.strokeDashoffset = "0";
  };
}

drawLogo();

/* ---- Screen 1 -> Screen 2 -> Screen 3 logo hand-off ----
   This is the SAME logo element from screen 1 — never duplicated. While
   scrolling through a screen's height it is reparented to <body> and set to
   position:fixed so its screen position/size can be interpolated between
   the two neighboring screens' spots (stroke <-> fill). Once the scroll
   passes fully into the next screen it's handed off into that screen's own
   layout; scrolling back up reverses all of it, including the DOM moves. */

const logoWrap = document.getElementById("logo-wrap");
const logoSlot = document.getElementById("logoSlot");
const smallLogoSlot = document.getElementById("smallLogoSlot");
const loadingScreen = document.getElementById("loading-screen");

const LOGO_SCREEN1 = { left: 682 / 1920, top: 304 / 1080, width: 555 / 1920, height: 472 / 1080 };
const LOGO_SCREEN2 = { left: 783 / 1920, top: 114 / 1080, width: 353 / 1920, height: 301 / 1080 };
const LOGO_SCREEN3 = { left: 880 / 1920, top: 34 / 1080, width: 160 / 1920, height: 64 / 1080 };

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpBox(from, to, t) {
  return {
    left: `${lerp(from.left, to.left, t) * 100}vw`,
    top: `${lerp(from.top, to.top, t) * 100}vh`,
    width: `${lerp(from.width, to.width, t) * 100}vw`,
    height: `${lerp(from.height, to.height, t) * 100}vh`,
  };
}

function applyBox(el, box) {
  el.style.left = box.left;
  el.style.top = box.top;
  el.style.width = box.width;
  el.style.height = box.height;
}

let logoHome = "screen1"; // "screen1" | "fixed" | "screen2" | "fixed2" | "screen3"

function updateLogoTransition() {
  const vh = window.innerHeight;
  const t1 = Math.max(0, Math.min(1, window.scrollY / vh));
  const t2 = Math.max(0, Math.min(1, window.scrollY / vh - 1));

  if (t2 <= 0) {
    logoPath.style.fill = "#FDFCF8";
    logoPath.style.fillOpacity = String(t1);
    logoPath.style.strokeOpacity = String(1 - t1);
  } else {
    logoPath.style.fillOpacity = String(1 - t2);
    logoPath.style.strokeOpacity = String(t2);
  }

  // the nav dot only appears once the logo has fully settled into its
  // screen 3 position — never mid-transition.
  const dotVisible = t2 >= 1;
  navDot.classList.toggle("is-visible", dotVisible);
  if (!dotVisible && navBar.classList.contains("is-open")) {
    navBar.classList.remove("is-open");
    navDot.classList.remove("is-open");
    navDot.setAttribute("aria-expanded", "false");
    navBar.setAttribute("aria-hidden", "true");
  }

  if (t1 <= 0) {
    if (logoHome !== "screen1") {
      logoWrap.removeAttribute("style");
      logoWrap.classList.remove("logo-wrap--fixed", "logo-wrap--docked");
      loadingScreen.appendChild(logoWrap);
      logoHome = "screen1";
    }
    return;
  }

  if (t1 < 1) {
    if (logoHome !== "fixed") {
      document.body.appendChild(logoWrap);
      logoWrap.classList.remove("logo-wrap--docked");
      logoWrap.classList.add("logo-wrap--fixed");
      logoHome = "fixed";
    }
    applyBox(logoWrap, lerpBox(LOGO_SCREEN1, LOGO_SCREEN2, t1));
    return;
  }

  if (t2 <= 0) {
    if (logoHome !== "screen2") {
      logoSlot.appendChild(logoWrap);
      logoWrap.removeAttribute("style");
      logoWrap.classList.remove("logo-wrap--fixed");
      logoWrap.classList.add("logo-wrap--docked");
      logoHome = "screen2";
    }
    return;
  }

  if (t2 < 1) {
    if (logoHome !== "fixed2") {
      document.body.appendChild(logoWrap);
      logoWrap.classList.remove("logo-wrap--docked");
      logoWrap.classList.add("logo-wrap--fixed");
      logoHome = "fixed2";
    }
    applyBox(logoWrap, lerpBox(LOGO_SCREEN2, LOGO_SCREEN3, t2));
    return;
  }

  if (logoHome !== "screen3") {
    smallLogoSlot.appendChild(logoWrap);
    logoWrap.removeAttribute("style");
    logoWrap.classList.remove("logo-wrap--fixed");
    logoWrap.classList.add("logo-wrap--docked");
    logoHome = "screen3";
  }
}

/* ---- Screen 2 -> Screen 3 sphere hand-off ----
   Same sphere-window/shell/sphere elements from screen 2 — never rebuilt or
   duplicated. During the same scroll range as the logo's second transition,
   it grows from the screen 2 "peek" into screen 3's full reveal. */

const sphereWindow = document.getElementById("sphere-window");
const sphereShell = document.getElementById("sphereShell");
const sphereScreenEl = document.getElementById("screen-sphere");
const sphereSlot = document.getElementById("sphereSlot");

// The shell's own width/height (set in CSS) are what the sphere's letters
// were positioned against at build time — they must never change, or every
// letter's translate3d offset goes out of proportion with its container.
// Screen 3's "full reveal" is achieved by scaling the whole shell uniformly
// with a transform instead, which scales its 3D contents together as one.
const SPHERE_NATURAL = { centerXFrac: 0.5, topFrac: 0.06, maxFrac: 0.64, maxPx: 760 };
const SPHERE_FULL = { centerXFrac: 0.5, centerYFrac: 0.56, maxFrac: 0.58, maxPx: 700 };

// The screen 2 "peek" clip window, and an effectively clip-free window for
// screen 3 — interpolated continuously so the reveal grows in step with the
// scroll instead of snapping open the instant the transition starts.
const WINDOW_NATURAL = { left: 469 / 1920, top: 512 / 1080, width: 981 / 1920, height: 814 / 1080 };
const WINDOW_FULL = { left: 0, top: 0, width: 1, height: 1 };

function naturalShellMetrics(vw, vh) {
  const size = Math.min(SPHERE_NATURAL.maxFrac * Math.min(vw, vh), SPHERE_NATURAL.maxPx);
  return {
    size,
    centerX: SPHERE_NATURAL.centerXFrac * vw,
    centerY: SPHERE_NATURAL.topFrac * vh + size / 2,
  };
}

function fullShellMetrics(vw, vh) {
  const size = Math.min(SPHERE_FULL.maxFrac * Math.min(vw, vh), SPHERE_FULL.maxPx);
  return {
    size,
    centerX: SPHERE_FULL.centerXFrac * vw,
    centerY: SPHERE_FULL.centerYFrac * vh,
  };
}

let sphereHome = "screen2"; // "screen2" | "fixed" | "screen3" | "dive"

/* ---- The dive into the core ----
   Scrolling past screen 3 flies the camera INTO the sphere, through the
   shell of letters, until the viewer rests at the heart of the typographic
   system where the התחל core waits. Fully scroll-driven and reversible. */
const sphereCamera = document.getElementById("sphereCamera");
const sphereCore = document.getElementById("sphereCore");
const coreBall = document.getElementById("coreBall");
const coreOrbit = document.getElementById("coreOrbit");
const coreOrbitTilt = document.querySelector(".core-orbit-tilt");
const sphereInnerEl = document.getElementById("sphere");
let coreActivated = false; // the one-way activation of the interface
const DIVE_PERSPECTIVE = 1400; // must match .sphere-shell perspective in CSS
// Camera resting distance from the core, in sphere radii. ~1.2R sits right
// at the shell's threshold: the near letters have swept past the viewer and
// the far half of the shell wraps the whole view around the core — deep
// enough to feel inside, wide enough to keep the dome of letters present.
const DIVE_DEPTH_FACTOR = 1.2;

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Scroll-built sphere: every node remembers its true shell position and a
// scattered origin; scrolling into the sphere screen converges the letters
// (staggered) from the scatter into the shell around the core.
let sphereNodesMeta = [];
let lastAssemblyT = -1;
let diveActive = false;

function snapshotSphereNodes() {
  sphereNodesMeta = Array.from(sphereInnerEl.querySelectorAll(".sphere-node")).map((el) => {
    const x = parseFloat(el.style.getPropertyValue("--x")) || 0;
    const y = parseFloat(el.style.getPropertyValue("--y")) || 0;
    const z = parseFloat(el.style.getPropertyValue("--z")) || 0;
    const jitter = () => (Math.random() - 0.5) * 240;
    return {
      el,
      x,
      y,
      z,
      sx: x * 2.1 + jitter(),
      sy: y * 2.1 + jitter(),
      sz: z * 2.1 + jitter(),
      stagger: Math.random() * 0.42,
      assemblyOpacity: 0.25,
    };
  });
  lastAssemblyT = -1;

  // CRITICAL billboard sync: the sphere's spin and each letter's counter-
  // rotation are separate infinite CSS animations — the letters mount only
  // after their SVGs finish loading, seconds after the spin began, leaving
  // a fixed phase offset that turns every glyph toward a side profile.
  // Same duration + same startTime = identical phase forever, so every
  // letter faces the viewer exactly, always.
  const spin = sphereInnerEl
    .getAnimations()
    .find((a) => a.animationName === "sphere-spin");
  if (spin && spin.startTime != null) {
    sphereInnerEl.querySelectorAll(".sphere-node-inner").forEach((el) => {
      const counter = el
        .getAnimations()
        .find((a) => a.animationName === "sphere-spin-reverse");
      if (counter) counter.startTime = spin.startTime;
    });
  }
}

function sphereRadiusPx() {
  return sphereInnerEl.clientWidth / 2 || 300;
}

function updateAssembly(tA) {
  if (!sphereNodesMeta.length) return;
  if (tA === lastAssemblyT && (tA <= 0 || tA >= 1)) return; // settled state
  lastAssemblyT = tA;
  sphereNodesMeta.forEach((m) => {
    const tn = easeOutCubic(clamp01((tA - m.stagger) / 0.58));
    m.el.style.setProperty("--x", `${lerp(m.sx, m.x, tn)}px`);
    m.el.style.setProperty("--y", `${lerp(m.sy, m.y, tn)}px`);
    m.el.style.setProperty("--z", `${lerp(m.sz, m.z, tn)}px`);
    m.assemblyOpacity = lerp(0.25, 1, tn);
    if (!diveActive) {
      m.el.style.opacity = m.assemblyOpacity >= 0.999 ? "" : String(m.assemblyOpacity);
    }
  });
}

// Depth fade while diving: a node dissolves softly as it comes too near the
// camera (about to sweep past the viewer), so letters glide around you
// instead of smearing across the screen. The sphere's live spin angle is
// read from its computed transform so the fade tracks the real positions.
function updateDiveFades(dz) {
  if (!sphereNodesMeta.length) return;
  const R = sphereRadiusPx();
  let rot = null;
  try {
    rot = new DOMMatrix(getComputedStyle(sphereInnerEl).transform);
  } catch (err) {
    rot = null;
  }
  sphereNodesMeta.forEach((m) => {
    let zr = m.z;
    if (rot) zr = rot.transformPoint(new DOMPoint(m.x, m.y, m.z)).z;
    const dist = DIVE_PERSPECTIVE - (dz + zr);
    const fade = clamp01((dist - 0.5 * R) / (0.3 * R));
    const a = m.assemblyOpacity * fade;
    m.el.style.opacity = a >= 0.999 ? "" : String(a);
    // a faded near-camera node is projected huge across the center — it must
    // never intercept clicks meant for the התחל core beneath it
    m.el.style.pointerEvents = fade < 0.55 ? "none" : "";
  });
}

function updateSphereTransition() {
  if (coreActivated) return; // the activation owns the stage from here on
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const t2 = Math.max(0, Math.min(1, window.scrollY / vh - 1));
  const t3 = Math.max(0, Math.min(1, window.scrollY / vh - 2));

  // the sphere assembles itself across the scroll into its screen
  updateAssembly(t2);

  if (t3 > 0) {
    if (sphereHome !== "dive") {
      document.body.appendChild(sphereWindow);
      sphereWindow.classList.remove("sphere-window--docked");
      sphereWindow.classList.add("sphere-window--fixed");
      sphereHome = "dive";
    }
    applyBox(sphereWindow, lerpBox(WINDOW_FULL, WINDOW_FULL, 1)); // full-viewport box, in units

    const naturalD = naturalShellMetrics(vw, vh);
    const fullD = fullShellMetrics(vw, vh);
    sphereShell.style.transform =
      `translateX(calc(-50% + ${fullD.centerX - naturalD.centerX}px)) ` +
      `translateY(${fullD.centerY - naturalD.centerY}px) scale(${fullD.size / naturalD.size})`;

    // the camera flies forward, through the shell, toward the core
    const R = sphereRadiusPx();
    const dz = easeInOutCubic(t3) * (DIVE_PERSPECTIVE - DIVE_DEPTH_FACTOR * R);
    sphereCamera.style.transform = `translateZ(${dz}px)`;
    diveActive = true;
    updateDiveFades(dz);

    // the core emerges from the depth; its perspective growth is counter-
    // scaled so the rendered size follows one intentional curve and the
    // text stays crisp (layout size is never scaled up)
    const sPersp = DIVE_PERSPECTIVE / (DIVE_PERSPECTIVE - dz);
    const net = lerp(0.12, 0.95, easeInOutCubic(t3));
    sphereCore.style.setProperty("--core-scale", String(net / sPersp));
    sphereCore.style.setProperty("--core-opacity", String(clamp01((t3 - 0.15) / 0.4)));
    // clickable from the moment it is clearly present — the user must never
    // find the core visible but unresponsive
    const coreLive = t3 > 0.55;
    sphereCore.classList.toggle("is-live", coreLive);
    sphereCore.setAttribute("aria-hidden", String(!coreLive));
    return;
  }

  if (diveActive) {
    // scrolled back out of the dive — restore the plain sphere view
    diveActive = false;
    sphereCamera.style.transform = "";
    sphereCore.style.setProperty("--core-scale", "0");
    sphereCore.style.setProperty("--core-opacity", "0");
    sphereCore.classList.remove("is-live");
    sphereCore.setAttribute("aria-hidden", "true");
    sphereNodesMeta.forEach((m) => {
      m.el.style.opacity = m.assemblyOpacity >= 0.999 ? "" : String(m.assemblyOpacity);
      m.el.style.pointerEvents = "";
    });
  }

  if (t2 <= 0) {
    if (sphereHome !== "screen2") {
      sphereScreenEl.appendChild(sphereWindow);
      sphereWindow.removeAttribute("style");
      sphereWindow.classList.remove("sphere-window--fixed", "sphere-window--docked");
      sphereShell.removeAttribute("style");
      sphereHome = "screen2";
    }
    return;
  }

  const natural = naturalShellMetrics(vw, vh);
  const full = fullShellMetrics(vw, vh);
  const scale = lerp(1, full.size / natural.size, t2);
  const centerX = lerp(natural.centerX, full.centerX, t2);
  const centerY = lerp(natural.centerY, full.centerY, t2);
  const dx = centerX - natural.centerX;
  const dy = centerY - natural.centerY;

  if (t2 < 1) {
    if (sphereHome !== "fixed") {
      document.body.appendChild(sphereWindow);
      sphereWindow.classList.remove("sphere-window--docked");
      sphereWindow.classList.add("sphere-window--fixed");
      sphereHome = "fixed";
    }
    applyBox(sphereWindow, lerpBox(WINDOW_NATURAL, WINDOW_FULL, t2));
  } else if (sphereHome !== "screen3") {
    sphereSlot.appendChild(sphereWindow);
    sphereWindow.classList.remove("sphere-window--fixed");
    sphereWindow.classList.add("sphere-window--docked");
    sphereHome = "screen3";
  }

  sphereShell.style.transform = `translateX(calc(-50% + ${dx}px)) translateY(${dy}px) scale(${scale})`;
}

/* ---- התחל activation ----
   One continuous gesture: the word vanishes at the click, the core pulls
   the letters and nikud into itself (a magnetic grab, then a powerful
   slam to the center — nothing pops, everything shrinks INTO the ball),
   the ball grows from the center until it covers the screen, and the
   interface rests on the light color. */

function activateCore() {
  if (coreActivated || !sphereCore.classList.contains("is-live")) return;
  coreActivated = true;
  document.body.style.overflow = "hidden"; // the activation is one-way
  sphereCore.classList.remove("is-live"); // no hover ring / re-click mid-sequence

  // the ambient chrome steps aside — nothing may linger over the white
  scrollIndicator.style.transition = "opacity 250ms ease";
  scrollIndicator.style.opacity = "0";
  navDot.style.transition = "opacity 250ms ease";
  navDot.style.opacity = "0";

  /* Everything below is arranged so the click handler itself is cheap and
     causes NO forced style/layout recalculation between writes — the whole
     sequence is committed in one go and plays as one timeline. */

  // single layout read, BEFORE any style writes
  const ballRect = coreBall.getBoundingClientRect();
  const needed =
    (Math.hypot(window.innerWidth, window.innerHeight) / Math.max(1, ballRect.width)) * 1.25;

  /* 1 — the התחל band is removed AT the click itself: hidden synchronously
     (no fade, no animation frame in between) — zero remnants, ever.
     The sphere's rotation is frozen in the same instant: nothing may TURN
     during the pull, so every letter stays locked facing forward. */
  coreOrbit.style.animation = "none";
  coreOrbitTilt.style.opacity = "0";
  coreOrbitTilt.style.visibility = "hidden";
  setSphereMotion("paused");

  /* 2 — the suction begins with an IMPULSE: on the very first frames the
     letters visibly yank inward (fast-out start), then the pull deepens
     into a powerful accelerating slam to the center. One continuous
     motion — no dead zone after the click.
     The keyframes are LITERAL pixel values (no var()/calc() resolution per
     frame), so the browser can composite the whole pull off the main
     thread — no first-frame jank, no stutter. Near-camera remnants (the
     already-faded letters that swept past the viewer) dissolve in place:
     dragging them across the screen would sweep giant distorted glyphs
     over the scene. */
  sphereNodesMeta.forEach((m, i) => {
    const cur = parseFloat(m.el.style.opacity || "1");
    if (cur < 0.55) {
      m.el.animate([{ opacity: cur }, { opacity: 0 }], {
        duration: 240,
        easing: "ease-out",
        fill: "forwards",
      });
      return;
    }
    const delay = (i % 5) * 12 + Math.random() * 20; // 0–68ms wave, starts NOW
    m.el.animate(
      [
        {
          transform: `translate3d(${m.x}px, ${m.y}px, ${m.z}px) scale(1)`,
          opacity: cur,
          offset: 0,
          easing: "cubic-bezier(0.15, 0.6, 0.4, 1)", // the impulse: instant yank
        },
        {
          transform: `translate3d(${m.x * 0.86}px, ${m.y * 0.86}px, ${m.z * 0.86}px) scale(0.95)`,
          opacity: cur,
          offset: 0.18,
          easing: "cubic-bezier(0.6, 0, 0.8, 0.35)", // the slam: full pull
        },
        { opacity: cur, offset: 0.85 },
        { transform: "translate3d(0px, 0px, 0px) scale(0.05)", opacity: 0, offset: 1 },
      ],
      { delay, duration: 950, fill: "forwards" }
    );
  });

  /* 3 — the ball owns ONE timeline from the click: an instant subtle
     "inhale" as it starts swallowing (immediate feedback), holding its
     breath through the collapse, then expanding until it covers the
     screen — declaratively chained, no waits between stages */
  coreBall.animate(
    [
      { transform: "scale(1)", offset: 0, easing: "cubic-bezier(0.3, 0.6, 0.4, 1)" },
      { transform: "scale(1.07)", offset: 0.12, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
      { transform: "scale(1.04)", offset: 0.45, easing: "cubic-bezier(0.55, 0.06, 0.25, 1)" },
      { transform: `scale(${needed})`, offset: 1 },
    ],
    { duration: 2000, fill: "forwards" }
  );

  /* 4 — the interface rests on the light color, edge to edge */
  // the next screen's design is fetched in parallel with the animation, so
  // it is ready the moment the white settles
  prefetchAfterScreen();

  window.setTimeout(() => {
    document.body.classList.add("is-core-activated");
    mountAfterScreen();
  }, 1950);
}

sphereCore.addEventListener("click", activateCore);

/* ---- The screens after the white (מסכי ההסבר) ----
   The full white becomes the next screen: her designs (assets/screens/
   after-white.svg + after-white-2.svg) are mounted over the veil in the
   same light color. One persistent stage holds the logo and the THREE
   orbital rings (the exact ring paths from her page-2 design) — the rings
   emerge one out of the other and then drift forever, never pausing or
   resetting, across both text pages. Page 1's paragraph types itself in;
   clicking the second pagination dot crossfades to page 2, whose text
   types in the same rhythm and ends with the scroll-down cue from the
   design. Exact glyphs, exact composition — always her outlined artwork,
   never re-typeset. */

const AFTER_SVG_URLS = ["assets/screens/after-white.svg", "assets/screens/after-white-2.svg"];
// the interface's one nav menu — same labels as screen 3's nav-bar (index.html)
const NAV_LINK_LABELS = ["האותיות", "על הפרויקט", "על ראש מילין"];
let afterSvgPromise = null;
let afterScreenMounted = false;
let afterPage2Shown = false;

function prefetchAfterScreen() {
  if (!afterSvgPromise) {
    afterSvgPromise = Promise.all(
      AFTER_SVG_URLS.map((u) => fetch(u).then((r) => r.text()).catch(() => null))
    );
  }
  return afterSvgPromise;
}

async function mountAfterScreen() {
  if (afterScreenMounted) return;
  afterScreenMounted = true;
  const [markup1, markup2] = await prefetchAfterScreen();
  if (!markup1 || !markup2) return;

  const doc1 = new DOMParser().parseFromString(markup1, "image/svg+xml");
  const doc2 = new DOMParser().parseFromString(markup2, "image/svg+xml");
  const byStart = (doc, s) =>
    Array.from(doc.querySelectorAll("path")).find((p) =>
      (p.getAttribute("d") || "").startsWith(s)
    );
  const smallDots = (doc) =>
    Array.from(doc.querySelectorAll("circle")).filter((c) => c.getAttribute("cx") === "5.5");

  const screen = document.createElement("div");
  screen.className = "after-screen";
  const stage = document.createElementNS(SVG_NS, "svg");
  stage.setAttribute("class", "after-stage");
  stage.setAttribute("viewBox", "0 0 1920 1080");
  stage.setAttribute("preserveAspectRatio", "xMidYMid slice");
  stage.setAttribute("fill", "none"); // as in the source svgs — rings stay hairlines
  screen.appendChild(stage);
  // attach BEFORE building the contents: getBBox() (used to place the
  // typewriter covers) only measures elements that are in the document
  document.body.appendChild(screen);

  const CX = 960; // the rings' shared center, from the design geometry
  const CY = 543;
  const fadeIn = (el, delay, duration) => {
    el.style.opacity = "0";
    return el.animate([{ opacity: 0 }, { opacity: 1 }], {
      delay,
      duration,
      easing: "ease-out",
      fill: "forwards",
    });
  };

  /* ---- the persistent orbital system: her exact three ring paths,
     contained in one shared scale wrapper (small enough never to be cut by
     the frame, and never to cross the text). Outer group per ring = an
     endless slow breathing oscillation (never touched again — it keeps
     moving through every page and transition); inner group = the one-time
     emergence, rings 2 and 3 opening OUT of ring 1's plane. Ring 1 itself
     arrives as a quick clean stroke DRAWN around the text. */
  // measured empirically: >=0.8 keeps every ring clear of the text (14px+
  // clearance even at the oscillation extremes); containment inside the
  // frame with a 50px margin holds up to ~0.95. 0.92 = large and safe.
  const RING_SCALE = 0.92;
  const ringField = document.createElementNS(SVG_NS, "g");
  ringField.style.transformOrigin = `${CX}px ${CY}px`;
  ringField.style.transform = `scale(${RING_SCALE})`;
  stage.appendChild(ringField);

  const makeRing = (pathEl, { oscAmpl, oscDur, oneSided, emergeFrom, delay, draw }) => {
    const osc = document.createElementNS(SVG_NS, "g");
    const emerge = document.createElementNS(SVG_NS, "g");
    osc.style.transformOrigin = `${CX}px ${CY}px`;
    emerge.style.transformOrigin = `${CX}px ${CY}px`;
    const p = pathEl.cloneNode(true);
    emerge.appendChild(p);
    osc.appendChild(emerge);
    ringField.appendChild(osc);
    // slow breathing drift, forever, always smooth. Symmetric rings swing
    // both ways; the tighter rings swing to ONE side only — each ring's
    // safe side was measured so the strokes never cross the text.
    const frames = oneSided
      ? [
          { transform: "rotate(0deg)", easing: "ease-in-out" },
          { transform: `rotate(${oscAmpl}deg)`, easing: "ease-in-out", offset: 0.5 },
          { transform: "rotate(0deg)" },
        ]
      : [
          { transform: "rotate(0deg)", easing: "ease-in-out" },
          { transform: `rotate(${oscAmpl}deg)`, easing: "ease-in-out", offset: 0.25 },
          { transform: `rotate(${-oscAmpl}deg)`, easing: "ease-in-out", offset: 0.75 },
          { transform: "rotate(0deg)" },
        ];
    osc.animate(frames, { duration: oscDur, iterations: Infinity });
    emerge.style.transform = `rotate(${emergeFrom}deg)`;
    emerge.animate(
      [{ transform: `rotate(${emergeFrom}deg)` }, { transform: "rotate(0deg)" }],
      { delay, duration: 1600, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)", fill: "forwards" }
    );
    if (draw) {
      // the first ring is DRAWN into existence around the text: a single
      // clean circular stroke, quick and intentional
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      const drawAnim = p.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { delay, duration: 1200, easing: "ease-in-out", fill: "forwards" }
      );
      // once fully drawn, drop the dash so the closed contour truly closes
      drawAnim.finished
        .then(() => {
          p.style.strokeDasharray = "none";
          p.style.strokeDashoffset = "0";
          try {
            drawAnim.cancel();
          } catch (err) { /* fine */ }
        })
        .catch(() => {});
    } else {
      fadeIn(osc, delay, 900);
    }
  };

  const ring1El = byStart(doc2, "M960 335");
  const ring2El = byStart(doc2, "M1031");
  const ring3El = byStart(doc2, "M854");
  if (ring1El) makeRing(ring1El, { oscAmpl: 9, oscDur: 30000, emergeFrom: 0, delay: 500, draw: true });
  if (ring2El) makeRing(ring2El, { oscAmpl: -12, oscDur: 40000, oneSided: true, emergeFrom: -12, delay: 1900 });
  if (ring3El) makeRing(ring3El, { oscAmpl: 14, oscDur: 52000, oneSided: true, emergeFrom: 14, delay: 2700 });

  /* the logo and the top-right dot — shared by both pages, arrive first */
  const logoPathEl = byStart(doc1, "M998");
  if (logoPathEl) {
    const logo = logoPathEl.cloneNode(true);
    stage.appendChild(logo);
    fadeIn(logo, 350, 1000);
  }
  // her top-right dot, now the live menu trigger for this screen: the exact
  // same dot->menu interaction as screen 3's nav-dot (wireDotMenu below),
  // recolored to the interface black for this light background. Same
  // corner position, same arrival timing as the logo above.
  const afterNavDot = document.createElement("button");
  afterNavDot.type = "button";
  afterNavDot.className = "nav-dot is-dark";
  afterNavDot.setAttribute("aria-haspopup", "true");
  afterNavDot.setAttribute("aria-expanded", "false");
  afterNavDot.setAttribute("aria-label", "פתח ניווט");
  afterNavDot.innerHTML =
    '<span class="nav-dot-fill"></span><span class="nav-dot-stroke"></span>';
  screen.appendChild(afterNavDot);

  const afterNavBar = document.createElement("nav");
  afterNavBar.className = "nav-bar is-dark";
  afterNavBar.setAttribute("aria-hidden", "true");
  afterNavBar.innerHTML = NAV_LINK_LABELS.map(
    (label) => `<button class="nav-link is-dark" type="button">${label}</button>`
  ).join("");
  screen.appendChild(afterNavBar);

  wireDotMenu(afterNavDot, afterNavBar);
  // reuse the dot's own is-visible transition (the same one screen 3's dot
  // uses to arrive) rather than a second, separate fade mechanism
  window.setTimeout(() => afterNavDot.classList.add("is-visible"), 350);

  /* typewriter: her outlined paragraph revealed line by line with stepped
     right-to-left wipes (covers in the background color). Returns the
     covers + the total duration so pages can schedule around it. */
  const TYPE_LINE_MS = 900;
  const TYPE_STAGGER = 860;
  const buildTypewriter = (group, textPath, lines) => {
    const bb = textPath.getBBox();
    const bandH = bb.height / lines;
    const covers = [];
    for (let i = 0; i < lines; i += 1) {
      const cover = document.createElementNS(SVG_NS, "rect");
      cover.setAttribute("x", String(bb.x - 6));
      cover.setAttribute("y", String(bb.y + i * bandH - 1));
      cover.setAttribute("width", String(bb.width + 12));
      cover.setAttribute("height", String(bandH + 2));
      cover.setAttribute("fill", "#FDFCF8");
      group.appendChild(cover);
      covers.push(cover);
    }
    return {
      covers,
      fullW: bb.width + 12,
      run(startDelay) {
        covers.forEach((cover, i) => {
          cover.animate([{ width: `${bb.width + 12}px` }, { width: "0px" }], {
            delay: startDelay + i * TYPE_STAGGER,
            duration: TYPE_LINE_MS,
            easing: "steps(24, end)",
            fill: "forwards",
          });
        });
        return startDelay + (lines - 1) * TYPE_STAGGER + TYPE_LINE_MS;
      },
    };
  };

  /* ---- page 1: the first paragraph + its pagination dots ---- */
  const page1 = document.createElementNS(SVG_NS, "g");
  stage.appendChild(page1);
  const text1 = byStart(doc1, "M791");
  let page1Done = 900;
  if (text1) {
    const t = text1.cloneNode(true);
    page1.appendChild(t);
    page1Done = buildTypewriter(page1, t, 6).run(900);
  }
  const dots1 = document.createElementNS(SVG_NS, "g");
  smallDots(doc1).forEach((d) => dots1.appendChild(d.cloneNode(true)));
  page1.appendChild(dots1);
  fadeIn(dots1, page1Done + 350, 800);

  // the second (left, stroke) dot is the way onward — a generous unseen
  // hit area over it, armed once the dots are visible
  const hit = document.createElementNS(SVG_NS, "circle");
  hit.setAttribute("cx", "952.5");
  hit.setAttribute("cy", "614.5");
  hit.setAttribute("r", "26");
  hit.setAttribute("fill", "transparent");
  hit.style.cursor = "pointer";
  hit.style.pointerEvents = "none";
  page1.appendChild(hit);
  window.setTimeout(() => {
    hit.style.pointerEvents = "auto";
  }, page1Done + 400);

  /* ---- page 2 (hidden): the second paragraph, its dots (now the left
     one is filled), and the scroll-down cue from the design ---- */
  const page2 = document.createElementNS(SVG_NS, "g");
  page2.style.opacity = "0";
  page2.style.visibility = "hidden";
  stage.appendChild(page2);
  const text2 = byStart(doc2, "M786");
  let type2 = null;
  if (text2) {
    const t = text2.cloneNode(true);
    page2.appendChild(t);
    type2 = buildTypewriter(page2, t, 4);
  }
  const dots2 = document.createElementNS(SVG_NS, "g");
  smallDots(doc2).forEach((d) => dots2.appendChild(d.cloneNode(true)));
  page2.appendChild(dots2);
  const scrollCue = document.createElementNS(SVG_NS, "g");
  scrollCue.setAttribute("id", "afterScrollCue");
  const cueLabel = byStart(doc2, "M953.615"); // [גלול]
  const cueArrow = byStart(doc2, "M971.646"); // the downward arrow
  if (cueLabel) scrollCue.appendChild(cueLabel.cloneNode(true));
  if (cueArrow) scrollCue.appendChild(cueArrow.cloneNode(true));
  scrollCue.style.opacity = "0";
  page2.appendChild(scrollCue);
  // center the cue on the exact horizontal middle of the screen (the
  // artwork sits a little off-center in the source file)
  const cueBB = scrollCue.getBBox();
  if (cueBB.width) {
    scrollCue.setAttribute(
      "transform",
      `translate(${960 - (cueBB.x + cueBB.width / 2)}, 0)`
    );
  }

  /* the transition: page 1's words step aside, page 2 writes itself —
     while the rings above simply keep turning, untouched */
  function goToAfterPage2() {
    if (afterPage2Shown) return;
    afterPage2Shown = true;
    hit.style.pointerEvents = "none";
    const out = page1.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 350,
      easing: "ease-in",
      fill: "forwards",
    });
    out.finished
      .catch(() => {})
      .then(() => {
        page1.style.visibility = "hidden";
      });
    window.setTimeout(() => {
      page2.style.visibility = "visible";
      page2.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        easing: "ease-out",
        fill: "forwards",
      });
      const done = type2 ? type2.run(450) : 450;
      const cueAnim = scrollCue.animate([{ opacity: 0 }, { opacity: 1 }], {
        delay: done + 350,
        duration: 800,
        easing: "ease-out",
        fill: "forwards",
      });
      cueAnim.finished
        .catch(() => {})
        .then(() => {
          scrollCue.style.opacity = "1";
        });
      // the arrow floats gently, same language as the loading screen's cue
      if (cueArrow) {
        const arrowEl = scrollCue.lastChild;
        arrowEl.animate(
          [
            { transform: "translateY(0px)" },
            { transform: "translateY(7px)" },
            { transform: "translateY(0px)" },
          ],
          { delay: done + 350, duration: 3600, iterations: Infinity, easing: "ease-in-out" }
        );
      }
      armScroll();
    }, 300);
  }

  hit.addEventListener("click", goToAfterPage2);

  /* ---- Scroll onward: the rings tilt flat into the horizontal X-axis
     carousel. Reference geometry: the earlier horizontal carousel build
     (reish-milin-copy-5's xSpec). On a downward scroll gesture the text steps
     away, the three rings tilt edge-on and flatten into the horizontal axis,
     and the black (#101010) letters fan out of that line into the strip.
     Visual transition only for now — no navigation or letter-click wired. */
  let xcarStarted = false;
  let scrollArmed = false;

  /* Geometry per the ring reference: the letters sit on a wide, shallow
     elliptical band — generous spacing, each item receding, rising slightly
     and thinning out as it leaves the frame. The profiles are sampled
     CONTINUOUSLY (piecewise-linear over |offset|) so the whole band can turn
     through fractional positions like a real rotating carousel. */
  const XCAR_DIST = [0, 21, 39, 52, 64]; // vw from center — wider spread
  const XCAR_LIFT = [0, -0.6, -1.8, -3.4, -5.4]; // vh — edges rise off the axis
  const XCAR_TILT = [0, 30, 48, 62, 74]; // deg — turned toward center
  const XCAR_DEPTH = [0, -70, -160, -250, -330]; // px translateZ
  const XCAR_SCALE = [1, 0.78, 0.6, 0.45, 0.34];
  const XCAR_FADE = [1, 0.92, 0.8, 0.62, 0]; // atmospheric depth — ink stays #101010
  const XCAR_EDGE = 4; // |offset| at which an item is fully offscreen

  const sampleProfile = (arr, a) => {
    const i = Math.min(Math.floor(a), arr.length - 2);
    const f = Math.min(a, arr.length - 1) - i;
    return arr[i] + (arr[i + 1] - arr[i]) * f;
  };

  const xcarSpec = (o) => {
    const a = Math.min(Math.abs(o), XCAR_EDGE);
    const s = o < 0 ? -1 : 1;
    return {
      transform:
        `translate(calc(-50% + ${-s * sampleProfile(XCAR_DIST, a)}vw), ` +
        `calc(-50% + ${sampleProfile(XCAR_LIFT, a)}vh)) ` +
        `translateZ(${sampleProfile(XCAR_DEPTH, a)}px) ` +
        `rotateY(${s * sampleProfile(XCAR_TILT, a)}deg) ` +
        `scale(${sampleProfile(XCAR_SCALE, a)})`,
      opacity: sampleProfile(XCAR_FADE, a),
    };
  };
  // entrance: collapsed onto the center line — same transform-function order
  // as xcarSpec so WAAPI interpolates the fan-out cleanly.
  const XCAR_ENTER = {
    transform: "translate(-50%, -50%) translateZ(0px) rotateY(0deg) scale(0.16)",
    opacity: 0,
  };

  /* ---- carousel state + the turning machinery ---- */
  const XCAR_N = LETTER_ORDER.length;
  const xcarSlots = []; // { el, li } — one slot per letter, always mounted
  let xcarRoot = null;
  let xcarArrows = [];
  let xcarActive = 0; // letter index standing at the center
  let xcarBusy = false;
  let xcarReady = false;
  let explorationOpen = false;

  // shortest signed distance around the 27-letter loop
  const signedOffset = (li, active) => {
    let d = (li - active) % XCAR_N;
    if (d > XCAR_N / 2) d -= XCAR_N;
    if (d < -XCAR_N / 2) d += XCAR_N;
    return d;
  };

  function layoutXcar(active) {
    xcarSlots.forEach(({ el, li }) => {
      const o = signedOffset(li, active);
      if (Math.abs(o) > XCAR_EDGE + 0.5) {
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
        return;
      }
      const spec = xcarSpec(o);
      el.style.visibility = "";
      el.style.transform = spec.transform;
      el.style.opacity = String(spec.opacity);
      el.style.pointerEvents = Math.abs(o) <= 3.5 && !explorationOpen ? "auto" : "none";
    });
  }

  const easeTurn = (t) => 1 - Math.pow(1 - t, 4);

  /* A real carousel turn: the whole band rotates through the fractional
     positions from the current letter to the target — every letter slides
     along the band's own path into its next slot. Never a swap or a fade.
     Loops infinitely in both directions. */
  function turnXcar(steps) {
    if (xcarBusy || explorationOpen || !xcarReady || !steps) return;
    xcarBusy = true;
    const from = xcarActive;
    const to = from + steps;
    const duration = Math.min(1040, 560 + (Math.abs(steps) - 1) * 160);
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      layoutXcar(from + (to - from) * easeTurn(t));
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }
      xcarActive = ((to % XCAR_N) + XCAR_N) % XCAR_N;
      if (xcarRoot) xcarRoot.dataset.activeLetter = LETTER_ORDER[xcarActive];
      layoutXcar(xcarActive);
      xcarBusy = false;
    };
    requestAnimationFrame(tick);
  }

  /* minimal chevron arrows, same drawing language as the interface's other
     arrows (thin stroke, round caps). RTL like the letter screen: the NEXT
     letter waits on the left, so the left arrow advances, the right returns. */
  function makeXcarArrow(side, dir) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `xcar-arrow xcar-arrow--${side}`;
    btn.setAttribute("aria-label", dir > 0 ? "האות הבאה" : "האות הקודמת");
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 12 20");
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", side === "left" ? "M10 2 3 10l7 8" : "M2 2l7 8-7 8");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "1.5");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    svg.appendChild(p);
    btn.appendChild(svg);
    btn.addEventListener("click", () => turnXcar(dir));
    return btn;
  }

  function onXcarKey(e) {
    if (!xcarReady || explorationOpen || xcarStarted === false) return;
    if (e.key === "ArrowLeft") turnXcar(1);
    else if (e.key === "ArrowRight") turnXcar(-1);
  }

  /* ---- the letter's exploration space ----
     Clicking the centered letter opens its dedicated space: a quick press
     acknowledges the touch, the band and the arrows step back, and the
     chosen letter alone glides up into presence at the center. The
     per-letter content mounts in mountLetterExploration once it exists —
     the routing and the arrival motion are already in place. */
  function pressIntoExploration(slot, li) {
    explorationOpen = true;
    const cell = slot.querySelector(".xcar-cell");
    const press = cell.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.955)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-in-out" }
    );
    press.finished.catch(() => {}).then(() => enterLetterExploration(slot, li));
  }

  function enterLetterExploration(slot, li) {
    const letter = LETTER_ORDER[li];
    if (xcarRoot) xcarRoot.dataset.exploring = letter;
    xcarArrows.forEach((a) => {
      a.style.pointerEvents = "none";
      a.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300, easing: "ease-in", fill: "forwards",
      });
    });
    // the band recedes — the neighbors slide on outward along their own
    // path and dissolve, staggered from the center out
    xcarSlots.forEach(({ el, li: sli }) => {
      if (sli === li) return;
      const o = signedOffset(sli, xcarActive);
      if (Math.abs(o) > XCAR_EDGE + 0.5) return;
      el.style.pointerEvents = "none";
      const away = xcarSpec(o < 0 ? o - 1.2 : o + 1.2);
      el.animate(
        [
          { transform: el.style.transform, opacity: el.style.opacity },
          { transform: away.transform, opacity: 0 },
        ],
        {
          delay: Math.min(Math.abs(o), 3) * 55,
          duration: 460,
          easing: "cubic-bezier(0.5, 0, 0.2, 1)",
          fill: "forwards",
        }
      );
    });
    slot.style.pointerEvents = "none";

    /* Decomposition letters (ש, and the others as their פירוק files are
       wired) never show their finished fill here: the given form withdraws
       with the band, and the letter's stroke construction — its inner
       logic — becomes the event of the screen. */
    if (hasBuild(letter)) {
      slot.animate(
        [{ opacity: slot.style.opacity || "1" }, { opacity: 0 }],
        { delay: 100, duration: 380, easing: "ease-in", fill: "forwards" }
      );
      mountBuildExploration(letter);
      return;
    }

    // the chosen letter glides up into presence
    const up = "translate(-50%, -50%) translateZ(0px) rotateY(0deg) scale(1.5)";
    slot
      .animate([{ transform: slot.style.transform }, { transform: up }], {
        delay: 120,
        duration: 620,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      })
      .finished.catch(() => {})
      .then(() => {
        slot.style.transform = up;
        mountLetterExploration(letter, slot);
      });
  }

  // Per-letter exploration content drops in here later.
  function mountLetterExploration(letter, host) { /* awaiting per-letter content */ }

  /* ---- construction exploration (decomposition letters) ----
     Reuses the project's stroke-construction system (build.js) — the same
     typographic normalization (component sizes drawn from the designed
     alphabet's own ink proportions, never equal boxes) and the same
     three-beat choreography, which carries the שי"ן of ראש מילין:
     the component forms emerge separately, each written by its own point
     of light (התפרטות, כמה קצות־אור); they branch precisely into their
     several places (כמה כיווני הופעה, ריבוי מאורגן); and the letter's own
     strokes ink through them, gathering the plurality into one form
     (ועדיין מתוך אחדות אחת). Black on the light field. */
  let xcarBuild = null;
  function mountBuildExploration(letter) {
    const stage = document.createElement("div");
    stage.className = "xcar-build";
    const box = document.createElement("div");
    box.className = "xcar-build-stage";
    stage.appendChild(box);
    (xcarRoot || document.body).appendChild(stage);
    stage.style.opacity = "0";
    const arrive = stage.animate([{ opacity: 0 }, { opacity: 1 }], {
      delay: 240,
      duration: 500,
      easing: "ease-out",
      fill: "forwards",
    });
    arrive.finished
      .catch(() => {})
      .then(() => {
        stage.style.opacity = "1";
        try { arrive.cancel(); } catch (err) { /* fine */ }
      });
    createBuildStage(letter, box).then((build) => {
      xcarBuild = build;
    });
  }

  function onScrollIntent(e) {
    const down =
      e.type === "wheel" ? e.deltaY > 0 :
      e.type === "keydown" ? ["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key) :
      true; // touchmove
    if (!down) return;
    if (e.cancelable) e.preventDefault();
    runRingsToCarousel();
  }
  function armScroll() {
    if (scrollArmed) return;
    scrollArmed = true;
    window.addEventListener("wheel", onScrollIntent, { passive: false });
    window.addEventListener("touchmove", onScrollIntent, { passive: false });
    window.addEventListener("keydown", onScrollIntent);
  }
  function removeScrollArm() {
    window.removeEventListener("wheel", onScrollIntent);
    window.removeEventListener("touchmove", onScrollIntent);
    window.removeEventListener("keydown", onScrollIntent);
  }

  function runRingsToCarousel() {
    if (xcarStarted) return;
    xcarStarted = true;
    removeScrollArm();

    // 1 — the text steps away, cleanly
    hit.style.pointerEvents = "none";
    [page1, page2].forEach((pg) => {
      const from = Number(getComputedStyle(pg).opacity) || 0;
      pg.animate([{ opacity: from }, { opacity: 0 }], {
        duration: 380, easing: "ease-in", fill: "forwards",
      }).finished.then(() => { pg.style.visibility = "hidden"; }).catch(() => {});
    });

    // 2 — the three rings tilt edge-on and flatten into the horizontal axis
    ringField.style.transformOrigin = `${CX}px ${CY}px`;
    ringField.animate(
      [{ transform: `scale(${RING_SCALE})` }, { transform: "scale(1.55, 0.02)" }],
      { duration: 640, easing: "cubic-bezier(0.5, 0, 0.2, 1)", fill: "forwards" }
    );
    ringField.animate(
      [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 0, offset: 1 }],
      { duration: 820, easing: "ease-in", fill: "forwards" }
    );

    // 3 — the flattened line resolves into the carousel: the black letters
    //     fan out of the center along the axis into their slots
    const xcar = document.createElement("div");
    xcar.className = "xcar";
    xcarRoot = xcar;
    xcar.dataset.activeLetter = LETTER_ORDER[0];
    const space = document.createElement("div");
    space.className = "xcar-space";
    xcar.appendChild(space);
    document.body.appendChild(xcar);

    // one slot per letter — the whole alphabet lives on the band, so it can
    // turn forever in either direction with no rebuilds
    for (let li = 0; li < XCAR_N; li += 1) {
      const glyph = getFillPreview(LETTER_ORDER[li]);
      if (!glyph) continue;
      const slot = document.createElement("div");
      slot.className = "xcar-slot";
      const cell = document.createElement("div");
      cell.className = "xcar-cell";
      cell.appendChild(glyph);
      slot.appendChild(cell);
      slot.style.visibility = "hidden";
      slot.style.opacity = "0";
      slot.style.pointerEvents = "none";
      // center letter -> its exploration space; a side letter sweeps itself
      // into the center (the same carousel turn)
      slot.addEventListener("click", () => {
        if (xcarBusy || explorationOpen || !xcarReady) return;
        const o = Math.round(signedOffset(li, xcarActive));
        if (o === 0) pressIntoExploration(slot, li);
        else turnXcar(o);
      });
      space.appendChild(slot);
      xcarSlots.push({ el: slot, li });
    }

    // entrance: the visible letters fan out of the flattened axis. Each
    // entrance animation is cancelled after handing its final state to the
    // inline style, so the turning machinery owns the transforms from there.
    let entranceEnd = 0;
    xcarSlots.forEach(({ el, li }) => {
      const o = signedOffset(li, 0);
      if (Math.abs(o) > XCAR_EDGE) return;
      const to = xcarSpec(o);
      el.style.visibility = "";
      el.style.transform = XCAR_ENTER.transform;
      const delay = 220 + Math.abs(o) * 70;
      entranceEnd = Math.max(entranceEnd, delay + 560);
      const anim = el.animate(
        [XCAR_ENTER, { transform: to.transform, opacity: to.opacity }],
        { delay, duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
      );
      anim.finished
        .catch(() => {})
        .then(() => {
          el.style.transform = to.transform;
          el.style.opacity = String(to.opacity);
          try { anim.cancel(); } catch (err) { /* fine */ }
        });
    });

    // the navigation arrows arrive with the band
    const leftArrow = makeXcarArrow("left", 1);
    const rightArrow = makeXcarArrow("right", -1);
    xcarArrows = [leftArrow, rightArrow];
    xcar.appendChild(leftArrow);
    xcar.appendChild(rightArrow);
    xcarArrows.forEach((a) => {
      a.style.opacity = "0";
      const anim = a.animate([{ opacity: 0 }, { opacity: 1 }], {
        delay: Math.max(0, entranceEnd - 160),
        duration: 420,
        easing: "ease-out",
        fill: "forwards",
      });
      anim.finished
        .catch(() => {})
        .then(() => {
          a.style.opacity = "";
          try { anim.cancel(); } catch (err) { /* fine */ }
        });
    });

    window.setTimeout(() => {
      layoutXcar(xcarActive);
      xcarReady = true;
    }, entranceEnd + 60);
    window.addEventListener("keydown", onXcarKey);
  }
}

/* ---- Scroll progress indicator ---- */

const scrollIndicator = document.getElementById("scrollIndicator");
const scrollDots = Array.from(scrollIndicator.querySelectorAll(".scroll-dot"));

function updateActiveDot() {
  // the dive (screen index 3) is a deeper state of the sphere screen — the
  // third dot stays active through it
  const screenIndex = Math.min(2, Math.round(window.scrollY / window.innerHeight));
  scrollDots.forEach((dot, i) => dot.classList.toggle("is-active", i === screenIndex));
  // visible on screens 2 and 3 (index 1, 2) — hidden on the screen 1 loading
  // view and while the letter carousel overlay is open.
  const carouselOpen = letterScreen.classList.contains("is-open");
  scrollIndicator.classList.toggle("is-visible", screenIndex >= 1 && !carouselOpen);
}

/* ---- Nav dot + nav bar ----
   The one dot-to-menu interaction in the interface: the buttons sit
   collapsed on the dot (scaled down, translated onto its exact center) and
   unfold outward into place on open — never a dropdown or a fade. Shared by
   every dot in the interface (screen 3's own dot, and the after-screen's
   black dot below) via wireDotMenu, so every menu trigger behaves and
   animates identically; only the color varies per screen. */
function wireDotMenu(dot, bar) {
  const links = Array.from(bar.querySelectorAll(".nav-link"));

  function positionLinksFromDot() {
    const dotRect = dot.getBoundingClientRect();
    const dotX = dotRect.left + dotRect.width / 2;
    const dotY = dotRect.top + dotRect.height / 2;

    links.forEach((link, i) => {
      const linkRect = link.getBoundingClientRect();
      const linkX = linkRect.left + linkRect.width / 2;
      const linkY = linkRect.top + linkRect.height / 2;
      link.style.setProperty("--dot-dx", `${dotX - linkX}px`);
      link.style.setProperty("--dot-dy", `${dotY - linkY}px`);
      link.style.setProperty("--nav-delay", `${i * 55}ms`);
    });
  }

  positionLinksFromDot();
  window.addEventListener("resize", positionLinksFromDot);

  dot.addEventListener("click", () => {
    const isOpen = bar.classList.toggle("is-open");
    dot.classList.toggle("is-open", isOpen);
    dot.setAttribute("aria-expanded", String(isOpen));
    bar.setAttribute("aria-hidden", String(!isOpen));
  });

  return positionLinksFromDot;
}

const navDot = document.getElementById("navDot");
const navBar = document.getElementById("navBar");
wireDotMenu(navDot, navBar);

function frame() {
  // re-register FIRST so a transient error can never kill the loop
  requestAnimationFrame(frame);
  try {
    updateLogoTransition();
    updateSphereTransition();
    updateActiveDot();
  } catch (err) {
    /* keep the loop alive; the next frame recovers */
  }
}

requestAnimationFrame(frame);
window.addEventListener(
  "scroll",
  () => {
    updateLogoTransition();
    updateSphereTransition();
    updateActiveDot();
  },
  { passive: true }
);

/* ---- Letters + nikud sphere ---- */

const sphereEl = document.getElementById("sphere");
if (sphereEl) buildLettersSphere(sphereEl).then(snapshotSphereNodes);

/* ---- Sphere letter -> letter screen (scalable routing + transition) ----
   Only letters (never nikud) are clickable. The clicked letter's own visible
   glyph is cloned once, flown (via a single FLIP-style transform, no layout
   thrashing) from its exact sphere position into the letter screen's stage,
   then handed off as that stage's permanent content — no duplicate letter
   left behind. Reversible: clicking the logo while a letter screen is open
   flies the same clone back and restores the sphere exactly as it was. */

const letterScreen = document.getElementById("letterScreen");
const letterStage = document.getElementById("letterStage");
const letterBack = document.getElementById("letterBack");
const buildStage = document.getElementById("buildStage");
const carouselSpace = document.getElementById("carouselSpace");
const arrowUp = document.getElementById("arrowUp");
const arrowDown = document.getElementById("arrowDown");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");
const FLIGHT_MS = 750;
const FLIGHT_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
// A sharp, fast "lock into place" curve (ease-out-expo family) rather than
// a soft symmetric ease — the slide travels quickly, then settles precisely.
const CAROUSEL_MS = 480;
const CAROUSEL_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

let letterTransitionBusy = false;
let activeLetterNode = null;
let carouselLetterIndex = 0;
let carouselVariationIndex = 0;
let carouselVariations = [];

function setSphereMotion(playState) {
  sphereEl.style.animationPlayState = playState;
  sphereEl.querySelectorAll(".sphere-node-inner").forEach((el) => {
    el.style.animationPlayState = playState;
  });
}

// Web Animations' `finished` promise can fail to settle in some conditions
// (observed in backgrounded/hidden tabs) — never let a stuck animation
// permanently block the carousel's busy-guard, cap the wait explicitly.
// Canceling always runs exactly once, whichever settles first, since a
// still-running animation's `fill: forwards` would otherwise keep
// overriding any style set right after.
function settleAnim(anim, durationMs) {
  const done = anim.finished.catch(() => {});
  const timeout = new Promise((resolve) => window.setTimeout(resolve, durationMs + 200));
  return Promise.race([done, timeout]).then(() => {
    try {
      anim.cancel();
    } catch (err) {
      /* already finished/canceled — fine */
    }
  });
}

// The letter geometry between the sphere (near-square glyph face) and the
// carousel (tall center region) has different box aspect ratios. Scaling a
// clone from one box to the other with separate sx/sy warps the letter — so
// instead we anchor the clone at ONE box and move it with a single UNIFORM
// scale. The glyph SVG uses preserveAspectRatio="xMidYMid meet", so it stays
// proportional inside any box; matching the glyph's rendered HEIGHT (not the
// box) makes the two endpoints line up in size without ever distorting.

function svgAspect(svgEl) {
  const vb = svgEl && svgEl.getAttribute("viewBox");
  if (!vb) return 1;
  const p = vb.split(/\s+/).map(Number);
  return p[3] ? p[2] / p[3] : 1; // glyph width / height
}

// Rendered glyph size inside a box, honouring `meet` (fit-inside).
function glyphRenderedSize(boxW, boxH, aspect) {
  if (!boxH) return { w: 0, h: 0 };
  if (aspect > boxW / boxH) {
    return { w: boxW, h: boxW / aspect }; // width-limited
  }
  return { w: boxH * aspect, h: boxH }; // height-limited
}

// Transform that places the anchored clone so its glyph matches `rect`.
function flightState(rect, anchor, anchorGlyphH, aspect) {
  const g = glyphRenderedSize(rect.width, rect.height, aspect);
  const scale = anchorGlyphH ? g.h / anchorGlyphH : 1;
  const dx = rect.left + rect.width / 2 - (anchor.left + anchor.width / 2);
  const dy = rect.top + rect.height / 2 - (anchor.top + anchor.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

function flyClone(clone, startRect, endRect) {
  const svgEl = clone.querySelector("svg");
  const aspect = svgAspect(svgEl);

  // Lay the clone out at the LARGER box so it only ever scales DOWN — the
  // SVG stays crisp (no upscaling blur) across the whole flight.
  const startArea = startRect.width * startRect.height;
  const endArea = endRect.width * endRect.height;
  const anchor = startArea >= endArea ? startRect : endRect;

  clone.style.position = "fixed";
  clone.style.left = `${anchor.left}px`;
  clone.style.top = `${anchor.top}px`;
  clone.style.width = `${anchor.width}px`;
  clone.style.height = `${anchor.height}px`;
  clone.style.transformOrigin = "center center";

  const anchorGlyphH = glyphRenderedSize(anchor.width, anchor.height, aspect).h;
  const fromState = flightState(startRect, anchor, anchorGlyphH, aspect);
  const toState = flightState(endRect, anchor, anchorGlyphH, aspect);

  const anim = clone.animate(
    [{ transform: fromState }, { transform: toState }],
    { duration: FLIGHT_MS, easing: FLIGHT_EASING, fill: "forwards" }
  );
  return settleAnim(anim, FLIGHT_MS);
}

// The carousel center letter renders in a region inset 12% inside the
// letter-stage (see .center-letter-svg) — the flight targets that exact
// region so the clone lands seamlessly on the real card.
function centerRegionRect() {
  const s = letterStage.getBoundingClientRect();
  return {
    left: s.left + s.width * 0.12,
    top: s.top + s.height * 0.12,
    width: s.width * 0.76,
    height: s.height * 0.76,
  };
}

/* ---- Orbital double-axis carousel ----
   Per the reference: ALL letters float on one wide elliptical orbit around
   the active letter, which stands alone at the exact center of the ring.
   Every letter faces forward (billboard) — depth presence comes from the
   orbit's perspective: items at the front of the orbit pass low and close,
   items at the back rise high and recede. Clicking any orbit letter sweeps
   the whole ring around until that letter arrives and stands in the center;
   the previous center letter returns to its slot on the orbit. The vertical
   variations carousel runs through the same center, activating for whichever
   letter currently stands there. */

const RING_COUNT = LETTER_ORDER.length; // 27 — active in center, 26 on orbit
const RING_RX = 38; // vw — orbit half-width
const RING_RY = 15; // vh — orbit half-height on screen (tilted-orbit look)
const RING_Z_MID = -70; // px — orbit plane depth
const RING_Z_AMP = 200; // px — front/back depth swing
const RING_SCALE_BASE = 0.34;
const RING_SCALE_SWING = 0.1;

// Vertical variations strip: forward-facing like the orbit, receding by
// depth and scale only.
const Y_DIST = [0, 26, 42, 54]; // vh from center
const Y_DEPTH = [0, -60, -140, -220]; // px translateZ
const Y_SCALE = [1, 0.55, 0.36, 0.24];
// Every VISIBLE item stays fully opaque so its 3D extrude is never
// flattened — CSS forces `transform-style: flat` on any element with
// opacity < 1 or a filter. Only the offscreen entering/exiting state fades.
const Y_OPACITY = [1, 1, 1, 0];

function makeSpec(xVw, yVh, z, rotY, rotX, scale, opacity) {
  return {
    transform:
      `translate(calc(-50% + ${xVw}vw), calc(-50% + ${yVh}vh)) ` +
      `translateZ(${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`,
    opacity: String(opacity),
  };
}

// Orbit position for a continuous slot value d (0..27, periodic). d is the
// distance ahead of the active letter in alphabet order; RTL: the NEXT
// letter (d=1) sits front-left, the PREVIOUS (d=26) front-right.
function ringAngle(d) {
  return (d / RING_COUNT) * Math.PI * 2;
}

function ringSpecAtAngle(th) {
  const x = -RING_RX * Math.sin(th);
  const y = RING_RY * Math.cos(th); // front of orbit lower, back higher
  const z = RING_Z_MID + RING_Z_AMP * Math.cos(th);
  const s = RING_SCALE_BASE + RING_SCALE_SWING * Math.cos(th);
  return makeSpec(x, y, z, 0, 0, s, 1);
}

function ringSpec(d) {
  return ringSpecAtAngle(ringAngle(d));
}

// The center stage spec (the active letter standing in the middle).
function centerSpec() {
  return makeSpec(0, 0, 0, 0, 0, 1, 1);
}

// Variations strip: NEXT variations (positive offset) sit BELOW the center.
function ySpec(v) {
  const a = Math.min(Math.abs(v), 3);
  const s = Math.sign(v);
  return makeSpec(0, s * Y_DIST[a], Y_DEPTH[a], 0, 0, Y_SCALE[a], Y_OPACITY[a]);
}

function applySpec(el, spec) {
  el.style.transform = spec.transform;
  el.style.opacity = spec.opacity;
}

/* ---- Ring drift ----
   The orbit is never frozen: a very slow continuous rotation keeps the
   carousel quietly alive in space, from the moment it enters. The phase is
   folded into every ring placement (rebuilds, sweeps, the build-mode
   split), so the drift never fights the navigation animations — it simply
   pauses while a transition owns the slots and resumes from the same
   phase, with no jump. */
const RING_DRIFT_SPEED = 1 / 45000; // slots per ms — one slot every 45s
let ringPhase = 0;
let ringDriftLast = null;

function ringSpecP(d) {
  return ringSpec(d + ringPhase);
}

function ringSpecBuildP(d) {
  return ringSpecBuild(d + ringPhase);
}

function driftTick(now) {
  window.requestAnimationFrame(driftTick);
  const last = ringDriftLast;
  ringDriftLast = now;
  if (last === null) return;
  if (letterTransitionBusy || !letterScreen.classList.contains("is-open")) return;
  ringPhase = (ringPhase + Math.min(100, now - last) * RING_DRIFT_SPEED) % RING_COUNT;
  const build = inBuildMode();
  carouselSpace.querySelectorAll(".carousel-slot--x").forEach((el) => {
    const d = Number(el.dataset.offset);
    el.style.transform = (build ? ringSpecBuildP(d) : ringSpecP(d)).transform;
  });
}
window.requestAnimationFrame(driftTick);

/* ---- Uniform sizing ----
   Every carousel item is re-fitted to a uniform, centered square viewBox
   around its own tight ink bounds, so all letters, all final forms, and all
   fill/stroke/tagin variations fill the same visual cell at the same size —
   the raw asset viewBox/canvas no longer affects the displayed size, and
   there is no size jump when switching letters or variations. */
const UNIFORM_PAD = 0.14;

// Measure the glyph's tight ink bounds. getBBox() only works on an element
// that is actually attached to a rendered SVG in the document, so we mount
// the clone in a fresh throwaway offscreen <svg> for the measurement — a
// persistent shared host proved unreliable (it could be detached before the
// measurement ran, silently returning zero and skipping normalization).
function measureTightBox(svgEl) {
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
  return bb && bb.width && bb.height ? bb : null;
}

function uniformGlyphSvg(svgEl) {
  const clone = svgEl.cloneNode(true);
  const bb = measureTightBox(svgEl);
  if (!bb) return clone;
  const side = Math.max(bb.width, bb.height) * (1 + UNIFORM_PAD * 2);
  const cx = bb.x + bb.width / 2;
  const cy = bb.y + bb.height / 2;
  clone.setAttribute("viewBox", `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return clone;
}

// Physical thickness for the CAROUSEL items: a tall stack of copies rising
// off the card toward the viewer, shaded from dark (back) to a lit warm gray
// (front) so the bevel reads clearly against the black background when the
// card is turned. Capped by the full-light front face. The active center
// letter is exempt — it shows flat, in its regular 2D state, on its flip
// card, per the intended 3D-carousel / 2D-selection contrast.
const EXTRUDE_LAYERS = 16;
const EXTRUDE_STEP_PX = 5;

function extrudeColor(t) {
  // Deep, clearly-lit bevel: dark at the base (reads against the card),
  // brightening steeply toward the front cap so the thickness band is
  // unmistakable on the turned ring cards.
  const back = [40, 38, 33];
  const near = [200, 194, 178];
  const e = Math.pow(t, 0.8);
  const c = back.map((b, i) => Math.round(b + (near[i] - b) * e));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function makeGlyph3D(rawSvg) {
  const svgEl = uniformGlyphSvg(rawSvg);
  const wrap = document.createElement("div");
  wrap.className = "glyph-3d";
  for (let i = 1; i <= EXTRUDE_LAYERS; i += 1) {
    const layer = svgEl.cloneNode(true);
    layer.setAttribute("class", "glyph-3d-layer");
    layer.style.color = extrudeColor(i / EXTRUDE_LAYERS);
    layer.style.transform = `translateZ(${i * EXTRUDE_STEP_PX}px)`;
    wrap.appendChild(layer);
  }
  const front = svgEl.cloneNode(true);
  front.setAttribute("class", "glyph-3d-front");
  front.style.transform = `translateZ(${(EXTRUDE_LAYERS + 1) * EXTRUDE_STEP_PX}px)`;
  wrap.appendChild(front);
  return wrap;
}

// A preview slot: the extruded letter floating in its cell. When the slot
// shows the default FILL of a letter that has a real 3D source
// (assets/letters3d), it renders the true extruded mesh instead of the
// layered stack — so א appears as its real 3D self everywhere in the
// carousel, not only in the selected center state.
function makeCarouselSlot(svg, spec, offset, extraClass, fill3DLetter) {
  const el = document.createElement("div");
  el.className = extraClass ? `carousel-slot ${extraClass}` : "carousel-slot";
  el.dataset.offset = String(offset);
  const card = document.createElement("div");
  card.className = "letter-card";
  if (fill3DLetter && has3DLetter(fill3DLetter)) {
    const mount = document.createElement("div");
    mount.className = "letter3d-mount letter3d-mount--preview";
    card.appendChild(mount);
    mount3DLetter(mount, fill3DLetter, { interactive: false });
  } else {
    card.appendChild(makeGlyph3D(svg));
  }
  el.appendChild(card);
  applySpec(el, spec);
  return el;
}

// Live real-3D letter instances (center + any carousel previews). All must
// be disposed before their canvases are detached, or draw loops leak.
const live3D = new Set();

function mount3DLetter(container, letter, opts) {
  const handle = createLetter3D(container, letter, opts);
  live3D.add(handle);
  return handle;
}

function disposeLetter3D() {
  live3D.forEach((h) => h.dispose());
  live3D.clear();
}

// The center slot: a flip card. Front = the active letter (the default
// fill variation of א renders as a REAL extruded, draggable 3D letter from
// assets/letters3d; every other letter/variation stays the regular flat
// 2D version). Back = the letter's name and explanation. Click flips.
function makeCenterSlot(variation, letter) {
  const el = document.createElement("div");
  el.className = "carousel-slot letter-content";
  el.dataset.offset = "0";

  const flip = document.createElement("div");
  flip.className = "flip-card";

  const front = document.createElement("div");
  front.className = "card-face card-front letter-card";

  const use3D = variation.key === "fill" && has3DLetter(letter);
  let mount3D = null;
  if (use3D) {
    mount3D = document.createElement("div");
    mount3D.className = "letter3d-mount";
    front.appendChild(mount3D);
    mount3DLetter(mount3D, letter);
  } else {
    const flatSvg = uniformGlyphSvg(variation.svg);
    flatSvg.setAttribute("class", "center-letter-svg");
    flatSvg.removeAttribute("style");
    front.appendChild(flatSvg);
  }

  const back = document.createElement("div");
  back.className = "card-face card-back letter-card";
  const info = LETTER_INFO[letter] || { name: letter, text: "" };
  const title = document.createElement("div");
  title.className = "card-back-title";
  title.textContent = info.name;
  const text = document.createElement("div");
  text.className = "card-back-text";
  text.textContent = info.text;
  back.appendChild(title);
  back.appendChild(text);

  flip.appendChild(front);
  flip.appendChild(back);
  el.appendChild(flip);

  el.addEventListener("click", () => {
    // a rotation drag on the 3D letter must not read as a flip click
    if (mount3D && mount3D.dataset.dragging3d === "1") return;
    flip.classList.toggle("is-flipped");
  });

  applySpec(el, centerSpec());
  return el;
}

// Canonical render of the current state: the active letter standing in the
// center, ALL other 26 letters on the orbit around it, and the variations
// strip through the center. Called after each sweep settles — the sweep's
// final keyframes match these positions exactly, so the rebuild is
// invisible.
function rebuildCarousel() {
  disposeLetter3D();
  carouselSpace.replaceChildren();
  const variation = carouselVariations[carouselVariationIndex];

  const activeLetter = LETTER_ORDER[carouselLetterIndex];
  const n = carouselVariations.length;
  // The variations strip is the NEXT layer of exploration: for letters with
  // a construction animation it stays absent until the letter has been
  // built (yAxisRevealed flips when returning from the build screen).
  if (yAxisRevealed && n >= 2) {
    const offsets = n >= 4 ? [-2, -1, 1, 2] : [-1, 1];
    offsets.forEach((v) => {
      const va = carouselVariations[(((carouselVariationIndex + v) % n) + n) % n];
      if (va && va.svg) {
        const fill3D = va.key === "fill" ? activeLetter : null;
        carouselSpace.appendChild(makeCarouselSlot(va.svg, ySpec(v), v, "carousel-slot--y", fill3D));
      }
    });
  }

  for (let d = 1; d < RING_COUNT; d += 1) {
    const letterIdx = nextLetterIndex(carouselLetterIndex, d);
    const letter = LETTER_ORDER[letterIdx];
    const svg = getFillPreview(letter);
    if (svg) {
      // orbit previews always show the fill state — so א rides the orbit
      // as its real 3D self too
      const el = makeCarouselSlot(svg, ringSpecP(d), d, "carousel-slot--x", letter);
      el.dataset.letterIndex = String(letterIdx);
      el.addEventListener("click", () => navigateToLetter(letterIdx));
      carouselSpace.appendChild(el);
    }
  }

  if (variation && variation.svg) {
    carouselSpace.appendChild(makeCenterSlot(variation, LETTER_ORDER[carouselLetterIndex]));
  }

  scheduleAutoBuild();
}

/* ---- Build screen (מסך בניית האות) ----
   A deeper state of the letter screen: the carousel recedes (smaller,
   dimmed, softly blurred), the Y-axis variations and arrows disappear, and
   the center stages the two-stage stroke construction of the active letter
   (build.js). It begins on its own: arriving at a letter that has a פירוק
   file, the carousel rests for a few seconds and the construction then
   starts automatically — no click needed. */

const AUTO_BUILD_DELAY_MS = 500; // the carousel shows itself only briefly
const BUILD_HOLD_MS = 1500; // contemplation on the finished letter
let autoBuildTimer = null;
let buildHandle = null;
let buildDoneTimer = null;
let buildCompleted = false; // did this visit's construction reach its end?

function cancelBuildFinish() {
  if (buildDoneTimer !== null) {
    window.clearTimeout(buildDoneTimer);
    buildDoneTimer = null;
  }
}

// When the construction completes (plus a short hold on the finished
// letter), the screen returns to the carousel on its own — and only a
// completed build unlocks the variations strip.
function scheduleBuildFinish(ms) {
  cancelBuildFinish();
  buildDoneTimer = window.setTimeout(() => {
    buildDoneTimer = null;
    buildCompleted = true;
    if (!inBuildMode()) return;
    if (letterTransitionBusy) {
      scheduleBuildFinish(300); // a transition owns the stage — retry shortly
      return;
    }
    exitBuildMode();
  }, ms);
}

/* ---- Y-axis gating ----
   For letters that have a construction animation, the variations strip is
   hidden on arrival and revealed only after the letter has been built —
   first the letter is introduced, then its variations open up. Letters
   without a build file keep their variations immediately. */
let yAxisRevealed = true;

function resetYReveal(letter) {
  yAxisRevealed = !hasBuild(letter);
  letterScreen.classList.toggle("is-y-hidden", !yAxisRevealed);
  // A new letter earns a fresh construction; the once-per-visit guard resets
  // here (and only here) so the build plays exactly once on entry.
  buildCompleted = false;
}

// The strip's entrance: each variation slides in from one step further out
// along its own axis direction, fading up — the same motion language as the
// Y navigation itself.
function revealYAxis() {
  if (yAxisRevealed) return;
  yAxisRevealed = true;
  letterScreen.classList.remove("is-y-hidden");
  const n = carouselVariations.length;
  if (n < 2) return;
  const activeLetter = LETTER_ORDER[carouselLetterIndex];
  const offsets = n >= 4 ? [-2, -1, 1, 2] : [-1, 1];
  offsets.forEach((v) => {
    const va = carouselVariations[(((carouselVariationIndex + v) % n) + n) % n];
    if (va && va.svg) {
      const fill3D = va.key === "fill" ? activeLetter : null;
      const from = { ...ySpec(v + Math.sign(v)), opacity: "0" };
      const el = makeCarouselSlot(va.svg, from, v, "carousel-slot--y", fill3D);
      carouselSpace.appendChild(el);
      animateSpec(el, from, ySpec(v), (Math.abs(v) - 1) * 70, 560);
    }
  });
}

/* The orbit's build-mode geometry: opened toward the sides, flatter and a
   little smaller — the ring parts to clear the center for the construction
   while staying present as quiet background context. */
const BUILD_RING_RX = 47; // vw
const BUILD_RING_RY = 11; // vh
const BUILD_RING_SCALE = 0.72;

function ringSpecBuild(d) {
  const th = ringAngle(d);
  const x = -BUILD_RING_RX * Math.sin(th);
  const y = BUILD_RING_RY * Math.cos(th);
  const z = RING_Z_MID + RING_Z_AMP * Math.cos(th);
  const s = (RING_SCALE_BASE + RING_SCALE_SWING * Math.cos(th)) * BUILD_RING_SCALE;
  return makeSpec(x, y, z, 0, 0, s, 1);
}

// Transform-only slot animation — opacity is owned by the build-mode CSS
// (the dim/blur transitions), so it must not be animated here.
function animateSlotTransform(el, fromSpec, toSpec, duration) {
  const anim = el.animate(
    [{ transform: fromSpec.transform }, { transform: toSpec.transform }],
    { duration, easing: CAROUSEL_EASING, fill: "both" }
  );
  return settleAnim(anim, duration).then(() => {
    el.style.transform = toSpec.transform;
  });
}

// Every orbit letter glides between its regular ring position and the
// opened build-mode ring (and back).
function splitRing(toBuild, duration) {
  const jobs = [];
  carouselSpace.querySelectorAll(".carousel-slot--x").forEach((el) => {
    const d = Number(el.dataset.offset);
    const from = toBuild ? ringSpecP(d) : ringSpecBuildP(d);
    const to = toBuild ? ringSpecBuildP(d) : ringSpecP(d);
    jobs.push(animateSlotTransform(el, from, to, duration));
  });
  return Promise.all(jobs);
}

function inBuildMode() {
  return letterScreen.classList.contains("is-build-mode");
}

function cancelAutoBuild() {
  if (autoBuildTimer !== null) {
    window.clearTimeout(autoBuildTimer);
    autoBuildTimer = null;
  }
}

// Armed every time the carousel settles on a letter that has a construction
// file. If the moment is wrong when it fires (mid-transition, or the user is
// reading the flipped explanation card), it quietly waits another round.
function scheduleAutoBuild() {
  cancelAutoBuild();
  if (!letterScreen.classList.contains("is-open") || inBuildMode()) return;
  // The construction plays once per letter visit only. After it has run, a
  // canonical rebuild (e.g. switching Y-axis variations) must NOT re-arm it —
  // switching variations only changes the variation, never rebuilds.
  if (buildCompleted) return;
  if (!hasBuild(LETTER_ORDER[carouselLetterIndex])) return;
  autoBuildTimer = window.setTimeout(() => {
    autoBuildTimer = null;
    if (letterTransitionBusy || carouselSpace.querySelector(".flip-card.is-flipped")) {
      scheduleAutoBuild();
      return;
    }
    enterBuildMode();
  }, AUTO_BUILD_DELAY_MS);
}

async function enterBuildMode() {
  if (letterTransitionBusy || !letterScreen.classList.contains("is-open") || inBuildMode()) return;
  const letter = LETTER_ORDER[carouselLetterIndex];
  if (!hasBuild(letter)) return;

  letterTransitionBusy = true;
  cancelAutoBuild();
  buildCompleted = false;
  letterScreen.classList.add("is-build-mode");
  buildStage.setAttribute("aria-hidden", "false");

  // the orbit opens toward the sides and quiets down, then the build begins
  try {
    await splitRing(true, 550);
    buildHandle = await createBuildStage(letter, buildStage);
    scheduleBuildFinish(((buildHandle && buildHandle.totalMs) || 9000) + BUILD_HOLD_MS);
  } catch (err) {
    buildHandle = null;
  } finally {
    letterTransitionBusy = false;
  }
}

function exitBuildMode() {
  if (letterTransitionBusy || !inBuildMode()) return;
  letterTransitionBusy = true;
  cancelBuildFinish();
  letterScreen.classList.remove("is-build-mode");
  buildStage.setAttribute("aria-hidden", "true");
  const handle = buildHandle;
  buildHandle = null;
  // the stage fades out via CSS; clear its contents once it's invisible.
  // No auto re-entry here — the user chose to step back to the carousel;
  // the build re-arms only when they navigate away and return.
  window.setTimeout(() => {
    if (handle) handle.dispose();
  }, 650);
  splitRing(false, 600).finally(() => {
    letterTransitionBusy = false;
    // only a construction that reached its end unlocks the variations —
    // the strip is the next layer AFTER the letter has been built
    if (buildCompleted) revealYAxis();
  });
}

const STAGGER_MS = 26;

function animateSpec(el, from, to, delay = 0, duration = CAROUSEL_MS) {
  const anim = el.animate([from, to], {
    duration,
    delay,
    easing: CAROUSEL_EASING,
    fill: "both",
  });
  return settleAnim(anim, duration + delay).then(() => applySpec(el, to));
}

// Multi-keyframe animation along the orbit's elliptical arc — a straight
// line between two orbit slots would cut across the ring, so the path is
// sampled at intermediate angles instead.
function animateAlongRing(el, dFrom, dTo, duration) {
  const steps = Math.min(24, Math.max(2, Math.round(Math.abs(dTo - dFrom) * 3)));
  const frames = [];
  for (let i = 0; i <= steps; i += 1) {
    const d = dFrom + ((dTo - dFrom) * i) / steps;
    const spec = ringSpecAtAngle(ringAngle(d + ringPhase));
    frames.push({ transform: spec.transform, opacity: spec.opacity });
  }
  const anim = el.animate(frames, { duration, easing: CAROUSEL_EASING, fill: "both" });
  return settleAnim(anim, duration).then(() => {
    const last = frames[frames.length - 1];
    el.style.transform = last.transform;
    el.style.opacity = last.opacity;
  });
}

// Shortest signed rotation (in slots) that brings `to` to the front.
function shortestDelta(from, to, n) {
  let d = (((to - from) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

// One sweep of the orbit: every letter glides `delta` slots along the
// ellipse; the target letter leaves the orbit and comes forward to stand in
// the center, while the old center letter returns to the orbit at the slot
// that opened behind it. carouselLetterIndex is already the NEW letter when
// this runs.
function sweepRing(delta, oldActiveIdx) {
  const jobs = [];
  const duration = Math.min(920, CAROUSEL_MS + (Math.abs(delta) - 1) * 60);

  carouselSpace.querySelectorAll(".carousel-slot--x").forEach((el) => {
    const letterIdx = Number(el.dataset.letterIndex);
    const dFrom = Number(el.dataset.offset);
    if (letterIdx === carouselLetterIndex) {
      // the chosen letter comes forward and stands in the center
      jobs.push(animateSpec(el, ringSpecP(dFrom), centerSpec(), 0, duration));
    } else {
      jobs.push(animateAlongRing(el, dFrom, dFrom - delta, duration));
    }
  });

  // the old center letter returns to the orbit slot that opened behind
  const centerEl = carouselSpace.querySelector(".letter-content");
  if (centerEl) {
    const dBack = (((-delta) % RING_COUNT) + RING_COUNT) % RING_COUNT;
    jobs.push(animateSpec(centerEl, centerSpec(), ringSpecP(dBack), 0, duration));
  }

  // the old letter's variation previews belong to the outgoing letter —
  // they recede and fade, then the rebuild brings in the new letter's set.
  carouselSpace.querySelectorAll(".carousel-slot--y").forEach((el) => {
    const v = Number(el.dataset.offset);
    const from = ySpec(v);
    jobs.push(animateSpec(el, from, { ...from, opacity: "0" }, 0, duration));
  });

  return Promise.all(jobs);
}

// One step of the variations ring, same mechanics vertically.
// carouselVariationIndex is already updated when this runs.
function slideY(dir) {
  const jobs = [];
  const n = carouselVariations.length;
  const maxKept = n >= 4 ? 2 : 1; // offsets beyond this aren't rendered — fade fully

  carouselSpace.querySelectorAll(".carousel-slot--y, .letter-content").forEach((el) => {
    const v = Number(el.dataset.offset);
    const t = v - dir;
    const to = Math.abs(t) > maxKept ? { ...ySpec(t), opacity: "0" } : ySpec(t);
    jobs.push(animateSpec(el, ySpec(v), to, Math.min(Math.abs(t), 3) * STAGGER_MS));
  });

  if (n >= 2) {
    const inOffset = n >= 4 ? 2 * dir : dir;
    const va = carouselVariations[(((carouselVariationIndex + inOffset) % n) + n) % n];
    if (va && va.svg) {
      const fill3D = va.key === "fill" ? LETTER_ORDER[carouselLetterIndex] : null;
      const el = makeCarouselSlot(va.svg, ySpec(inOffset + dir), inOffset, "carousel-slot--y", fill3D);
      carouselSpace.appendChild(el);
      jobs.push(animateSpec(el, ySpec(inOffset + dir), ySpec(inOffset), Math.abs(inOffset) * STAGGER_MS));
    }
  }

  return Promise.all(jobs);
}

function openLetterScreen(node) {
  if (letterTransitionBusy || letterScreen.classList.contains("is-open")) return;
  const face = node.querySelector(".glyph-face");
  const fillSvg = node.querySelector(".glyph-fill");
  if (!face || !fillSvg) return;

  letterTransitionBusy = true;
  activeLetterNode = node;
  const letter = node.dataset.letter || "";
  letterScreen.dataset.activeLetter = letter;
  carouselLetterIndex = Math.max(0, LETTER_ORDER.indexOf(letter));
  carouselVariationIndex = 0;
  carouselVariations = [];
  prefetchTagin(letter);
  resetYReveal(letter);

  // Measure the plain-div wrapper, never the SVG itself — an SVG root with
  // overflow:visible can report a getBoundingClientRect based on its
  // rendered content rather than its actual CSS box, which threw the flight
  // math off. Divs are always reliable.
  const fromRect = face.getBoundingClientRect();
  setSphereMotion("paused");
  node.classList.add("sphere-node--is-selected");

  const clone = document.createElement("div");
  clone.className = "letter-flight";
  const svgClone = uniformGlyphSvg(fillSvg);
  svgClone.style.position = "absolute";
  svgClone.style.inset = "0";
  svgClone.style.width = "100%";
  svgClone.style.height = "100%";
  clone.appendChild(svgClone);
  document.body.appendChild(clone);

  sphereShell.style.transition = "opacity 380ms ease";
  sphereShell.style.opacity = "0";
  letterScreen.classList.add("is-open");
  letterScreen.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  scrollIndicator.classList.remove("is-visible");

  const toRect = centerRegionRect();
  flyClone(clone, fromRect, toRect).then(() => {
    getVariations(letter).then((vars) => {
      carouselVariations = vars;
      carouselVariationIndex = 0;
      rebuildCarousel();
      clone.remove();
      letterTransitionBusy = false;
    });
  });
}

function finishClose(node) {
  cancelAutoBuild();
  cancelBuildFinish();
  yAxisRevealed = true;
  letterScreen.classList.remove("is-y-hidden");
  node.classList.remove("sphere-node--is-selected");
  setSphereMotion("running");
  document.body.style.overflow = "";
  delete letterScreen.dataset.activeLetter;
  activeLetterNode = null;
  carouselVariations = [];
  carouselSpace.replaceChildren();
  letterTransitionBusy = false;
  updateActiveDot(); // restore the scroll indicator for the screen we're back on
  disposeLetter3D();
}

function closeLetterScreen() {
  // Stepwise back: from the build screen, חזור first returns to the
  // carousel; only from the carousel does it return to the sphere.
  if (inBuildMode()) {
    exitBuildMode();
    return;
  }
  if (letterTransitionBusy || !letterScreen.classList.contains("is-open")) return;
  cancelAutoBuild();
  const node = activeLetterNode;
  if (!node) return;

  const isAtOrigin =
    LETTER_ORDER[carouselLetterIndex] === node.dataset.letter && carouselVariationIndex === 0;
  // Fly-back only happens from the fill state, so build the flight glyph
  // from the letter's fill asset directly — the center may be rendering the
  // real 3D letter (א), which has no flat svg in the DOM to clone.
  const flightSource = isAtOrigin
    ? getFillPreview(LETTER_ORDER[carouselLetterIndex])
    : null;

  letterTransitionBusy = true;
  letterScreen.classList.remove("is-open");
  letterScreen.setAttribute("aria-hidden", "true");
  sphereShell.style.opacity = "1";

  if (isAtOrigin && flightSource) {
    const fromRect = centerRegionRect();
    const clone = document.createElement("div");
    clone.className = "letter-flight";
    const svgClone = uniformGlyphSvg(flightSource);
    svgClone.removeAttribute("class");
    svgClone.style.position = "absolute";
    svgClone.style.inset = "0";
    svgClone.style.width = "100%";
    svgClone.style.height = "100%";
    clone.appendChild(svgClone);
    document.body.appendChild(clone);
    disposeLetter3D();
    carouselSpace.replaceChildren();

    const toRect = node.querySelector(".glyph-face").getBoundingClientRect();
    flyClone(clone, fromRect, toRect).then(() => {
      clone.remove();
      finishClose(node);
    });
  } else {
    finishClose(node);
  }
}

/* ---- Navigation: sweep the orbit to any letter ---- */

// Clicking any orbit letter (or pressing an arrow) sweeps the ring by the
// shortest rotation until that letter arrives at the front and stands in
// the center.
async function navigateToLetter(targetIdx) {
  if (letterTransitionBusy || !letterScreen.classList.contains("is-open") || inBuildMode()) return;
  if (targetIdx === carouselLetterIndex) return;
  letterTransitionBusy = true;
  cancelAutoBuild(); // re-armed for the new letter on rebuild
  const oldActiveIdx = carouselLetterIndex;
  const delta = shortestDelta(carouselLetterIndex, targetIdx, RING_COUNT);
  carouselLetterIndex = targetIdx;
  const letter = LETTER_ORDER[carouselLetterIndex];
  letterScreen.dataset.activeLetter = letter;
  prefetchTagin(letter);
  resetYReveal(letter);
  const varsPromise = getVariations(letter);
  await sweepRing(delta, oldActiveIdx);
  carouselVariations = await varsPromise;
  carouselVariationIndex = 0;
  rebuildCarousel();
  letterTransitionBusy = false;
}

function navigateLetter(dir) {
  return navigateToLetter(nextLetterIndex(carouselLetterIndex, dir));
}

async function navigateVariation(dir) {
  if (letterTransitionBusy || !letterScreen.classList.contains("is-open") || inBuildMode()) return;
  if (!yAxisRevealed || carouselVariations.length < 2) return;
  letterTransitionBusy = true;
  cancelAutoBuild(); // re-armed once the variation settles (rebuild)
  const n = carouselVariations.length;
  carouselVariationIndex = (carouselVariationIndex + dir + n) % n;
  await slideY(dir);
  rebuildCarousel();
  letterTransitionBusy = false;
}

// Right arrow -> previous letter, left arrow -> next letter (reversed from
// the usual LTR convention, per the design's explicit direction rule).
arrowRight.addEventListener("click", () => navigateLetter(-1));
arrowLeft.addEventListener("click", () => navigateLetter(1));
arrowDown.addEventListener("click", () => navigateVariation(1));
arrowUp.addEventListener("click", () => navigateVariation(-1));

/* Carousel flow TEMPORARILY DISCONNECTED (all of its code above is kept
   intact). In the current flow, clicking any letter or nikud on the sphere
   only toggles it between its fill and stroke states.
   To reconnect the carousel, restore the previous handler:
     const node = event.target.closest(".sphere-node--letter");
     if (node) openLetterScreen(node);                                    */
sphereEl.addEventListener("click", (event) => {
  if (coreActivated) return; // the letters have been absorbed into the core
  const node = event.target.closest(".sphere-node");
  if (!node) return;
  node.classList.toggle("is-stroke");
});

logoWrap.addEventListener("click", () => {
  if (letterScreen.classList.contains("is-open")) closeLetterScreen();
});

letterBack.addEventListener("click", closeLetterScreen);
