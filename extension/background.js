// ============================================
// BOOKMARK DPB - BACKGROUND SERVICE WORKER
// ============================================

// Colores disponibles para highlights
const HIGHLIGHT_COLORS = [
  { id: "yellow", label: "🟡 Amarillo", color: "#fef08a" },
  { id: "green", label: "🟢 Verde", color: "#86efac" },
  { id: "blue", label: "🔵 Azul", color: "#93c5fd" },
  { id: "pink", label: "🩷 Rosa", color: "#f9a8d4" },
  { id: "orange", label: "🟠 Naranja", color: "#fdba74" },
];

// Crear el menú contextual al instalar
chrome.runtime.onInstalled.addListener(() => {
  // Menú para guardar página
  chrome.contextMenus.create({
    id: "savePage",
    title: "📌 Guardar página en Bookmark DPB",
    contexts: ["page"],
  });

  // Menú para guardar enlace
  chrome.contextMenus.create({
    id: "saveLink",
    title: "🔗 Guardar enlace en Bookmark DPB",
    contexts: ["link"],
  });

  // Menú para guardar selección
  chrome.contextMenus.create({
    id: "saveSelection",
    title: "📝 Guardar selección en Bookmark DPB",
    contexts: ["selection"],
  });

  // NUEVO: Menú padre para resaltar
  chrome.contextMenus.create({
    id: "highlightParent",
    title: "🖍️ Resaltar en Bookmark DPB",
    contexts: ["selection"],
  });

  // NUEVO: Sub-menús para cada color
  HIGHLIGHT_COLORS.forEach((colorOption) => {
    chrome.contextMenus.create({
      id: `highlight_${colorOption.id}`,
      parentId: "highlightParent",
      title: colorOption.label,
      contexts: ["selection"],
    });
  });
});

// Escuchar clics en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "savePage") {
    handleSavePage(tab);
  } else if (info.menuItemId === "saveLink") {
    handleSaveLink(info, tab);
  } else if (info.menuItemId === "saveSelection") {
    handleSaveSelection(info, tab);
  } else if (String(info.menuItemId).startsWith("highlight_")) {
    // NUEVO: Manejar resaltado
    const color = String(info.menuItemId).replace("highlight_", "");
    handleHighlight(info, tab, color);
  }
});

