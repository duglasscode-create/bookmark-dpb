"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconDisplay, IconPicker } from "./IconPicker";
import { Bot, Pencil, Trash2, ExternalLink } from "lucide-react";

type AiAssistant = {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  position: number;
};

type AiPanelProps = {
  userId: string;
  isDarkMode: boolean;
};

const DEFAULT_AIS = [
  { name: "Qwen", url: "https://chat.qwen.ai" },
  { name: "ChatGPT", url: "https://chatgpt.com" },
  { name: "Grok", url: "https://grok.com" },
  { name: "Gemini", url: "https://gemini.google.com" },
  { name: "Claude", url: "https://claude.ai" },
  { name: "Perplexity", url: "https://www.perplexity.ai" },
];

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

export function AiPanel({ userId, isDarkMode }: AiPanelProps) {
  const supabase = createClient();
  const [ais, setAis] = useState<AiAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AiAssistant | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    fetchAis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchAis = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_assistants")
      .select("id, name, url, icon, position")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (!error && data) {
      if (data.length === 0) {
        await supabase.from("ai_assistants").insert(
          DEFAULT_AIS.map((ai, index) => ({
            user_id: userId,
            name: ai.name,
            url: ai.url,
            icon: null,
            position: index,
          }))
        );
        const { data: seeded } = await supabase
          .from("ai_assistants")
          .select("id, name, url, icon, position")
          .eq("user_id", userId)
          .order("position", { ascending: true });
        setAis(seeded || []);
      } else {
        setAis(data);
      }
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setName("");
    setUrl("");
    setIcon(null);
    setIsModalOpen(true);
  };

  const openEdit = (ai: AiAssistant) => {
    setEditing(ai);
    setName(ai.name);
    setUrl(ai.url);
    setIcon(ai.icon);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSaving(true);

    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    if (editing) {
      await supabase
        .from("ai_assistants")
        .update({ name: name.trim(), url: finalUrl, icon: icon || null })
        .eq("id", editing.id)
        .eq("user_id", userId);
    } else {
      await supabase.from("ai_assistants").insert({
        user_id: userId,
        name: name.trim(),
        url: finalUrl,
        icon: icon || null,
        position: ais.length,
      });
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchAis();
  };

  const handleDelete = async (ai: AiAssistant) => {
    const confirmed = confirm(`¿Eliminar el asistente "${ai.name}"?`);
    if (!confirmed) return;
    await supabase
      .from("ai_assistants")
      .delete()
      .eq("id", ai.id)
      .eq("user_id", userId);
    fetchAis();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setTimeout(() => setDraggedId(id), 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const dragged = e.dataTransfer.getData("text/plain") || draggedId;
    if (dragged && dragged !== targetId) {
      const ids = ais.map((ai) => ai.id);
      const from = ids.indexOf(dragged);
      const to = ids.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        ids.splice(from, 1);
        ids.splice(to, 0, dragged);

        // Actualizar estado local inmediatamente
        setAis((prev) => {
          const byId = new Map(prev.map((ai) => [ai.id, ai]));
          return ids.map((id, index) => ({ ...byId.get(id)!, position: index }));
        });

        // Guardar en Supabase
        await Promise.all(
          ids.map((id, index) =>
            supabase.from("ai_assistants").update({ position: index }).eq("id", id)
          )
        );
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
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
      <div className="mb-6 flex items-center justify-between">
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {ais.length} asistente{ais.length !== 1 ? "s" : ""} · Arrastra para reordenar · Haz clic para abrir
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Bot size={16} /> Agregar IA
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        onDragOver={(e) => e.preventDefault()}
      >
        {ais.map((ai) => (
          <div
            key={ai.id}
            draggable
            onDragStart={(e) => handleDragStart(e, ai.id)}
            onDragOver={(e) => handleDragOver(e, ai.id)}
            onDrop={(e) => handleDrop(e, ai.id)}
            onDragEnd={handleDragEnd}
            className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:shadow-xl cursor-grab active:cursor-grabbing ${
              dragOverId === ai.id ? "ring-2 ring-blue-500" : ""
            } ${draggedId === ai.id ? "opacity-50" : ""}`}
          >
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(ai);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
                title="Editar"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(ai);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                title="Eliminar"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <a
              href={ai.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3"
              title={`Abrir ${ai.name}`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--card-border)] ${
                  isDarkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                {ai.icon ? (
                  <IconDisplay icon={ai.icon} size={28} />
                ) : (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getDomain(ai.url)}&sz=64`}
                    alt=""
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                {ai.name}
              </span>
              <span
                className={`flex items-center gap-1 text-[10px] ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <ExternalLink size={10} /> {getDomain(ai.url)}
              </span>
            </a>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "✏️ Editar asistente" : "🤖 Nuevo asistente IA"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: ChatGPT"
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  URL del chat *
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://chatgpt.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  💡 El icono original se toma automáticamente del sitio. Si
                  prefieres otro, elígelo abajo.
                </p>
              </div>

              <IconPicker value={icon} onChange={setIcon} isDarkMode={true} />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !url.trim()}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "💾 Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}