/* ראש מילין — dev-layout: a development-only manual positioning mode.

   This module never changes the design. It only ADDS an offset on top of
   wherever an object already sits, so "reset" is always exact: remove the
   offset and the original design is back, untouched.

   The offset rides the CSS `translate` property — deliberately NOT
   `transform`. Two facts in this interface make that the only safe carrier:

     1. the opening letters have `transform: translate3d(var(--x), ...)`
        rewritten every animation frame — anything written to `transform`
        is erased on the next frame;
     2. objects like .lp2-side-name carry real design transforms
        (`translateX(-50%) rotate(90deg)`) — overwriting `transform` would
        destroy their placement.

   `translate` composes with `transform` instead of replacing it, and it
   applies in the PARENT's coordinate space, so a drag moves an object the
   way the screen sees it even when the object itself is rotated.

   Off by default in production: the module self-gates to localhost / file://
   / ?edit=1 and does nothing at all anywhere else.

   Toggle: press  E   (ignored while typing in a field)
*/

/* ==== the gate ==== */

const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", ""]);
const FORCED = /(?:^|[?&])edit(?:=1)?(?:&|$)/.test(location.search);
const ENABLED =
  FORCED || DEV_HOSTS.has(location.hostname) || location.protocol === "file:";

const STORE_KEY = "reish-milin:dev-layout:v1";
const CONFIG_URL = "dev-layout.json";
const DESIGN_W = 2850; // the design frame's own width — 1u = 100vw/2850

/* ==== what can be moved ====
   Add a line here and the object becomes movable — that is the whole
   extension story. `live: true` marks objects the animation loop keeps
   re-placing every frame (see the note in the panel). */

