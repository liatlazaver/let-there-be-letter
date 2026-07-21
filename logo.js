/* ראש מילין — the brand mark (מיקום לוגו.png reference).
   One black square, 124u — exactly the white top bar's height — flush to the
   top-right corner of the viewport, holding the pinwheel mark centred at the
   reference's inner padding. Mounted ONCE on the body as a fixed element
   above every screen (letters, ניקוד, אודות, the opening world), so it sits
   in the same exact place at the same exact scale everywhere the white bar
   lives. Inert to the pointer — it never disturbs any interaction. */

const SRC = "assets/logo-mark.png"; // 309×309, ink #101010 — blends seamlessly

(function injectCss() {
  const tag = document.createElement("style");
  tag.textContent = `
  .os-logo {
    position: fixed;
    top: 0;
    right: 0;
    width: calc(100vw / 2850 * 124);
    height: calc(100vw / 2850 * 124);
    background: #101010;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 90;            /* above every screen (60–80), under the cursor (100) */
    pointer-events: none;   /* purely a mark — never intercepts anything */
  }
  .os-logo img {
    /* the mark's ink spans 88% of its bitmap; 87.5% here lands the drawn
       pinwheel at the reference's ~95.5u inside the 124u square */
    width: 87.5%;
    height: 87.5%;
    display: block;
  }`;
  document.head.appendChild(tag);
})();

export function mountLogo() {
  if (document.querySelector(".os-logo")) return;
  const box = document.createElement("div");
  box.className = "os-logo";
  box.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.src = SRC;
  img.alt = "";
  box.appendChild(img);
  document.body.appendChild(box);
}
