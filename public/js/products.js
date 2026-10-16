import { fetchCatalog } from "./api.js";
import { initCartUi } from "./cart-ui.js";
import { renderContact, renderFooter, applySiteBranding } from "./site-chrome.js";
import { initMobileNav, initHeaderCompact } from "./nav-ui.js";
import { hydrateIcons } from "./icons-init.js";
import { t } from "./strings.js";

function showCatalogError() {
  const catalog = document.getElementById("catalog");
  if (!catalog) return;
  catalog.innerHTML = t.catalogLoadError;
  catalog.querySelector("[data-catalog-retry]")?.addEventListener("click", () => {
    boot();
  });
}

async function boot() {
  try {
    const catalog = await fetchCatalog();
    const { meta } = catalog;

    applySiteBranding(meta, t.productsPageTitle);
    renderContact(meta);
    renderFooter(meta);
    initCartUi(catalog);
  } catch (err) {
    console.error(err);
    showCatalogError();
  }
}

hydrateIcons();
initMobileNav();
initHeaderCompact();
boot();