const SPECS = [
  /* --- opening screen --- */
  { name: "letter", sel: ".sphere-node--letter", label: "אות ראשית (פתיחה)", live: true },
  { name: "hint", sel: "#hint", label: "טקסט הנחיה" },
  { name: "topbar", sel: ".os-topbar", label: "סרגל עליון (פתיחה)" },
  { name: "brand", sel: "#brand", label: "לוגו" },

  /* --- letter page (lp2) --- */
  { name: "lp2-top", sel: ".lp2 .lp2-top", label: "סרגל עליון" },
  { name: "lp2-pill", sel: ".lp2 .lp2-pill", label: "כפתור ניווט" },
  { name: "lp2-field", sel: ".lp2-field", label: "שדה האות" },
  { name: "lp2-art", sel: ".lp2-art", label: "ציור האות" },
  { name: "lp2-comp", sel: ".lp2-comp", label: "אות מרכיבה" },
  { name: "lp2-gen", sel: ".lp2-gen", label: "אות נגזרת" },
  { name: "lp2-lbl", sel: ".lp2-lbl", label: "מספר / תווית" },
  { name: "lp2-tag", sel: ".lp2-tag", label: "תג" },
  { name: "lp2-side", sel: ".lp2-side", label: "פאנל צד" },
  { name: "lp2-side-name", sel: ".lp2-side-name", label: "שם צד" },
  { name: "lp2-side-arrow", sel: ".lp2-side-arrow", label: "חץ צד" },
  { name: "lp2-info", sel: ".lp2-info", label: "פאנל מידע" },
  { name: "lp2-title", sel: ".lp2-title", label: "כותרת" },
  { name: "lp2-title-gem", sel: ".lp2-title-gem", label: "גימטריה בכותרת" },
  { name: "lp2-sub", sel: ".lp2-sub", label: "כותרת משנה" },
  { name: "lp2-body", sel: ".lp2-body", label: "גוף טקסט" },
  { name: "lp2-rows", sel: ".lp2-rows", label: "פאנל תחתון" },
  { name: "lp2-row", sel: ".lp2-row", label: "שורה בפאנל התחתון" },

  /* --- learn page --- */
  { name: "learn-title", sel: "#learnTitle", label: "כותרת (learn)" },
  { name: "learn-tabs", sel: "#learnTabs", label: "טאבים (learn)" },
  { name: "learn-letter", sel: "#learnLetter", label: "אות (learn)" },
  { name: "learn-body", sel: "#learnBody", label: "טקסט (learn)" },

  /* --- אודות: the shelf --- */
  { name: "ab-title", sel: ".ab-title", label: "כותרת אודות" },
  { name: "ab-edge", sel: ".ab-edge", label: "קו קצה המדף" },
  /* `tap` = a click that did NOT drag still performs the object's own
     action, so a book can still be opened while edit mode is on */
  { name: "ab-spine-p", sel: ".ab-spine--project", label: "כריכה · על הפרויקט", tap: true },
  { name: "ab-spine-m", sel: ".ab-spine--milin", label: "כריכה · על ראש מילין", tap: true },
  { name: "ab-sp-title-p", sel: ".ab-spine--project .ab-spine-title", label: "שם כריכה · הפרויקט" },
  { name: "ab-sp-label-p", sel: ".ab-spine--project .ab-spine-label", label: "תווית כריכה · הפרויקט" },
  { name: "ab-sp-title-m", sel: ".ab-spine--milin .ab-spine-title", label: "שם כריכה · ראש מילין" },
  { name: "ab-sp-label-m", sel: ".ab-spine--milin .ab-spine-label", label: "תווית כריכה · ראש מילין" },
  { name: "ab-tilted", sel: ".ab-tilted", label: "הספר הלבן הנטוי" },
  { name: "ab-tilted-label", sel: ".ab-tilted-label", label: "שם · ויהי אות" },
  { name: "ab-track", sel: ".ab-track", label: "פס הגלילה" },
  { name: "ab-dot", sel: ".ab-dot", label: "נקודת הגלילה" },

  /* --- אודות: על ראש מילין --- */
  { name: "ab-m-h1", sel: ".ab-m-h1", label: "כותרת · הרב קוק" },
  { name: "ab-m-rule1", sel: ".ab-m-rule1", label: "קו 1 (מילין)" },
  { name: "ab-m-body1", sel: ".ab-m-body1", label: "טקסט 1 (מילין)" },
  { name: "ab-m-portrait", sel: ".ab-m-portrait", label: "תצלום הרב קוק" },
  { name: "ab-m-cap1", sel: ".ab-m-cap1", label: "כיתוב 1 (מילין)" },
  { name: "ab-m-h2", sel: ".ab-m-h2", label: "כותרת · ראש מילין" },
  { name: "ab-m-rule2", sel: ".ab-m-rule2", label: "קו 2 (מילין)" },
  { name: "ab-m-body2", sel: ".ab-m-body2", label: "טקסט 2 (מילין)" },
  { name: "ab-m-cover", sel: ".ab-m-cover", label: "כריכת הספר" },
  { name: "ab-m-cap2", sel: ".ab-m-cap2", label: "כיתוב 2 (מילין)" },
  { name: "ab-m-body3", sel: ".ab-m-body3", label: "טקסט 3 (מילין)" },
  { name: "ab-m-page-l", sel: ".ab-m-page-left", label: "עמוד ימני (מפתח 1)" },
  { name: "ab-m-page-r", sel: ".ab-m-page-right", label: "עמוד שמאלי (מפתח 1)" },
  { name: "ab-m-page2-l", sel: ".ab-m-page2-left", label: "הנקודות (מפתח 2)" },
  { name: "ab-m-page2-r", sel: ".ab-m-page2-right", label: "התגין (מפתח 2)" },
  { name: "ab-m-rule3", sel: ".ab-m-rule3", label: "קו סיום (מילין)" },

  /* --- אודות: על הפרויקט --- */
  { name: "ab-p-h1", sel: ".ab-p-h1", label: "כותרת · על ויהי אות" },
  { name: "ab-p-rule1", sel: ".ab-p-rule1", label: "קו 1 (פרויקט)" },
  { name: "ab-p-intro", sel: ".ab-p-intro", label: "טקסט פתיחה" },
  { name: "ab-p-lbl", sel: ".ab-p-letters-label", label: "כותרת · האותיות" },
  { name: "ab-p-rule2", sel: ".ab-p-rule2", label: "קו 2 (פרויקט)" },
  { name: "ab-grid", sel: ".ab-grid", label: "רשת האותיות" },
  { name: "ab-p-h2", sel: ".ab-p-h2", label: "כותרת · כתב סת״ם" },
  { name: "ab-p-rule3", sel: ".ab-p-rule3", label: "קו 3 (פרויקט)" },
  { name: "ab-p-design", sel: ".ab-p-design", label: "טקסט העיצוב" },
  { name: "ab-stam", sel: ".ab-stam", label: "תצלום כתב הסת״ם" },
  { name: "ab-p-cap", sel: ".ab-p-cap", label: "כיתוב (פרויקט)" },
  { name: "ab-p-thanks-t", sel: ".ab-p-thanks-title", label: "כותרת · תודות" },
  { name: "ab-p-rule4", sel: ".ab-p-rule4", label: "קו 4 (פרויקט)" },
  { name: "ab-p-thanks", sel: ".ab-p-thanks", label: "טקסט התודות" },
  { name: "ab-p-rule5", sel: ".ab-p-rule5", label: "קו סיום (פרויקט)" },

  /* --- ניקוד --- */
  { name: "nk-name", sel: ".nk-name", label: "שם הניקוד" },
  { name: "nk-text", sel: ".nk-text", label: "טקסט הניקוד" },
  { name: "nk-arrow", sel: ".nk-arrow", label: "חץ הניקוד" },
];

