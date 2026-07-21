/* Real extruded 3D letter (p5.js WEBGL) — integrated from the provided
   "אותיות לתלת מימד" sketch, adapted to instance mode so it can live inside
   a carousel slot instead of owning the whole page.

   Pipeline (same as the source sketch):
     1. SVG parsing        -> contours (closed point rings)
     2. Normalization      -> center + scale + flip Y + CCW winding
     3. Mesh construction  -> earcut caps + side walls, unwelded triangles
     4. Rendering          -> transparent WEBGL canvas, soft lighting
     5. Interaction        -> drag rotation with inertia + gentle idle turn

   Only the default FILL variation of א uses this for now; the loader is
   per-letter so more 3D letters can be dropped into assets/letters3d/
   later without code changes. */

const LETTER_COLOR = "#FDFCF8";
const DEPTH_RATIO = 0.183; // extrusion depth relative to target size (55/300)
const PATH_SAMPLE_STEP = 4;
const DRAG_SENSITIVITY = 0.01;
const FRICTION = 0.94;
// Rest pose: a gentle 3/4 view — depth clearly visible, letter always
// legible. After a drag's inertia decays, the letter eases back here and
// sways softly around it (never spins to an edge-on, unreadable angle).
const REST_X = -0.28;
const REST_Y = 0.45;
const SWAY_AMPL = 0.16;
const SWAY_SPEED = 0.0006;
const HOME_EASE = 0.035;

const svgCache = new Map();

async function fetchSvgMarkup(letter) {
  if (!svgCache.has(letter)) {
    svgCache.set(
      letter,
      fetch(encodeURI(`assets/letters3d/${letter}.svg`)).then((r) => {
        if (!r.ok) throw new Error(`no 3d svg for ${letter}`);
        return r.text();
      })
    );
  }
  return svgCache.get(letter);
}

// Letters that have a real 3D source file available.
const AVAILABLE_3D = new Set(["א"]);

export function has3DLetter(letter) {
  return AVAILABLE_3D.has(letter);
}

/* ---- SVG parsing (polygons/polylines/paths -> contours) ---- */
function parseSVG(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const contours = [];

  doc.querySelectorAll("polygon, polyline").forEach((el) => {
    const nums = el.getAttribute("points").trim().split(/[\s,]+/).map(Number);
    const ring = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      ring.push({ x: nums[i], y: nums[i + 1] });
    }
    if (ring.length >= 3) contours.push(ring);
  });

  const paths = doc.querySelectorAll("path");
  if (paths.length) {
    const NS = "http://www.w3.org/2000/svg";
    const liveSvg = document.createElementNS(NS, "svg");
    liveSvg.style.position = "absolute";
    liveSvg.style.width = liveSvg.style.height = "0";
    liveSvg.style.overflow = "hidden";
    document.body.appendChild(liveSvg);

    paths.forEach((p) => {
      const live = document.createElementNS(NS, "path");
      live.setAttribute("d", p.getAttribute("d"));
      liveSvg.appendChild(live);
      const total = live.getTotalLength();
      const steps = Math.max(12, Math.floor(total / PATH_SAMPLE_STEP));
      const ring = [];
      for (let i = 0; i < steps; i += 1) {
        const pt = live.getPointAtLength((i / steps) * total);
        ring.push({ x: pt.x, y: pt.y });
      }
      if (ring.length >= 3) contours.push(ring);
    });

    document.body.removeChild(liveSvg);
  }

  return contours;
}

/* ---- Normalization ---- */
function signedArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

function normalizeContours(contours, targetSize) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  contours.forEach((ring) =>
    ring.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    })
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = targetSize / Math.max(maxX - minX, maxY - minY);
  const out = contours.map((ring) =>
    ring.map((p) => ({ x: (p.x - cx) * scale, y: -(p.y - cy) * scale }))
  );
  out.forEach((ring) => {
    if (signedArea(ring) < 0) ring.reverse();
  });
  return out;
}

/* ---- Mesh construction ---- */
function buildLetterGeometry(contours, depth) {
  const geo = new window.p5.Geometry();
  const zF = depth / 2;
  const zB = -depth / 2;

  const v = (x, y, z) => new window.p5.Vector(x, y, z);
  const addTri = (v0, v1, v2) => {
    const n = geo.vertices.length;
    geo.vertices.push(v0, v1, v2);
    geo.faces.push([n, n + 1, n + 2]);
  };
  const addCap = (a, b, c, z, wantFront) => {
    const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if ((nz > 0) === wantFront) {
      addTri(v(a.x, a.y, z), v(b.x, b.y, z), v(c.x, c.y, z));
    } else {
      addTri(v(a.x, a.y, z), v(c.x, c.y, z), v(b.x, b.y, z));
    }
  };

  contours.forEach((ring) => {
    const flat = [];
    ring.forEach((p) => flat.push(p.x, p.y));
    const tris = window.earcut(flat);
    for (let i = 0; i < tris.length; i += 3) {
      const a = ring[tris[i]];
      const b = ring[tris[i + 1]];
      const c = ring[tris[i + 2]];
      addCap(a, b, c, zF, true);
      addCap(a, b, c, zB, false);
    }
    for (let i = 0; i < ring.length; i += 1) {
      const p = ring[i];
      const q = ring[(i + 1) % ring.length];
      const fp = v(p.x, p.y, zF);
      const fq = v(q.x, q.y, zF);
      const bq = v(q.x, q.y, zB);
      const bp = v(p.x, p.y, zB);
      addTri(fp, fq, bq);
      addTri(fp, bq, bp);
    }
  });

  geo.computeNormals();
  geo.gid = `letter3d-${Math.random().toString(36).slice(2)}`;
  return geo;
}

