/* ראש מילין — the entry morph.
   Whenever a letter screen is entered — from the opening screen OR by
   navigating between letters (arrows / research rows, through the
   accordion) — the letter's own construction animation (assets/morph)
   plays ONCE inside the black letter field. The animation's final letter
   is mapped 1:1 onto the screen's own static letter (same ink box, same
   optical centre), so when it lands the interactive letter simply fades
   in over it — a seamless handoff. On accordion arrivals the morph waits
   for the fold to settle (the incoming panel unfolds clean), then builds:
   accordion → construction → interactive screen, one continuous gesture. */

const DIR = {
  "א": "aleph", "ב": "bet", "ג": "gimel", "ד": "dalet", "ה": "he", "ו": "vav",
  "ז": "zayin", "ח": "het", "ט": "tet", "י": "yod", "כ": "kaf", "ך": "kaf-sofit",
  "ל": "lamed", "מ": "mem", "ם": "mem-sofit", "נ": "nun", "ן": "nun-sofit",
  "ס": "samekh", "ע": "ayin", "פ": "pe", "ף": "pe-sofit", "צ": "tsadi",
  "ץ": "tsadi-sofit", "ק": "qof", "ר": "resh", "ש": "shin", "ת": "tav",
};


/* injected once: while the morph plays the letter (and only the letter —
   the frame and the gematria stay) is hidden but measurable; the reveal
   crossfades it back in over the animation's identical final frame. */
(function injectCss() {
  const tag = document.createElement("style");
  tag.textContent = `
  .lp2.lp2-morphing .lp2-comp, .lp2.lp2-morphing .lp2-base,
  .lp2.lp2-morphing .lp2-gen, .lp2.lp2-morphing .lp2-lbl,
  .lp2.lp2-morphing .lp2-tag { opacity: 0; pointer-events: none; }
  .lp2.lp2-revealing .lp2-comp, .lp2.lp2-revealing .lp2-base,
  .lp2.lp2-revealing .lp2-gen, .lp2.lp2-revealing .lp2-lbl,
  .lp2.lp2-revealing .lp2-tag { transition: opacity 180ms ease; }
  /* during the build the black panel stands clean: the hairline frame and
     its gematria retire, and breathe back in once the letter has landed —
     exactly where and as they always were */
  .lp2.lp2-morphing .lp2-frame, .lp2.lp2-morphing .lp2-gem { opacity: 0; }
  .lp2.lp2-revealing .lp2-frame, .lp2.lp2-revealing .lp2-gem { transition: opacity 260ms ease; }
  .lp2-morph-frame {
    position: absolute; inset: 0; width: 100%; height: 100%;
    border: 0; background: transparent; pointer-events: none; z-index: 5;
  }
  .lp2-morph-frame.is-out { opacity: 0; transition: opacity 160ms ease; }`;
  document.head.appendChild(tag);
})();

export function playEntryMorph(screenEl, opts) {
  const letter = screenEl.dataset.letter;
  const dir = DIR[letter];
  const field = screenEl.querySelector(".lp2-field");
  const svg = screenEl.querySelector(".lp2-art");
  /* י is itself a foundational unit — its morph has no construction stage,
     so its screen opens exactly as before */
  if (!dir || !field || !svg || letter === "י") return;

  /* the letter hides NOW — an accordion arrival unfolds a clean black
     panel — but measuring and playing wait for `after` (the accordion's
     completion), when the screen's columns have shed their fold transforms
     and the geometry is final */
  const after = opts && opts.after;

  screenEl.classList.add("lp2-morphing");

  let iframe = null;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.removeEventListener("message", onMsg);
    /* a screen that navigated away mid-morph needs no reveal — just cleanup */
    if (!screenEl.isConnected) { if (iframe) iframe.remove(); return; }
    /* the crossfade: the identical static letter fades in over the final
       animation frame, then the frame slips away beneath it */
    screenEl.classList.add("lp2-revealing");
    screenEl.classList.remove("lp2-morphing");
    setTimeout(() => {
      if (iframe) iframe.classList.add("is-out");
      setTimeout(() => {
        if (iframe) iframe.remove();
        screenEl.classList.remove("lp2-revealing");
      }, 200);
    }, 190);
  };
  const onMsg = (e) => {
    /* only THIS screen's own animation ends its morph state — a message
       from another screen's frame (mid-navigation) is not ours */
    if (e && e.data && e.data.type === "morph-done" &&
        iframe && e.source === iframe.contentWindow) finish();
  };

  /* the screens build their letters asynchronously — wait until the ink
     exists and is measurable, then fit the morph onto it exactly */
  let t0 = 0;
  const poll = () => {
    if (finished) return;
    if (!screenEl.isConnected || screenEl.dataset.letter !== letter) { finish(); return; }
    if (!t0) t0 = performance.now();
    /* the letter's drawn ink box, measured in SCREEN pixels: each element's
       local bbox is projected through its full transform chain (viewBox +
       its own translate/scale) via getScreenCTM — the exact rendered box */
    let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9, any = false;
    svg.querySelectorAll(".lp2-comp, .lp2-base, .lp2-gen").forEach((el) => {
      let b;
      try { b = el.getBBox(); } catch (err) { return; }
      if (!b || (!b.width && !b.height)) return;
      const m = el.getScreenCTM();
      if (!m) return;
      [[b.x, b.y], [b.x + b.width, b.y],
       [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].forEach(([x, y]) => {
        const sx = m.a * x + m.c * y + m.e;
        const sy = m.b * x + m.d * y + m.f;
        if (sx < X0) X0 = sx; if (sx > X1) X1 = sx;
        if (sy < Y0) Y0 = sy; if (sy > Y1) Y1 = sy;
      });
      any = true;
    });
    if (!any) {
      /* never hold the screen hostage: if the letter can't be measured,
         reveal it and skip the animation */
      if (performance.now() - t0 > 4000) { finish(); return; }
      setTimeout(poll, 90);
      return;
    }

    const fr = field.getBoundingClientRect();
    if (!fr.width) { setTimeout(poll, 90); return; }
    const tx = X0 - fr.left;
    const ty = Y0 - fr.top;
    const tw = X1 - X0;
    const th = Y1 - Y0;

    window.addEventListener("message", onMsg);
    iframe = document.createElement("iframe");
    iframe.className = "lp2-morph-frame";
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.src =
      `assets/morph/${dir}/${dir}-morph-animation.html?embed=1` +
      `&tx=${tx.toFixed(2)}&ty=${ty.toFixed(2)}&tw=${tw.toFixed(2)}&th=${th.toFixed(2)}`;
    field.appendChild(iframe);
    /* safety net: if the animation never reports, reveal anyway */
    setTimeout(finish, 8000);
  };
  /* start immediately (opening-screen entry) or once the accordion settles */
  Promise.resolve(after).then(poll, poll);
}