const SPEC_BY_NAME = new Map(SPECS.map((s) => [s.name, s]));

/* ==== the offsets ==== */

/** id -> {dx, dy} */
let offsets = new Map();
let baseline = new Map(); // from dev-layout.json — what "reset" falls back to

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj).map(([k, v]) => [k, { dx: +v.dx || 0, dy: +v.dy || 0 }]));
  } catch (err) {
    return new Map();
  }
};

const writeStore = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(asObject()));
  } catch (err) { /* private mode — the session still works, it just won't persist */ }
};

function asObject() {
  const out = {};
  for (const [id, o] of offsets) {
    if (o.dx || o.dy) out[id] = { dx: round(o.dx), dy: round(o.dy) };
  }
  return out;
}

const round = (n) => Math.round(n * 10) / 10;

/* ==== identity ====
   An id has to survive a rebuild: letter pages are constructed on demand,
   so the same object must resolve to the same id every time. Scope by the
   page's letter (the .lp2 root carries data-letter), then index within that
   scope — the build order is deterministic. */

function scopeOf(el) {
  /* a ניקוד strip names its own scope, exactly as a letter page does, so
     `nk-text@kamatz[0]` stays stable however the list is rebuilt */
  const root = el.closest ? el.closest("[data-letter], [data-nikud]") : null;
  if (root && root.dataset) {
    if (root.dataset.letter) return root.dataset.letter;
    if (root.dataset.nikud) return root.dataset.nikud;
  }
  const svg = el.ownerSVGElement;
  if (svg) {
    const sroot = svg.closest("[data-letter]");
    if (sroot && sroot.dataset.letter) return sroot.dataset.letter;
  }
  return "*";
}

function idOf(el, spec, indexInScope) {
  return `${spec.name}@${scopeOf(el)}[${indexInScope}]`;
}

/* ==== applying ====
   `translate` is the only property this module ever writes on a target. */

function applyTo(el) {
  const id = el.dataset.devId;
  if (!id) return;
  const o = offsets.get(id);
  if (!o || (!o.dx && !o.dy)) el.style.translate = "";
  else el.style.translate = `${round(o.dx)}px ${round(o.dy)}px`;
}

/** Tag every registered object with its id and re-apply its saved offset. */
function scan() {
  for (const spec of SPECS) {
    let all;
    try {
      all = document.querySelectorAll(spec.sel);
    } catch (err) {
      continue;
    }
    const perScope = new Map();
    all.forEach((el) => {
      const scope = scopeOf(el);
      const i = perScope.get(scope) || 0;
      perScope.set(scope, i + 1);
      el.dataset.devId = idOf(el, spec, i);
      el.dataset.devSpec = spec.name;
      applyTo(el);
    });
  }
  if (editing) refreshPanel();
}

const targets = () => document.querySelectorAll("[data-dev-id]");
const byId = (id) => document.querySelector(`[data-dev-id="${CSS.escape(id)}"]`);

/* ==== the coordinate space ====
   `translate` moves an object inside its PARENT's space. If an ancestor is
   scaled (or an SVG viewBox is doing the scaling), a 10px mouse move is not
   a 10px offset — measure the ratio and divide, so dragging tracks the
   cursor exactly. */

function unitScale(el) {
  if (el.ownerSVGElement) {
    const p = el.parentNode;
    const m = p && p.getScreenCTM ? p.getScreenCTM() : null;
    if (m) {
      const s = Math.hypot(m.a, m.b);
      if (s > 0.0001 && isFinite(s)) return s;
    }
    return 1;
  }
  const p = el.parentElement;
  if (!p) return 1;
  const r = p.getBoundingClientRect();
  const w = p.offsetWidth;
  if (!w || !r.width) return 1;
  const s = r.width / w;
  return s > 0.01 && isFinite(s) ? s : 1;
}

