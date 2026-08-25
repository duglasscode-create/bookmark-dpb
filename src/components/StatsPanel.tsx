"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconDisplay } from "./IconPicker";

type StatsPanelProps = {
  userId: string;
};

type BookmarkData = {
  id: string;
  domain: string | null;
  source: string | null;
  created_at: string;
  is_favorite: boolean;
  collection_id: string | null;
};

type Collection = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type Stats = {
  totalBookmarks: number;
  totalFavorites: number;
  totalCollections: number;
  totalTags: number;
  totalTrash: number;
  topDomains: { domain: string; count: number }[];
  sourceCounts: { manual: number; import: number; extension: number };
  monthlyData: { label: string; count: number }[];
  collectionDistribution: { name: string; count: number; color: string; icon: string | null }[];
  currentStreak: number;
};

const chartColors = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#f59e0b",
  "#10b981", "#14b8a6", "#06b6d4", "#6366f1", "#a855f7", "#d946ef",
];

export function StatsPanel({ userId }: StatsPanelProps) {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const { data: collections } = await supabase
      .from("collections")
      .select("id, name, color, icon")
      .eq("user_id", userId)
      .order("position");

    const { count: totalTags } = await supabase
      .from("tags")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: totalTrash } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", true);

    const { data: bookmarksData } = await supabase
      .from("bookmarks")
      .select("id, domain, source, created_at, is_favorite")
      .eq("user_id", userId)
      .eq("is_deleted", false);

    const { data: collectionRelations } = await supabase
      .from("bookmark_collections")
      .select("bookmark_id, collection_id")
      .eq("user_id", userId);

    const bookmarks: BookmarkData[] = (bookmarksData || []).map((b) => {
      const relation = collectionRelations?.find((r) => r.bookmark_id === b.id);
      return { ...b, collection_id: relation?.collection_id || null };
    });

    const totalBookmarks = bookmarks.length;
    const totalFavorites = bookmarks.filter((b) => b.is_favorite).length;
    const totalCollections = collections?.length || 0;

    const domainCount: Record<string, number> = {};
    bookmarks.forEach((b) => {
      if (b.domain) domainCount[b.domain] = (domainCount[b.domain] || 0) + 1;
    });
    const topDomains = Object.entries(domainCount)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sourceCounts = { manual: 0, import: 0, extension: 0 };
    bookmarks.forEach((b) => {
      const source = b.source as keyof typeof sourceCounts;
      if (source && sourceCounts.hasOwnProperty(source)) sourceCounts[source]++;
    });

    const monthlyData = calculateMonthlyData(bookmarks);
    const collectionDistribution = calculateCollectionDistribution(bookmarks, collections || []);
    const currentStreak = calculateStreak(bookmarks);

    setStats({
      totalBookmarks,
      totalFavorites,
      totalCollections,
      totalTags: totalTags || 0,
      totalTrash: totalTrash || 0,
      topDomains,
      sourceCounts,
      monthlyData,
      collectionDistribution,
      currentStreak,
    });

    setLoading(false);
  };

  const calculateMonthlyData = (bookmarks: BookmarkData[]) => {
    const months: { label: string; count: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("es-ES", { month: "short" });
      const year = date.getFullYear();

      const count = bookmarks.filter((b) => {
        const bookmarkDate = new Date(b.created_at);
        return bookmarkDate.getMonth() === date.getMonth() && bookmarkDate.getFullYear() === year;
      }).length;

      months.push({ label: i === 0 ? "Actual" : monthName, count });
    }

    return months;
  };

  const calculateCollectionDistribution = (
    bookmarks: BookmarkData[],
    collections: Collection[]
  ) => {
    const distribution: { name: string; count: number; color: string; icon: string | null }[] = [];

    collections.forEach((collection, index) => {
      const count = bookmarks.filter((b) => b.collection_id === collection.id).length;

      if (count > 0) {
        distribution.push({
          name: collection.name,
          count,
          color: chartColors[index % chartColors.length],
          icon: collection.icon,
        });
      }
    });

    const uncollected = bookmarks.filter((b) => !b.collection_id).length;
    if (uncollected > 0) {
      distribution.push({
        name: "Sin colección",
        count: uncollected,
        color: "#64748b",
        icon: "📂",
      });
    }

    return distribution.sort((a, b) => b.count - a.count);
  };

  const calculateStreak = (bookmarks: BookmarkData[]): number => {
    if (bookmarks.length === 0) return 0;

    const uniqueDays = new Set<string>();
    bookmarks.forEach((b) => {
      uniqueDays.add(new Date(b.created_at).toDateString());
    });

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toDateString();

      if (uniqueDays.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        if (i === 1 && uniqueDays.has(new Date(today.setDate(today.getDate() - 1)).toDateString())) {
          continue;
        }
        break;
      } else {
        continue;
      }
    }

    return streak;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-400">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxMonthlyCount = Math.max(...stats.monthlyData.map((m) => m.count), 1);
  const maxDomainCount = stats.topDomains.length > 0 ? stats.topDomains[0].count : 1;

  let cumulativePercent = 0;
  const gradientSegments = stats.collectionDistribution.map((item) => {
    const percent = (item.count / stats.totalBookmarks) * 100;
    const segment = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return segment;
  });
  const conicGradient =
    stats.collectionDistribution.length > 0
      ? `conic-gradient(${gradientSegments.join(", ")})`
      : "conic-gradient(#64748b 0% 100%)";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          📊 Estadísticas de tu biblioteca
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Un resumen visual de todos tus marcadores y cómo los organizas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard icon="🔖" label="Marcadores" value={stats.totalBookmarks} color="blue" />
        <MetricCard icon="⭐" label="Favoritos" value={stats.totalFavorites} color="amber" />
        <MetricCard icon="📁" label="Colecciones" value={stats.totalCollections} color="emerald" />
        <MetricCard icon="🏷️" label="Etiquetas" value={stats.totalTags} color="purple" />
        <MetricCard icon="🗑️" label="En papelera" value={stats.totalTrash} color="red" />
        <MetricCard icon="🔥" label="Racha (días)" value={stats.currentStreak} color="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución por colección con iconos REALES */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-6 text-base font-semibold text-white flex items-center gap-2">
            🥧 Distribución por colección
          </h3>

          {stats.collectionDistribution.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay datos</p>
          ) : (
            <div className="flex items-center gap-6">
              <div
                className="h-40 w-40 shrink-0 rounded-full"
                style={{ background: conicGradient }}
              >
                <div className="flex h-full w-full items-center justify-center">
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-slate-900">
                    <span className="text-2xl font-bold text-white">{stats.totalBookmarks}</span>
                    <span className="text-xs text-slate-400">total</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {stats.collectionDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-sm text-slate-300 truncate flex-1 flex items-center gap-1.5">
                      <IconDisplay icon={item.icon} size={14} />
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-white">{item.count}</span>
                    <span className="text-xs text-slate-500">
                      ({Math.round((item.count / stats.totalBookmarks) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top dominios */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-6 text-base font-semibold text-white flex items-center gap-2">
            🌐 Top 10 dominios más guardados
          </h3>

          {stats.topDomains.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay datos</p>
          ) : (
            <div className="space-y-3">
              {stats.topDomains.map((item, index) => (
                <div key={item.domain} className="flex items-center gap-3">
                  <span className="w-6 text-sm text-slate-500">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 truncate">{item.domain}</span>
                      <span className="text-sm font-medium text-slate-400">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(item.count / maxDomainCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Origen de los marcadores */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-6 text-base font-semibold text-white flex items-center gap-2">
          📥 Origen de los marcadores
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <SourceCard icon="✍️" label="Guardados manualmente" count={stats.sourceCounts.manual} total={stats.totalBookmarks} color="bg-blue-500" />
          <SourceCard icon="📦" label="Importados del navegador" count={stats.sourceCounts.import} total={stats.totalBookmarks} color="bg-emerald-500" />
          <SourceCard icon="🧩" label="Desde la extensión" count={stats.sourceCounts.extension} total={stats.totalBookmarks} color="bg-purple-500" />
        </div>
      </div>

      {/* Marcadores por mes (AL FINAL) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-6 text-base font-semibold text-white flex items-center gap-2">
          📈 Marcadores guardados por mes
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.monthlyData.map((month, index) => {
            const height = (month.count / maxMonthlyCount) * 100;
            return (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  {month.count > 0 ? month.count : ""}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    index === stats.monthlyData.length - 1 ? "bg-blue-500" : "bg-blue-500/40"
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${month.label}: ${month.count} marcadores`}
                ></div>
                <span className="text-xs text-slate-500 truncate w-full text-center">{month.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    red: "from-red-500/10 to-red-500/5 border-red-500/20",
    orange: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function SourceCard({ icon, label, count, total, color }: { icon: string; label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-slate-300 flex-1">{label}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-white">{count}</span>
        <span className="text-xs text-slate-500">({percentage}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}