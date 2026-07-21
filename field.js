/* ==== the particle field ====
   Shared by the opening screen (the sky behind the carousel) and the ש
   letter screen, so both breathe the same atmosphere. The motion is a
   genuine rotating VOLUME of dust: the points live in a 3D box and turn
   about the vertical (Y) axis, exactly as points on a great slow globe
   would. On the near face they flow steadily left→right; they curve away
   over the sides and continue around the far face (smaller, dimmer, moving
   back the other way), so the whole field reads as one large invisible
   rotating system rather than a flat drift or a pinwheel. A gentle
   perspective gives real depth — near motes larger and brighter. */

const FIELD_CENTER_Y = 0.46; // the sphere's own anchor (see .scene origin)

export function createField(canvas, opt) {
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let parts = [];
  let RX = 0; // half-extents of the dust volume, and the perspective focal
  let RY = 0;
  let RZ = 0;
  let PERSP = 0;

  const spawn = () => {
    const bright = Math.random() < (opt.brightRatio || 0);
    return {
      // a point somewhere in the rotating volume; x/z circulate, y is fixed
      x: (Math.random() * 2 - 1) * RX,
      y: (Math.random() * 2 - 1) * RY,
      z: (Math.random() * 2 - 1) * RZ,
      mag: bright ? 0.8 + Math.random() * 0.2 : opt.aMin + Math.random() * opt.aSpan,
      r0: (opt.rMin + Math.random() * opt.rSpan) + (bright ? 0.35 : 0),
      tw: 2.4 + Math.random() * 5.2,
      ph: Math.random() * Math.PI * 2,
    };
  };

  const build = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    RX = W * 0.62;
    RY = H * 0.62;
    RZ = Math.max(W, H) * 0.55;
    PERSP = RZ * 3.4; // gentle: near/far scale ratio stays modest and calm
    const count = Math.min(opt.maxCount || 3800, Math.round(W * H * opt.density * 1.5));
    parts = Array.from({ length: count }, spawn);
  };

  build();
  window.addEventListener("resize", build);

  return {
    draw(dt, t, extraSpin = 0) {
      const cx = W * 0.5;
      const cy = H * FIELD_CENTER_Y;
      // turn the whole volume about the vertical axis this frame
      const a = opt.spin * dt + extraSpin;
      const c = Math.cos(a);
      const s = Math.sin(a);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = opt.color;
      for (const p of parts) {
        const nx = p.x * c - p.z * s; // rotate x,z: near face flows left→right
        const nz = p.x * s + p.z * c;
        p.x = nx;
        p.z = nz;
        const scale = PERSP / (PERSP + p.z); // perspective: near is larger
        const sx = cx + p.x * scale;
        const sy = cy + p.y * scale;
        const depth = (RZ - p.z) / (2 * RZ); // 0 far .. 1 near
        const breathe = opt.twinkle ? 0.72 + 0.28 * Math.sin((t * Math.PI * 2) / p.tw + p.ph) : 1;
        ctx.globalAlpha = Math.min(1, p.mag * (0.32 + 0.95 * depth) * breathe);
        const rad = p.r0 * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, rad > 0.25 ? rad : 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };
}

/* The one shared sky recipe — a bimodal starfield (a wide faint population
   and ~40% sharp near-white stars) orbiting one centre as a slowly turning
   field, alive but controlled so it never overpowers the glyphs. Both the
   opening carousel and the ש screen build from THIS, so they stay coherent:
   change the density/size here and both screens change together. */
export const SKY_FIELD_OPTS = {
  color: "#fdfcf8",
  density: 1 / 1000, // sparser again — lighter, cleaner air, same atmosphere
  maxCount: 2300,
  spin: 0.026, // orbital field speed (rad/s) — alive and flowing, still calm
  twinkle: true,
  brightRatio: 0.4,
  rMin: 0.34, // a touch finer still — quieter points, same language
  rSpan: 0.6,
  aMin: 0.14,
  aSpan: 0.5,
};