/* ==== edit mode ==== */

let editing = false;
let selected = null; // the element
let panel = null;

function setEditing(on) {
  editing = !!on;
  document.body.classList.toggle("dev-edit", editing);
  if (!editing) {
    select(null);
    if (panel) panel.remove();
    panel = null;
    return;
  }
  scan();
  buildPanel();
}

function select(el) {
  if (selected && selected !== el) selected.classList.remove("dev-selected");
  selected = el || null;
  if (selected) selected.classList.add("dev-selected");
  refreshPanel();
}

function offsetFor(el) {
  const id = el.dataset.devId;
  let o = offsets.get(id);
  if (!o) {
    o = { dx: 0, dy: 0 };
    offsets.set(id, o);
  }
  return o;
}

/* ==== history ====
   One transaction per completed gesture: a whole drag, a single nudge, or
   one reset. Undo only ever rewrites offsets — it can never reach the
   interface's own state, so the design's behaviour is untouchable. */

const undoStack = [];
const redoStack = [];
const HISTORY_MAX = 200;

const stateOf = (id) => {
  const o = offsets.get(id);
  return { dx: o ? o.dx : 0, dy: o ? o.dy : 0 };
};

function putState(id, st) {
  offsets.set(id, { dx: st.dx, dy: st.dy });
  const el = byId(id);
  if (el) applyTo(el); // absent = its screen is closed; the value waits for it
}

/** @param {{id:string, before:{dx,dy}, after:{dx,dy}}[]} entries */
function commit(entries) {
  const real = entries.filter(
    (e) => e.before.dx !== e.after.dx || e.before.dy !== e.after.dy
  );
  if (!real.length) return;
  undoStack.push(real);
  if (undoStack.length > HISTORY_MAX) undoStack.shift();
  redoStack.length = 0;
  writeStore();
  refreshPanel();
}

function undo() {
  const tx = undoStack.pop();
  if (!tx) return;
  tx.forEach((e) => putState(e.id, e.before));
  redoStack.push(tx);
  writeStore();
  refreshPanel();
}

function redo() {
  const tx = redoStack.pop();
  if (!tx) return;
  tx.forEach((e) => putState(e.id, e.after));
  undoStack.push(tx);
  writeStore();
  refreshPanel();
}

function nudge(dx, dy) {
  if (!selected) return;
  const id = selected.dataset.devId;
  const before = stateOf(id);
  const o = offsetFor(selected);
  o.dx += dx;
  o.dy += dy;
  applyTo(selected);
  commit([{ id, before, after: stateOf(id) }]);
}

/** the floor an object falls back to: dev-layout.json, else its design place */
const floorOf = (id) => baseline.get(id) || { dx: 0, dy: 0 };

function resetOne(el) {
  if (!el) return;
  const id = el.dataset.devId;
  const before = stateOf(id);
  putState(id, floorOf(id));
  commit([{ id, before, after: stateOf(id) }]);
}

/** every movable object inside the screen the given object belongs to */
function screenRootOf(el) {
  return (
    (el.closest && (el.closest(".about") || el.closest(".nikud") || el.closest(".lp2"))) ||
    document.body
  );
}

function resetScreen(el) {
  if (!el) return;
  const entries = [];
  screenRootOf(el).querySelectorAll("[data-dev-id]").forEach((t) => {
    const id = t.dataset.devId;
    const before = stateOf(id);
    putState(id, floorOf(id));
    entries.push({ id, before, after: stateOf(id) });
  });
  commit(entries);
}

function resetAll() {
  const entries = [];
  const ids = new Set([...offsets.keys(), ...baseline.keys()]);
  ids.forEach((id) => {
    const before = stateOf(id);
    putState(id, floorOf(id));
    entries.push({ id, before, after: stateOf(id) });
  });
  commit(entries);
}

/* ==== dragging ==== */

let drag = null;

