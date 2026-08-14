"use client";

type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Filters = {
  dateRange: "all" | "week" | "month" | "year";
  domain: string;
  tagId: string;
  source: "all" | "manual" | "import" | "extension";
};

export const defaultFilters: Filters = {
  dateRange: "all",
  domain: "",
  tagId: "",
  source: "all",
};

type AdvancedFiltersProps = {
  domains: string[];
  tags: Tag[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClear: () => void;
};

export function AdvancedFilters({
  domains,
  tags,
  filters,
  onFiltersChange,
  onClear,
}: AdvancedFiltersProps) {
  const activeCount =
    (filters.dateRange !== "all" ? 1 : 0) +
    (filters.domain !== "" ? 1 : 0) +
    (filters.tagId !== "" ? 1 : 0) +
    (filters.source !== "all" ? 1 : 0);

  const dateOptions = [
    { value: "all", label: "Todo" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
    { value: "year", label: "Año" },
  ];

  const sourceOptions = [
    { value: "all", label: "Todas", icon: "📚" },
    { value: "manual", label: "Manual", icon: "✍️" },
    { value: "import", label: "Importado", icon: "📦" },
    { value: "extension", label: "Extensión", icon: "🧩" },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      {/* Header del panel */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎛️</span>
          <h3 className="text-sm font-semibold text-white">Filtros avanzados</h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              {activeCount} activo{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 transition hover:text-white"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Filtro por fecha */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            📅 Fecha de guardado
          </label>
          <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  onFiltersChange({ ...filters, dateRange: option.value as Filters["dateRange"] })
                }
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filters.dateRange === option.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por fuente */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            📥 Origen
          </label>
          <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  onFiltersChange({ ...filters, source: option.value as Filters["source"] })
                }
                className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                  filters.source === option.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtros por dominio y etiqueta */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Dominio */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
              🌐 Dominio
            </label>
            <select
              value={filters.domain}
              onChange={(e) => onFiltersChange({ ...filters, domain: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
            >
              <option value="">Todos los dominios</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* Etiqueta */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
              🏷️ Etiqueta
            </label>
            <select
              value={filters.tagId}
              onChange={(e) => onFiltersChange({ ...filters, tagId: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
            >
              <option value="">Todas las etiquetas</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}