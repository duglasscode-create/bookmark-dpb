"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Highlight = {
  id: string;
  url: string;
  selected_text: string;
  note: string | null;
  color: string;
  created_at: string;
  bookmark_id: string | null;
};

type HighlightsPanelProps = {
  userId: string;
};

const colorOptions = [
  { id: "yellow", label: "Amarillo", bg: "bg-yellow-300", text: "text-yellow-900", border: "border-yellow-400" },
  { id: "green", label: "Verde", bg: "bg-green-300", text: "text-green-900", border: "border-green-400" },
  { id: "blue", label: "Azul", bg: "bg-blue-300", text: "text-blue-900", border: "border-blue-400" },
  { id: "pink", label: "Rosa", bg: "bg-pink-300", text: "text-pink-900", border: "border-pink-400" },
  { id: "orange", label: "Naranja", bg: "bg-orange-300", text: "text-orange-900", border: "border-orange-400" },
];

export function HighlightsPanel({ userId }: HighlightsPanelProps) {
  const supabase = createClient();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterColor, setFilterColor] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    setLoading(true);

    let query = supabase
      .from("highlights")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (filterColor !== "all") {
      query = query.eq("color", filterColor);
    }

    const { data, error } = await query;

    if (!error) {
      setHighlights(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHighlights();
  }, [filterColor]);

  const filteredHighlights = highlights.filter((h) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      h.selected_text.toLowerCase().includes(query) ||
      h.url.toLowerCase().includes(query) ||
      (h.note && h.note.toLowerCase().includes(query))
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este highlight?")) return;

    const { error } = await supabase.from("highlights").delete().eq("id", id);

    if (!error) {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleSaveNote = async (id: string) => {
    const { error } = await supabase
      .from("highlights")
      .update({ note: editNote.trim() || null })
      .eq("id", id);

    if (!error) {
      setHighlights((prev) =>
        prev.map((h) => (h.id === id ? { ...h, note: editNote.trim() || null } : h))
      );
      setEditingId(null);
      setEditNote("");
    }
  };

  const handleExport = async () => {
    const text = filteredHighlights
      .map((h) => {
        const colorLabel = colorOptions.find((c) => c.id === h.color)?.label || h.color;
        let entry = `"${h.selected_text}"\n`;
        entry += `URL: ${h.url}\n`;
        entry += `Color: ${colorLabel}\n`;
        if (h.note) entry += `Nota: ${h.note}\n`;
        entry += `Fecha: ${new Date(h.created_at).toLocaleString()}\n`;
        return entry;
      })
      .join("\n---\n\n");

    try {
      await navigator.clipboard.writeText(text);
      alert(`✅ ${filteredHighlights.length} highlights exportados al portapapeles`);
    } catch (error) {
      alert("❌ No se pudo exportar al portapapeles");
    }
  };

  const getColorClasses = (color: string) => {
    return colorOptions.find((c) => c.id === color) || colorOptions[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            🖍️ Highlights & Anotaciones
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {highlights.length} highlight{highlights.length !== 1 ? "s" : ""} guardado
            {highlights.length !== 1 ? "s" : ""}
          </p>
        </div>

        {highlights.length > 0 && (
          <button
            onClick={handleExport}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            📋 Exportar al portapapeles
          </button>
        )}
      </div>

      {/* Filtro por color y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filtro por color */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterColor("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filterColor === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Todos
          </button>
          {colorOptions.map((color) => (
            <button
              key={color.id}
              onClick={() => setFilterColor(color.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filterColor === color.id
                  ? `${color.bg} ${color.text}`
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {color.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar highlights..."
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
        />
      </div>

      {/* Lista de highlights */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400">Cargando highlights...</p>
          </div>
        </div>
      ) : filteredHighlights.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 py-16 text-center">
          <p className="mb-3 text-5xl">🖍️</p>
          <p className="mb-1 font-medium text-white">
            {searchQuery || filterColor !== "all"
              ? "No se encontraron highlights con estos filtros"
              : "Aún no tienes highlights"}
          </p>
          <p className="text-sm text-slate-400">
            {searchQuery || filterColor !== "all"
              ? "Intenta ajustar los filtros"
              : "Selecciona texto en cualquier página y usa la extensión para resaltar"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHighlights.map((highlight) => {
            const colorClasses = getColorClasses(highlight.color);
            const isEditing = editingId === highlight.id;

            return (
              <div
                key={highlight.id}
                className={`group rounded-2xl border bg-slate-900 p-5 transition hover:border-slate-600 ${colorClasses.border}`}
              >
                {/* Texto resaltado */}
                <div
                  className={`mb-3 rounded-lg px-4 py-3 ${colorClasses.bg} ${colorClasses.text}`}
                >
                  <p className="text-sm font-medium leading-relaxed">
                    "{highlight.selected_text}"
                  </p>
                </div>

                {/* Nota */}
                {isEditing ? (
                  <div className="mb-3">
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Escribe una nota..."
                      rows={2}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                      autoFocus
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleSaveNote(highlight.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white transition hover:bg-blue-700"
                      >
                        Guardar nota
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditNote("");
                        }}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  highlight.note && (
                    <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2">
                      <p className="text-sm text-slate-300">
                        📝 {highlight.note}
                      </p>
                    </div>
                  )
                )}

                {/* Metadata y acciones */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <a
                      href={highlight.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-blue-400 truncate block"
                    >
                      {highlight.url}
                    </a>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {new Date(highlight.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(highlight.id);
                        setEditNote(highlight.note || "");
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                      title="Editar nota"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(highlight.id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                      title="Eliminar highlight"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}