function onPointerDown(e) {
  if (!editing || e.button !== 0) return;
  const el = e.target.closest ? e.target.closest("[data-dev-id]") : null;
  if (!el) {
    if (!e.target.closest || !e.target.closest(".dev-panel")) select(null);
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  select(el);
  const o = offsetFor(el);
  const scale = unitScale(el) || 1;
  drag = { el, x0: e.clientX, y0: e.clientY, dx0: o.dx, dy0: o.dy, scale, moved: false };
  el.classList.add("dev-dragging");
  try { el.setPointerCapture(e.pointerId); } catch (err) { /* SVG in some engines */ }
}

function onPointerMove(e) {
  if (!drag) return;
  e.preventDefault();
  const o = offsetFor(drag.el);
  o.dx = drag.dx0 + (e.clientX - drag.x0) / drag.scale;
  o.dy = drag.dy0 + (e.clientY - drag.y0) / drag.scale;
  drag.moved = true;
  applyTo(drag.el);
  refreshPanel();
}

function onPointerUp(e) {
  if (!drag) return;
  drag.el.classList.remove("dev-dragging");
  try { drag.el.releasePointerCapture(e.pointerId); } catch (err) { /* fine */ }
  /* the whole drag is one undo step, not one per pointermove */
  if (drag.moved) {
    const id = drag.el.dataset.devId;
    commit([{ id, before: { dx: drag.dx0, dy: drag.dy0 }, after: stateOf(id) }]);
  } else {
    /* a tap that never moved: objects marked `tap` still do their own job,
       so books can be opened and closed without leaving edit mode */
    const spec = SPEC_BY_NAME.get(drag.el.dataset.devSpec);
    if (spec && spec.tap) {
      tapThrough = drag.el;
      drag.el.click();
      tapThrough = null;
    }
  }
  drag = null;
}

/* Edit mode must not fire the interface's own behaviour: a letter must not
   open a page because you picked it up. */
let tapThrough = null; // the one element allowed to act on a no-drag tap

function swallow(e) {
  if (!editing) return;
  if (tapThrough) return;
  const el = e.target.closest ? e.target.closest("[data-dev-id]") : null;
  if (el) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/* ==== keys ==== */

const typing = (t) =>
  t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName || ""));

function onKeyDown(e) {
  if (typing(e.target)) return;

  if (!e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "e" || e.key === "E" || e.key === "ק")) {
    e.preventDefault();
    setEditing(!editing);
    return;
  }
  if (!editing) return;

  if (e.key === "Escape") {
    select(null);
    return;
  }
  /* undo / redo — scoped to edit mode, so it can never reach the interface */
  if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z" || e.key === "ז")) {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && (e.key === "y" || e.key === "Y")) {
    e.preventDefault();
    redo();
    return;
  }
  /* Shift ±10 · plain ±1 · Alt ±0.5 (sub-pixel trim) */
  const step = e.shiftKey ? 10 : e.altKey ? 0.5 : 1;
  const moves = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  const m = moves[e.key];
  if (m && selected) {
    e.preventDefault();
    nudge(m[0], m[1]);
  }
}

/* ==== the panel ==== */

function buildPanel() {
  if (panel) panel.remove();
  panel = document.createElement("div");
  panel.className = "dev-panel";
  panel.dir = "rtl";
  document.body.appendChild(panel);
  refreshPanel();
}

/* the live geometry of an object, reported in the interface's own design
   units (--u = 100vw/2850) so a number read here can go straight into the
   CSS. x/y are measured against the offset parent; for a rotated object
   the box is the upright bounding box. */
function metricsOf(el) {
  const uu = innerWidth / DESIGN_W;
  const r = el.getBoundingClientRect();
  const p = el.offsetParent ? el.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
  let rot = 0;
  try {
    const t = getComputedStyle(el).transform;
    if (t && t !== "none") {
      const m = new DOMMatrixReadOnly(t);
      rot = Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI * 10) / 10;
    }
  } catch (err) { /* no matrix support — the row simply reads 0 */ }
  return {
    x: round((r.left - p.left) / uu),
    y: round((r.top - p.top) / uu),
    w: round(r.width / uu),
    h: round(r.height / uu),
    rot,
    u: uu,
  };
}

