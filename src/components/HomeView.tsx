"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconDisplay } from "./IconPicker";
import { blockBgStyle, blockTextStyle, blockIconStyle } from "@/utils/notionColors";
import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  Pencil,
  Share2,
  Trash2,
  Star,
  StickyNote,
  Search,
} from "lucide-react";

type Collection = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  parent_id?: string | null;
};

type HomeBookmark = {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  icon: string | null;
  is_favorite: boolean;
};

type HomeViewProps = {
  userId: string;
  collections: Collection[];
  isDarkMode: boolean;
  onSelectCollection: (id: string) => void;
  onEditCollection: (id: string) => void;
  onDeleteCollection: (id: string, name: string) => void;
  onShareCollection: (id: string) => void;
  onAddBookmark: () => void;
  onReorderCollections: (ids: string[]) => void;
  onGoNotes: () => void;
};

export function HomeView({
  userId,
  collections,
  isDarkMode,
  onSelectCollection,
  onEditCollection,
  onDeleteCollection,
  onShareCollection,
  onAddBookmark,
  onReorderCollections,
  onGoNotes,
}: HomeViewProps) {
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<HomeBookmark[]>([]);
  const [bookmarkToCollections, setBookmarkToCollections] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
   const [search, setSearch] = useState("");
  const [homeNote, setHomeNote] = useState<{
    id: string;
    title: string;
    content: string;
    pinned: boolean;
    updated_at: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (collections.length > 0) {
      setExpanded(new Set(collections.filter((c) => !c.parent_id).map((c) => c.id)));
    }
  }, [collections]);

  const fetchData = async () => {
    setLoading(true);

    const { data: bookmarksData } = await supabase
      .from("bookmarks")
      .select("id, url, title, domain, icon, is_favorite")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (bookmarksData) {
      setBookmarks(bookmarksData);

      const { data: relations } = await supabase
        .from("bookmark_collections")
        .select("bookmark_id, collection_id")
        .eq("user_id", userId);

      const mapping: Record<string, string[]> = {};
      relations?.forEach((rel) => {
        if (!mapping[rel.bookmark_id]) mapping[rel.bookmark_id] = [];
        mapping[rel.bookmark_id].push(rel.collection_id);
      });
      setBookmarkToCollections(mapping);
    }

    const { data: noteData } = await supabase
      .from("notes")
      .select("id, title, content, pinned, updated_at")
      .eq("user_id", userId)
      .eq("deleted", false)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1);

    if (noteData && noteData.length > 0) {
      setHomeNote(noteData[0]);
    }

    setLoading(false);
  };

  const stripHtml = (html: string): string => {
    if (!html) return "";
    if (typeof document === "undefined") return html;
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").trim();
  };

  const q = search.trim().toLowerCase();

  const matchesSearch = (b: HomeBookmark): boolean => {
    if (!q) return true;
    return (
      (b.title || "").toLowerCase().includes(q) ||
      (b.url || "").toLowerCase().includes(q) ||
      (b.domain || "").toLowerCase().includes(q)
    );
  };

  const getBookmarksOf = (collectionId: string): HomeBookmark[] =>
    bookmarks
      .filter((b) => (bookmarkToCollections[b.id] || []).includes(collectionId))
      .filter(matchesSearch);

  const rootCollections = collections.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    collections.filter((c) => c.parent_id === parentId);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setTimeout(() => setDraggedId(id), 0);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const dragged = e.dataTransfer.getData("text/plain") || draggedId;
    if (dragged && dragged !== targetId) {
      const ids = rootCollections.map((c) => c.id);
      const from = ids.indexOf(dragged);
      const to = ids.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        ids.splice(from, 1);
        ids.splice(to, 0, dragged);
        onReorderCollections(ids);
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const renderBookmarkRow = (b: HomeBookmark) => (
    <a
      key={b.id}
      href={b.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition ${
        isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
      }`}
    >
      <span className="inline-flex shrink-0 items-center">
        {b.icon ? (
          <IconDisplay icon={b.icon} size={15} />
        ) : (
          <img
            src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`}
            alt=""
            draggable={false}
            className="h-4 w-4 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </span>
      <span
        className={`flex-1 truncate text-sm ${
          isDarkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        {b.title || b.url}
      </span>
      {b.is_favorite && <Star size={12} className="shrink-0 text-amber-400" fill="currentColor" />}
    </a>
  );

  const renderCollectionCard = (collection: Collection) => {
    const children = getChildren(collection.id);
    const childData = children.map((child) => ({
      child,
      books: getBookmarksOf(child.id),
    }));
    const ownBookmarks = getBookmarksOf(collection.id);
    const isExpanded = expanded.has(collection.id) || q !== "";
    const nameMatch = collection.name.toLowerCase().includes(q);
    const totalCount =
      ownBookmarks.length +
      childData.reduce((acc, cd) => acc + cd.books.length, 0);

    // Si hay búsqueda y no hay coincidencias, ocultar la tarjeta
    if (
      q &&
      !nameMatch &&
      ownBookmarks.length === 0 &&
      !childData.some((cd) => cd.books.length > 0 || cd.child.name.toLowerCase().includes(q))
    ) {
      return null;
    }

    return (
      <div
        key={collection.id}
        className={`flex flex-col overflow-visible rounded-2xl border border-[color:var(--card-border)] bg-[var(--card-bg)] shadow-sm transition ${
          dragOverId === collection.id ? "ring-2 ring-blue-500" : ""
        } ${draggedId === collection.id ? "opacity-50" : ""}`}
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, collection.id)}
          onDragOver={(e) => {
            e.preventDefault();
            if (collection.id !== draggedId) setDragOverId(collection.id);
          }}
          onDrop={(e) => handleDrop(e, collection.id)}
          onDragEnd={() => {
            setDraggedId(null);
            setDragOverId(null);
          }}
          className="relative flex cursor-grab items-center gap-2 rounded-t-2xl px-4 py-3 active:cursor-grabbing"
          style={blockBgStyle(collection.color)}
        >
          <span className="inline-flex shrink-0 items-center" style={blockIconStyle(collection.color)}>
            <IconDisplay icon={collection.icon || "📁"} size={17} />
          </span>
          <button
            onClick={() => onSelectCollection(collection.id)}
            className="flex-1 truncate text-left text-sm font-bold hover:underline"
            style={blockTextStyle(collection.color)}
            title={`Abrir colección "${collection.name}"`}
          >
            {collection.name}
          </button>
          <span className="text-xs opacity-70" style={blockTextStyle(collection.color)}>
            {totalCount}
          </span>
          <button
            onClick={() =>
              setMenuOpenId(menuOpenId === collection.id ? null : collection.id)
            }
            className="rounded-lg p-1 opacity-70 transition hover:opacity-100"
            style={blockTextStyle(collection.color)}
            title="Opciones de la colección"
          >
            <MoreHorizontal size={15} />
          </button>
          <button
            onClick={() => toggleExpanded(collection.id)}
            className="rounded-lg p-1 opacity-70 transition hover:opacity-100"
            style={blockTextStyle(collection.color)}
            title={isExpanded ? "Colapsar" : "Expandir"}
          >
            <ChevronDown
              size={15}
              className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            />
          </button>

          {menuOpenId === collection.id && (
            <div
              className={`absolute right-2 top-11 z-30 w-52 rounded-xl border py-1 shadow-xl ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-white"
              }`}
            >
              <button
                onClick={() => {
                  setMenuOpenId(null);
                  onAddBookmark();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                  isDarkMode
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Plus size={13} /> Agregar marcador
              </button>
              <button
                onClick={() => {
                  setMenuOpenId(null);
                  onEditCollection(collection.id);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                  isDarkMode
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Pencil size={13} /> Renombrar / editar
              </button>
              <button
                onClick={() => {
                  setMenuOpenId(null);
                  onShareCollection(collection.id);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                  isDarkMode
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Share2 size={13} /> Compartir
              </button>
              <button
                onClick={() => {
                  setMenuOpenId(null);
                  onDeleteCollection(collection.id, collection.name);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-500 transition hover:bg-red-500/10"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="flex-1 space-y-1 p-2">
            {childData.map(({ child, books }) => (
              <div key={child.id}>
                <button
                  onClick={() => onSelectCollection(child.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition ${
                    isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                  title={`Abrir subcolección "${child.name}"`}
                >
                  <span className="inline-flex shrink-0 items-center">
                    <IconDisplay icon={child.icon || "📁"} size={13} />
                  </span>
                  <span
                    className={`flex-1 truncate text-xs font-semibold ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {child.name}
                  </span>
                  <span className={`text-[10px] ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>
                    {books.length}
                  </span>
                </button>
                <div className="ml-3">
                  {books.slice(0, 8).map(renderBookmarkRow)}
                </div>
              </div>
            ))}

            {ownBookmarks.slice(0, 10).map(renderBookmarkRow)}

            {totalCount === 0 && (
              <p
                className={`px-3 py-4 text-center text-xs ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {q ? "Sin coincidencias" : "Colección vacía"}
              </p>
            )}

            {totalCount > 10 && (
              <button
                onClick={() => onSelectCollection(collection.id)}
                className="w-full px-3 py-2 text-left text-xs font-medium text-blue-500 transition hover:text-blue-400"
              >
                Ver todos ({totalCount}) →
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Buscador */}
      <div className="mb-4">
        <div
          className={`relative max-w-md ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en mis colecciones..."
            className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              isDarkMode
                ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500"
                : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
            }`}
          />
        </div>
      </div>

      <p className={`mb-4 text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
        Arrastra las tarjetas por su cabecera para reordenar · ⋯ para opciones
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rootCollections.map(renderCollectionCard)}

        {/* Tarjeta de Notas: muestra la nota fijada o la última nota */}
        <div className="flex flex-col overflow-visible rounded-2xl border border-[color:var(--card-border)] bg-[var(--card-bg)] shadow-sm">
          <div
            className="flex items-center gap-2 rounded-t-2xl px-4 py-3"
            style={blockBgStyle("yellow")}
          >
            <span style={blockIconStyle("yellow")}>
              <StickyNote size={17} />
            </span>
            <button
              onClick={onGoNotes}
              className="flex-1 truncate text-left text-sm font-bold hover:underline"
              style={blockTextStyle("yellow")}
              title="Abrir bloc de notas"
            >
              Notas
            </button>
            {homeNote && (
              <span className="text-xs opacity-70" style={blockTextStyle("yellow")}>
                {homeNote.pinned ? "📌 fijada" : "última"}
              </span>
            )}
          </div>

          {homeNote ? (
            <button
              onClick={onGoNotes}
              className={`flex flex-1 flex-col gap-2 p-4 text-left transition ${
                isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-100"
              }`}
              title="Abrir bloc de notas"
            >
              <span
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                {homeNote.title || "Sin título"}
              </span>
              <span
                className={`line-clamp-4 text-xs ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {stripHtml(homeNote.content) || "(sin contenido)"}
              </span>
              <span
                className={`mt-auto text-[10px] ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {new Date(homeNote.updated_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </button>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
              <p className={`text-center text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                Sin notas aún. Crea una o fija una con 📌 para verla aquí.
              </p>
              <button
                onClick={onGoNotes}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Abrir bloc de notas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}