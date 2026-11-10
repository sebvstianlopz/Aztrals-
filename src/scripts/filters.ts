// Collection filters and colour pickers. Both work without motion; motion only adds the fade.

// ---------- filters ----------
document.querySelectorAll<HTMLElement>('[data-filter-scope]').forEach((scope) => {
  const buttons = [...scope.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const tiles = [...scope.querySelectorAll<HTMLElement>('[data-tile]')];
  const count = scope.querySelector<HTMLElement>('[data-filter-count]');
  const none = scope.querySelector<HTMLElement>('[data-filter-none]');

  function apply(key: string) {
    let shown = 0;
    tiles.forEach((tile) => {
      const match = key === 'all' || tile.hasAttribute(`data-${key}`);
      tile.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
    if (count) count.textContent = shown === 1 ? count.dataset.one || '' : (count.dataset.many || '').replace('{n}', String(shown));
    if (none) none.hidden = shown > 0;
  }

  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter || 'all')));
});

// ---------- colour pickers (spotlight and product page) ----------
document.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (!input.matches('[data-cw-input]')) return;
  const scope = input.closest<HTMLElement>('[data-spot], [data-cw-scope]');
  if (!scope) return;
  scope.querySelectorAll<HTMLElement>('[data-cw]').forEach((layer) => {
    layer.toggleAttribute('data-active', layer.dataset.cw === input.value);
  });
  scope.querySelectorAll<HTMLElement>('[data-cw-name]').forEach((el) => (el.textContent = input.dataset.name || ''));
  scope.querySelectorAll<HTMLElement>('[data-add]').forEach((btn) => (btn.dataset.colorway = input.value));
});