/* ---- Shared rotation state ----
   One persistent orientation per letter, shared by every live instance of
   it (center, orbit preview, variation preview). The letter keeps turning
   coherently as it moves between carousel roles — no orientation pop when
   it is swept from the orbit into the center. */
const rotStates = new Map();

function getRotState(letter) {
  if (!rotStates.has(letter)) {
    rotStates.set(letter, { rotX: -0.3, rotY: 0.55, velX: 0, velY: 0 });
  }
  return rotStates.get(letter);
}

/* ---- Public API ----
   createLetter3D(container, letter, { interactive }) mounts a transparent
   WEBGL canvas in `container`, renders the extruded letter, and returns
   { dispose() }. Interactive mode adds drag rotation with inertia; while
   the user is actively dragging, the container gets data-dragging3d="1" so
   click handlers above it (the flip card) can tell a rotation gesture
   apart from a plain click. Non-interactive instances (carousel previews)
   just follow the shared orientation with a gentle idle turn. */
export function createLetter3D(container, letter, { interactive = true } = {}) {
  let instance = null;
  let disposed = false;

  fetchSvgMarkup(letter)
    .then((markup) => {
      if (disposed || !window.p5 || !window.earcut) return;
      const w = Math.max(60, container.clientWidth);
      const h = Math.max(60, container.clientHeight);
      // matches the normalized 2D letters' ink size in the same cell
      const target = Math.min(w, h) * 0.78;
      const rot = getRotState(letter);

      instance = new window.p5((p) => {
        let geo = null;
        let dragging = false;
        let dragDist = 0;

        p.setup = () => {
          p.createCanvas(w, h, p.WEBGL);
          const contours = normalizeContours(parseSVG(markup), target);
          geo = buildLetterGeometry(contours, target * DEPTH_RATIO);
        };

        p.draw = () => {
          p.clear();
          if (!geo) return;

          if (interactive && dragging) {
            rot.velY = (p.mouseX - p.pmouseX) * DRAG_SENSITIVITY;
            rot.velX = (p.mouseY - p.pmouseY) * DRAG_SENSITIVITY;
            dragDist += Math.abs(p.mouseX - p.pmouseX) + Math.abs(p.mouseY - p.pmouseY);
            rot.rotY += rot.velY;
            rot.rotX += rot.velX;
          } else if (interactive) {
            // free inertia after a drag...
            rot.rotY += rot.velY;
            rot.rotX += rot.velX;
            rot.velX *= FRICTION;
            rot.velY *= FRICTION;
            // ...then ease home to the legible rest pose with a soft sway.
            if (Math.abs(rot.velX) + Math.abs(rot.velY) < 0.002) {
              const TAU = Math.PI * 2;
              // unwind whole extra turns so homing takes the short way
              rot.rotY -= TAU * Math.round((rot.rotY - REST_Y) / TAU);
              rot.rotX -= TAU * Math.round((rot.rotX - REST_X) / TAU);
              const sway = Math.sin(p.millis() * SWAY_SPEED) * SWAY_AMPL;
              rot.rotY += (REST_Y + sway - rot.rotY) * HOME_EASE;
              rot.rotX += (REST_X - rot.rotX) * HOME_EASE;
            }
          }
          // non-interactive previews simply follow the shared state, which
          // the easing above keeps at a legible angle.

          p.ambientLight(205);
          p.directionalLight(80, 80, 80, -0.4, -0.6, -0.8);
          p.push();
          p.rotateX(rot.rotX);
          p.rotateY(rot.rotY);
          p.noStroke();
          p.ambientMaterial(LETTER_COLOR);
          p.model(geo);
          p.pop();
        };

        if (interactive) {
          p.mousePressed = () => {
            if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
              dragging = true;
              dragDist = 0;
              container.dataset.dragging3d = "0";
            }
          };

          p.mouseDragged = () => {
            if (dragging && dragDist > 6) container.dataset.dragging3d = "1";
          };

          p.mouseReleased = () => {
            dragging = false;
            // let the click event (which fires right after) read the flag,
            // then clear it.
            window.setTimeout(() => {
              container.dataset.dragging3d = "0";
            }, 0);
          };
        }
      }, container);
    })
    .catch(() => {
      /* no 3D source — container simply stays empty; caller already
         renders the 2D fallback in that case */
    });

  return {
    dispose() {
      disposed = true;
      if (instance) {
        instance.remove();
        instance = null;
      }
    },
  };
}
