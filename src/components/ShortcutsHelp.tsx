"use client";

type ShortcutsHelpProps = {
  isOpen: boolean;
  onClose: () => void;
};

const shortcuts = [
  { category: "Navegación", items: [
    { keys: ["1"], action: "Ir a Todos los marcadores" },
    { keys: ["2"], action: "Ir a Favoritos" },
    { keys: ["3"], action: "Ir a Papelera" },
    { keys: ["4"], action: "Ir a Estadísticas" },
  ]},
  { category: "Marcadores", items: [
    { keys: ["N"], action: "Nuevo marcador (enfocar URL)" },
    { keys: ["/"], action: "Buscar marcadores" },
    { keys: ["G"], action: "Vista cuadrícula" },
    { keys: ["L"], action: "Vista lista" },
  ]},
  { category: "General", items: [
    { keys: ["?"], action: "Mostrar esta ayuda" },
    { keys: ["Esc"], action: "Cerrar modales" },
  ]},
];

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            ⌨️ Atajos de teclado
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Lista de atajos */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {section.category}
              </h4>
              <div className="space-y-2">
                {section.items.map((shortcut, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-300">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1 text-xs font-mono text-slate-200 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400 text-center">
            💡 Los atajos de marcadores solo funcionan cuando no estás escribiendo en un campo de texto
          </p>
        </div>
      </div>
    </div>
  );
}