/* ראש מילין — the inactivity reset.
   A small reusable manager: watches every kind of user interaction
   (pointer, wheel, keys, touch, inner scrolls), and when a full quiet
   period passes with none, calls the given reset. The timer is a cheap
   timestamp + a 5s heartbeat — no re-arming storms on pointermove, no
   duplicate timers, and a stop() that removes everything cleanly. */

const EVENTS = ["pointermove", "pointerdown", "wheel", "keydown", "touchstart", "scroll"];

/**
 * @param {Object} opts
 * @param {number} opts.timeoutMs  full quiet period before reset (default 2min)
 * @param {() => void} opts.reset  called once per elapsed quiet period
 * @returns {() => void} stop — removes listeners and the heartbeat
 */
export function startInactivityReset({ timeoutMs = 120000, reset }) {
  let last = performance.now();
  const bump = () => { last = performance.now(); };

  /* capture phase: inner scrollers (the readings' panels) don't bubble
     their scroll events, but capture on window still sees them */
  EVENTS.forEach((ev) =>
    window.addEventListener(ev, bump, { passive: true, capture: true })
  );

  const heartbeat = setInterval(() => {
    if (performance.now() - last < timeoutMs) return;
    last = performance.now(); // one reset per quiet period, never a burst
    try { reset(); } catch (err) { /* a failed reset must not kill the timer */ }
  }, 5000);

  return function stop() {
    clearInterval(heartbeat);
    EVENTS.forEach((ev) =>
      window.removeEventListener(ev, bump, { capture: true })
    );
  };
}
