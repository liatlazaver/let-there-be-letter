/* ראש מילין — letterAccordionTransition: the letter-to-letter move.

   The midpoint is the closed accordion from ניסיון אקורדיון סגור.svg: the
   screen folds into a pleated field — twenty-seven paper strips ruled by
   hairlines — holds there a moment, and opens again on the next letter.

     open → the pleats close across the screen → the closed accordion,
     held a moment → the pleats open away → the next letter

   Two motions carry it. The pleats are vertical slats: each grows from a
   hairline to its full width and back, in a wave that travels in the
   direction the reading is going. Beneath them the standing screen folds
   gently toward its own gutter — the seam where the black letter field
   meets the reading — so the sheet is felt to compress while the slats
   close over it.

   Coverage is absolute by construction. The sheet is pinned to the viewport
   under the top bar (left/right/bottom all 0) and its twenty-seven strips
   are flex children of equal share, so they tile the whole area edge to edge
   at every window size and aspect — there is no fixed height to fall short
   of the screen and no margin for the old page to show through.

   Every divider is one strip's LEFT border and nothing else, so no two
   borders ever stack: twenty-six lines, each exactly 1px, none doubled and
   none missing. (A sub-pixel hairline was the reason some lines read bolder
   than others — the browser rounds a 0.5px border up on some boundaries and
   away on others. A whole pixel renders the same everywhere.)

   Only `scale` animates on the slats and on the folding columns — the
   `scale` property composes with transforms a panel already carries and
   stays on the compositor.

   All timing lives in TIMING; adjust there, nowhere else. */

import { TITLES } from "./content.js?v=6";

const TIMING = {
  closePleat: 260,   // one slat closing
  closeWave: 9,      // the wave's step from slat to slat
  fold: 470,         // the screen folding under the slats
  hold: 150,         // the closed accordion, held
  openPleat: 280,    // one slat opening away
  openWave: 9,
  unfold: 500,       // the next screen opening out
  easeClose: "cubic-bezier(0.72, 0, 0.24, 1)",   // firm, deliberate
  easeOpen: "cubic-bezier(0.18, 0.85, 0.28, 1)", // decisive, settling quietly
};
/* ≈ 260+26*9 + 150 + 280+26*9 ≈ 1160ms, closing a touch faster than opening */

const PLEATS = 27;    // the reference's own count
const BAR = 124.5;    // the top bar's rule, in design units — the sheet hangs from it
const FOLD = 0.86;    // how far the sheet compresses under the slats — felt, not stark
/* the bracketed names: every ink bottom in the reference sits on one line,
   72.5u above the strip's floor. The type is not the transition's own — it is
   the interface's side-panel bracket label (.lp2-side-name): Lyon italic, 400,
   40u on the same 100vw/2850 unit, line-height 1, no tracking. Read it there,
   not here, if it ever changes. */
const NAME_SIZE = 40;
const NAME_UP = 72.5;
const ORDER = [..."אבגדהוזחטיכלמנסעפצקרשת", ..."ךםןףץ"];

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==== the closed accordion ==== */

let sheet = null; // built once, reused by every transition

function getSheet() {
  if (sheet) return sheet;
  injectStyles();
  sheet = document.createElement("div");
  sheet.className = "lat-sheet";
  sheet.setAttribute("aria-hidden", "true");
  for (let i = 0; i < PLEATS; i++) {
    const pleat = document.createElement("div");
    pleat.className = "lat-pleat";
    /* the strips are laid right-to-left, so א stands at the right edge */
    const name = document.createElement("span");
    name.className = "lat-name";
    name.textContent = `[${(TITLES[ORDER[i]] || ORDER[i]).replace(/״/g, "")}]`;
    pleat.appendChild(name);
    sheet.appendChild(pleat);
  }
  return sheet;
}

/* ==== whole-pixel strips ====
   Equal flex shares put every seam on a FRACTIONAL pixel (viewport/27), and
   the browser rounds each 1px divider differently — some strips read heavier
   than others. Sized here to integer widths (the remainder spread one pixel
   at a time), every seam sits on a whole pixel and every divider renders at
   exactly the same weight. Re-measured at each transition, so any window
   size keeps the grid true; the ±1px share difference is invisible. */
function sizePleats(sh) {
  const n = sh.children.length;
  const total = Math.round(innerWidth);
  const base = Math.floor(total / n);
  const extra = total - base * n;
  [...sh.children].forEach((p, i) => {
    p.style.flex = `0 0 ${base + (i < extra ? 1 : 0)}px`;
  });
}

/* ==== the screen's own fold ==== */

function columnsOf(screen) {
  const q = (s) => screen.querySelector(s);
  return {
    cols: [q(".lp2-side--l"), q(".lp2-field"), q(".lp2-info"), q(".lp2-side--r")].filter(Boolean),
    field: q(".lp2-field"),
  };
}

function setOrigins(screen, gutter) {
  columnsOf(screen).cols.forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.transformOrigin = `${(gutter - r.left).toFixed(2)}px center`;
  });
}

/** restore a screen to exactly the state the interface gives an open page */
function clearScreen(screen) {
  columnsOf(screen).cols.forEach((el) => {
    el.getAnimations().forEach((a) => a.cancel());
    el.style.scale = "";
    el.style.transformOrigin = "";
  });
  screen.style.pointerEvents = "";
  screen.style.visibility = "";
  screen.classList.add("is-open");
  screen.style.clipPath = "inset(0 0 0 0)";
}

/**
 * Close the standing letter screen into the accordion and open the next one.
 *
 * @param {HTMLElement} oldEl  the standing .lp2 screen
 * @param {HTMLElement} newEl  the incoming .lp2 screen (already above it)
 * @param {"left"|"right"} fromSide  the wave travels this way
 * @param {() => void} onDone  called once, after every animation and cleanup
 */
