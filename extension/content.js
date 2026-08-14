// ============================================
// BOOKMARK DPB - CONTENT SCRIPT
// ============================================
// Este script se inyecta en las páginas para
// proporcionar metadatos adicionales cuando
// el background lo solicite.

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getMetadata") {
    const metadata = {
      title: document.title,
      description:
        getMetaContent('meta[name="description"]') ||
        getMetaContent('meta[property="og:description"]') ||
        "",
      imageUrl:
        getMetaContent('meta[property="og:image"]') ||
        getMetaContent('meta[name="twitter:image"]') ||
        null,
      canonicalUrl: getCanonicalUrl(),
    };

    sendResponse(metadata);
  }

  return true; // Mantener el canal de mensaje abierto
});

// Obtener contenido de una meta tag
function getMetaContent(selector) {
  const element = document.querySelector(selector);
  return element ? element.getAttribute("content") : null;
}

// Obtener URL canónica
function getCanonicalUrl() {
  const canonical = document.querySelector('link[rel="canonical"]');
  return canonical ? canonical.getAttribute("href") : window.location.href;
}