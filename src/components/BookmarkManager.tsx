"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookmarkCard } from "./BookmarkCard";
import { KanbanView } from "./KanbanView";
import { SearchBar } from "./SearchBar";
import { SortSelector, type SortOption } from "./SortSelector";
import { EditBookmarkModal } from "./EditBookmarkModal";
import { ReaderModal } from "./ReaderModal";
import { BulkActionsBar } from "./BulkActionsBar";
import { AdvancedFilters, defaultFilters, type Filters } from "./AdvancedFilters";
import type { ViewMode } from "./ViewSwitcher";
import { logActivity } from "@/utils/activityLog";

type BookmarkTag = {
  id: string;
  name: string;
  color: string;
};

type Bookmark = {
  id: string;
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  note: string | null;
  read_status: string;
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
  source: string | null;
  tags?: BookmarkTag[];
};

type Collection = {
  id: string;
  name: string;
};

type BookmarkManagerProps = {
  userId: string;
  activeFilter: string;
  collections: Collection[];
  viewMode: ViewMode;
  cardZoom: number;
  onTrashChange?: () => void;
  onDeleteCollection?: (collectionId: string, collectionName: string) => void;
  onOpenAddModal?: () => void;
  isDarkMode?: boolean;
};

const zoomToGridClass: Record<number, string> = {
  1: "grid-cols-1 sm:grid-cols-2",
  2: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
  3: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5",
};

