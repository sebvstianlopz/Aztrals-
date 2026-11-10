// Opens and closes the intro screen. Whether it shows at all is decided before first paint by the
// inline script in Base.astro (html.intro-on); this only runs the closing.
const root = document.documentElement;
const intro = document.querySelector<HTMLElement>('[data-intro]');

if (intro && root.classList.contains('intro-on')) {
  const page = document.querySelectorAll<HTMLElement>('[data-inert-with-bag]');
  page.forEach((el) => (el.inert = true));

  let closing = false;
  const onKey = (e: KeyboardEvent) => {
    if (['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      close();
    }
  };
  const close = () => {
    if (closing) return;
    closing = true;
    root.classList.add('intro-leaving');
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      intro.remove();
      root.classList.remove('intro-on', 'intro-leaving');
      page.forEach((el) => (el.inert = false));
      window.removeEventListener('keydown', onKey);
      window.dispatchEvent(new Event('aztrals:intro-done'));
    };
    intro.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 1100); // in case the transition never fires
  };

  const timer = setTimeout(close, 3500);
  intro.addEventListener('click', () => {
    clearTimeout(timer);
    close();
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', close, { once: true, passive: true });
  window.addEventListener('touchmove', close, { once: true, passive: true });
} else {
  intro?.remove();
}
