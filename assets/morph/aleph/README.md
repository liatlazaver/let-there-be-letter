# א — Morph / Build Animation (standalone export)

The build animation for the Hebrew letter **א**: a circle appears, its material
divides into the **two foundational י forms**, the diagonal stroke grows in
between them, and the two forms rotate rigidly into place — the assembled **א**.

Sequence: **circle → foundational י components → complete א.**

White letterforms on a black background, sharp angular geometry, no glow or soft
effects. Drawn on an HTML5 `<canvas>` in plain JavaScript — **no libraries, no
build step, no external assets, no network requests.**

---

## Files

| File | What it is |
|------|------------|
| `aleph-morph-animation.html` | **Standalone preview.** Fully self-contained (inline CSS + JS). Open it directly in any browser to watch the animation. It loops; click to restart. |
| `aleph-morph-animation.js`  | **The reusable animation.** Drop this into your interface and point it at a `<canvas>`. This is the file to embed. |
| `aleph-morph-animation.css` | Optional minimal styling for the canvas container. |
| `README.md` | This file. |

### To preview
Open **`aleph-morph-animation.html`** — double-click it, or drag it into a
browser window. Nothing else is required.

### To embed later
Use **`aleph-morph-animation.js`** (details below).

---

## How to embed it in your interface

### 1. Plain HTML / `<script>` (simplest)

```html
<link rel="stylesheet" href="aleph-morph-animation.css">

<div class="aleph-morph" id="aleph-holder">
  <canvas id="aleph"></canvas>
</div>

<script src="aleph-morph-animation.js"></script>
<script>
  const anim = AlephMorph.create(document.getElementById('aleph'), {
    ink: '#fdfcf8',   // letterform colour
    bg:  '#000',      // background
    loop: true        // loop forever
  });
  anim.play();
</script>
```

The animation sizes itself to the canvas's container, so give `.aleph-morph`
whatever width/height you want (a box in your layout, or a full-screen overlay —
see the commented variant in the CSS).

### 2. As an ES module

If your interface uses ES modules, add this single line at the **bottom** of
`aleph-morph-animation.js`:

```js
export const create = AlephMorph.create;
```

Then:

```js
import { create } from './aleph-morph-animation.js';
const anim = create(canvasEl, { loop: false, onFormed: () => { /* reveal page */ } });
anim.play();
```

---

## Options

`AlephMorph.create(canvasElement, options)` — `options` (all optional):

| Option | Default | Meaning |
|--------|---------|---------|
| `ink` | `'#fdfcf8'` | Letterform colour |
| `bg` | `'#000'` | Background colour (painted on the canvas each frame) |
| `fitW` / `fitH` | `460` / `400` | Design box the letter is scaled to fit; lower numbers = larger א |
| `loop` | `true` | `true` loops; `false` plays once and holds the finished א |
| `onFormed` | — | Called once, the instant the א is fully formed (useful to fade the animation out and reveal your page) |
| `onEnd` | — | Called at the end of the hold (only when `loop: false`) |

### Returned controls

```js
const anim = AlephMorph.create(canvas, opts);
anim.play();     // start (or restart) the animation
anim.stop();     // pause / stop the render loop
anim.resize();   // re-measure the canvas (called automatically on window resize)
anim.destroy();  // stop and remove the resize listener
anim.DURATION;   // build length in seconds (before the hold)
```

### Play-once, then hand off to your page (intro pattern)

```js
const anim = AlephMorph.create(canvas, {
  loop: false,
  onFormed() {
    holder.classList.add('fade-out'); // your CSS fade
    setTimeout(() => anim.stop(), 700);
    // ...then reveal your real א screen
  }
});
anim.play();
```

---

## Notes

- **Colours** are `#fdfcf8` on `#000`. Change via `ink` / `bg`.
- **Sharpness:** the letterforms are exact straight-line polygons interpolated
  corner-to-corner, so edges stay crisp. The only rounding is a brief "material"
  merge at the circle → two-י moment, which resolves fully sharp. The two י then
  travel to their places by pure rigid rotation (they never deform).
- **No SVG version:** the animation is a per-frame geometric morph (plus a
  blur/threshold pass for the circle split), so it cannot be captured as a single
  static SVG. The canvas JS above is the reusable form.
- **Timing** lives in the `TL` object inside the JS if you ever want to adjust
  stage durations.
- Self-contained: no fonts, images, or other files are needed.
