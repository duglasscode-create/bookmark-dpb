// ============================================
// BOOKMARK DPB - HIGHLIGHTER INTELIGENTE
// ============================================
// Muestra el toolbar al seleccionar texto, pero
// NO interfiere cuando el usuario quiere copiar.

const HIGHLIGHT_COLORS = [
  { id: "yellow", label: "Amarillo", color: "#fef08a", textColor: "#854d0e" },
  { id: "green", label: "Verde", color: "#86efac", textColor: "#166534" },
  { id: "blue", label: "Azul", color: "#93c5fd", textColor: "#1e40af" },
  { id: "pink", label: "Rosa", color: "#f9a8d4", textColor: "#9d174d" },
  { id: "orange", label: "Naranja", color: "#fdba74", textColor: "#9a3412" },
];

let toolbar = null;
let currentSelection = null;
let pendingShowTimer = null;

// Crear el toolbar flotante
function createToolbar() {
  if (toolbar) return toolbar;
  toolbar = document.createElement("div");
  toolbar.id = "bdpb-highlight-toolbar";
  toolbar.style.display = "none";

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

function showToolbar(x, y) {
  const tb = createToolbar();
  tb.style.display = "flex";
  tb.style.left = `${x}px`;
  tb.style.top = `${y}px`;

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

function hideToolbar() {
  if (toolbar) {
    toolbar.style.display = "none";
  }
}

// Cancelar la aparición pendiente (modo inteligente)
function cancelPendingToolbar() {
  if (pendingShowTimer) {
    clearTimeout(pendingShowTimer);
    pendingShowTimer = null;
  }
  hideToolbar();
}

// Aplicar resaltado al texto seleccionado
function applyHighlight(color) {
  if (!currentSelection) return;
  const selectedText = currentSelection.toString().trim();
  if (!selectedText) return;

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

  saveHighlight(selectedText, color, null);
  currentSelection = null;
  cancelPendingToolbar();
}

// Mostrar prompt para nota
function showNotePrompt() {
  if (!currentSelection) return;
  const selectedText = currentSelection.toString().trim();
  if (!selectedText) return;

  const note = prompt("Escribe una nota para este resaltado (opcional):");

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
  cancelPendingToolbar();
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

// ============================================
// MODO INTELIGENTE: no estorbar al copiar
// ============================================

// Si el usuario COPIA o CORTA, cancelamos el toolbar
document.addEventListener("copy", () => {
  currentSelection = null;
  cancelPendingToolbar();
});

document.addEventListener("cut", () => {
  currentSelection = null;
  cancelPendingToolbar();
});

// Si presiona Ctrl+C / Cmd+C, cancelamos el toolbar
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
    currentSelection = null;
    cancelPendingToolbar();
  }
});

// Escuchar eventos de selección
document.addEventListener("mouseup", (e) => {
  if (toolbar && toolbar.contains(e.target)) return;

  setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      // No mostrar dentro de inputs, textareas o editables
      try {
        const node = selection.getRangeAt(0).startContainer;
        const el = node.nodeType === 3 ? node.parentElement : node;
        if (el && el.closest("input, textarea, select, [contenteditable='true']")) {
          return;
        }
      } catch (err) {}

      currentSelection = selection;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.left + rect.width / 2 + window.scrollX;
      const y = rect.bottom + window.scrollY + 10;

      // Esperar 700ms: si el usuario copia en ese tiempo, NO aparece
      if (pendingShowTimer) clearTimeout(pendingShowTimer);
      pendingShowTimer = setTimeout(() => {
        const still = window.getSelection();
        if (still && still.toString().trim().length > 0 && currentSelection) {
          showToolbar(x, y);
        }
        pendingShowTimer = null;
      }, 700);
    } else {
      cancelPendingToolbar();
    }
  }, 10);
});

// Ocultar al hacer clic en otro lugar
document.addEventListener("mousedown", (e) => {
  if (toolbar && !toolbar.contains(e.target)) {
    cancelPendingToolbar();
  }
});

window.addEventListener("load", () => {
  cancelPendingToolbar();
});

console.log("🖍️ Bookmark DPB Highlighter inteligente cargado");