/** Consistent 24px stroke icons — no external dependencies */

const STROKE = 1.5;

function svgBody(paths, extra = "") {
  return paths
    .map(
      (d) =>
        `<path d="${d}" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("") + extra;
}

const SHAPES = {
  menu: svgBody(["M4 7h16", "M4 12h16", "M4 17h16"]),
  close: svgBody(["M6 6l12 12", "M18 6L6 18"]),
  cart: svgBody([
    "M6 6h14l-1 10H7L6 6z",
    "M6 6L5 3H2",
    "M9 20a1 1 0 100-2 1 1 0 000 2z",
    "M17 20a1 1 0 100-2 1 1 0 000 2z",
  ]),
  chevronStart: svgBody(["M15 6l-6 6 6 6"]),
  chevronEnd: svgBody(["M9 6l6 6-6 6"]),
  plus: svgBody(["M12 5v14", "M5 12h14"]),
  minus: svgBody(["M5 12h14"]),
  trash: svgBody([
    "M4 7h16",
    "M10 11v6",
    "M14 11v6",
    "M9 7V5h6v2",
    "M7 7l1 12h8l1-12",
  ]),
  check: svgBody(["M5 12l4 4 10-10"]),
  alert: svgBody(["M12 8v5", "M12 17h.01"], `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="${STROKE}" fill="none"/>`),
  arrowBack: svgBody(["M9 6l-6 6 6 6", "M3 12h18"]),
  cod: svgBody(["M4 7h16v10H4V7z", "M8 11h8", "M8 14h5"]),
  pin: svgBody(
    ["M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"],
    `<circle cx="12" cy="10" r="2.25" stroke="currentColor" stroke-width="${STROKE}" fill="none"/>`
  ),
};

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/**
 * @param {keyof SHAPES} name
 * @param {{ decorative?: boolean, label?: string, className?: string, size?: number }} [opts]
 */
export function icon(name, opts = {}) {
  const inner = SHAPES[name];
  if (!inner) return "";
  const decorative = opts.decorative !== false;
  const size = opts.size ?? 24;
  const cls = opts.className ? ` class="${escapeAttr(opts.className)}"` : ' class="icon"';
  const aria = decorative
    ? ' aria-hidden="true" focusable="false"'
    : ` role="img" aria-label="${escapeAttr(opts.label || name)}"`;
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"${aria}>${inner}</svg>`;
}
