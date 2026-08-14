"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDarkMode?: boolean;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar marcadores...",
  isDarkMode = true,
}: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      {/* Icono de búsqueda */}
      <div
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm outline-none transition focus:ring-2 ${
          isDarkMode
            ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
            : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
        }`}
      />

      {/* Botón limpiar */}
      {value && (
        <button
          onClick={() => onChange("")}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
            isDarkMode
              ? "text-slate-500 hover:text-white"
              : "text-slate-400 hover:text-slate-700"
          }`}
          title="Limpiar búsqueda"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Atajo de teclado */}
      {!value && (
        <kbd
          className={`absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs ${
            isDarkMode
              ? "bg-slate-700 text-slate-400"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          /
        </kbd>
      )}
    </div>
  );
}