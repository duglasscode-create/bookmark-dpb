"use client";

import { useState } from "react";
import { TagBadge } from "./TagBadge";
import { IconDisplay } from "./IconPicker";
import { getSmallScreenshotUrl } from "@/utils/screenshot";

type BookmarkTag = {
  id: string;
  name: string;
  color: string;
};

type BookmarkCardProps = {
  id: string;
  url: string;
  icon?: string | null;
  domain: string | null;
  title: string | null;
  description: string | null;
  note?: string | null;
  read_status?: string;
  is_favorite: boolean;
  is_pinned?: boolean;
  tags?: BookmarkTag[];
  viewMode: "grid" | "list";
  onToggleFavorite: (id: string, currentState: boolean) => void;
  onTogglePin?: (id: string, currentState: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRead: (url: string, title: string) => void;
  onTagClick?: (tagId: string) => void;
  onToggleReadLater?: (id: string, currentStatus: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
};

const getDomainColor = (domain: string | null): string => {
  if (!domain) return "from-slate-600 to-slate-800";
  const colors = [
    "from-blue-500 to-blue-700",
    "from-purple-500 to-purple-700",
    "from-pink-500 to-pink-700",
    "from-red-500 to-red-700",
    "from-orange-500 to-orange-700",
    "from-amber-500 to-amber-700",
    "from-emerald-500 to-emerald-700",
    "from-teal-500 to-teal-700",
    "from-cyan-500 to-cyan-700",
    "from-indigo-500 to-indigo-700",
    "from-violet-500 to-violet-700",
    "from-fuchsia-500 to-fuchsia-700",
  ];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getFaviconUrl = (domain: string | null): string | null => {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

export function BookmarkCard({
  id,
  url,
  icon,
  domain,
  title,
  description,
  note,
  read_status = "unread",
  is_favorite,
  is_pinned = false,
  tags = [],
  viewMode,
  onToggleFavorite,
  onTogglePin,
  onDelete,
  onEdit,
  onRead,
  onTagClick,
  onToggleReadLater,
  selectionMode = false,
  isSelected = false,
  onSelect,
}: BookmarkCardProps) {
  const gradientColor = getDomainColor(domain);
  const faviconUrl = getFaviconUrl(domain);
  const [screenshotError, setScreenshotError] = useState(false);
  const [screenshotLoaded, setScreenshotLoaded] = useState(false);

  const isPending = read_status === "pending";
  const hasNote = note && note.trim().length > 0;

  const SelectionCheckbox = () => {
    if (!selectionMode) return null;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect(id);
        }}
        className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
          isSelected
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-slate-500 bg-black/30 backdrop-blur-sm hover:border-blue-400"
        }`}
      >
        {isSelected && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    );
  };

  const ReadLaterButton = () => {
    if (!onToggleReadLater) return null;
    return (
      <button
        onClick={() => onToggleReadLater(id, read_status)}
        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${
          isPending
            ? "bg-emerald-500/80 hover:bg-emerald-600"
            : "bg-black/50 hover:bg-black/70"
        }`}
        title={isPending ? "Marcar como leído" : "Leer después"}
      >
        {isPending ? "✓" : "🔖"}
      </button>
    );
  };

  // VISTA LISTA
  if (viewMode === "list") {
    return (
      <div
        className={`group flex items-center gap-4 rounded-xl border bg-slate-900 px-4 py-3 transition ${
          isSelected
            ? "border-blue-500 bg-blue-500/5"
            : is_pinned
            ? "border-amber-500/50 bg-amber-500/5"
            : isPending
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
        }`}
      >
        {selectionMode && (
          <button
            onClick={() => onSelect && onSelect(id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
              isSelected
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-slate-600 hover:border-blue-400"
            }`}
          >
            {isSelected && (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        {is_pinned && (
          <span className="shrink-0 text-lg" title="Marcador fijado">
            📌
          </span>
        )}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
          {icon ? (
            <IconDisplay icon={icon} size={20} />
          ) : faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="h-6 w-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML = "🔗";
              }}
            />
          ) : (
            <span className="text-lg">🔗</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-medium text-white hover:text-blue-400"
            >
              {title || url}
            </a>
            {isPending && (
              <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Leer después
              </span>
            )}
            {hasNote && (
              <span className="shrink-0 text-xs" title={note || ""}>
                📝
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="truncate text-sm text-slate-500">{domain || url}</p>
            {tags.length > 0 && (
              <div className="hidden items-center gap-1 sm:flex">
                {tags.slice(0, 3).map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    size="sm"
                    onClick={onTagClick ? () => onTagClick(tag.id) : undefined}
                  />
                ))}
                {tags.length > 3 && (
                  <span className="text-xs text-slate-500">+{tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(id, is_pinned)}
              className={`rounded-lg p-2 transition ${
                is_pinned
                  ? "text-amber-400 hover:bg-amber-500/20"
                  : "hover:bg-slate-700"
              }`}
              title={is_pinned ? "Desfijar" : "Fijar arriba"}
            >
              📌
            </button>
          )}
          <button
            onClick={() => onToggleReadLater && onToggleReadLater(id, read_status)}
            className={`rounded-lg p-2 transition ${
              isPending
                ? "text-emerald-400 hover:bg-emerald-500/20"
                : "hover:bg-slate-700"
            }`}
            title={isPending ? "Marcar como leído" : "Leer después"}
          >
            {isPending ? "✓" : "🔖"}
          </button>
          <button
            onClick={() => onRead(url, title || url)}
            className="rounded-lg p-2 transition hover:bg-slate-700"
            title="Leer"
          >
            📖
          </button>
          <button
            onClick={() => onEdit(id)}
            className="rounded-lg p-2 transition hover:bg-slate-700"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={() => onToggleFavorite(id, is_favorite)}
            className="rounded-lg p-2 text-lg transition hover:bg-slate-700"
            title="Favorito"
          >
            {is_favorite ? "⭐" : "☆"}
          </button>
          <button
            onClick={() => onDelete(id)}
            className="rounded-lg p-2 transition hover:bg-red-500/20"
            title="Eliminar"
          >
            🗑️
          </button>
        </div>

        {is_favorite && (
          <span className="shrink-0 text-lg group-hover:hidden">⭐</span>
        )}
      </div>
    );
  }

  // VISTA GRID
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-slate-900 transition ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : is_pinned
          ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
          : isPending
          ? "border-emerald-500/40 hover:border-emerald-500/70"
          : "border-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10"
      }`}
    >
      <SelectionCheckbox />

      {is_pinned && (
        <div className="absolute left-3 top-3 z-20">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm shadow-lg"
            title="Marcador fijado"
          >
            📌
          </span>
        </div>
      )}

      {isPending && !is_pinned && (
        <div className="absolute left-3 top-3 z-20">
          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
            Leer después
          </span>
        </div>
      )}

      <div
        className={`relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br ${gradientColor}`}
      >
        {!screenshotError && (
          <img
            src={getSmallScreenshotUrl(url)}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              screenshotLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setScreenshotLoaded(true)}
            onError={() => setScreenshotError(true)}
          />
        )}

        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            screenshotLoaded ? "bg-black/30 opacity-100" : "opacity-0"
          }`}
        ></div>

        {icon ? (
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <IconDisplay icon={icon} size={32} />
          </div>
        ) : faviconUrl ? (
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <img
              src={faviconUrl}
              alt=""
              className="h-8 w-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <span className="relative z-10 text-4xl">🔗</span>
        )}
      </div>

      <div className="absolute right-3 top-3 z-20 flex gap-2 opacity-0 transition group-hover:opacity-100">
        {onTogglePin && (
          <button
            onClick={() => onTogglePin(id, is_pinned)}
            className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${
              is_pinned
                ? "bg-amber-500/80 hover:bg-amber-600"
                : "bg-black/50 hover:bg-black/70"
            }`}
            title={is_pinned ? "Desfijar" : "Fijar arriba"}
          >
            📌
          </button>
        )}
        <ReadLaterButton />
        <button
          onClick={() => onRead(url, title || url)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-black/70"
          title="Leer"
        >
          📖
        </button>
        <button
          onClick={() => onEdit(id)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-black/70"
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={() => onToggleFavorite(id, is_favorite)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-lg backdrop-blur-sm transition hover:bg-black/70"
          title="Favorito"
        >
          {is_favorite ? "⭐" : "☆"}
        </button>
        <button
          onClick={() => onDelete(id)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-red-500/50"
          title="Eliminar"
        >
          🗑️
        </button>
      </div>

      {is_favorite && (
        <div className="absolute right-3 top-3 z-20 group-hover:hidden">
          <span className="text-xl drop-shadow-lg">⭐</span>
        </div>
      )}

      <div className="p-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 block truncate font-semibold text-white hover:text-blue-400"
        >
          {title || url}
        </a>

        <p className="mb-3 line-clamp-2 text-sm text-slate-400">
          {description || "Sin descripción"}
        </p>

        {hasNote && (
          <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <p className="text-xs text-amber-400/90 line-clamp-2 flex items-start gap-1.5">
              <span className="shrink-0">📝</span>
              <span>{note}</span>
            </p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                color={tag.color}
                size="sm"
                onClick={onTagClick ? () => onTagClick(tag.id) : undefined}
              />
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-slate-500">+{tags.length - 4}</span>
            )}
          </div>
        )}

        {tags.length === 0 && !hasNote && (
          <button
            onClick={() => onEdit(id)}
            className="mb-3 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-700 px-2 py-1 text-xs text-slate-500 transition hover:border-blue-500 hover:text-blue-400"
          >
            + Agregar etiquetas
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex h-4 w-4 items-center justify-center overflow-hidden rounded">
            {icon ? (
              <IconDisplay icon={icon} size={12} />
            ) : faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="h-3 w-3 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
          </span>
          <span className="truncate">{domain || url}</span>
        </div>
      </div>
    </div>
  );
}