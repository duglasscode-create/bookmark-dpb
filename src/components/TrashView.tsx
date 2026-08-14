"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type TrashBookmark = {
  id: string;
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  deleted_at: string;
};

type TrashViewProps = {
  userId: string;
  onTrashChange?: () => void;
};

const AUTO_DELETE_DAYS = 30;

export function TrashView({ userId, onTrashChange }: TrashViewProps) {
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<TrashBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, url, domain, title, description, deleted_at")
      .eq("user_id", userId)
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    if (!error) {
      setBookmarks(data || []);
    }
    setLoading(false);
  };

  // Calcular días restantes antes de auto-eliminación
  const getDaysRemaining = (deletedAt: string): number => {
    if (!deletedAt) return AUTO_DELETE_DAYS;
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted);
    expiry.setDate(expiry.getDate() + AUTO_DELETE_DAYS);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Obtener texto de tiempo desde eliminación
  const getTimeSinceDeleted = (deletedAt: string): string => {
    if (!deletedAt) return "";
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = now.getTime() - deleted.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "hace un momento";
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
    return `hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`;
  };

  const handleRestore = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from("bookmarks")
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id);

    if (!error) {
      fetchTrash();
      if (onTrashChange) onTrashChange();
    } else {
      alert("Error al restaurar: " + error.message);
    }
    setProcessingId(null);
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("¿Eliminar este marcador PERMANENTEMENTE? Esta acción no se puede deshacer.")) {
      return;
    }
    setProcessingId(id);

    await supabase.from("bookmark_collections").delete().eq("bookmark_id", id);
    await supabase.from("bookmark_tags").delete().eq("bookmark_id", id);
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (!error) {
      fetchTrash();
      if (onTrashChange) onTrashChange();
    } else {
      alert("Error al eliminar: " + error.message);
    }
    setProcessingId(null);
  };

  const handleEmptyTrash = async () => {
    if (!confirmEmpty) {
      setConfirmEmpty(true);
      setTimeout(() => setConfirmEmpty(false), 3000);
      return;
    }

    setLoading(true);
    const ids = bookmarks.map((b) => b.id);

    if (ids.length > 0) {
      await supabase.from("bookmark_collections").delete().in("bookmark_id", ids);
      await supabase.from("bookmark_tags").delete().in("bookmark_id", ids);
      await supabase.from("bookmarks").delete().in("id", ids);
    }

    setConfirmEmpty(false);
    fetchTrash();
    if (onTrashChange) onTrashChange();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            🗑️ Papelera de reciclaje
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {bookmarks.length} marcador{bookmarks.length !== 1 ? "es" : ""} eliminado
            {bookmarks.length !== 1 ? "s" : ""}
          </p>
        </div>

        {bookmarks.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              confirmEmpty
                ? "bg-red-600 text-white"
                : "border border-red-500/30 text-red-400 hover:bg-red-500/10"
            }`}
          >
            {confirmEmpty ? "⚠️ ¿Confirmar vaciado?" : "🗑️ Vaciar papelera"}
          </button>
        )}
      </div>

      {/* Info de auto-eliminación */}
      {bookmarks.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-400 flex items-center gap-2">
            <span>⏰</span>
            Los marcadores se eliminan automáticamente después de{" "}
            <strong>{AUTO_DELETE_DAYS} días</strong>. Restaura los que quieras conservar.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400">Cargando papelera...</p>
          </div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 py-16 text-center">
          <p className="mb-3 text-5xl">🗑️</p>
          <p className="mb-1 font-medium text-white">La papelera está vacía</p>
          <p className="text-sm text-slate-400">
            Cuando elimines marcadores, aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => {
            const daysRemaining = getDaysRemaining(bookmark.deleted_at);
            const isExpiringSoon = daysRemaining <= 7;
            const isExpiringCritical = daysRemaining <= 3;

            return (
              <div
                key={bookmark.id}
                className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition hover:border-slate-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
                  🗑️
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-300">
                    {bookmark.title || bookmark.url}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="truncate text-sm text-slate-500">
                      {bookmark.domain || bookmark.url}
                    </p>
                    <span className="text-xs text-slate-600">•</span>
                    <p className="text-xs text-slate-500">
                      {getTimeSinceDeleted(bookmark.deleted_at)}
                    </p>
                    <span className="text-xs text-slate-600">•</span>
                    <p
                      className={`text-xs font-medium ${
                        isExpiringCritical
                          ? "text-red-400"
                          : isExpiringSoon
                          ? "text-amber-400"
                          : "text-slate-500"
                      }`}
                    >
                      ⏰ {daysRemaining} día{daysRemaining !== 1 ? "s" : ""} restante
                      {daysRemaining !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleRestore(bookmark.id)}
                    disabled={processingId === bookmark.id}
                    className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {processingId === bookmark.id ? "..." : "↩️ Restaurar"}
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(bookmark.id)}
                    disabled={processingId === bookmark.id}
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    ✕ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}