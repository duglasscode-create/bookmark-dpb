"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Reminder = {
  id: string;
  bookmark_id: string;
  remind_at: string;
  note: string | null;
  is_notified: boolean;
  bookmark_title: string | null;
  bookmark_url: string | null;
};

type RemindersPanelProps = {
  userId: string;
};

export function RemindersPanel({ userId }: RemindersPanelProps) {
  const supabase = createClient();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Actualizar el tiempo cada minuto para cálculos en tiempo real
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);

    // Obtener reminders con datos del marcador
    const { data: remindersData } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .order("remind_at", { ascending: true });

    if (remindersData) {
      // Obtener títulos y URLs de los marcadores
      const bookmarkIds = remindersData.map((r) => r.bookmark_id);
      let bookmarksMap: Record<string, { title: string | null; url: string | null }> = {};

      if (bookmarkIds.length > 0) {
        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("id, title, url")
          .in("id", bookmarkIds);

        bookmarks?.forEach((b) => {
          bookmarksMap[b.id] = { title: b.title, url: b.url };
        });
      }

      const enrichedReminders = remindersData.map((r) => ({
        ...r,
        bookmark_title: bookmarksMap[r.bookmark_id]?.title || null,
        bookmark_url: bookmarksMap[r.bookmark_id]?.url || null,
      }));

      setReminders(enrichedReminders);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este recordatorio?")) return;

    const { error } = await supabase.from("reminders").delete().eq("id", id);

    if (!error) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const getTimeInfo = (remindAt: string) => {
    const remindDate = new Date(remindAt);
    const diffMs = remindDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { label: "Vencido", isOverdue: true, isUpcoming: false };
    } else if (diffMinutes < 60) {
      return { label: `En ${diffMinutes} min`, isOverdue: false, isUpcoming: true };
    } else if (diffHours < 24) {
      return { label: `En ${diffHours} hora${diffHours !== 1 ? "s" : ""}`, isOverdue: false, isUpcoming: true };
    } else {
      return { label: `En ${diffDays} día${diffDays !== 1 ? "s" : ""}`, isOverdue: false, isUpcoming: true };
    }
  };

  const upcomingReminders = reminders.filter((r) => !r.is_notified && new Date(r.remind_at) > now);
  const overdueReminders = reminders.filter((r) => !r.is_notified && new Date(r.remind_at) <= now);
  const notifiedReminders = reminders.filter((r) => r.is_notified);

  const renderReminderCard = (reminder: Reminder) => {
    const timeInfo = getTimeInfo(reminder.remind_at);
    const remindDate = new Date(reminder.remind_at);

    return (
      <div
        key={reminder.id}
        className={`group rounded-2xl border bg-slate-900 p-5 transition hover:border-slate-600 ${
          timeInfo.isOverdue
            ? "border-red-500/50"
            : timeInfo.isUpcoming
            ? "border-amber-500/30"
            : "border-slate-700"
        }`}
      >
        {/* Badge de estado */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              timeInfo.isOverdue
                ? "bg-red-500/20 text-red-400"
                : timeInfo.isUpcoming
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {timeInfo.isOverdue ? "⏰ Vencido" : timeInfo.isUpcoming ? "⏳ " + timeInfo.label : "✅ Notificado"}
          </span>

          <button
            onClick={() => handleDelete(reminder.id)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100"
            title="Eliminar recordatorio"
          >
            🗑️
          </button>
        </div>

        {/* Info del marcador */}
        <div className="mb-3">
          <a
            href={reminder.bookmark_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white hover:text-blue-400 transition"
          >
            {reminder.bookmark_title || "Marcador"}
          </a>
          {reminder.bookmark_url && (
            <p className="text-xs text-slate-500 truncate mt-1">
              {reminder.bookmark_url}
            </p>
          )}
        </div>

        {/* Nota del recordatorio */}
        {reminder.note && (
          <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
            <p className="text-sm text-slate-300">📝 {reminder.note}</p>
          </div>
        )}

        {/* Fecha */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>📅</span>
          <span>
            {remindDate.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span>•</span>
          <span>
            {remindDate.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          ⏰ Recordatorios
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {reminders.length} recordatorio{reminders.length !== 1 ? "s" : ""} en total
        </p>
      </div>

      {/* Info sobre notificaciones */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
        <p className="text-sm text-blue-400 flex items-center gap-2">
          <span>💡</span>
          Las notificaciones aparecerán en tu navegador cuando llegue la hora del recordatorio.
          Mantén esta pestaña abierta para recibirlas.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400">Cargando recordatorios...</p>
          </div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 py-16 text-center">
          <p className="mb-3 text-5xl">⏰</p>
          <p className="mb-1 font-medium text-white">No tienes recordatorios</p>
          <p className="text-sm text-slate-400">
            Agrega recordatorios desde el editor de cualquier marcador
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Vencidos */}
          {overdueReminders.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-400 flex items-center gap-2">
                ⏰ Vencidos ({overdueReminders.length})
              </h3>
              <div className="space-y-3">
                {overdueReminders.map(renderReminderCard)}
              </div>
            </div>
          )}

          {/* Próximos */}
          {upcomingReminders.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                ⏳ Próximos ({upcomingReminders.length})
              </h3>
              <div className="space-y-3">
                {upcomingReminders.map(renderReminderCard)}
              </div>
            </div>
          )}

          {/* Notificados */}
          {notifiedReminders.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                ✅ Notificados ({notifiedReminders.length})
              </h3>
              <div className="space-y-3">
                {notifiedReminders.map(renderReminderCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}