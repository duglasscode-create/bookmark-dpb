"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconDisplay, IconPicker } from "./IconPicker";
import { KeyRound, Pencil, Trash2, ExternalLink, StickyNote, Copy } from "lucide-react";

type Account = {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  note: string | null;
  position: number;
};

type AccountsPanelProps = {
  userId: string;
  isDarkMode: boolean;
};

const DEFAULT_ACCOUNTS = [
  { name: "Google", url: "https://accounts.google.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Supabase", url: "https://supabase.com" },
  { name: "Vercel", url: "https://vercel.com" },
];

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

export function AccountsPanel({ userId, isDarkMode }: AccountsPanelProps) {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [viewing, setViewing] = useState<Account | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, url, icon, note, position")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (!error && data) {
      if (data.length === 0) {
        await supabase.from("accounts").insert(
          DEFAULT_ACCOUNTS.map((acc, index) => ({
            user_id: userId,
            name: acc.name,
            url: acc.url,
            icon: null,
            note: null,
            position: index,
          }))
        );
        const { data: seeded } = await supabase
          .from("accounts")
          .select("id, name, url, icon, note, position")
          .eq("user_id", userId)
          .order("position", { ascending: true });
        setAccounts(seeded || []);
      } else {
        setAccounts(data);
      }
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setName("");
    setUrl("");
    setIcon(null);
    setNote("");
    setIsModalOpen(true);
  };

  const openEdit = (acc: Account) => {
    setEditing(acc);
    setName(acc.name);
    setUrl(acc.url);
    setIcon(acc.icon);
    setNote(acc.note || "");
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
        .from("accounts")
        .update({ name: name.trim(), url: finalUrl, icon: icon || null, note: note.trim() || null })
        .eq("id", editing.id)
        .eq("user_id", userId);
    } else {
      await supabase.from("accounts").insert({
        user_id: userId,
        name: name.trim(),
        url: finalUrl,
        icon: icon || null,
        note: note.trim() || null,
        position: accounts.length,
      });
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchAccounts();
  };

  const handleDelete = async (acc: Account) => {
    const confirmed = confirm(`¿Eliminar la cuenta "${acc.name}"?`);
    if (!confirmed) return;
    await supabase.from("accounts").delete().eq("id", acc.id).eq("user_id", userId);
    fetchAccounts();
  };

  const copyNote = async () => {
    if (!viewing?.note) return;
    try {
      await navigator.clipboard.writeText(viewing.note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("No se pudo copiar");
    }
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
      const ids = accounts.map((a) => a.id);
      const from = ids.indexOf(dragged);
      const to = ids.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        ids.splice(from, 1);
        ids.splice(to, 0, dragged);

        setAccounts((prev) => {
          const byId = new Map(prev.map((a) => [a.id, a]));
          return ids.map((id, index) => ({ ...byId.get(id)!, position: index }));
        });

        await Promise.all(
          ids.map((id, index) =>
            supabase.from("accounts").update({ position: index }).eq("id", id)
          )
        );
      }
    }
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
          {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} · Arrastra para reordenar · 📝 para ver la nota
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <KeyRound size={16} /> Agregar cuenta
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        onDragOver={(e) => e.preventDefault()}
      >
        {accounts.map((acc) => (
          <div
            key={acc.id}
            draggable
            onDragStart={(e) => handleDragStart(e, acc.id)}
            onDragOver={(e) => handleDragOver(e, acc.id)}
            onDrop={(e) => handleDrop(e, acc.id)}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
            className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:shadow-xl cursor-grab active:cursor-grabbing ${
              dragOverId === acc.id ? "ring-2 ring-blue-500" : ""
            } ${draggedId === acc.id ? "opacity-50" : ""}`}
          >
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
              {acc.note && (
                <button
                  onClick={() => setViewing(acc)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    isDarkMode
                      ? "text-amber-400 hover:bg-amber-500/10"
                      : "text-amber-600 hover:bg-amber-100"
                  }`}
                  title="Ver nota"
                >
                  <StickyNote size={13} />
                </button>
              )}
              <button
                onClick={() => openEdit(acc)}
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
                onClick={() => handleDelete(acc)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                title="Eliminar"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <a
              href={acc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3"
              title={`Abrir ${acc.name}`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--card-border)] ${
                  isDarkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                {acc.icon ? (
                  <IconDisplay icon={acc.icon} size={28} />
                ) : (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getDomain(acc.url)}&sz=64`}
                    alt=""
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  isDarkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                {acc.name}
                {acc.note && <span className="text-[10px]">📝</span>}
              </span>
              <span
                className={`flex items-center gap-1 text-[10px] ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <ExternalLink size={10} /> {getDomain(acc.url)}
              </span>
            </a>
          </div>
        ))}
      </div>

      {/* Modal ver nota */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewing(null)}></div>
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                🔐 {viewing.name}
              </h3>
              <button
                onClick={() => setViewing(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-200">
              {viewing.note || "(sin nota)"}
            </pre>

            <div className="mt-4 flex gap-3">
              <button
                onClick={copyNote}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <Copy size={14} /> {copied ? "✅ Copiado" : "Copiar todo"}
              </button>
              <button
                onClick={() => {
                  setViewing(null);
                  openEdit(viewing);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                <Pencil size={14} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar/editar cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "✏️ Editar cuenta" : "🔐 Nueva cuenta"}
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
                <label className="mb-2 block text-sm font-medium text-slate-300">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: GitHub"
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">URL *</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  📝 Nota (credenciales, usuario, categoría...)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={"Usuario: duglasscode\nEmail: duglasscode@gmail.com\nPassword: ••••••••\nCategoría: Desarrollo"}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  💡 Pulsa 📝 en la tarjeta para verla y copiarla rápido.
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