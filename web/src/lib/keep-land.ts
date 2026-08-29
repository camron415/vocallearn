export function keepSlotRem(count: number, viewport = 390) {
  const n = Math.max(1, count);
  const dock = Math.min(28 * 16, viewport * 0.56);
  const gap = 0.22 * 16;
  const px = Math.min(
    0.82 * 16,
    Math.max(0.5 * 16, (dock - Math.max(0, n - 1) * gap) / n)
  );
  return `${+(px / 16).toFixed(3)}rem`;
}

export function keepLandBox() {
  if (typeof document === "undefined") return null;
  const pocket = document.querySelector("[data-keep-pocket]");
  const box = pocket?.getBoundingClientRect();
  if (!box) return null;
  const size = Math.max(12, Math.round(box.height) || 13);
  return new DOMRect(
    box.right - size,
    box.top + Math.max(0, (box.height - size) / 2),
    size,
    size
  );
}
