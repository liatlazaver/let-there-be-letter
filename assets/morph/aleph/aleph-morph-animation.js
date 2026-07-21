/* ============================================================
   aleph-morph-animation.js
   The א build/morph animation as a reusable, self-contained
   canvas renderer. No dependencies. Drop it in, give it a
   <canvas>, and it plays:
     circle → the two foundational י forms → diagonal → א.

   Usage (plain <script>):
     <canvas id="aleph"></canvas>
     <script src="aleph-morph-animation.js"></script>
     <script>
       const anim = AlephMorph.create(document.getElementById('aleph'), {
         ink: '#fdfcf8',   // letterform colour
         bg:  '#000',      // background
         loop: true        // loop forever (false = play once, then hold)
       });
       anim.play();
     </script>

   Options: { ink, bg, fitW, fitH, loop, onFormed, onEnd }
     ink/bg    colours (defaults white on black)
     fitW/fitH design box the letter is scaled to fit (default 460 x 400)
     loop      true (default) loops; false plays once and holds the final א
     onFormed  called once the instant the א is fully formed
     onEnd     called at the end of the hold (only when loop === false)

   Returns { play, stop, resize, destroy, DURATION }.

   To use as an ES module instead, add at the bottom of this file:
     export const create = AlephMorph.create;
   ============================================================ */
