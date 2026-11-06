// Colour buttons on a product tile: show that colourway's picture and link to it.
export function initSwatches(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.tile').forEach((tile) => {
    const img = tile.querySelector<HTMLImageElement>('.pic img');
    const links = tile.querySelectorAll<HTMLAnchorElement>('a');
    const buttons = tile.querySelectorAll<HTMLButtonElement>('.sw');
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        if (img && b.dataset.poster) img.src = b.dataset.poster;
        if (b.dataset.field) tile.style.setProperty('--field', b.dataset.field);
        links.forEach((a) => b.dataset.href && (a.href = b.dataset.href));
      }),
    );
  });
}
