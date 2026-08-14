"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { actionLabels, actionIcons, type ActivityAction } from "@/utils/activityLog";

type Activity = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  created_at: string;
};

type ActivityPanelProps = {
  userId: string;
};

export function ActivityPanel({ userId }: ActivityPanelProps) {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    fetchActivities();
  }, [filterAction]);

  const fetchActivities = async () => {
    setLoading(true);

    let query = supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterAction !== "all") {
      query = query.eq("action", filterAction);
    }

    const { data, error } = await query;

    if (!error) {
      setActivities(data || []);
    }

    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (
      !confirm(
        "¿Limpiar todo el historial de actividad?\n\nEsta acción no se puede deshacer."
      )
    )
      return;

    const { error } = await supabase
      .from("activity_log")
      .delete()
      .eq("user_id", userId);

    if (!error) {
      setActivities([]);
    }
  };

  // Agrupar actividades por día
  const groupedActivities = activities.reduce<Record<string, Activity[]>>(
    (groups, activity) => {
      const date = new Date(activity.created_at).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);

      return groups;
    },
    {}
  );

  const filterOptions = [
    { value: "all", label: "Todas", icon: "📋" },
    { value: "bookmark_added", label: "Agregados", icon: "➕" },
    { value: "bookmark_edited", label: "Editados", icon: "✏️" },
    { value: "bookmark_deleted", label: "Eliminados", icon: "🗑️" },
    { value: "bookmark_pinned", label: "Fijados", icon: "📌" },
    { value: "bookmark_favorited", label: "Favoritos", icon: "⭐" },
    { value: "collection_created", label: "Colecciones", icon: "📁" },
    { value: "tag_created", label: "Etiquetas", icon: "🏷️" },
  ];

  const getActionLabel = (action: string): string => {
    return actionLabels[action as ActivityAction] || "Acción";
  };

  const getActionIcon = (action: string): string => {
    return actionIcons[action as ActivityAction] || "📝";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            🕐 Historial de cambios
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {activities.length} actividad{activities.length !== 1 ? "es" : ""} registrada
            {activities.length !== 1 ? "s" : ""}
          </p>
        </div>

        {activities.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            🗑️ Limpiar historial
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterAction(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filterAction === option.value
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {option.icon} {option.label}
          </button>
        ))}
      </div>

      {/* Lista de actividades */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400">Cargando historial...</p>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 py-16 text-center">
          <p className="mb-3 text-5xl">🕐</p>
          <p className="mb-1 font-medium text-white">
            {filterAction !== "all"
              ? "No hay actividades de este tipo"
              : "Aún no hay actividades registradas"}
          </p>
          <p className="text-sm text-slate-400">
            {filterAction !== "all"
              ? "Prueba con otro filtro"
              : "Tus acciones se registrarán aquí automáticamente"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date}>
              {/* Encabezado del día */}
              <h3 className="mb-3 text-sm font-semibold text-slate-400 capitalize flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-800"></span>
                <span>{date}</span>
                <span className="h-px flex-1 bg-slate-800"></span>
              </h3>

              {/* Actividades del día */}
              <div className="space-y-2">
                {dayActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700"
                  >
                    {/* Ícono */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
                      {getActionIcon(activity.action)}
                    </div>

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {getActionLabel(activity.action)}
                      </p>
                      {activity.entity_name && (
                        <p className="text-sm text-slate-400 truncate mt-0.5">
                          {activity.entity_name}
                        </p>
                      )}
                      {activity.details && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activity.details}
                        </p>
                      )}
                    </div>

                    {/* Hora */}
                    <span className="shrink-0 text-xs text-slate-500">
                      {new Date(activity.created_at).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}