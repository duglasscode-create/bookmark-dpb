"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./Sidebar";
import { HomeView } from "./HomeView";
import { BookmarkManager } from "./BookmarkManager";
import { TrashView } from "./TrashView";
import { StatsPanel } from "./StatsPanel";
import { HighlightsPanel } from "./HighlightsPanel";
import { RemindersPanel } from "./RemindersPanel";
import { ActivityPanel } from "./ActivityPanel";
import { AutoRulesPanel } from "./AutoRulesPanel";
import { NotesPanel } from "./NotesPanel";
import { AiPanel } from "./AiPanel";
import { CollectionModal } from "./CollectionModal";
import { EditCollectionModal } from "./EditCollectionModal";
import { ImportModal } from "./ImportModal";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { ShareCollectionModal } from "./ShareCollectionModal";
import { AddBookmarkModal } from "./AddBookmarkModal";
import { TagsManagerModal } from "./TagsManagerModal";
import { ViewSwitcher, type ViewMode } from "./ViewSwitcher";
import { SettingsMenu } from "./SettingsMenu";
import { HelpMenu } from "./HelpMenu";
import { FloatingActions } from "./FloatingActions";
import { IconDisplay } from "./IconPicker";
import { logActivity } from "@/utils/activityLog";

type Theme = "dark" | "light" | "system";

type Collection = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  slug?: string;
  is_public?: boolean;
  share_slug?: string | null;
  parent_id?: string | null;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

type DashboardClientProps = {
  userId: string;
  userEmail: string;
};

const AUTO_DELETE_DAYS = 30;

