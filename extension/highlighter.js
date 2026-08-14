// ============================================
// BOOKMARK DPB - HIGHLIGHTER (Content Script)
// ============================================
// Muestra un toolbar flotante cuando el usuario
// selecciona texto, permitiendo resaltar con colores.

const HIGHLIGHT_COLORS = [
  { id: "yellow", label: "Amarillo", color: "#fef08a", textColor: "#854d0e" },
  { id: "green", label: "Verde", color: "#86efac", textColor: "#166534" },
  { id: "blue", label: "Azul", color: "#93c5fd", textColor: "#1e40af" },
  { id: "pink", label: "Rosa", color: "#f9a8d4", textColor: "#9d174d" },
  { id: "orange", label: "Naranja", color: "#fdba74", textColor: "#9a3412" },
];

let toolbar = null;
let currentSelection = null;

// Crear el toolbar flotante
function createToolbar() {
  if (toolbar) return toolbar;

  toolbar = document.createElement("div");
  toolbar.id = "bdpb-highlight-toolbar";
  toolbar.style.display = "none";

  // Botones de colores
  HIGHLIGHT_COLORS.forEach((colorOption) => {
    const btn = document.createElement("button");
    btn.className = "bdpb-color-btn";
    btn.style.backgroundColor = colorOption.color;
    btn.title = `Resaltar en ${colorOption.label}`;
    btn.dataset.color = colorOption.id;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      applyHighlight(colorOption.id);
    });

    toolbar.appendChild(btn);
  });

  // Botón de nota
  const noteBtn = document.createElement("button");
  noteBtn.className = "bdpb-note-btn";
  noteBtn.innerHTML = "📝";
  noteBtn.title = "Resaltar con nota";
  noteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showNotePrompt();
  });
  toolbar.appendChild(noteBtn);

  document.body.appendChild(toolbar);
  return toolbar;
}

// Mostrar el toolbar cerca de la selección
function showToolbar(x, y) {
  const tb = createToolbar();
  tb.style.display = "flex";
  tb.style.left = `${x}px`;
  tb.style.top = `${y}px`;

  // Ajustar si se sale de la pantalla
  requestAnimationFrame(() => {
    const rect = tb.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      tb.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      tb.style.top = `${y - rect.height - 10}px`;
    }
  });
}

// Ocultar el toolbar
function hideToolbar() {
  if (toolbar) {
    toolbar.style.display = "none";
  }
}

// Aplicar resaltado al texto seleccionado
function applyHighlight(color) {
  if (!currentSelection) return;

  const selectedText = currentSelection.toString().trim();
  if (!selectedText) return;

  // Aplicar el resaltado visual
  try {
    const range = currentSelection.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "bdpb-highlight";
    span.dataset.bdpbColor = color;

    const colorMap = {
      yellow: "#fef08a",
      green: "#86efac",
      blue: "#93c5fd",
      pink: "#f9a8d4",
      orange: "#fdba74",
    };

    span.style.backgroundColor = colorMap[color] || "#fef08a";
    span.style.padding = "1px 2px";
    span.style.borderRadius = "2px";

    range.surroundContents(span);
  } catch (e) {
    console.error("Error aplicando resaltado visual:", e);
  }

  // Guardar en Supabase
  saveHighlight(selectedText, color, null);

  // Limpiar selección y ocultar toolbar
  currentSelection = null;
  hideToolbar();
}

// Mostrar prompt para nota
function showNotePrompt() {
  if (!currentSelection) return;

  const selectedText = currentSelection.toString().trim();
  if (!selectedText) return;

  const note = prompt("Escribe una nota para este resaltado (opcional):");

  // Aplicar resaltado visual (por defecto amarillo si hay nota)
  try {
    const range = currentSelection.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "bdpb-highlight";
    span.dataset.bdpbColor = "yellow";
    span.style.backgroundColor = "#fef08a";
    span.style.padding = "1px 2px";
    span.style.borderRadius = "2px";

    range.surroundContents(span);
  } catch (e) {
    console.error("Error aplicando resaltado visual:", e);
  }

  saveHighlight(selectedText, "yellow", note);

  currentSelection = null;
  hideToolbar();
}

// Guardar highlight en Supabase
function saveHighlight(selectedText, color, note) {
  chrome.runtime.sendMessage({
    action: "saveHighlight",
    data: {
      url: window.location.href,
      selectedText: selectedText,
      color: color,
      note: note,
    },
  });
}

// Escuchar eventos de selección
document.addEventListener("mouseup", (e) => {
  // Ignorar clics dentro del toolbar
  if (toolbar && toolbar.contains(e.target)) return;

  setTimeout(() => {
    const selection = window.getSelection();

    if (selection && selection.toString().trim().length > 0) {
      currentSelection = selection;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      showToolbar(
        rect.left + rect.width / 2 + window.scrollX,
        rect.bottom + window.scrollY + 10
      );
    } else {
      hideToolbar();
    }
  }, 10);
});

// Ocultar toolbar al hacer scroll o clic en otro lugar
document.addEventListener("mousedown", (e) => {
  if (toolbar && !toolbar.contains(e.target)) {
    hideToolbar();
  }
});

// Limpiar al cargar la página
window.addEventListener("load", () => {
  hideToolbar();
});

console.log("🖍️ Bookmark DPB Highlighter cargado");