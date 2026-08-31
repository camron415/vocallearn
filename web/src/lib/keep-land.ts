export function keepSlotRem(count: number, viewport = 390) {
  const n = Math.max(1, count);
  const dock = Math.min(28 * 16, viewport * 0.56);
  const gap = 0.22 * 16;
  const cap = n >= 10 ? 0.92 * 16 : 1.05 * 16;
  const px = Math.min(
    cap,
    Math.max(0.62 * 16, (dock - Math.max(0, n - 1) * gap) / n)
  );
  return `${+(px / 16).toFixed(3)}rem`;
}

export function keepLandBox() {
  if (typeof document === "undefined") return null;
  const pocket = document.querySelector("[data-keep-pocket]");
  const box = pocket?.getBoundingClientRect();
  if (!box) return null;
  const size = Math.max(12, Math.round(box.height) || 13);
  const vw = window.innerWidth;
  const x = Math.min(Math.max(8, box.right - size), vw - size - 8);
  const y = Math.max(8, box.top + Math.max(0, (box.height - size) / 2));
  return new DOMRect(x, y, size, size);
}

/** Same bead-size target as Keep, but the ◎ badge. */
export function goldLandBox() {
  if (typeof document === "undefined") return null;
  const mark = document.querySelector("[data-gold-kept-land]");
  const box = mark?.getBoundingClientRect();
  if (!box || box.width < 4) return null;
  const size = Math.max(12, Math.round(Math.min(box.height, box.width) || 16));
  return new DOMRect(
    box.left + Math.max(0, (box.width - size) / 2),
    box.top + Math.max(0, (box.height - size) / 2),
    size,
    size
  );
}