export function DashboardClient({ userId, userEmail }: DashboardClientProps) {
  const supabase = createClient();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [pendingReadCount, setPendingReadCount] = useState(0);
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCollectionId, setShareCollectionId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cardZoom, setCardZoom] = useState(3);

  const [theme, setTheme] = useState<Theme>("light");
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false);
  const [editCollectionId, setEditCollectionId] = useState<string | null>(null);
  const [isSavingCollectionEdit, setIsSavingCollectionEdit] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("viewMode") as ViewMode;
      const savedZoom = localStorage.getItem("cardZoom");
      

      if (savedViewMode) setViewMode(savedViewMode);
      if (savedZoom) setCardZoom(parseInt(savedZoom, 10));
      
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      if (theme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          mediaQuery.matches ? "dark" : "light"
        );
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
    };

    applyTheme();

    if (theme === "system") {
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("cardZoom", String(cardZoom));
  }, [cardZoom]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    fetchCollections();
    fetchTags();
    fetchTrashCount();
    fetchPendingReadCount();
    fetchCollectionCounts();
    cleanupOldTrash();
  }, []);

  const checkReminders = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      const { data: dueReminders } = await supabase
        .from("reminders")
        .select("id, bookmark_id, note")
        .eq("user_id", userId)
        .eq("is_notified", false)
        .lte("remind_at", now);

      if (dueReminders && dueReminders.length > 0) {
        if (typeof window !== "undefined" && "Notification" in window) {
          let permission = Notification.permission;

          if (permission === "default") {
            permission = await Notification.requestPermission();
          }

          if (permission === "granted") {
            const bookmarkIds = dueReminders.map((r) => r.bookmark_id);
            const { data: bookmarks } = await supabase
              .from("bookmarks")
              .select("id, title, url")
              .in("id", bookmarkIds);

            const bookmarksMap: Record<string, { title: string | null; url: string | null }> = {};
            bookmarks?.forEach((b) => {
              bookmarksMap[b.id] = { title: b.title, url: b.url };
            });

            dueReminders.forEach((reminder) => {
              const bookmark = bookmarksMap[reminder.bookmark_id];
              const title = bookmark?.title || "Marcador";
              const note = reminder.note ? `\n${reminder.note}` : "";

              new Notification("⏰ Recordatorio - Bookmark DPB", {
                body: `${title}${note}`,
                icon: "/favicon.ico",
                tag: reminder.id,
              });
            });
          }
        }

        const reminderIds = dueReminders.map((r) => r.id);
        await supabase
          .from("reminders")
          .update({ is_notified: true })
          .in("id", reminderIds);
      }
    } catch (error) {
      console.error("Error verificando recordatorios:", error);
    }
  }, [userId, supabase]);

  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const cleanupOldTrash = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - AUTO_DELETE_DAYS);

      const { data: oldTrash } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("is_deleted", true)
        .lt("deleted_at", cutoffDate.toISOString());

      if (oldTrash && oldTrash.length > 0) {
        const ids = oldTrash.map((b) => b.id);
        await supabase.from("bookmark_collections").delete().in("bookmark_id", ids);
        await supabase.from("bookmark_tags").delete().in("bookmark_id", ids);
        await supabase.from("bookmarks").delete().in("id", ids);
      }
    } catch (error) {
      console.error("Error en limpieza automática:", error);
    }
  };

  const handleReorderCollections = async (orderedIds: string[]) => {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("collections").update({ position: index }).eq("id", id)
        )
      );
      const reordered = orderedIds
        .map((id) => collections.find((c) => c.id === id))
        .filter(Boolean) as Collection[];
      setCollections(reordered);
    } catch (error) {
      console.error("Error reordenando colecciones:", error);
    }
  };

  const getIsDarkMode = () => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  };

  const isDarkMode = getIsDarkMode();

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
        case "h":
          setActiveFilter("home");
          break;
        case "1":
          setActiveFilter("all");
          break;
        case "2":
          setActiveFilter("favorites");
          break;
        case "3":
          setActiveFilter("trash");
          break;
        case "4":
          setActiveFilter("stats");
          break;
        case "5":
          setActiveFilter("highlights");
          break;
        case "6":
          setActiveFilter("reminders");
          break;
        case "7":
          setActiveFilter("activity");
          break;
        case "8":
          setActiveFilter("auto_rules");
          break;
        case "9":
          setActiveFilter("notes");
          break;
                  case "i":
          setActiveFilter("ai");
          break;
        case "n":
          setIsAddModalOpen(true);
          break;
        case "g":
          setViewMode("grid");
          break;
        case "l":
          setViewMode("list");
          break;
        case "k":
          setViewMode("kanban");
          break;
        case "?":
          setIsShortcutsHelpOpen(true);
          break;
        case "escape":
          setIsShortcutsHelpOpen(false);
          setIsMobileSidebarOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    const { data, error } = await supabase
      .from("collections")
      .select("id, name, slug, color, icon, is_public, share_slug, parent_id")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (!error) {
      setCollections(data || []);
    }
    setLoadingCollections(false);
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("user_id", userId)
      .order("name");

    if (!error) {
      setTags(data || []);
    }
  };

  const fetchTrashCount = async () => {
    const { count, error } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", true);

    if (!error) {
      setTrashCount(count || 0);
    }
  };

  const fetchPendingReadCount = async () => {
    const { count, error } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("read_status", "pending");

    if (!error) {
      setPendingReadCount(count || 0);
    }
  };

  const fetchCollectionCounts = async () => {
    const { data: relations } = await supabase
      .from("bookmark_collections")
      .select("collection_id")
      .eq("user_id", userId);

    const counts: Record<string, number> = {};
    relations?.forEach((rel) => {
      counts[rel.collection_id] = (counts[rel.collection_id] || 0) + 1;
    });

    setCollectionCounts(counts);
  };

  const handleTrashChange = () => {
    fetchTrashCount();
  };

  const handleCreateCollection = async (
    name: string,
    color: string,
    icon: string,
    parentId: string
  ) => {
    setIsSavingCollection(true);

    const { data: newCollection, error } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        color,
        icon,
        position: collections.length,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (!error) {
      fetchCollections();
      setIsModalOpen(false);

      if (newCollection) {
        logActivity(
          supabase,
          userId,
          "collection_created",
          "collection",
          newCollection.id,
          name
        );
      }
    } else {
      alert("Error al crear colección: " + error.message);
    }

    setIsSavingCollection(false);
  };

  const handleEditCollection = (collectionId: string) => {
    setEditCollectionId(collectionId);
    setIsEditCollectionModalOpen(true);
  };

  const handleSaveCollectionEdit = async (
    collectionId: string,
    name: string,
    color: string,
    icon: string,
    parentId: string
  ) => {
    setIsSavingCollectionEdit(true);

    const { error } = await supabase
      .from("collections")
      .update({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        color,
        icon,
        parent_id: parentId || null,
      })
      .eq("id", collectionId)
      .eq("user_id", userId);

    if (!error) {
      fetchCollections();
      setIsEditCollectionModalOpen(false);
      setEditCollectionId(null);
      logActivity(supabase, userId, "collection_updated", "collection", collectionId, name);
    } else {
      alert("Error al actualizar colección: " + error.message);
    }

    setIsSavingCollectionEdit(false);
  };

  const handleDeleteCollection = async (
    collectionId: string,
    collectionName: string
  ) => {
    const { data: collectionBookmarks } = await supabase
      .from("bookmark_collections")
      .select("bookmark_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    const bookmarkIds = collectionBookmarks?.map((r) => r.bookmark_id) || [];
    const bookmarkCount = bookmarkIds.length;

    const message =
      bookmarkCount > 0
        ? `¿Eliminar la colección "${collectionName}"?\n\n⚠️ Esto enviará a la PAPELERA ${bookmarkCount} marcador${
            bookmarkCount !== 1 ? "s" : ""
          } que están en esta colección.`
        : `¿Eliminar la colección "${collectionName}"?\n\nEsta colección está vacía.`;

    const confirmed = confirm(message);
    if (!confirmed) return;

    try {
      if (bookmarkIds.length > 0) {
        await supabase
          .from("bookmarks")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .in("id", bookmarkIds)
          .eq("user_id", userId);
      }

      await supabase
        .from("bookmark_collections")
        .delete()
        .eq("collection_id", collectionId)
        .eq("user_id", userId);

      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId)
        .eq("user_id", userId);

      if (!error) {
        fetchCollections();
        fetchTrashCount();
        if (activeFilter === collectionId) {
          setActiveFilter("home");
        }

        logActivity(
          supabase,
          userId,
          "collection_deleted",
          "collection",
          collectionId,
          collectionName
        );
      } else {
        alert("Error al eliminar colección: " + error.message);
      }
    } catch (error) {
      console.error("Error eliminando colección:", error);
      alert("Error al eliminar la colección");
    }
  };

  const handleShareCollection = (collectionId: string) => {
    setShareCollectionId(collectionId);
    setIsShareModalOpen(true);
  };

  const shareCollection = shareCollectionId
    ? collections.find((c) => c.id === shareCollectionId) || null
    : null;

  const getFilterTitle = (): ReactNode => {
    if (activeFilter === "home") return "🏠 Home";
    if (activeFilter === "all") return "📚 Todos los marcadores";
    if (activeFilter === "favorites") return "⭐ Favoritos";
    if (activeFilter === "trash") return "🗑️ Papelera";
    if (activeFilter === "stats") return "📊 Estadísticas";
    if (activeFilter === "highlights") return "🖍️ Highlights";
    if (activeFilter === "reminders") return "⏰ Recordatorios";
    if (activeFilter === "activity") return "🕐 Historial";
    if (activeFilter === "auto_rules") return "🎯 Reglas inteligentes";
    if (activeFilter === "pending_read") return "🔖 Leer después";
    if (activeFilter === "notes") return "📝 Notas";
    if (activeFilter === "ai") return "🤖 Asistentes IA";
    if (activeFilter.startsWith("tag:")) {
      const tagId = activeFilter.replace("tag:", "");
      const tag = tags.find((t) => t.id === tagId);
      return tag ? `🏷️ ${tag.name}` : "Etiqueta";
    }

    const collection = collections.find((c) => c.id === activeFilter);
    if (collection) {
      return (
        <span className="flex items-center gap-2">
          {collection.icon ? (
            <span className="inline-flex items-center">
              <IconDisplay icon={collection.icon} size={20} />
            </span>
          ) : (
            <span>📁</span>
          )}
          {collection.name}
        </span>
      );
    }
    return "Colección";
  };

  const showViewControls =
    activeFilter !== "home" &&
    activeFilter !== "trash" &&
    activeFilter !== "stats" &&
    activeFilter !== "highlights" &&
    activeFilter !== "reminders" &&
    activeFilter !== "activity" &&
    activeFilter !== "auto_rules" &&
    activeFilter !== "notes" &&
        activeFilter !== "ai" &&
    !activeFilter.startsWith("tag:");

  const renderContent = () => {
    if (activeFilter === "home") {
      return (
        <HomeView
          userId={userId}
          collections={collections}
          isDarkMode={isDarkMode}
          onSelectCollection={(id) => setActiveFilter(id)}
          onEditCollection={handleEditCollection}
          onDeleteCollection={handleDeleteCollection}
          onShareCollection={handleShareCollection}
          onAddBookmark={() => setIsAddModalOpen(true)}
          onGoNotes={() => setActiveFilter("notes")}
        />
      );
    }

    if (activeFilter === "trash") {
      return <TrashView userId={userId} onTrashChange={handleTrashChange} />;
    }

    if (activeFilter === "stats") {
      return <StatsPanel userId={userId} />;
    }

    if (activeFilter === "highlights") {
      return <HighlightsPanel userId={userId} />;
    }

    if (activeFilter === "reminders") {
      return <RemindersPanel userId={userId} />;
    }

    if (activeFilter === "activity") {
      return <ActivityPanel userId={userId} />;
    }

    if (activeFilter === "auto_rules") {
      return <AutoRulesPanel userId={userId} />;
    }

    if (activeFilter === "notes") {
      return <NotesPanel userId={userId} isDarkMode={isDarkMode} />;
    }
    if (activeFilter === "ai") {
      return <AiPanel userId={userId} isDarkMode={isDarkMode} />;
    }
    return (
      <BookmarkManager
        userId={userId}
        activeFilter={activeFilter}
        collections={collections}
        viewMode={viewMode}
        cardZoom={cardZoom}
        onTrashChange={handleTrashChange}
        onDeleteCollection={handleDeleteCollection}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isDarkMode={isDarkMode}
      />
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
            <Sidebar
        collections={collections}
        tags={tags}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onNewCollection={() => setIsModalOpen(true)}
        onEditCollection={handleEditCollection}
        onDeleteCollection={handleDeleteCollection}
        onShareCollection={handleShareCollection}
        onImport={() => setIsImportModalOpen(true)}
        isLoading={loadingCollections}
        trashCount={trashCount}
        pendingReadCount={pendingReadCount}
        collectionCounts={collectionCounts}
        userId={userId}
        isDarkMode={isDarkMode}
        onManageTags={() => setIsTagsManagerOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className={`flex items-center justify-between border-b border-[color:var(--border-color)] bg-[var(--bg-secondary)] px-4 md:px-6 py-3 md:py-4`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition md:hidden ${
                isDarkMode
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Abrir menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="min-w-0">
              <h2
                className={`text-base md:text-lg font-semibold truncate ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {getFilterTitle()}
              </h2>
              <p
                className={`hidden md:block text-xs ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {showViewControls && (
              <div className="hidden md:block">
                <ViewSwitcher
                  viewMode={viewMode}
                  onChangeView={setViewMode}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

            {showViewControls && viewMode === "grid" && (
              <div
                className={`hidden lg:flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-300 bg-white"
                }`}
              >
                <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  🔍
                </span>
                           <input
                  type="range"
                  min="1"
                  max="5"
                  value={6 - cardZoom}
                  onChange={(e) => setCardZoom(6 - parseInt(e.target.value, 10))}
                  className="h-1.5 w-20 cursor-pointer"
                  title="Tamaño de las tarjetas"
                />
                <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  🔎
                </span>
              </div>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 md:px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              title="Agregar marcador (N)"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">Nuevo</span>
            </button>

            <HelpMenu
              isDarkMode={isDarkMode}
              onOpenShortcuts={() => setIsShortcutsHelpOpen(true)}
            />

            <SettingsMenu
              isDarkMode={isDarkMode}
              theme={theme}
              onThemeChange={setTheme}
              onImport={() => setIsImportModalOpen(true)}
              onManageTags={() => setIsTagsManagerOpen(true)}
              userId={userId}
            />
          </div>
        </header>

        {showViewControls && (
          <div
            className={`flex md:hidden items-center justify-between gap-2 border-b border-[color:var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2`}
          >
            <ViewSwitcher
              viewMode={viewMode}
              onChangeView={setViewMode}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>

      <FloatingActions
        isDarkMode={isDarkMode}
        onAddBookmark={() => setIsAddModalOpen(true)}
        onNewCollection={() => setIsModalOpen(true)}
        onGoNotes={() => setActiveFilter("notes")}
      />

      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateCollection}
        isSaving={isSavingCollection}
        collections={collections}
      />

      <EditCollectionModal
        isOpen={isEditCollectionModalOpen}
        onClose={() => {
          setIsEditCollectionModalOpen(false);
          setEditCollectionId(null);
        }}
        onSave={handleSaveCollectionEdit}
        isSaving={isSavingCollectionEdit}
        collection={
          editCollectionId
            ? collections.find((c) => c.id === editCollectionId) || null
            : null
        }
        allCollections={collections}
        isDarkMode={isDarkMode}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onComplete={() => {
          fetchCollections();
          fetchTags();
          fetchTrashCount();
        }}
        userId={userId}
      />

      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      <ShareCollectionModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareCollectionId(null);
        }}
        collection={
          shareCollection
            ? {
                id: shareCollection.id,
                name: shareCollection.name,
                slug: shareCollection.slug || shareCollection.name.toLowerCase(),
                icon: shareCollection.icon,
                is_public: shareCollection.is_public || false,
                share_slug: shareCollection.share_slug || null,
              }
            : null
        }
        onUpdate={fetchCollections}
      />

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={() => {}}
        userId={userId}
        collections={collections}
      />

      <TagsManagerModal
        isOpen={isTagsManagerOpen}
        onClose={() => setIsTagsManagerOpen(false)}
        userId={userId}
        onTagsChanged={fetchTags}
      />
    </div>
  );
}