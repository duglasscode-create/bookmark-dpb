"use client";

export type ViewMode = "grid" | "list" | "kanban";

type ViewSwitcherProps = {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  isDarkMode?: boolean;
};

export function ViewSwitcher({ viewMode, onChangeView, isDarkMode = true }: ViewSwitcherProps) {
  const inactiveClass = isDarkMode 
    ? "text-slate-400 hover:bg-slate-700 hover:text-white"
    : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]";

  const activeClass = "bg-blue-600 text-white shadow-lg shadow-blue-500/25";

  return (
    <div className={`flex items-center gap-1 rounded-xl border p-1 ${
      isDarkMode ? "border-slate-700 bg-slate-800" : "border-[var(--border-color)] bg-[var(--bg-tertiary)]"
    }`}>
      <button
        onClick={() => onChangeView("grid")}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          viewMode === "grid" ? activeClass : inactiveClass
        }`}
        title="Vista cuadrícula (G)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        <span className="hidden sm:inline">Cuadrícula</span>
      </button>

      <button
        onClick={() => onChangeView("list")}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          viewMode === "list" ? activeClass : inactiveClass
        }`}
        title="Vista lista (L)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline">Lista</span>
      </button>

      <button
        onClick={() => onChangeView("kanban")}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          viewMode === "kanban" ? activeClass : inactiveClass
        }`}
        title="Vista tablero (K)"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h4zm11 0a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1V5a1 1 0 011-1h4z"
          />
        </svg>
        <span className="hidden sm:inline">Tablero</span>
      </button>
    </div>
  );
}