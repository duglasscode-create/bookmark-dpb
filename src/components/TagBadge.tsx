"use client";

type TagBadgeProps = {
  name: string;
  color: string;
  onClick?: () => void;
  onRemove?: () => void;
  size?: "sm" | "md";
};

// Mapa de colores a clases de Tailwind (22 colores)
const colorClasses: Record<string, string> = {
  slate: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  zinc: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  stone: "bg-stone-500/20 text-stone-400 border-stone-500/30",
  brown: "bg-amber-700/20 text-amber-600 border-amber-700/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  lime: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  sky: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  indigo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  fuchsia: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const dotClasses: Record<string, string> = {
  slate: "bg-slate-400",
  gray: "bg-gray-400",
  zinc: "bg-zinc-400",
  stone: "bg-stone-400",
  brown: "bg-amber-600",
  red: "bg-red-400",
  orange: "bg-orange-400",
  amber: "bg-amber-400",
  yellow: "bg-yellow-400",
  lime: "bg-lime-400",
  green: "bg-green-400",
  emerald: "bg-emerald-400",
  teal: "bg-teal-400",
  cyan: "bg-cyan-400",
  sky: "bg-sky-400",
  blue: "bg-blue-400",
  indigo: "bg-indigo-400",
  violet: "bg-violet-400",
  purple: "bg-purple-400",
  fuchsia: "bg-fuchsia-400",
  pink: "bg-pink-400",
  rose: "bg-rose-400",
};

export function TagBadge({
  name,
  color,
  onClick,
  onRemove,
  size = "sm",
}: TagBadgeProps) {
  const baseClasses = colorClasses[color] || colorClasses.slate;
  const dotClass = dotClasses[color] || dotClasses.slate;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-3 py-1 text-sm";

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition ${baseClasses} ${sizeClasses} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`}></span>
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 transition hover:bg-white/20"
          title="Quitar etiqueta"
        >
          <svg
            className="h-3 w-3"
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
    </span>
  );
}