export function letterAccordionTransition(oldEl, newEl, fromSide, onDone) {
  /* stillness, when asked for: a short crossfade carries the change */
  if (reduced()) {
    newEl.style.clipPath = "inset(0 0 0 0)";
    const a = newEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
    a.onfinish = () => { oldEl.remove(); clearScreen(newEl); onDone(); };
    return;
  }

  const sh = getSheet();
  sizePleats(sh);
  const oldC = columnsOf(oldEl);
  const gutter = oldC.field
    ? oldC.field.getBoundingClientRect().right
    : innerWidth * 0.5614;
  setOrigins(oldEl, gutter);
  setOrigins(newEl, gutter);

  /* the incoming screen waits, already folded, under the closed sheet */
  newEl.style.clipPath = "inset(0 0 0 0)";
  columnsOf(newEl).cols.forEach((el) => { el.style.scale = `${FOLD} 1`; });
  newEl.style.visibility = "hidden";

  oldEl.style.pointerEvents = "none";
  newEl.style.pointerEvents = "none";

  /* the sheet stands over both screens for the length of the move */
  document.body.appendChild(sh);
  const pleats = [...sh.children];
  /* the wave runs with the reading: leftward navigation closes from the left */
  const order = fromSide === "left" ? pleats : [...pleats].reverse();

  /* ---- close: the slats sweep shut, the sheet compresses beneath ---- */
  oldC.cols.forEach((el) =>
    el.animate([{ scale: "1 1" }, { scale: `${FOLD} 1` }],
      { duration: TIMING.fold, easing: TIMING.easeClose, fill: "forwards" })
  );

  let lastClose = null;
  order.forEach((p, i) => {
    p.style.scale = "0 1";
    lastClose = p.animate(
      [{ scale: "0 1" }, { scale: "1 1" }],
      { duration: TIMING.closePleat, delay: i * TIMING.closeWave,
        easing: TIMING.easeClose, fill: "forwards" }
    );
  });

  lastClose.onfinish = () => {
    /* ---- the closed accordion, held ---- */
    newEl.style.visibility = "";
    oldEl.remove();

    setTimeout(() => {
      /* ---- open: the slats sweep away, the next screen opens out ---- */
      columnsOf(newEl).cols.forEach((el) =>
        el.animate([{ scale: `${FOLD} 1` }, { scale: "1 1" }],
          { duration: TIMING.unfold, easing: TIMING.easeOpen, fill: "forwards" })
      );

      let lastOpen = null;
      order.forEach((p, i) => {
        lastOpen = p.animate(
          [{ scale: "1 1" }, { scale: "0 1" }],
          { duration: TIMING.openPleat, delay: i * TIMING.openWave,
            easing: TIMING.easeOpen, fill: "forwards" }
        );
      });

      lastOpen.onfinish = () => {
        pleats.forEach((p) => {
          p.getAnimations().forEach((a) => a.cancel());
          p.style.scale = "";
        });
        sh.remove();          // the sheet leaves no trace between moves
        clearScreen(newEl);
        onDone();
      };
    }, TIMING.hold);
  };
}

/* ==== styles ====
   Injected from here so the transition stays one file, and so nothing of it
   exists in the interface's own stylesheets. */
let styled = false;
function injectStyles() {
  if (styled) return;
  styled = true;
  const s = document.createElement("style");
  s.id = "letter-accordion-css";
  s.textContent = `
.lat-sheet {
  --lu: calc(100vw / 2850);
  position: fixed;
  top: calc(var(--lu) * ${BAR});  /* hangs from the top bar's rule */
  left: 0;
  right: 0;
  bottom: 0;                      /* to the floor, at every aspect */
  z-index: 65;                    /* over the letter screen (60), under ניקוד/אודות */
  pointer-events: none;
  overflow: hidden;               /* clips cleanly to the viewport */
  display: flex;                  /* equal shares tile the field edge to edge */
  direction: rtl;
  background: transparent;
}
.lat-pleat {
  position: relative;             /* the label stands inside its own strip */
  flex: 1 1 0;                    /* no fixed width: no gaps, no margins */
  min-width: 0;
  overflow: hidden;
  height: 100%;
  background: #FDFCF8;
  /* one divider per seam — never two borders meeting, never doubled */
  border-left: 1px solid #101010;
  box-sizing: border-box;
  transform-origin: center center; /* each slat closes on its own axis */
}
/* the row runs RTL, so the LAST child stands at the LEFT screen edge — that
   is the border to drop (an edge is not a seam). The first child is the
   rightmost strip (א), and its left border IS the א|ב seam: removing it was
   exactly the missing separation between [אלף] and [בית]. */
.lat-pleat:last-child { border-left: 0; }
/* the name reads upward from a fixed foot. Rotating about the box's own
   top-RIGHT corner is what makes that foot length-independent: the first
   letter lands on the same line whatever the name's length, exactly as the
   reference has every label sitting on one baseline. */
.lat-name {
  position: absolute;
  top: calc(100% - var(--lu) * ${NAME_UP});
  right: calc(50% - var(--lu) * ${NAME_SIZE / 2});
  transform: rotate(90deg);
  transform-origin: 100% 0;
  white-space: nowrap;
  color: #101010;
  font-family: "Lyon Text", "Editor Sans", serif;
  font-style: italic;
  font-weight: 400;
  font-size: calc(var(--lu) * ${NAME_SIZE});
  line-height: 1;
}
@media (prefers-reduced-motion: reduce) { .lat-sheet { display: none; } }
`;
  document.head.appendChild(s);
}