function refreshPanel() {
  if (!panel || !editing) return;
  const count = targets().length;
  const moved = [...offsets.values()].filter((o) => o.dx || o.dy).length;
  const hist = `<span class="dev-dim">↶ ${undoStack.length} · ↷ ${redoStack.length}</span>`;

  if (!selected) {
    panel.innerHTML = `
      <div class="dev-panel-h">מצב עריכה <span class="dev-k">E</span></div>
      <div class="dev-panel-b">לחצו על אובייקט כדי לבחור אותו.<br />
        <span class="dev-dim">${count} אובייקטים ניתנים להזזה · ${moved} הוזזו</span><br />${hist}</div>
      <div class="dev-panel-f">
        <button type="button" data-act="undo">↶ ביטול</button>
        <button type="button" data-act="redo">↷ שחזור</button>
        <button type="button" data-act="reset-all">איפוס הכל</button>
        <button type="button" data-act="export">ייצוא JSON</button>
        <button type="button" data-act="copy">העתקה</button>
      </div>`;
  } else {
    const id = selected.dataset.devId;
    const spec = SPEC_BY_NAME.get(selected.dataset.devSpec);
    const o = offsets.get(id) || { dx: 0, dy: 0 };
    const g = metricsOf(selected);
    panel.innerHTML = `
      <div class="dev-panel-h">${spec ? spec.label : id} <span class="dev-k">E</span></div>
      <div class="dev-panel-b">
        <div class="dev-id">${id}</div>
        <div class="dev-xy">Δ x <b>${round(o.dx)}</b> &nbsp; y <b>${round(o.dy)}</b>
          <span class="dev-dim">px</span></div>
        <div class="dev-xy dev-sub">Δ <b>${round(o.dx / g.u)}</b> , <b>${round(o.dy / g.u)}</b>
          <span class="dev-dim">u</span></div>
        <div class="dev-grid">
          <span>x</span><b>${g.x}</b><span>y</span><b>${g.y}</b>
          <span>w</span><b>${g.w}</b><span>h</span><b>${g.h}</b>
          <span>rot</span><b>${g.rot}°</b><span></span><b></b>
        </div>
        <div class="dev-dim dev-note">x/y/w/h ביחידות העיצוב (u)</div>
        ${spec && spec.live
          ? `<div class="dev-warn">האות הזו ממוקמת מחדש בכל פריים ומקיפה את המסגרת — ההיסט נוסע איתה ולא נשאר במקום קבוע.</div>`
          : ""}
        <span class="dev-dim">גרירה · חצים ±1 · Shift ±10 · Alt ±0.5 · ⌘Z ביטול</span><br />${hist}
      </div>
      <div class="dev-panel-f">
        <button type="button" data-act="undo">↶</button>
        <button type="button" data-act="redo">↷</button>
        <button type="button" data-act="reset-one">איפוס האובייקט</button>
        <button type="button" data-act="reset-screen">איפוס המסך</button>
        <button type="button" data-act="reset-all">איפוס הכל</button>
        <button type="button" data-act="export">ייצוא</button>
        <button type="button" data-act="copy">העתקה</button>
      </div>`;
  }

  panel.querySelectorAll("button[data-act]").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const act = b.dataset.act;
      if (act === "reset-one") resetOne(selected);
      else if (act === "reset-screen") resetScreen(selected);
      else if (act === "reset-all") resetAll();
      else if (act === "undo") undo();
      else if (act === "redo") redo();
      else if (act === "export") exportJSON();
      else if (act === "copy") copyJSON(b);
    });
  });
}

/* ==== save / export ====
   localStorage holds the working session (every drag is saved the moment
   you let go). Export writes the same thing as dev-layout.json — the file
   to keep when you decide a position is final. */

