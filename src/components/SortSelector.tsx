"use client";

export type SortOption =
  | "newest"
  | "oldest"
  | "title_asc"
  | "title_desc"
  | "domain_asc";

type SortSelectorProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  isDarkMode?: boolean;
};

const sortOptions = [
  { value: "newest" as SortOption, label: "Más recientes" },
  { value: "oldest" as SortOption, label: "Más antiguos" },
  { value: "title_asc" as SortOption, label: "Título (A-Z)" },
  { value: "title_desc" as SortOption, label: "Título (Z-A)" },
  { value: "domain_asc" as SortOption, label: "Dominio (A-Z)" },
];

export function SortSelector({ value, onChange, isDarkMode = true }: SortSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20 ${
        isDarkMode
          ? "border-slate-700 bg-slate-800 text-white focus:border-blue-500"
          : "border-slate-300 bg-white text-slate-900 focus:border-blue-500"
      }`}
      title="Ordenar por"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}