export function BookmarkManager({
  userId,
  activeFilter,
  collections,
  viewMode,
  cardZoom,
  onTrashChange,
  onDeleteCollection,
  onOpenAddModal,
  isDarkMode = true,
}: BookmarkManagerProps) {
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [allTags, setAllTags] = useState<BookmarkTag[]>([]);

  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readingUrl, setReadingUrl] = useState("");
  const [readingTitle, setReadingTitle] = useState("");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Filters>(defaultFilters);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchBookmarks();
    setSelectedIds([]);
  }, [activeFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isTyping) return;

      switch (e.key.toLowerCase()) {
        case "/":
          e.preventDefault();
          document.getElementById("search-input")?.focus();
          break;
        case "escape":
          if (selectionMode) {
            setSelectionMode(false);
            setSelectedIds([]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode]);

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("user_id", userId)
      .order("name");

    if (!error) {
      setAllTags(data || []);
    }
  };

  const fetchBookmarks = async () => {
    setLoading(true);

    let query = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (activeFilter === "favorites") {
      query = query.eq("is_favorite", true);
    } else if (activeFilter === "pending_read") {
      query = query.eq("read_status", "pending");
    } else if (activeFilter.startsWith("tag:")) {
      const tagId = activeFilter.replace("tag:", "");
      const { data: bookmarkTagIds } = await supabase
        .from("bookmark_tags")
        .select("bookmark_id")
        .eq("tag_id", tagId);

      const ids = bookmarkTagIds?.map((item) => item.bookmark_id) || [];

      if (ids.length === 0) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      query = query.in("id", ids);
    } else if (activeFilter !== "all") {
      const { data: collectionBookmarkIds } = await supabase
        .from("bookmark_collections")
        .select("bookmark_id")
        .eq("collection_id", activeFilter);

      const ids = collectionBookmarkIds?.map((item) => item.bookmark_id) || [];

      if (ids.length === 0) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (!error && data) {
      const bookmarksWithTags = await Promise.all(
        data.map(async (bookmark) => {
          const { data: tagRelations } = await supabase
            .from("bookmark_tags")
            .select("tag_id")
            .eq("bookmark_id", bookmark.id);

          const tagIds = tagRelations?.map((r) => r.tag_id) || [];

          if (tagIds.length === 0) {
            return { ...bookmark, tags: [] };
          }

          const { data: tags } = await supabase
            .from("tags")
            .select("id, name, color")
            .in("id", tagIds);

          return { ...bookmark, tags: tags || [] };
        })
      );

      setBookmarks(bookmarksWithTags);
    }
    setLoading(false);
  };

  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();
    bookmarks.forEach((bookmark) => {
      if (bookmark.domain) {
        domains.add(bookmark.domain);
      }
    });
    return Array.from(domains).sort();
  }, [bookmarks]);

  const activeFiltersCount =
    (advancedFilters.dateRange !== "all" ? 1 : 0) +
    (advancedFilters.domain !== "" ? 1 : 0) +
    (advancedFilters.tagId !== "" ? 1 : 0) +
    (advancedFilters.source !== "all" ? 1 : 0);

  const filteredAndSortedBookmarks = useMemo(() => {
    let result = [...bookmarks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((bookmark) => {
        const titleMatch = bookmark.title?.toLowerCase().includes(query);
        const urlMatch = bookmark.url.toLowerCase().includes(query);
        const descriptionMatch = bookmark.description
          ?.toLowerCase()
          .includes(query);
        const domainMatch = bookmark.domain?.toLowerCase().includes(query);
        const tagMatch = bookmark.tags?.some((tag) =>
          tag.name.toLowerCase().includes(query)
        );

        return (
          titleMatch || urlMatch || descriptionMatch || domainMatch || tagMatch
        );
      });
    }

    if (advancedFilters.dateRange !== "all") {
      const now = new Date();
      let cutoffDate = new Date();

      if (advancedFilters.dateRange === "week") {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (advancedFilters.dateRange === "month") {
        cutoffDate.setDate(now.getDate() - 30);
      } else if (advancedFilters.dateRange === "year") {
        cutoffDate.setDate(now.getDate() - 365);
      }

      result = result.filter(
        (bookmark) => new Date(bookmark.created_at) >= cutoffDate
      );
    }

    if (advancedFilters.domain !== "") {
      result = result.filter(
        (bookmark) => bookmark.domain === advancedFilters.domain
      );
    }

    if (advancedFilters.tagId !== "") {
      result = result.filter((bookmark) =>
        bookmark.tags?.some((tag) => tag.id === advancedFilters.tagId)
      );
    }

    if (advancedFilters.source !== "all") {
      result = result.filter(
        (bookmark) => bookmark.source === advancedFilters.source
      );
    }

    result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }

      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "title_asc":
          return (a.title || a.url).localeCompare(b.title || b.url);
        case "title_desc":
          return (b.title || b.url).localeCompare(a.title || a.url);
        case "domain_asc":
          return (a.domain || "").localeCompare(b.domain || "");
        default:
          return 0;
      }
    });

    return result;
  }, [bookmarks, searchQuery, sortBy, advancedFilters]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds([]);
    } else {
      setSelectionMode(true);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedBookmarks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedBookmarks.map((b) => b.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      await supabase
        .from("bookmarks")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .in("id", selectedIds)
        .eq("user_id", userId);

      logActivity(
        supabase,
        userId,
        "bookmark_deleted",
        "bookmark",
        null,
        null,
        `${selectedIds.length} marcadores enviados a la papelera`
      );

      setSelectedIds([]);
      setSelectionMode(false);
      fetchBookmarks();
      if (onTrashChange) onTrashChange();
    } catch (error) {
      console.error("Error eliminando seleccionados:", error);
    }
  };

  const handleMoveSelectedToCollection = async (collectionId: string) => {
    if (selectedIds.length === 0) return;

    try {
      await supabase
        .from("bookmark_collections")
        .delete()
        .in("bookmark_id", selectedIds)
        .eq("user_id", userId);

      if (collectionId) {
        const inserts = selectedIds.map((bookmarkId) => ({
          bookmark_id: bookmarkId,
          collection_id: collectionId,
          user_id: userId,
        }));
        await supabase.from("bookmark_collections").insert(inserts);

        const collectionName = collections.find((c) => c.id === collectionId)?.name;
        logActivity(
          supabase,
          userId,
          "bookmark_moved",
          "bookmark",
          null,
          null,
          `${selectedIds.length} marcadores movidos a "${collectionName}"`
        );
      }

      setSelectedIds([]);
      setSelectionMode(false);
      fetchBookmarks();
    } catch (error) {
      console.error("Error moviendo seleccionados:", error);
    }
  };

  const handleFavoriteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      await supabase
        .from("bookmarks")
        .update({ is_favorite: true })
        .in("id", selectedIds)
        .eq("user_id", userId);

      setSelectedIds([]);
      setSelectionMode(false);
      fetchBookmarks();
    } catch (error) {
      console.error("Error marcando favoritos:", error);
    }
  };

  const handleToggleReadLater = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "read" : "pending";

    const { error } = await supabase
      .from("bookmarks")
      .update({ read_status: newStatus })
      .eq("id", id);

    if (!error) {
      fetchBookmarks();
    }
  };

  const handleTogglePin = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("bookmarks")
      .update({ is_pinned: !currentState })
      .eq("id", id);

    if (!error) {
      fetchBookmarks();

      const bookmark = bookmarks.find((b) => b.id === id);
      if (bookmark) {
        logActivity(
          supabase,
          userId,
          currentState ? "bookmark_unpinned" : "bookmark_pinned",
          "bookmark",
          id,
          bookmark.title || bookmark.url
        );
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      fetchBookmarks();
      if (onTrashChange) onTrashChange();

      const bookmark = bookmarks.find((b) => b.id === id);
      if (bookmark) {
        logActivity(
          supabase,
          userId,
          "bookmark_deleted",
          "bookmark",
          id,
          bookmark.title || bookmark.url
        );
      }
    }
  };

  const handleToggleFavorite = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("bookmarks")
      .update({ is_favorite: !currentState })
      .eq("id", id);

    if (!error) {
      fetchBookmarks();

      const bookmark = bookmarks.find((b) => b.id === id);
      if (bookmark) {
        logActivity(
          supabase,
          userId,
          currentState ? "bookmark_unfavorited" : "bookmark_favorited",
          "bookmark",
          id,
          bookmark.title || bookmark.url
        );
      }
    }
  };

  const handleEdit = (id: string) => {
    setEditingBookmarkId(id);
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditingBookmarkId(null);
  };

  const handleEditSave = () => {
    fetchBookmarks();

    if (editingBookmarkId) {
      const bookmark = bookmarks.find((b) => b.id === editingBookmarkId);
      if (bookmark) {
        logActivity(
          supabase,
          userId,
          "bookmark_edited",
          "bookmark",
          editingBookmarkId,
          bookmark.title || bookmark.url
        );
      }
    }
  };

  const handleRead = (url: string, title: string) => {
    setReadingUrl(url);
    setReadingTitle(title);
    setIsReaderOpen(true);
  };

  const handleReaderClose = () => {
    setIsReaderOpen(false);
    setReadingUrl("");
    setReadingTitle("");
  };

  const editingBookmark =
    bookmarks.find((b) => b.id === editingBookmarkId) || null;

  // Grid responsive: en móvil siempre 1 columna
  const gridClass = zoomToGridClass[cardZoom] || zoomToGridClass[3];
  const responsiveGridClass = `grid-cols-1 sm:${gridClass}`;

  const cardBg = isDarkMode ? "bg-slate-900" : "bg-white";
  const cardBorder = isDarkMode ? "border-slate-800" : "border-slate-200";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const btnInactive = isDarkMode
    ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
    : "border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900";
  const btnActive = "border-blue-500 bg-blue-500/20 text-blue-500";

  const pinnedCount = filteredAndSortedBookmarks.filter((b) => b.is_pinned).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Barra de búsqueda y controles responsive */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          isDarkMode={isDarkMode}
        />

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`relative rounded-xl border px-3 md:px-4 py-2.5 text-sm font-medium transition ${
              showAdvancedFilters || activeFiltersCount > 0
                ? btnActive
                : btnInactive
            }`}
            title="Filtros avanzados"
          >
            🎛️ <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={handleToggleSelectionMode}
            className={`rounded-xl border px-3 md:px-4 py-2.5 text-sm font-medium transition ${
              selectionMode ? btnActive : btnInactive
            }`}
            title="Modo selección (Esc para cancelar)"
          >
            {selectionMode ? "☑️" : "⬜"}{" "}
            <span className="hidden sm:inline">
              {selectionMode ? "Seleccionando" : "Seleccionar"}
            </span>
          </button>

          {selectionMode && filteredAndSortedBookmarks.length > 0 && (
            <button
              onClick={handleSelectAll}
              className={`rounded-xl border px-3 md:px-4 py-2.5 text-sm font-medium transition ${btnInactive}`}
            >
              <span className="hidden sm:inline">
                {selectedIds.length === filteredAndSortedBookmarks.length
                  ? "Deseleccionar todo"
                  : "Seleccionar todo"}
              </span>
              <span className="sm:hidden">
                {selectedIds.length === filteredAndSortedBookmarks.length
                  ? "✕ Todo"
                  : "✓ Todo"}
              </span>
            </button>
          )}

          <SortSelector
            value={sortBy}
            onChange={setSortBy}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      {showAdvancedFilters && (
        <AdvancedFilters
          domains={uniqueDomains}
          tags={allTags}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onClear={() => setAdvancedFilters(defaultFilters)}
        />
      )}

      {/* Contador de resultados */}
      <div className={`flex flex-wrap items-center gap-2 text-sm ${textMuted}`}>
        <span>
          {searchQuery || activeFiltersCount > 0
            ? `${filteredAndSortedBookmarks.length} resultado${
                filteredAndSortedBookmarks.length !== 1 ? "s" : ""
              }${searchQuery ? ` para "${searchQuery}"` : ""}`
            : `${filteredAndSortedBookmarks.length} marcador${
                filteredAndSortedBookmarks.length !== 1 ? "es" : ""
              }`}
        </span>
        {pinnedCount > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            • 📌 {pinnedCount} fijado{pinnedCount !== 1 ? "s" : ""}
          </span>
        )}
        {(searchQuery || activeFiltersCount > 0) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setAdvancedFilters(defaultFilters);
            }}
            className="text-blue-500 hover:text-blue-400"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div
          className={`flex items-center justify-center rounded-2xl border py-16 ${cardBg} ${cardBorder}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className={textMuted}>Cargando...</p>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanView
          userId={userId}
          collections={collections}
          onRead={handleRead}
          onDeleteCollection={onDeleteCollection || (async () => {})}
          onTrashChange={onTrashChange}
        />
      ) : filteredAndSortedBookmarks.length === 0 ? (
        <div
          className={`rounded-2xl border py-16 text-center ${cardBg} ${cardBorder}`}
        >
          <p className="mb-3 text-5xl">
            {searchQuery || activeFiltersCount > 0
              ? "🔍"
              : activeFilter === "favorites"
              ? "⭐"
              : activeFilter === "pending_read"
              ? "🔖"
              : "📭"}
          </p>
          <p className={`mb-1 font-medium ${textPrimary}`}>
            {searchQuery || activeFiltersCount > 0
              ? "No se encontraron resultados con estos filtros"
              : activeFilter === "favorites"
              ? "No tienes favoritos aún"
              : activeFilter === "pending_read"
              ? "No tienes marcadores pendientes de leer"
              : activeFilter.startsWith("tag:")
              ? "Esta etiqueta no tiene marcadores"
              : activeFilter === "all"
              ? "Aún no tienes marcadores"
              : "Esta colección está vacía"}
          </p>
          <p className={`text-sm ${textMuted}`}>
            {searchQuery || activeFiltersCount > 0 ? (
              "Intenta ajustar la búsqueda o los filtros"
            ) : activeFilter === "pending_read" ? (
              "Marca marcadores con 🔖 para leerlos después"
            ) : (
              <>
                Presiona{" "}
                <button
                  onClick={onOpenAddModal}
                  className="text-blue-500 hover:text-blue-400 font-medium"
                >
                  + Nuevo
                </button>{" "}
                para agregar tu primer marcador
              </>
            )}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className={`grid gap-4 ${responsiveGridClass}`}>
          {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              id={bookmark.id}
              url={bookmark.url}
              domain={bookmark.domain}
              title={bookmark.title}
              description={bookmark.description}
              note={bookmark.note}
              read_status={bookmark.read_status}
              is_favorite={bookmark.is_favorite}
              is_pinned={bookmark.is_pinned}
              tags={bookmark.tags}
              viewMode="grid"
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onRead={handleRead}
              onToggleReadLater={handleToggleReadLater}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(bookmark.id)}
              onSelect={handleToggleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              id={bookmark.id}
              url={bookmark.url}
              domain={bookmark.domain}
              title={bookmark.title}
              description={bookmark.description}
              note={bookmark.note}
              read_status={bookmark.read_status}
              is_favorite={bookmark.is_favorite}
              is_pinned={bookmark.is_pinned}
              tags={bookmark.tags}
              viewMode="list"
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onRead={handleRead}
              onToggleReadLater={handleToggleReadLater}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(bookmark.id)}
              onSelect={handleToggleSelect}
            />
          ))}
        </div>
      )}

      {/* Barra de acciones masivas */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        collections={collections}
        onDeleteSelected={handleDeleteSelected}
        onMoveToCollection={handleMoveSelectedToCollection}
        onFavoriteSelected={handleFavoriteSelected}
        onClearSelection={() => {
          setSelectedIds([]);
          setSelectionMode(false);
        }}
      />

      {/* Modal de edición */}
      <EditBookmarkModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        onSave={handleEditSave}
        bookmark={editingBookmark}
        userId={userId}
        collections={collections}
        allTags={allTags}
      />

      {/* Modal de lectura */}
      <ReaderModal
        isOpen={isReaderOpen}
        onClose={handleReaderClose}
        url={readingUrl}
        initialTitle={readingTitle}
      />
    </div>
  );
}