function exportJSON() {
  const blob = new Blob([JSON.stringify(asObject(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dev-layout.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function copyJSON(btn) {
  const text = JSON.stringify(asObject(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    const was = btn.textContent;
    btn.textContent = "הועתק";
    setTimeout(() => { btn.textContent = was; }, 1200);
  } catch (err) {
    console.log("[dev-layout]\n" + text);
  }
}

/* ==== styles ====
   Injected from here so that edit mode leaves no trace in the design's own
   stylesheets, and so that nothing exists when the mode is off. Every rule
   below is scoped to body.dev-edit or the panel. */

const CSS_TEXT = `
body.dev-edit [data-dev-id] {
  cursor: move !important;
  pointer-events: auto !important;
  outline: 1px dashed rgba(140, 190, 255, 0.45);
  outline-offset: 2px;
}
body.dev-edit [data-dev-id]:hover { outline-color: rgba(160, 205, 255, 0.85); }
body.dev-edit .dev-selected {
  outline: 1.5px solid rgba(120, 200, 255, 0.95) !important;
  outline-offset: 2px;
}
body.dev-edit .dev-dragging { transition: none !important; }
/* the interface hides the system cursor and draws its own — in edit mode the
   real cursor has to be visible to aim with */
body.dev-edit .cursor-dot,
body.dev-edit .cursor-ring,
body.dev-edit .cursor-lens { display: none !important; }
body.dev-edit { cursor: default; }

.dev-panel {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 2147483000;
  width: 232px;
  background: rgba(16, 16, 20, 0.92);
  color: #eef1f6;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  font: 11px/1.5 ui-monospace, "SF Mono", Menlo, monospace;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  user-select: none;
  cursor: default;
}
.dev-panel-h {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 7px 9px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600; font-size: 11px;
}
.dev-k {
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 3px; padding: 0 4px; opacity: 0.7; font-size: 10px;
}
.dev-panel-b { padding: 8px 9px; }
.dev-id {
  direction: ltr; text-align: left; opacity: 0.55;
  font-size: 10px; word-break: break-all; margin-bottom: 5px;
}
.dev-xy { direction: ltr; text-align: left; font-size: 13px; letter-spacing: 0.03em; }
.dev-xy b { color: #7fd0ff; font-weight: 600; }
.dev-xy.dev-sub { font-size: 11px; opacity: 0.75; margin-top: 1px; }
.dev-grid {
  direction: ltr; text-align: left;
  display: grid; grid-template-columns: auto 1fr auto 1fr;
  gap: 1px 6px; margin: 6px 0 2px; font-size: 11px;
}
.dev-grid span { opacity: 0.45; }
.dev-grid b { color: #9ee7c0; font-weight: 600; }
.dev-note { display: block; margin-bottom: 5px; }
.dev-dim { opacity: 0.5; font-size: 10px; }
.dev-warn {
  margin: 6px 0; padding: 5px 6px;
  background: rgba(255, 176, 64, 0.12);
  border-right: 2px solid rgba(255, 176, 64, 0.7);
  border-radius: 3px; color: #ffd8a1; font-size: 10px; line-height: 1.45;
}
.dev-panel-f {
  display: flex; flex-wrap: wrap; gap: 4px;
  padding: 7px 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.dev-panel-f button {
  flex: 1 1 auto;
  background: rgba(255, 255, 255, 0.07);
  color: #eef1f6;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  padding: 4px 6px;
  font: inherit; font-size: 10px;
  cursor: pointer;
}
.dev-panel-f button:hover { background: rgba(255, 255, 255, 0.14); }
`;

/* ==== init ==== */

function injectStyles() {
  const s = document.createElement("style");
  s.id = "dev-layout-css";
  s.textContent = CSS_TEXT;
  document.head.appendChild(s);
}

async function loadBaseline() {
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-store" });
    if (!res.ok) return;
    const obj = await res.json();
    const src = obj && obj.offsets ? obj.offsets : obj;
    baseline = new Map(
      Object.entries(src).map(([k, v]) => [k, { dx: +v.dx || 0, dy: +v.dy || 0 }])
    );
  } catch (err) { /* no config file yet — that is a normal first run */ }
}

let rescan = null;
function watch() {
  // letter pages are built on demand: re-tag and re-apply when the DOM grows
  const obs = new MutationObserver(() => {
    clearTimeout(rescan);
    rescan = setTimeout(scan, 60);
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

async function init() {
  injectStyles();
  await loadBaseline();
  // the file is the floor; anything moved this session sits on top of it
  offsets = new Map(baseline);
  for (const [k, v] of readStore()) offsets.set(k, v);

  scan();
  watch();

  addEventListener("keydown", onKeyDown);
  addEventListener("pointerdown", onPointerDown, true);
  addEventListener("pointermove", onPointerMove, true);
  addEventListener("pointerup", onPointerUp, true);
  addEventListener("pointercancel", onPointerUp, true);
  addEventListener("click", swallow, true);

  console.log(
    "%c[dev-layout]%c מצב עריכה ידני — E להפעלה/כיבוי. " +
      `${targets().length} אובייקטים רשומים.`,
    "color:#7fd0ff;font-weight:600",
    "color:inherit"
  );

  // a small console handle, for when a panel button is not what you want
  window.devLayout = {
    on: () => setEditing(true),
    off: () => setEditing(false),
    get: asObject,
    resetAll,
    export: exportJSON,
    specs: SPECS,
  };
}

if (ENABLED) {
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", init);
  else init();
}
