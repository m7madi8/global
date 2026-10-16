import { icon } from "./icons.js";

export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon-slot]").forEach((el) => {
    const name = el.getAttribute("data-icon-slot");
    if (!name) return;
    el.outerHTML = icon(name, { className: "icon" });
  });
}