// NUEVO: Manejar resaltado de texto
async function handleHighlight(info, tab, color) {
  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  try {
    // Obtener configuración
    const config = await chrome.storage.local.get([
      "supabaseUrl",
      "supabaseKey",
      "userId",
    ]);

    const { supabaseUrl, supabaseKey, userId } = config;

    if (!supabaseUrl || !supabaseKey || !userId) {
      showNotification(
        "⚙️ Configuración necesaria",
        "Configura la extensión primero."
      );
      return;
    }

    // Buscar si hay un bookmark con esta URL
    const { data: existingBookmark } = await fetch(
      `${supabaseUrl}/rest/v1/bookmarks?url=eq.${encodeURIComponent(tab.url)}&user_id=eq.${userId}&is_deleted=eq.false&select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    ).then((res) => res.json());

    const bookmarkId = existingBookmark?.[0]?.id || null;

    // Guardar el highlight
    const response = await fetch(`${supabaseUrl}/rest/v1/highlights`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        bookmark_id: bookmarkId,
        url: tab.url,
        selected_text: selectedText,
        note: null,
        color: color,
      }),
    });

    if (response.ok) {
      showNotification(
        "🖍️ Highlight guardado",
        `Texto resaltado en ${color} (${selectedText.substring(0, 50)}...)`
      );
    } else {
      throw new Error("Error al guardar highlight");
    }
  } catch (error) {
    console.error("Error guardando highlight:", error);
    showNotification("❌ Error", "No se pudo guardar el highlight");
  }
}

// Manejar guardar página actual
async function handleSavePage(tab) {
  try {
    const metadata = await getPageMetadata(tab.id);

    const bookmarkData = {
      url: tab.url,
      title: metadata.title || tab.title || tab.url,
      description: metadata.description || "",
      imageUrl: metadata.imageUrl || null,
    };

    openSaveWindow(bookmarkData);
  } catch (error) {
    console.error("Error obteniendo datos de la página:", error);
    showNotification("❌ Error", "No se pudo obtener la información de la página");
  }
}

// Manejar guardar enlace
async function handleSaveLink(info, tab) {
  try {
    const linkUrl = info.linkUrl;

    let title = info.linkText?.trim() || linkUrl;
    let description = "";
    let imageUrl = null;

    if (!title || title.length < 3 || title === linkUrl) {
      try {
        const metadata = await fetchUrlMetadata(linkUrl);
        title = metadata.title || linkUrl;
        description = metadata.description || "";
        imageUrl = metadata.imageUrl || null;
      } catch (e) {
        title = info.linkText?.trim() || linkUrl;
      }
    }

    const bookmarkData = {
      url: linkUrl,
      title: title,
      description: description,
      imageUrl: imageUrl,
    };

    openSaveWindow(bookmarkData);
  } catch (error) {
    console.error("Error procesando enlace:", error);
    showNotification("❌ Error", "No se pudo procesar el enlace");
  }
}

// Manejar guardar selección
async function handleSaveSelection(info, tab) {
  try {
    const bookmarkData = {
      url: tab.url,
      title: tab.title || tab.url,
      description: info.selectionText?.trim().substring(0, 500) || "",
      imageUrl: null,
    };

    openSaveWindow(bookmarkData);
  } catch (error) {
    console.error("Error procesando selección:", error);
    showNotification("❌ Error", "No se pudo procesar la selección");
  }
}

// Abrir la ventana de guardado rápido
async function openSaveWindow(bookmarkData) {
  const config = await chrome.storage.local.get([
    "supabaseUrl",
    "supabaseKey",
    "userId",
  ]);

  if (!config.supabaseUrl || !config.supabaseKey || !config.userId) {
    showNotification(
      "⚙️ Configuración necesaria",
      "Haz clic derecho en el ícono de la extensión y selecciona 'Opciones' para configurar."
    );
    chrome.runtime.openOptionsPage();
    return;
  }

  await chrome.storage.local.set({ pendingBookmark: bookmarkData });

  const currentWindow = await chrome.windows.getCurrent();

  const width = 420;
  const height = 640;

  const left = Math.round(
    currentWindow.left + (currentWindow.width - width) / 2
  );
  const top = Math.round(
    currentWindow.top + (currentWindow.height - height) / 2
  );

  chrome.windows.create({
    url: chrome.runtime.getURL("save.html"),
    type: "popup",
    width: width,
    height: height,
    left: left,
    top: top,
    focused: true,
  });
}

// Obtener metadatos de la página actual
async function getPageMetadata(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractPageMetadata,
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
  } catch (error) {
    console.error("Error obteniendo metadatos:", error);
  }

  return {};
}

// Función que se inyecta en la página para extraer metadatos
function extractPageMetadata() {
  const getMetaContent = (selector) => {
    const element = document.querySelector(selector);
    return element ? element.getAttribute("content") : null;
  };

  return {
    title: document.title,
    description:
      getMetaContent('meta[name="description"]') ||
      getMetaContent('meta[property="og:description"]') ||
      "",
    imageUrl:
      getMetaContent('meta[property="og:image"]') ||
      getMetaContent('meta[name="twitter:image"]') ||
      null,
  };
}

// Obtener metadatos de una URL haciendo fetch
async function fetchUrlMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {};
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : null;

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/is);
    const description = descMatch ? decodeHTMLEntities(descMatch[1].trim()) : "";

    const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/is);
    const imageUrl = imgMatch ? imgMatch[1].trim() : null;

    return { title, description, imageUrl };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {};
  }
}

// Decodificar entidades HTML básicas
function decodeHTMLEntities(text) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
}

// Mostrar notificación
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message,
    priority: 2,
  });
}

// Escuchar mensajes del content script (highlighter)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveHighlight") {
    handleHighlightFromContentScript(message.data, sender.tab)
      .then((result) => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Mantener el canal abierto para respuesta asíncrona
  }
});

// Manejar highlight desde el content script
async function handleHighlightFromContentScript(data, tab) {
  const config = await chrome.storage.local.get([
    "supabaseUrl",
    "supabaseKey",
    "userId",
  ]);

  const { supabaseUrl, supabaseKey, userId } = config;

  if (!supabaseUrl || !supabaseKey || !userId) {
    throw new Error("Configuración incompleta");
  }

  // Buscar si hay un bookmark con esta URL
  const bookmarkResponse = await fetch(
    `${supabaseUrl}/rest/v1/bookmarks?url=eq.${encodeURIComponent(data.url)}&user_id=eq.${userId}&is_deleted=eq.false&select=id&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );
  const bookmarkData = await bookmarkResponse.json();
  const bookmarkId = bookmarkData?.[0]?.id || null;

  // Guardar el highlight
  const response = await fetch(`${supabaseUrl}/rest/v1/highlights`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      bookmark_id: bookmarkId,
      url: data.url,
      selected_text: data.selectedText,
      note: data.note || null,
      color: data.color,
    }),
  });

  if (!response.ok) {
    throw new Error("Error al guardar highlight");
  }

  showNotification(
    "🖍️ Highlight guardado",
    `Texto resaltado en ${data.color}`
  );
}

// Atajos de teclado
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-current-tab") {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tabs[0]) {
        handleSavePage(tabs[0]);
      }
    } catch (error) {
      console.error("Error con atajo de teclado:", error);
    }
  }
});

// Clic en el ícono de la barra
chrome.action.onClicked.addListener((tab) => {
  handleSavePage(tab);
});