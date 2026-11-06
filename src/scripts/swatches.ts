// Colourway pictures on a product card: show that colourway and link to it.
export function initSwatches(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.tile').forEach((tile) => {
    const main = tile.querySelector<HTMLImageElement>('.pic .main');
    const alt = tile.querySelector<HTMLImageElement>('.pic .alt');
    const links = tile.querySelectorAll<HTMLAnchorElement>('a');
    const buttons = tile.querySelectorAll<HTMLButtonElement>('.thumb');
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        if (main && b.dataset.main) main.src = b.dataset.main;
        if (alt) b.dataset.front ? (alt.src = b.dataset.front) : alt.remove();
        links.forEach((a) => b.dataset.href && (a.href = b.dataset.href));
      }),
    );
  });
}
