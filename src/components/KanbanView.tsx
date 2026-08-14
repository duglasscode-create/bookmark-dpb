"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type KanbanBookmark = {
  id: string;
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  is_favorite: boolean;
};

type Collection = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type KanbanViewProps = {
  userId: string;
  collections: Collection[];
  onRead: (url: string, title: string) => void;
  onDeleteCollection: (collectionId: string, collectionName: string) => void;
  onTrashChange?: () => void;
};

const colorClasses: Record<string, string> = {
  blue: "border-t-blue-500",
  purple: "border-t-purple-500",
  pink: "border-t-pink-500",
  red: "border-t-red-500",
  orange: "border-t-orange-500",
  amber: "border-t-amber-500",
  emerald: "border-t-emerald-500",
  teal: "border-t-teal-500",
  cyan: "border-t-cyan-500",
  indigo: "border-t-indigo-500",
  violet: "border-t-violet-500",
  fuchsia: "border-t-fuchsia-500",
  slate: "border-t-slate-500",
};

export function KanbanView({
  userId,
  collections,
  onRead,
  onDeleteCollection,
  onTrashChange,
}: KanbanViewProps) {
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<KanbanBookmark[]>([]);
  const [bookmarkToCollection, setBookmarkToCollection] = useState<
    Record<string, string | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [draggedBookmarkId, setDraggedBookmarkId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  // Cargar datos al iniciar y cuando cambien las colecciones
  useEffect(() => {
    fetchData();
  }, [collections]);

  const fetchData = async () => {
    setLoading(true);

    const { data: bookmarksData } = await supabase
      .from("bookmarks")
      .select("id, url, domain, title, description, is_favorite")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (bookmarksData) {
      setBookmarks(bookmarksData);

      const { data: relations } = await supabase
        .from("bookmark_collections")
        .select("bookmark_id, collection_id")
        .eq("user_id", userId);

      const mapping: Record<string, string | null> = {};
      bookmarksData.forEach((b) => {
        mapping[b.id] = null;
      });

      if (relations) {
        relations.forEach((rel) => {
          if (mapping.hasOwnProperty(rel.bookmark_id)) {
            mapping[rel.bookmark_id] = rel.collection_id;
          }
        });
      }

      setBookmarkToCollection(mapping);
    }

    setLoading(false);
  };

  const getColumnBookmarks = (collectionId: string | null): KanbanBookmark[] => {
    return bookmarks.filter((bookmark) => {
      const bookmarkCollection = bookmarkToCollection[bookmark.id];
      if (collectionId === null) {
        return bookmarkCollection === null || bookmarkCollection === undefined;
      }
      return bookmarkCollection === collectionId;
    });
  };

  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    setDraggedBookmarkId(bookmarkId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", bookmarkId);
  };

  const handleDragEnd = () => {
    setDraggedBookmarkId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, collectionId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const columnKey = collectionId === null ? "uncollected" : collectionId;
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, collectionId: string | null) => {
    e.preventDefault();
    const bookmarkId = e.dataTransfer.getData("text/plain");

    if (!bookmarkId) return;

    setDragOverColumn(null);
    setDraggedBookmarkId(null);
    setMoving(true);

    try {
      await supabase
        .from("bookmark_collections")
        .delete()
        .eq("bookmark_id", bookmarkId)
        .eq("user_id", userId);

      if (collectionId !== null) {
        await supabase.from("bookmark_collections").insert({
          bookmark_id: bookmarkId,
          collection_id: collectionId,
          user_id: userId,
        });
      }

      setBookmarkToCollection((prev) => ({
        ...prev,
        [bookmarkId]: collectionId,
      }));
    } catch (error) {
      console.error("Error moviendo marcador:", error);
      alert("Error al mover el marcador");
    } finally {
      setMoving(false);
    }
  };

  // NUEVO: Eliminar un marcador desde el Kanban
  const handleDeleteBookmark = async (bookmarkId: string, bookmarkTitle: string) => {
    const confirmed = confirm(
      `¿Enviar "${bookmarkTitle}" a la papelera?\n\nPodrás recuperarlo desde la papelera.`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("bookmarks")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", bookmarkId);

      if (!error) {
        // Quitar del estado local
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));

        // Actualizar contador de papelera
        if (onTrashChange) {
          onTrashChange();
        }
      } else {
        alert("Error al eliminar: " + error.message);
      }
    } catch (error) {
      console.error("Error eliminando marcador:", error);
    }
  };

  // NUEVO: Eliminar una columna (colección) desde el Kanban
  const handleDeleteColumn = async (
    collectionId: string,
    collectionName: string
  ) => {
    onDeleteCollection(collectionId, collectionName);
    // Los datos se refrescarán automáticamente por el useEffect
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  const columns = [
    { id: null, name: "Sin colección", icon: "📂", color: "slate" },
    ...collections.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "📁",
      color: c.color || "slate",
    })),
  ];

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => {
          const columnBookmarks = getColumnBookmarks(column.id);
          const columnKey = column.id === null ? "uncollected" : column.id;
          const isOver = dragOverColumn === columnKey;
          const isRealCollection = column.id !== null;

          return (
            <div
              key={columnKey}
              className={`flex w-72 flex-col rounded-2xl border-t-4 bg-slate-900 transition-all ${
                colorClasses[column.color] || "border-t-slate-500"
              } ${
                isOver
                  ? "ring-2 ring-blue-500 bg-slate-800/80"
                  : "border border-slate-800"
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Header de la columna */}
              <div className="group flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{column.icon}</span>
                  <h3 className="text-sm font-semibold text-white truncate">
                    {column.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                    {columnBookmarks.length}
                  </span>

                  {/* NUEVO: Botón eliminar columna (solo para colecciones reales) */}
                  {isRealCollection && (
                    <button
                      onClick={() =>
                        handleDeleteColumn(column.id!, column.name)
                      }
                      className="hidden h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/20 hover:text-red-400 group-hover:flex"
                      title={`Eliminar colección "${column.name}"`}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Tarjetas de la columna */}
              <div className="flex-1 space-y-3 overflow-y-auto p-3 max-h-[60vh]">
                {columnBookmarks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                    <p className="text-xs text-slate-500">
                      {isOver ? "Suelta aquí" : "Arrastra marcadores aquí"}
                    </p>
                  </div>
                ) : (
                  columnBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bookmark.id)}
                      onDragEnd={handleDragEnd}
                      className={`group cursor-grab rounded-xl border border-slate-700 bg-slate-800 p-3 transition-all hover:border-slate-600 hover:shadow-lg active:cursor-grabbing ${
                        draggedBookmarkId === bookmark.id
                          ? "opacity-50 rotate-2"
                          : ""
                      }`}
                    >
                      {/* Título y acciones */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm font-medium text-white hover:text-blue-400 line-clamp-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {bookmark.title || bookmark.url}
                        </a>
                        <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() =>
                              onRead(bookmark.url, bookmark.title || bookmark.url)
                            }
                            className="rounded p-1 text-xs transition hover:bg-slate-700"
                            title="Leer"
                          >
                            📖
                          </button>
                          {/* NUEVO: Botón eliminar marcador */}
                          <button
                            onClick={() =>
                              handleDeleteBookmark(
                                bookmark.id,
                                bookmark.title || bookmark.url
                              )
                            }
                            className="rounded p-1 text-xs transition hover:bg-red-500/20"
                            title="Enviar a papelera"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Descripción */}
                      {bookmark.description && (
                        <p className="mb-2 text-xs text-slate-400 line-clamp-2">
                          {bookmark.description}
                        </p>
                      )}

                      {/* Footer de la tarjeta */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          {bookmark.domain && (
                            <>
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${bookmark.domain}&sz=16`}
                                alt=""
                                className="h-3.5 w-3.5 rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                              <span className="truncate max-w-[100px]">
                                {bookmark.domain}
                              </span>
                            </>
                          )}
                        </span>
                        {bookmark.is_favorite && <span className="text-xs">⭐</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicador de movimiento */}
      {moving && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 shadow-xl">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-300">Moviendo marcador...</span>
        </div>
      )}
    </div>
  );
}