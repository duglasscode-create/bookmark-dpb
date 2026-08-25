"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconDisplay } from "./IconPicker";
import { normalizeColor } from "@/utils/notionColors";
import {
  Home as HomeIcon,
  Library,
  Star,
  Bookmark,
  Trash2,
  BarChart3,
  Highlighter,
  AlarmClock,
  History,
  Target,
  StickyNote,
  Bot,
  KeyRound,
  Plus,
} from "lucide-react";

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
  onEditCollection: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string, collectionName: string) => void;
  onShareCollection: (collectionId: string) => void;
  onImport: () => void;
  isLoading: boolean;
  trashCount: number;
  pendingReadCount: number;
  userId: string;
  collectionCounts: Record<string, number>;
  isDarkMode?: boolean;
  onManageTags: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  activeDark: string;
  activeLight: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "all",
    label: "All Bookmarks",
    icon: <Library size={17} />,
    activeDark: "bg-blue-600/20 text-blue-400",
    activeLight: "bg-blue-100 text-blue-700",
  },
  {
    id: "favorites",
    label: "Favoritos",
    icon: <Star size={17} />,
    activeDark: "bg-amber-600/20 text-amber-400",
    activeLight: "bg-amber-100 text-amber-700",
  },
  {
    id: "pending_read",
    label: "Leer después",
    icon: <Bookmark size={17} />,
    activeDark: "bg-emerald-600/20 text-emerald-400",
    activeLight: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "trash",
    label: "Papelera",
    icon: <Trash2 size={17} />,
    activeDark: "bg-red-600/20 text-red-400",
    activeLight: "bg-red-100 text-red-700",
  },
  {
    id: "stats",
    label: "Estadísticas",
    icon: <BarChart3 size={17} />,
    activeDark: "bg-purple-600/20 text-purple-400",
    activeLight: "bg-purple-100 text-purple-700",
  },
  {
    id: "highlights",
    label: "Highlights",
    icon: <Highlighter size={17} />,
    activeDark: "bg-amber-600/20 text-amber-400",
    activeLight: "bg-amber-100 text-amber-700",
  },
  {
    id: "reminders",
    label: "Recordatorios",
    icon: <AlarmClock size={17} />,
    activeDark: "bg-orange-600/20 text-orange-400",
    activeLight: "bg-orange-100 text-orange-700",
  },
  {
    id: "activity",
    label: "Historial",
    icon: <History size={17} />,
    activeDark: "bg-cyan-600/20 text-cyan-400",
    activeLight: "bg-cyan-100 text-cyan-700",
  },
  {
    id: "auto_rules",
    label: "Reglas",
    icon: <Target size={17} />,
    activeDark: "bg-emerald-600/20 text-emerald-400",
    activeLight: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "notes",
    label: "Notas",
    icon: <StickyNote size={17} />,
    activeDark: "bg-yellow-600/20 text-yellow-400",
    activeLight: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "ai",
    label: "Asistentes IA",
    icon: <Bot size={17} />,
    activeDark: "bg-teal-600/20 text-teal-400",
    activeLight: "bg-teal-100 text-teal-700",
  },
  {
    id: "accounts",
    label: "Cuentas",
    icon: <KeyRound size={17} />,
    activeDark: "bg-sky-600/20 text-sky-400",
    activeLight: "bg-sky-100 text-sky-700",
  },
];

