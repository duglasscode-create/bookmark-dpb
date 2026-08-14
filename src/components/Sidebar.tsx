"use client";

import { useState, useEffect } from "react";
import { ExportButton } from "./ExportButton";

type Collection = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_public?: boolean;
  share_slug?: string | null;
  parent_id?: string | null;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

type SidebarProps = {
  collections: Collection[];
  tags: Tag[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onNewCollection: () => void;
  onDeleteCollection: (collectionId: string, collectionName: string) => void;
  onShareCollection: (collectionId: string) => void;
  onReorderCollections: (orderedIds: string[]) => void;
  onImport: () => void;
  isLoading: boolean;
  trashCount: number;
  pendingReadCount: number;
  userId: string;
  collectionCounts: Record<string, number>;
  isDarkMode?: boolean;
  onManageTags: () => void;
  // NUEVO: Props para móvil
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
  slate: "bg-slate-500",
};

export function Sidebar({
  collections,
  tags,
  activeFilter,
  onSelectFilter,
  onNewCollection,
  onDeleteCollection,
  onShareCollection,
  onReorderCollections,
  onImport,
  isLoading,
  trashCount,
  pendingReadCount,
  userId,
  collectionCounts,
  isDarkMode = true,
  onManageTags,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [draggedCollectionId, setDraggedCollectionId] = useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);
  const [collectionsCollapsed, setCollectionsCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCollectionsCollapsed(localStorage.getItem("collectionsCollapsed") === "true");
      setTagsCollapsed(localStorage.getItem("tagsCollapsed") === "true");
    }
  }, []);

  const toggleCollections = () => {
    const newValue = !collectionsCollapsed;
    setCollectionsCollapsed(newValue);
    localStorage.setItem("collectionsCollapsed", String(newValue));
  };

  const toggleTags = () => {
    const newValue = !tagsCollapsed;
    setTagsCollapsed(newValue);
    localStorage.setItem("tagsCollapsed", String(newValue));
  };

  const toggleExpanded = (collectionId: string) => {
    setExpandedCollections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  // NUEVO: Manejar selección de filtro y cerrar en móvil
  const handleSelectFilter = (filter: string) => {
    onSelectFilter(filter);
    // Cerrar el sidebar en móvil al seleccionar
    if (window.innerWidth < 768) {
      onMobileClose();
    }
  };

  const handleCollectionDragStart = (e: React.DragEvent, collectionId: string) => {
    setDraggedCollectionId(collectionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCollectionDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    if (collectionId !== draggedCollectionId) {
      setDragOverCollectionId(collectionId);
    }
  };

  const handleCollectionDrop = (e: React.DragEvent, targetCollectionId: string) => {
    e.preventDefault();
    if (!draggedCollectionId || draggedCollectionId === targetCollectionId) {
      setDraggedCollectionId(null);
      setDragOverCollectionId(null);
      return;
    }

    const orderedIds = collections.map((c) => c.id);
    const draggedIndex = orderedIds.indexOf(draggedCollectionId);
    const targetIndex = orderedIds.indexOf(targetCollectionId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      orderedIds.splice(draggedIndex, 1);
      orderedIds.splice(targetIndex, 0, draggedCollectionId);
      onReorderCollections(orderedIds);
    }

    setDraggedCollectionId(null);
    setDragOverCollectionId(null);
  };

  const handleCollectionDragEnd = () => {
    setDraggedCollectionId(null);
    setDragOverCollectionId(null);
  };

  const rootCollections = collections.filter((c) => !c.parent_id);
  const getChildCollections = (parentId: string) =>
    collections.filter((c) => c.parent_id === parentId);

  const navButtonClass = (isActive: boolean, activeColor: string) => {
    if (isActive) {
      if (isDarkMode) return `bg-${activeColor}-600/20 text-${activeColor}-400`;
      return "bg-blue-100 text-blue-700";
    }
    if (isDarkMode) return "text-slate-300 hover:bg-slate-800 hover:text-white";
    return "text-slate-700 hover:bg-slate-100 hover:text-slate-900";
  };

  const renderCollection = (collection: Collection, depth: number = 0) => {
    const children = getChildCollections(collection.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCollections.has(collection.id);
    const bookmarkCount = collectionCounts[collection.id] || 0;

    return (
      <div key={collection.id}>
        <div
          draggable
          onDragStart={(e) => handleCollectionDragStart(e, collection.id)}
          onDragOver={(e) => handleCollectionDragOver(e, collection.id)}
          onDrop={(e) => handleCollectionDrop(e, collection.id)}
          onDragEnd={handleCollectionDragEnd}
          className={`group relative flex items-center rounded-xl transition-all ${
            draggedCollectionId === collection.id ? "opacity-50" : ""
          } ${dragOverCollectionId === collection.id ? "ring-2 ring-blue-500" : ""}`}
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <div className="absolute left-1 hidden group-hover:flex flex-col gap-0.5 text-slate-600 cursor-grab">
            <span className="text-[8px]">⋮⋮</span>
          </div>

          <button
            onClick={() => handleSelectFilter(collection.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 pl-5 text-left text-sm font-medium transition ${
              activeFilter === collection.id
                ? isDarkMode
                  ? "bg-slate-800 text-white"
                  : "bg-blue-50 text-blue-700"
                : isDarkMode
                ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {hasChildren ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(collection.id);
                }}
                className="flex h-4 w-4 items-center justify-center text-slate-500 hover:text-blue-500"
              >
                <svg
                  className={`h-3 w-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            ) : (
              <span className="w-4"></span>
            )}

            <span
              className={`h-3 w-3 rounded-full ${
                colorMap[collection.color || "slate"] || "bg-slate-500"
              }`}
            ></span>
            <span className="truncate flex-1">
              {collection.icon && <span className="mr-1.5">{collection.icon}</span>}
              {collection.name}
            </span>

            {bookmarkCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  isDarkMode
                    ? "bg-slate-700/50 text-slate-400"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {bookmarkCount}
              </span>
            )}

            {collection.is_public && (
              <span className="text-xs" title="Colección pública">
                🔗
              </span>
            )}
          </button>

          <div className="absolute right-2 hidden items-center gap-1 group-hover:flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShareCollection(collection.id);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                isDarkMode
                  ? "text-slate-500 hover:bg-blue-500/20 hover:text-blue-400"
                  : "text-slate-500 hover:bg-blue-100 hover:text-blue-600"
              }`}
              title={collection.is_public ? "Ver enlace público" : "Compartir colección"}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCollection(collection.id, collection.name);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                isDarkMode
                  ? "text-slate-500 hover:bg-red-500/20 hover:text-red-400"
                  : "text-slate-500 hover:bg-red-100 hover:text-red-600"
              }`}
              title={`Eliminar colección "${collection.name}"`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {children.map((child) => renderCollection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* NUEVO: Overlay para móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        ></div>
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 md:w-64 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:transition-none
          flex h-full flex-col border-r
          ${
            isDarkMode
              ? "border-slate-800 bg-slate-900 md:bg-slate-900/50"
              : "border-slate-200 bg-white"
          }
        `}
      >
        {/* Logo con botón de cerrar en móvil */}
        <div
          className={`flex items-center justify-between border-b px-5 py-4 ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg">
              🔖
            </div>
            <div>
              <h1
                className={`text-sm font-bold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Bookmark DPB
              </h1>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Best Bookmark
              </p>
            </div>
          </div>

          {/* NUEVO: Botón cerrar en móvil */}
          <button
            onClick={onMobileClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition md:hidden ${
              isDarkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            }`}
            title="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 overflow-y-auto p-4">
          <p
            className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Biblioteca
          </p>

          <div className="space-y-1">
            <button
              onClick={() => handleSelectFilter("all")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "all",
                "blue"
              )}`}
            >
              <span className="text-lg">📚</span>
              <span className="flex-1">Todos los marcadores</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                1
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("favorites")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "favorites",
                "amber"
              )}`}
            >
              <span className="text-lg">⭐</span>
              <span className="flex-1">Favoritos</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                2
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("pending_read")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "pending_read",
                "emerald"
              )}`}
            >
              <span className="text-lg">🔖</span>
              <span className="flex-1">Leer después</span>
              {pendingReadCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isDarkMode
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {pendingReadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectFilter("trash")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "trash",
                "red"
              )}`}
            >
              <span className="text-lg">🗑️</span>
              <span className="flex-1">Papelera</span>
              {trashCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isDarkMode
                      ? "bg-red-500/20 text-red-400"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {trashCount}
                </span>
              )}
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                3
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("stats")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "stats",
                "purple"
              )}`}
            >
              <span className="text-lg">📊</span>
              <span className="flex-1">Estadísticas</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                4
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("highlights")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "highlights",
                "amber"
              )}`}
            >
              <span className="text-lg">🖍️</span>
              <span className="flex-1">Highlights</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                5
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("reminders")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "reminders",
                "orange"
              )}`}
            >
              <span className="text-lg">⏰</span>
              <span className="flex-1">Recordatorios</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                6
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("activity")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "activity",
                "cyan"
              )}`}
            >
              <span className="text-lg">🕐</span>
              <span className="flex-1">Historial</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                7
              </kbd>
            </button>

            <button
              onClick={() => handleSelectFilter("auto_rules")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${navButtonClass(
                activeFilter === "auto_rules",
                "emerald"
              )}`}
            >
              <span className="text-lg">🎯</span>
              <span className="flex-1">Reglas</span>
              <kbd
                className={`hidden md:inline text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                8
              </kbd>
            </button>
          </div>

          {/* Colecciones */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between px-3">
              <button
                onClick={toggleCollections}
                className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  isDarkMode
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title={collectionsCollapsed ? "Expandir" : "Colapsar"}
              >
                <svg
                  className={`h-3 w-3 transition-transform ${
                    collectionsCollapsed ? "-rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Colecciones
                <span className={isDarkMode ? "text-slate-600" : "text-slate-400"}>
                  ({collections.length})
                </span>
              </button>
              <button
                onClick={onNewCollection}
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
                title="Nueva colección"
              >
                +
              </button>
            </div>

            {!collectionsCollapsed && (
              <>
                {isLoading ? (
                  <div className="space-y-2 px-3">
                    <div
                      className={`h-9 animate-pulse rounded-lg ${
                        isDarkMode ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    ></div>
                    <div
                      className={`h-9 animate-pulse rounded-lg ${
                        isDarkMode ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    ></div>
                  </div>
                ) : collections.length === 0 ? (
                  <div
                    className={`rounded-xl border border-dashed p-4 text-center ${
                      isDarkMode ? "border-slate-700" : "border-slate-300"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      Sin colecciones aún
                    </p>
                    <button
                      onClick={onNewCollection}
                      className="mt-2 text-xs font-medium text-blue-500 hover:text-blue-400"
                    >
                      + Crear la primera
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {rootCollections.map((collection) =>
                      renderCollection(collection, 0)
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Etiquetas */}
          {tags.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between px-3">
                <button
                  onClick={toggleTags}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    isDarkMode
                      ? "text-slate-500 hover:text-slate-300"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title={tagsCollapsed ? "Expandir" : "Colapsar"}
                >
                  <svg
                    className={`h-3 w-3 transition-transform ${
                      tagsCollapsed ? "-rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Etiquetas
                  <span className={isDarkMode ? "text-slate-600" : "text-slate-400"}>
                    ({tags.length})
                  </span>
                </button>

                <button
                  onClick={onManageTags}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                    isDarkMode
                      ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title="Gestionar etiquetas"
                >
                  ⚙️
                </button>
              </div>

              {!tagsCollapsed && (
                <div className="space-y-1">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleSelectFilter(`tag:${tag.id}`)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                        activeFilter === `tag:${tag.id}`
                          ? isDarkMode
                            ? "bg-slate-800 text-white"
                            : "bg-blue-50 text-blue-700"
                          : isDarkMode
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          colorMap[tag.color] || "bg-slate-500"
                        }`}
                      ></span>
                      <span className="truncate">{tag.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tags.length === 0 && (
            <div className="mt-6 px-3">
              <button
                onClick={onManageTags}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs font-medium transition ${
                  isDarkMode
                    ? "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                    : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                }`}
              >
                🏷️ Gestionar etiquetas
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div
          className={`border-t p-4 ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <button
            onClick={onImport}
            className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              isDarkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            📥 Importar marcadores
          </button>

          <ExportButton userId={userId} />

          <p
            className={`hidden md:block text-center text-xs mt-2 ${
              isDarkMode ? "text-slate-600" : "text-slate-500"
            }`}
          >
            Presiona{" "}
            <kbd
              className={`rounded px-1.5 py-0.5 ${
                isDarkMode ? "bg-slate-800" : "bg-slate-200"
              }`}
            >
              ?
            </kbd>{" "}
            para ver atajos
          </p>
        </div>
      </aside>
    </>
  );
}