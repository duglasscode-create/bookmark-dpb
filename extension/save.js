// ============================================
// BOOKMARK DPB - VENTANA DE GUARDADO RÁPIDO
// ============================================

let pendingBookmark = null;
let collections = [];
let tags = [];
let selectedCollectionId = null;
let selectedTagIds = [];
let config = {};

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  // Cargar configuración
  config = await chrome.storage.local.get([
    "supabaseUrl",
    "supabaseKey",
    "userId",
    "defaultCollectionId",
  ]);

  if (!config.supabaseUrl || !config.supabaseKey || !config.userId) {
    showError("Configuración incompleta. Configura la extensión primero.");
    disableSave();
    return;
  }

  // Cargar el marcador pendiente
  const stored = await chrome.storage.local.get("pendingBookmark");
  pendingBookmark = stored.pendingBookmark;

  if (!pendingBookmark) {
    showError("No hay marcador para guardar.");
    disableSave();
    return;
  }

  // Mostrar info del marcador
  document.getElementById("bookmarkTitle").textContent =
    pendingBookmark.title || pendingBookmark.url;
  document.getElementById("bookmarkUrl").textContent = pendingBookmark.url;

  // Seleccionar colección por defecto
  selectedCollectionId = config.defaultCollectionId || null;

  // Cargar colecciones y etiquetas
  await Promise.all([loadCollections(), loadTags()]);

  // Configurar botones
  document.getElementById("cancelBtn").addEventListener("click", cancelSave);
  document.getElementById("saveBtn").addEventListener("click", saveBookmark);

  // NUEVO: Botón de configuración
  document.getElementById("settingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Atajos de teclado
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cancelSave();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveBookmark();
    }
  });
});

// Cargar colecciones desde Supabase
async function loadCollections() {
  const container = document.getElementById("collectionsList");

  try {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/collections?user_id=eq.${config.userId}&order=position.asc`,
      {
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error cargando colecciones");
    }

    collections = await response.json();
    renderCollections();
  } catch (error) {
    console.error("Error cargando colecciones:", error);
    container.innerHTML = '<div class="empty-message">Error al cargar colecciones</div>';
  }
}

// Renderizar lista de colecciones
function renderCollections() {
  const container = document.getElementById("collectionsList");

  if (collections.length === 0) {
    container.innerHTML = '<div class="empty-message">No tienes colecciones</div>';
    return;
  }

  container.innerHTML = "";

  // Opción "Sin colección"
  const noneItem = createCollectionItem(null, "📂", "Sin colección");
  container.appendChild(noneItem);

  // Colecciones
  collections.forEach((collection) => {
    const item = createCollectionItem(
      collection.id,
      collection.icon || "📁",
      collection.name
    );
    container.appendChild(item);
  });
}

// Crear un item de colección
function createCollectionItem(id, icon, name) {
  const item = document.createElement("div");
  item.className = "collection-item";
  if (selectedCollectionId === id) {
    item.classList.add("selected");
  }

  item.innerHTML = `
    <span class="collection-icon">${icon}</span>
    <span class="collection-name">${escapeHtml(name)}</span>
    <span class="collection-check">✓</span>
  `;

  item.addEventListener("click", () => {
    selectedCollectionId = id;
    renderCollections();
  });

  return item;
}

// Cargar etiquetas desde Supabase
async function loadTags() {
  const container = document.getElementById("tagsList");

  try {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/tags?user_id=eq.${config.userId}&order=name.asc`,
      {
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error cargando etiquetas");
    }

    tags = await response.json();
    renderTags();
  } catch (error) {
    console.error("Error cargando etiquetas:", error);
    container.innerHTML = '<div class="empty-message">Error al cargar etiquetas</div>';
  }
}

// Renderizar lista de etiquetas
function renderTags() {
  const container = document.getElementById("tagsList");

  if (tags.length === 0) {
    container.innerHTML = '<div class="empty-message">No tienes etiquetas</div>';
    return;
  }

  container.innerHTML = "";

  tags.forEach((tag) => {
    const item = document.createElement("div");
    item.className = "tag-item";
    if (selectedTagIds.includes(tag.id)) {
      item.classList.add("selected");
    }
    item.textContent = tag.name;

    item.addEventListener("click", () => {
      if (selectedTagIds.includes(tag.id)) {
        selectedTagIds = selectedTagIds.filter((id) => id !== tag.id);
      } else {
        selectedTagIds.push(tag.id);
      }
      renderTags();
    });

    container.appendChild(item);
  });
}

// Guardar el marcador
async function saveBookmark() {
  const saveBtn = document.getElementById("saveBtn");

  // Evitar doble clic
  if (saveBtn.disabled) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Guardando...";

  try {
    // Extraer dominio
    let domain = null;
    try {
      const urlObj = new URL(pendingBookmark.url);
      domain = urlObj.hostname.replace("www.", "");
    } catch (e) {
      domain = null;
    }

    // 1. Insertar el marcador
    const bookmarkResponse = await fetch(
      `${config.supabaseUrl}/rest/v1/bookmarks`,
      {
        method: "POST",
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          user_id: config.userId,
          url: pendingBookmark.url,
          domain: domain,
          title: pendingBookmark.title || pendingBookmark.url,
          description: pendingBookmark.description || null,
          image_url: pendingBookmark.imageUrl || null,
          source: "extension",
        }),
      }
    );

    if (!bookmarkResponse.ok) {
      const errorData = await bookmarkResponse.json();
      throw new Error(errorData.message || "Error al guardar el marcador");
    }

    const newBookmark = await bookmarkResponse.json();
    const bookmarkId = newBookmark[0]?.id;

    if (!bookmarkId) {
      throw new Error("No se pudo obtener el ID del marcador");
    }

    // 2. Vincular con colección
    if (selectedCollectionId) {
      await fetch(`${config.supabaseUrl}/rest/v1/bookmark_collections`, {
        method: "POST",
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookmark_id: bookmarkId,
          collection_id: selectedCollectionId,
          user_id: config.userId,
        }),
      });
    }

    // 3. Vincular con etiquetas
    if (selectedTagIds.length > 0) {
      const tagInserts = selectedTagIds.map((tagId) => ({
        bookmark_id: bookmarkId,
        tag_id: tagId,
        user_id: config.userId,
      }));

      await fetch(`${config.supabaseUrl}/rest/v1/bookmark_tags`, {
        method: "POST",
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tagInserts),
      });
    }

    // Éxito
    showSuccess("✅ ¡Marcador guardado!");

    // Limpiar el marcador pendiente
    await chrome.storage.local.remove("pendingBookmark");

    // Cerrar la ventana después de un momento
    setTimeout(() => {
      window.close();
    }, 800);
  } catch (error) {
    console.error("Error guardando:", error);
    showError("❌ " + (error.message || "Error al guardar"));
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 Guardar";
  }
}

// Cancelar y cerrar
async function cancelSave() {
  await chrome.storage.local.remove("pendingBookmark");
  window.close();
}

// Mostrar mensaje de éxito
function showSuccess(message) {
  const status = document.getElementById("statusMessage");
  status.className = "status-message success";
  status.textContent = message;
}

// Mostrar mensaje de error
function showError(message) {
  const status = document.getElementById("statusMessage");
  status.className = "status-message error";
  status.textContent = message;
}

// Deshabilitar botón de guardar
function disableSave() {
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "No disponible";
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}