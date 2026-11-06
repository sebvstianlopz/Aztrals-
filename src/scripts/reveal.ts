// Parts of each section rise in, one after another, the first time the section is seen.
export function initReveal() {
  if (!document.documentElement.classList.contains('motion')) return;
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  els.forEach((el) => Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i))));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