(function (global) {
  'use strict';

  /* ---- stage geometry, from "א.svg" ---- */
  const YODS_D = [
    "M759.963 454.192L786.877 454.045L798.289 468.547L798.489 499.752L774.588 541.302L786.677 502.484L783.794 500.242L754.87 500.422L754.53 446.936L757.927 446.914L759.963 454.192Z",
    "M958.963 400.192L985.877 400.045L997.289 414.547L997.489 445.752L973.588 487.301L985.677 448.484L982.794 446.242L953.87 446.422L953.53 392.936L956.927 392.914L958.963 400.192Z"
  ];
  const DIAG_MID_D = "M943.978 544.538L817.975 441.384L814 392L943.317 498.471L943.978 544.538Z";
  const ARMS_D = [
    "M845.53 862.97L819.317 856.889L811.594 840.14L818.629 809.734L851.506 774.824L830.744 809.807L833.035 812.653L861.204 819.169L849.134 871.29L845.82 870.529L845.53 862.97Z",
    "M915.051 712.036L935.334 729.727L934.301 748.152L913.811 771.688L868.402 787.041L903.145 765.924L902.466 762.335L880.653 743.339L915.776 703L918.338 705.229L915.051 712.036Z"
  ];
  const DIAG_FIN_D = "M930.978 858.837L804.975 755.683L801 706.299L930.317 812.77L930.978 858.837Z";

  /* ---- polygon helpers ---- */
  function parsePoly(d) {
    const tok = d.match(/[MLHVZ]|-?\d*\.?\d+/gi);
    const pts = [];
    let i = 0, x = 0, y = 0;
    while (i < tok.length) {
      const c = tok[i++];
      if (c === 'M' || c === 'L') { x = +tok[i++]; y = +tok[i++]; pts.push({ x, y }); }
      else if (c === 'H') { x = +tok[i++]; pts.push({ x, y }); }
      else if (c === 'V') { y = +tok[i++]; pts.push({ x, y }); }
    }
    const a = pts[0], b = pts[pts.length - 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 0.01) pts.pop();
    return pts;
  }
  function centroid(pts) {
    let x = 0, y = 0;
    for (const p of pts) { x += p.x; y += p.y; }
    return { x: x / pts.length, y: y / pts.length };
  }
  function bbox(ptsArrays) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const pts of ptsArrays) for (const p of pts) {
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }
  const translate = (pts, dx, dy) => pts.map(p => ({ x: p.x + dx, y: p.y + dy }));
  function windCW(pts) {
    let area = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
    return area < 0 ? pts.slice().reverse() : pts;
  }
  function alignShift(from, to) {
    const n = from.length;
    const cf = centroid(from), ct = centroid(to);
    let best = 0, bestD = Infinity;
    for (let off = 0; off < n; off++) {
      let d = 0;
      for (let i = 0; i < n; i++) {
        const a = from[i], b = to[(i + off) % n];
        const dx = (a.x - cf.x) - (b.x - ct.x);
        const dy = (a.y - cf.y) - (b.y - ct.y);
        d += dx * dx + dy * dy;
      }
      if (d < bestD) { bestD = d; best = off; }
    }
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = to[(i + best) % n];
    return out;
  }
  function alignRot(from, to) {
    const n = from.length;
    const cf = centroid(from), ct = centroid(to);
    let best = 0, bestR = Infinity;
    for (let off = 0; off < n; off++) {
      let sc = 0, sd = 0;
      for (let i = 0; i < n; i++) {
        const ax = from[i].x - cf.x, ay = from[i].y - cf.y;
        const b = to[(i + off) % n];
        const bx = b.x - ct.x, by = b.y - ct.y;
        sc += ax * by - ay * bx; sd += ax * bx + ay * by;
      }
      const th = Math.atan2(sc, sd);
      const cr = Math.cos(th), sr = Math.sin(th);
      let res = 0;
      for (let i = 0; i < n; i++) {
        const ax = from[i].x - cf.x, ay = from[i].y - cf.y;
        const rx = ax * cr - ay * sr, ry = ax * sr + ay * cr;
        const b = to[(i + off) % n];
        res += Math.hypot(rx - (b.x - ct.x), ry - (b.y - ct.y));
      }
      if (res < bestR) { bestR = res; best = off; }
    }
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = to[(i + best) % n];
    return out;
  }
  function resampleCorners(poly, N) {
    const n = poly.length;
    const seg = []; let L = 0;
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; const d = Math.hypot(b.x - a.x, b.y - a.y); seg.push(d); L += d; }
    const counts = seg.map(d => Math.max(1, Math.round(N * d / L)));
    let sum = counts.reduce((a, b) => a + b, 0);
    while (sum > N) {
      let mi = -1, mv = -1;
      for (let i = 0; i < n; i++) if (counts[i] > 1) { const dens = counts[i] / seg[i]; if (dens > mv) { mv = dens; mi = i; } }
      if (mi < 0) break; counts[mi]--; sum--;
    }
    while (sum < N) { let mi = 0, mv = -1; for (let i = 0; i < n; i++) { const d = seg[i] / counts[i]; if (d > mv) { mv = d; mi = i; } } counts[mi]++; sum++; }
    const out = [];
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n], c = counts[i]; for (let j = 0; j < c; j++) { const f = j / c; out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }); } }
    return out;
  }

  /* ---- aligned keyframes (built once) ---- */
  let YODS = YODS_D.map(d => windCW(parsePoly(d)));
  let DIAG_MID = windCW(parsePoly(DIAG_MID_D));
  let ARMS = ARMS_D.map(d => windCW(parsePoly(d)));
  let DIAG_FIN = windCW(parsePoly(DIAG_FIN_D));

  const sortByX = arr => arr.slice().sort((a, b) => centroid(a).x - centroid(b).x);
  YODS = sortByX(YODS); ARMS = sortByX(ARMS);
  {
    const bb1 = bbox(YODS.concat([DIAG_MID]));
    for (let s = 0; s < 2; s++) YODS[s] = translate(YODS[s], -bb1.cx, -bb1.cy);
    DIAG_MID = translate(DIAG_MID, -bb1.cx, -bb1.cy);
    const bb2 = bbox(ARMS.concat([DIAG_FIN]));
    for (let s = 0; s < 2; s++) ARMS[s] = translate(ARMS[s], -bb2.cx, -bb2.cy);
    DIAG_FIN = translate(DIAG_FIN, -bb2.cx, -bb2.cy);
  }
  for (let s = 0; s < 2; s++) ARMS[s] = alignRot(YODS[s], ARMS[s]);
  DIAG_FIN = alignShift(DIAG_MID, DIAG_FIN);
  const DIAG_C = centroid(DIAG_MID);
  const DIAG0 = DIAG_MID.map(() => ({ x: DIAG_C.x, y: DIAG_C.y }));

  /* ---- circle → two foundational י ---- */
  const N_OPEN = 72;
  const bbY = bbox(YODS);
  const CIRCLE_R = 0.60 * Math.max(bbY.w, bbY.h);
  let CIRCLE = [];
  for (let i = 0; i < N_OPEN; i++) {
    const a = -Math.PI / 2 + 2 * Math.PI * i / N_OPEN;
    CIRCLE.push({ x: Math.cos(a) * CIRCLE_R, y: Math.sin(a) * CIRCLE_R });
  }
  CIRCLE = windCW(CIRCLE);
  function buildStrip(x0, x1) {
    const R = CIRCLE_R, arcN = 26, pts = [];
    for (let i = 0; i <= arcN; i++) { const x = x0 + (x1 - x0) * i / arcN; pts.push({ x, y: -Math.sqrt(Math.max(0, R * R - x * x)) }); }
    for (let i = 0; i <= arcN; i++) { const x = x1 + (x0 - x1) * i / arcN; pts.push({ x, y: Math.sqrt(Math.max(0, R * R - x * x)) }); }
    return pts;
  }
  const XS = [-CIRCLE_R, 0, CIRCLE_R];
  const STRIP = [buildStrip(XS[0], XS[1]), buildStrip(XS[1], XS[2])].map(s => resampleCorners(windCW(s), N_OPEN));
  const YOD_N = YODS.map((y, s) => alignShift(STRIP[s], resampleCorners(y, N_OPEN)));

  /* ---- morph ---- */
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function lagWeights(from, to) {
    const cf = centroid(from), ct = centroid(to);
    let dx = ct.x - cf.x, dy = ct.y - cf.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1) { dx = 0; dy = 1; } else { dx /= mag; dy /= mag; }
    const proj = from.map(p => p.x * dx + p.y * dy);
    const mn = Math.min(...proj), mx = Math.max(...proj);
    const span = (mx - mn) || 1;
    return proj.map(v => 1 - (v - mn) / span);
  }
  function splitWeights(strip) {
    const c = centroid(strip);
    let ux = c.x, uy = c.y;
    const m = Math.hypot(ux, uy);
    if (m < 1) { ux = 1; uy = 0; } else { ux /= m; uy /= m; }
    const proj = strip.map(p => p.x * ux + p.y * uy);
    const mn = Math.min(...proj), mx = Math.max(...proj);
    const span = (mx - mn) || 1;
    return proj.map(v => 1 - (v - mn) / span);
  }
  function morphShape(from, to, weights, t, lag) {
    const n = from.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const local = Math.min(1, Math.max(0, t * (1 + lag) - weights[i] * lag));
      const e = easeInOut(local);
      out[i] = { x: from[i].x + (to[i].x - from[i].x) * e, y: from[i].y + (to[i].y - from[i].y) * e };
    }
    return out;
  }
  function rigidTransform(from, to) {
    const cf = centroid(from), ct = centroid(to);
    let sc = 0, sd = 0;
    for (let i = 0; i < from.length; i++) {
      const ax = from[i].x - cf.x, ay = from[i].y - cf.y;
      const bx = to[i].x - ct.x, by = to[i].y - ct.y;
      sc += ax * by - ay * bx; sd += ax * bx + ay * by;
    }
    return { cf, ct, theta: Math.atan2(sc, sd) };
  }
  function rigidMorph(from, rig, e) {
    const ang = rig.theta * e;
    const cx = rig.cf.x + (rig.ct.x - rig.cf.x) * e;
    const cy = rig.cf.y + (rig.ct.y - rig.cf.y) * e;
    const cr = Math.cos(ang), sr = Math.sin(ang);
    return from.map(p => {
      const x = p.x - rig.cf.x, y = p.y - rig.cf.y;
      return { x: cx + x * cr - y * sr, y: cy + x * sr + y * cr };
    });
  }

  const LAG_SPLIT = 0.92;
  const LAG_BUILD = 0.55;
  const GOO_RMAX = 30;
  const GOO_K = 70;

  const TL = {
    circleStart: 0.10, circleDur: 0.32,
    splitStart: 0.55, splitDur: 1.10, splitStagger: 0.10,
    diagStart: 1.55, diagDur: 0.70,
    buildStart: 2.45, buildDur: 1.15, buildStagger: 0.10,
    end: 3.85, holdEnd: 2.0
  };
  const W_split = STRIP.map(splitWeights);
  const W_dgrow = lagWeights(DIAG0, DIAG_MID);
  const RIG_build = YODS.map((y, s) => rigidTransform(y, ARMS[s]));
  const RIG_diag = rigidTransform(DIAG_MID, DIAG_FIN);
  const phase = (t, start, dur) => Math.min(1, Math.max(0, (t - start) / dur));

  /* ---- instance factory ---- */
  function createAlephBuild(canvas, opts) {
    opts = opts || {};
    const ink = opts.ink || '#fdfcf8';
    const bg = opts.bg || '#000';
    const fitW = opts.fitW || 460;
    const fitH = opts.fitH || 400;
    const loop = opts.loop !== false;
    const onFormed = opts.onFormed || function () {};
    const onEnd = opts.onEnd || function () {};

    const ctx = canvas.getContext('2d');
    const off = document.createElement('canvas');
    const offctx = off.getContext('2d');
    let vw = 0, vh = 0, dpr = 1;
    let rafId = null, t0 = 0, running = false, formed = false, ended = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = canvas.clientWidth || (canvas.parentNode && canvas.parentNode.clientWidth) || window.innerWidth;
      vh = canvas.clientHeight || (canvas.parentNode && canvas.parentNode.clientHeight) || window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
    }
    const onResize = function () { resize(); };
    window.addEventListener('resize', onResize);

    function drawShape(pts, scale, ox, oy, c) {
      c = c || ctx;
      c.beginPath();
      c.moveTo(ox + pts[0].x * scale, oy + pts[0].y * scale);
      for (let i = 1; i < pts.length; i++) c.lineTo(ox + pts[i].x * scale, oy + pts[i].y * scale);
      c.closePath();
      c.fill();
    }
    function drawMerged(drawFn, R) {
      if (R <= 0.5) { drawFn(ctx); return; }
      if (off.width !== canvas.width || off.height !== canvas.height) { off.width = canvas.width; off.height = canvas.height; }
      offctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      offctx.fillStyle = '#000';
      offctx.fillRect(0, 0, vw, vh);
      offctx.fillStyle = '#fff';
      drawFn(offctx);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = 'blur(' + (R * dpr) + 'px) contrast(' + GOO_K + ')';
      ctx.drawImage(off, 0, 0);
      ctx.filter = 'none';
      ctx.restore();
    }

    function render(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, vw, vh);

      const scale = Math.min(vw / fitW, vh / fitH);
      const ox = vw / 2, oy = vh / 2;
      ctx.fillStyle = ink;

      if (t < TL.buildStart) {
        if (t < TL.splitStart) {
          const cg = easeOut(phase(t, TL.circleStart, TL.circleDur));
          if (cg > 0) drawMerged(function (c) {
            for (let s = 0; s < 2; s++) drawShape(STRIP[s].map(p => ({ x: p.x * cg, y: p.y * cg })), scale, ox, oy, c);
          }, 0);
        } else {
          const sg = phase(t, TL.splitStart, TL.splitDur + TL.splitStagger);
          let R;
          if (sg < 0.15) R = GOO_RMAX * (sg / 0.15);
          else if (sg < 0.70) R = GOO_RMAX * (1 - (sg - 0.15) / 0.55);
          else R = 0;
          drawMerged(function (c) {
            for (let s = 0; s < 2; s++) {
              const k = 1 - s;
              const pS = phase(t, TL.splitStart + k * TL.splitStagger, TL.splitDur);
              drawShape(morphShape(STRIP[s], YOD_N[s], W_split[s], pS, LAG_SPLIT), scale, ox, oy, c);
            }
          }, R);
        }
      } else {
        for (let s = 0; s < 2; s++) {
          const k = 1 - s;
          const pB = phase(t, TL.buildStart + k * TL.buildStagger, TL.buildDur);
          if (pB >= 1) drawShape(ARMS[s], scale, ox, oy);
          else if (pB > 0) drawShape(rigidMorph(YODS[s], RIG_build[s], easeInOut(pB)), scale, ox, oy);
          else drawShape(YODS[s], scale, ox, oy);
        }
      }

      const pG = phase(t, TL.diagStart, TL.diagDur);
      const pM = phase(t, TL.buildStart, TL.buildDur);
      if (pM >= 1) drawShape(DIAG_FIN, scale, ox, oy);
      else if (pM > 0) drawShape(rigidMorph(DIAG_MID, RIG_diag, easeInOut(pM)), scale, ox, oy);
      else if (pG > 0) drawShape(morphShape(DIAG0, DIAG_MID, W_dgrow, pG, LAG_BUILD), scale, ox, oy);
    }

    function frame(now) {
      if (!running) return;
      let t = (now - t0) / 1000;
      const total = TL.end + TL.holdEnd;
      if (loop) {
        if (t > total) { t0 = now; t = 0; }
      } else if (t >= TL.end) {
        t = TL.end;
        if (!formed) { formed = true; onFormed(); }
        if (!ended && (now - t0) / 1000 > total) { ended = true; onEnd(); }
      }
      render(t);
      rafId = requestAnimationFrame(frame);
    }

    return {
      DURATION: TL.end,
      play: function () {
        resize();
        formed = false; ended = false; running = true;
        t0 = performance.now();
        if (rafId === null) rafId = requestAnimationFrame(frame);
      },
      stop: function () {
        running = false;
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      },
      resize: resize,
      destroy: function () {
        this.stop();
        window.removeEventListener('resize', onResize);
      }
    };
  }

  global.AlephMorph = { create: createAlephBuild };
})(typeof window !== 'undefined' ? window : this);
