// ============================================
// BOOKMARK DPB - OPTIONS PAGE
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // Cargar configuración existente
  const config = await chrome.storage.local.get([
    "supabaseUrl",
    "supabaseKey",
    "userId",
    "defaultCollectionId",
  ]);

  if (config.supabaseUrl) {
    document.getElementById("supabaseUrl").value = config.supabaseUrl;
  }
  if (config.supabaseKey) {
    document.getElementById("supabaseKey").value = config.supabaseKey;
  }
  if (config.userId) {
    document.getElementById("userId").value = config.userId;
  }

  // Cargar colecciones si hay configuración
  if (config.supabaseUrl && config.supabaseKey && config.userId) {
    await loadCollections(config);
  }

  // Manejar envío del formulario
  document.getElementById("configForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("saveBtn");
    const status = document.getElementById("status");

    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    const supabaseUrl = document.getElementById("supabaseUrl").value.trim();
    const supabaseKey = document.getElementById("supabaseKey").value.trim();
    const userId = document.getElementById("userId").value.trim();
    const defaultCollectionId = document.getElementById("defaultCollection").value;

    // Limpiar URL (quitar trailing slash)
    const cleanUrl = supabaseUrl.replace(/\/$/, "");

    try {
      // Verificar conexión con Supabase
      const testResponse = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

            if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("Error de Supabase:", testResponse.status, errorText);
        throw new Error(
          `Error ${testResponse.status}: ${errorText || "Verifica la URL y la clave"}`
        );
      }

      // Guardar configuración
      await chrome.storage.local.set({
        supabaseUrl: cleanUrl,
        supabaseKey: supabaseKey,
        userId: userId,
        defaultCollectionId: defaultCollectionId || null,
      });

      status.className = "status success";
      status.textContent = "✅ Configuración guardada correctamente";
    } catch (error) {
      status.className = "status error";
      status.textContent = "❌ " + error.message;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Guardar configuración";
    }
  });

  // Recargar colecciones cuando cambien las credenciales
  const reloadCollections = async () => {
    const supabaseUrl = document.getElementById("supabaseUrl").value.trim();
    const supabaseKey = document.getElementById("supabaseKey").value.trim();
    const userId = document.getElementById("userId").value.trim();

    if (supabaseUrl && supabaseKey && userId) {
      await loadCollections({
        supabaseUrl: supabaseUrl.replace(/\/$/, ""),
        supabaseKey,
        userId,
      });
    }
  };

  document.getElementById("supabaseUrl").addEventListener("blur", reloadCollections);
  document.getElementById("supabaseKey").addEventListener("blur", reloadCollections);
  document.getElementById("userId").addEventListener("blur", reloadCollections);
});

// Cargar colecciones desde Supabase
async function loadCollections(config) {
  const select = document.getElementById("defaultCollection");

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

    const collections = await response.json();

    // Limpiar opciones existentes
    select.innerHTML = '<option value="">Sin colección</option>';

    // Agregar colecciones
    collections.forEach((collection) => {
      const option = document.createElement("option");
      option.value = collection.id;
      option.textContent = `${collection.icon || "📁"} ${collection.name}`;

      if (config.defaultCollectionId === collection.id) {
        option.selected = true;
      }

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando colecciones:", error);
  }
}