export function Sidebar({
  collections,
  tags,
  activeFilter,
  onSelectFilter,
  onNewCollection,
  onEditCollection,
  onDeleteCollection,
  onShareCollection,
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
    const supabase = createClient();
  const [order, setOrder] = useState<string[]>([]);
  const [sidebarDragId, setSidebarDragId] = useState<string | null>(null);
  const [sidebarDragOverId, setSidebarDragOverId] = useState<string | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [orderLoaded, setOrderLoaded] = useState(false);

  // Cargar orden desde Supabase al montar
  useEffect(() => {
    const loadOrderFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("sidebar_order")
          .eq("user_id", userId)
          .single();

        if (!error && data?.sidebar_order) {
          setOrder(data.sidebar_order);
        } else {
          // Si no existe, intentar desde localStorage como fallback
          const savedOrder = localStorage.getItem("sidebarOrder");
          if (savedOrder) {
            try {
              setOrder(JSON.parse(savedOrder));
            } catch {
              setOrder([]);
            }
          }
        }
      } catch (error) {
        console.error("Error cargando orden del sidebar:", error);
      } finally {
        setOrderLoaded(true);
      }
    };

    loadOrderFromSupabase();
  }, [userId]);

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

  const handleSelectFilter = (filter: string) => {
    onSelectFilter(filter);
    if (window.innerWidth < 768) {
      onMobileClose();
    }
  };

  const rootCollections = collections.filter((c) => !c.parent_id);
  const getChildCollections = (parentId: string) =>
    collections.filter((c) => c.parent_id === parentId);

  const getEffectiveOrder = (): string[] => {
    const navIds = NAV_ITEMS.map((n) => n.id);
    const colIds = rootCollections.map((c) => `col:${c.id}`);
    const allValidIds = [...navIds, ...colIds];
    const valid = order.filter((id) => allValidIds.includes(id));
    const missing = allValidIds.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  };

  const saveOrder = async (ids: string[]) => {
    setOrder(ids);
    localStorage.setItem("sidebarOrder", JSON.stringify(ids)); // Caché local

    // Guardar en Supabase
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            sidebar_order: ids,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error guardando orden en Supabase:", error);
      }
    } catch (error) {
      console.error("Error guardando orden:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setTimeout(() => setSidebarDragId(id), 0);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const dragged = e.dataTransfer.getData("text/plain") || sidebarDragId;
    if (dragged && dragged !== targetId) {
      const ids = getEffectiveOrder();
      const from = ids.indexOf(dragged);
      const to = ids.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        ids.splice(from, 1);
        ids.splice(to, 0, dragged);
        await saveOrder(ids);
      }
    }
    setSidebarDragId(null);
    setSidebarDragOverId(null);
  };

  const draggableWrap = (id: string, content: ReactNode) => (
    <div
      key={id}
      draggable
      onDragStart={(e) => handleDragStart(e, id)}
      onDragOver={(e) => {
        e.preventDefault();
        if (id !== sidebarDragId) setSidebarDragOverId(id);
      }}
      onDrop={(e) => handleDrop(e, id)}
      onDragEnd={() => {
        setSidebarDragId(null);
        setSidebarDragOverId(null);
      }}
      className={`rounded-xl transition ${
        sidebarDragId === id ? "opacity-50" : ""
      } ${sidebarDragOverId === id ? "ring-2 ring-blue-500" : ""}`}
      title="Arrastra para reordenar"
    >
      {content}
    </div>
  );

  const renderNavItem = (nav: NavItem) => (
    <button
      onClick={() => handleSelectFilter(nav.id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        activeFilter === nav.id
          ? isDarkMode
            ? nav.activeDark
            : nav.activeLight
          : isDarkMode
          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="shrink-0 inline-flex items-center">{nav.icon}</span>
      <span className="flex-1 truncate">{nav.label}</span>
      {nav.id === "pending_read" && pendingReadCount > 0 && (
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
      {nav.id === "trash" && trashCount > 0 && (
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
    </button>
  );

  const renderCollection = (collection: Collection, depth: number = 0) => {
    const children = getChildCollections(collection.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCollections.has(collection.id);
    const bookmarkCount = collectionCounts[collection.id] || 0;
    const hasColor = collection.color && collection.color !== "default";

    return (
      <div key={collection.id} style={{ paddingLeft: `${depth * 12}px` }}>
        <div className="group relative flex items-center">
          <button
            onClick={() => handleSelectFilter(collection.id)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
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
                className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-500 hover:text-blue-500"
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
              <span className="w-4 shrink-0"></span>
            )}

            {hasColor ? (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: `var(--blk-${normalizeColor(collection.color)}-icon)`,
                }}
              ></span>
            ) : (
              <span className="w-1 shrink-0"></span>
            )}

            <span className="truncate flex-1 flex items-center gap-1.5">
              {collection.icon && (
                <span className="inline-flex shrink-0 items-center">
                  <IconDisplay icon={collection.icon} size={16} />
                </span>
              )}
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
                onEditCollection(collection.id);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                isDarkMode
                  ? "text-slate-500 hover:bg-blue-500/20 hover:text-blue-400"
                  : "text-slate-500 hover:bg-blue-100 hover:text-blue-600"
              }`}
              title={`Editar colección "${collection.name}"`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

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

  if (!orderLoaded) {
    return null; // Esperar a que cargue el orden
  }

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        ></div>
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 ${desktopExpanded ? "md:w-64" : "md:w-16"} md:hover:w-64
          flex h-full flex-col overflow-hidden border-r border-[color:var(--border-color)] bg-[var(--bg-secondary)]
        `}
      >
        <div
          className={`flex items-center justify-between border-b border-[color:var(--border-color)] px-3 py-4`}
        >
          <button
            onClick={() => handleSelectFilter("home")}
            className="flex items-center gap-3"
            title="Ir al inicio (Home)"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg">
              🔖
            </div>
            <div className="min-w-0 text-left">
              <h1
                className={`text-sm font-bold whitespace-nowrap ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Bookmark DPB
              </h1>
              <p
                className={`text-xs whitespace-nowrap ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Best Bookmark
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onNewCollection}
              className={`hidden md:flex h-8 w-8 items-center justify-center rounded-lg transition ${
                isDarkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Nueva colección"
            >
              <Plus size={16} />
            </button>

            <button
              onClick={onMobileClose}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition md:hidden ${
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
        </div>

        {/* Botón »/« SIEMPRE visible en modo escritorio/iPad horizontal */}
        <div className="hidden md:flex justify-center border-b border-[color:var(--border-color)] py-1.5">
          <button
            onClick={() => setDesktopExpanded(!desktopExpanded)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
              isDarkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            }`}
            title={desktopExpanded ? "Contraer panel" : "Expandir panel"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${desktopExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-2 md:hover:p-4 transition-all whitespace-nowrap ${desktopExpanded ? "md:p-4" : ""}`}>
          <button
            onClick={() => handleSelectFilter("home")}
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeFilter === "home"
                ? isDarkMode
                  ? "bg-blue-600/20 text-blue-400"
                  : "bg-blue-100 text-blue-700"
                : isDarkMode
                ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Home (H)"
          >
            <span className="shrink-0 inline-flex items-center">
              <HomeIcon size={17} />
            </span>
            <span className="flex-1 truncate">Home</span>
          </button>

          <div className="space-y-1">
            {getEffectiveOrder().map((id) => {
              if (id.startsWith("col:")) {
                const col = collections.find((c) => c.id === id.slice(4));
                if (!col) return null;
                return draggableWrap(id, renderCollection(col, 0));
              }
              const nav = NAV_ITEMS.find((n) => n.id === id);
              if (!nav) return null;
              return draggableWrap(id, renderNavItem(nav));
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}