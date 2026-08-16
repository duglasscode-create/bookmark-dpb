"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  archived: boolean;
  locked: boolean;
  deleted: boolean;
  links: string;
  image_size: string;
  position: number;
  updated_at: string;
};

type NotesPanelProps = {
  userId: string;
  isDarkMode: boolean;
};

const noteColors = ["yellow", "green", "blue", "pink", "purple", "orange"];

const cardClasses: Record<string, string> = {
  yellow: "bg-yellow-200 border-yellow-400",
  green: "bg-green-200 border-green-400",
  blue: "bg-blue-200 border-blue-400",
  pink: "bg-pink-200 border-pink-400",
  purple: "bg-purple-200 border-purple-400",
  orange: "bg-orange-200 border-orange-400",
};

const dotClasses: Record<string, string> = {
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
};

const imageSizeClasses: Record<string, string> = {
  sm: "h-20",
  md: "h-36",
  lg: "h-56",
};

const zoomWidths = [170, 210, 250, 300, 360];

const IMAGE_HOSTS = [
  "imgur.com",
  "unsplash.com",
  "picsum.photos",
  "cloudinary",
  "giphy.com",
  "tenor.com",
  "googleusercontent.com",
  "fbcdn.net",
  "twimg.com",
  "images.",
  "media.",
];

const parseLinks = (links: string): string[] =>
  links
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const isImageUrl = (url: string): boolean => {
  const clean = url.startsWith("!") ? url.slice(1).trim() : url;
  if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(clean)) return true;
  return IMAGE_HOSTS.some((h) => clean.includes(h));
};

const cleanUrl = (url: string): string =>
  url.startsWith("!") ? url.slice(1).trim() : url;

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const toHtml = (content: string): string => {
  if (!content) return "";
  if (content.includes("<")) return content;
  return content
    .split(/\r?\n/)
    .map((line) => `<div>${line === "" ? "<br>" : line}</div>`)
    .join("");
};

export function NotesPanel({ userId, isDarkMode }: NotesPanelProps) {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("yellow");
  const [links, setLinks] = useState("");
  const [imageSize, setImageSize] = useState("md");
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [alwaysToolbar, setAlwaysToolbar] = useState(false);
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedZoom = localStorage.getItem("noteZoom");
      if (savedZoom) setZoom(parseInt(savedZoom, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("noteZoom", String(zoom));
  }, [zoom]);

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (isModalOpen && editorRef.current) {
      editorRef.current.innerHTML = toHtml(editingNote ? editingNote.content : "");
    }
  }, [isModalOpen, editingNote]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select(
        "id, title, content, color, pinned, archived, locked, deleted, links, image_size, position, updated_at"
      )
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("position", { ascending: true });

    if (!error) setNotes(data || []);
    setLoading(false);
  };

  const trashNotes = notes.filter((n) => n.deleted);
  const visibleNotes = showTrash
    ? trashNotes
    : notes.filter((n) => !n.deleted && n.archived === showArchived);
  const archivedCount = notes.filter((n) => !n.deleted && n.archived).length;

  const openNew = () => {
    setEditingNote(null);
    setTitle("");
    setColor("yellow");
    setLinks("");
    setImageSize("md");
    setIsModalOpen(true);
  };

  const openEdit = (note: Note) => {
    if (note.locked || note.deleted) return;
    setEditingNote(note);
    setTitle(note.title);
    setColor(note.color || "yellow");
    setLinks(note.links || "");
    setImageSize(note.image_size || "md");
    setIsModalOpen(true);
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const insertImage = () => {
    const url = prompt("Pega la URL de la imagen:");
    if (url && url.trim()) exec("insertImage", url.trim());
  };

  const insertTable = () => {
    exec(
      "insertHTML",
      `<table><tbody><tr><td>Celda</td><td>Celda</td></tr><tr><td>Celda</td><td>Celda</td></tr></tbody></table><div><br></div>`
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const html = editorRef.current?.innerHTML || "";
    const plain = (editorRef.current?.innerText || "").trim();
    if (!plain && !title.trim() && !links.trim()) return;

    setSaving(true);

    if (editingNote) {
      await supabase
        .from("notes")
        .update({
          title: title.trim(),
          content: html,
          color,
          links: links.trim(),
          image_size: imageSize,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingNote.id)
        .eq("user_id", userId);
    } else {
      await supabase.from("notes").insert({
        user_id: userId,
        title: title.trim(),
        content: html,
        color,
        links: links.trim(),
        image_size: imageSize,
        position: notes.length,
      });
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchNotes();
  };

  // Papelera: borrado suave o definitivo
  const handleDelete = async (note: Note) => {
    if (showTrash) {
      const confirmed = confirm(
        `¿Eliminar DEFINITIVAMENTE la nota "${note.title || "Sin título"}"?\n\nEsta acción NO se puede deshacer.`
      );
      if (!confirmed) return;
      await supabase
        .from("notes")
        .delete()
        .eq("id", note.id)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("notes")
        .update({ deleted: true, pinned: false })
        .eq("id", note.id)
        .eq("user_id", userId);
    }
    setOpenMenuId(null);
    fetchNotes();
  };

  const handleRestore = async (note: Note) => {
    await supabase
      .from("notes")
      .update({ deleted: false })
      .eq("id", note.id)
      .eq("user_id", userId);
    setOpenMenuId(null);
    fetchNotes();
  };

  const handleTogglePin = async (note: Note) => {
    await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id)
      .eq("user_id", userId);
    fetchNotes();
  };

  const handleToggleLock = async (note: Note) => {
    await supabase
      .from("notes")
      .update({ locked: !note.locked })
      .eq("id", note.id)
      .eq("user_id", userId);
    setOpenMenuId(null);
    fetchNotes();
  };

  const handleToggleArchive = async (note: Note) => {
    await supabase
      .from("notes")
      .update({ archived: !note.archived })
      .eq("id", note.id)
      .eq("user_id", userId);
    setOpenMenuId(null);
    fetchNotes();
  };

  // ---- Arrastrar y reordenar ----
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", noteId);
    setTimeout(() => setDraggedNoteId(noteId), 0);
  };

  const handleDragOver = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (noteId !== draggedNoteId) setDragOverNoteId(noteId);
  };

  const reorderTo = async (draggedId: string | null, targetId: string | null) => {
    if (!draggedId || draggedId === targetId) return;

    const ids = visibleNotes.map((n) => n.id);
    const from = ids.indexOf(draggedId);
    if (from === -1) return;

    ids.splice(from, 1);

    if (targetId === null) {
      ids.push(draggedId);
    } else {
      const to = ids.indexOf(targetId);
      if (to === -1) return;
      ids.splice(to, 0, draggedId);
    }

    setNotes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      const visibleSet = new Set(ids);
      const others = prev.filter((n) => !visibleSet.has(n.id));
      const reordered = ids.map((id, index) => ({
        ...byId.get(id)!,
        position: index,
      }));
      return [...others, ...reordered];
    });

    await Promise.all(
      ids.map((id, index) =>
        supabase.from("notes").update({ position: index }).eq("id", id)
      )
    );
  };

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    const draggedId =
      e.dataTransfer.getData("text/plain") || draggedNoteId;
    await reorderTo(draggedId, targetId);
    setDraggedNoteId(null);
    setDragOverNoteId(null);
  };

  // ---- Render de enlaces e imágenes ----
  const renderLinks = (note: Note) => {
    const urls = parseLinks(note.links);
    if (urls.length === 0) return null;

    const images = urls.filter(isImageUrl);
    const webs = urls.filter((u) => !isImageUrl(u));
    const sizeClass = imageSizeClasses[note.image_size] || imageSizeClasses.md;

    return (
      <div className="mt-2 space-y-2">
        {images.map((raw) => {
          const url = cleanUrl(raw);
          return (
            <a
              key={raw}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="block overflow-hidden rounded-lg border border-black/10 transition hover:opacity-80"
              title="Abrir imagen"
            >
              <img
                src={url}
                alt=""
                draggable={false}
                className={`w-full ${sizeClass} object-cover`}
                onError={(e) => {
                  const anchor = (e.target as HTMLImageElement)
                    .parentElement as HTMLAnchorElement;
                  anchor.innerHTML = `<span class="flex items-center gap-2 p-2 text-xs text-slate-700">🖼️ ${getDomain(
                    url
                  )}</span>`;
                }}
              />
            </a>
          );
        })}
        {webs.map((raw) => {
          const url = cleanUrl(raw);
          return (
            <a
              key={raw}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/60 px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-white"
              title={url}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=32`}
                alt=""
                draggable={false}
                className="h-4 w-4 shrink-0 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="truncate font-medium">{getDomain(url)}</span>
              <span className="ml-auto shrink-0 text-slate-400">↗</span>
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const previewMax = zoom <= 2 ? "max-h-16" : "max-h-40";

  return (
    <div>
      <style>{`
        .note-content img{max-width:100%;height:auto;border-radius:8px;margin:4px 0}
        .note-content table{border-collapse:collapse;width:100%;margin:6px 0}
        .note-content td,.note-content th{border:1px solid rgba(0,0,0,.25);padding:4px 8px;font-size:12px}
        .note-content ul{list-style:disc;padding-left:20px}
        .note-content ol{list-style:decimal;padding-left:20px}
        .note-content:focus{outline:none}
      `}</style>

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {visibleNotes.length} nota{visibleNotes.length !== 1 ? "s" : ""} ·
          {showTrash
            ? " Papelera: restaura o elimina definitivamente"
            : " Arrastra para reordenar · Menú ⋮ para opciones"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!showTrash && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-300 bg-white"
              }`}
              title="Tamaño de las notas"
            >
              <span className="text-xs">🔍</span>
              <input
                type="range"
                min="1"
                max="5"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value, 10))}
                className="h-1.5 w-20 cursor-pointer"
              />
              <span className="text-xs">🔎</span>
            </div>
          )}

          <button
            onClick={() => setAlwaysToolbar(!alwaysToolbar)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              alwaysToolbar
                ? "border-blue-500 bg-blue-500/10 text-blue-500"
                : isDarkMode
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
            title="Mostrar u ocultar la barra de herramientas"
          >
            🛠️ Barra
          </button>
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setShowTrash(false);
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              showArchived
                ? "border-amber-500 bg-amber-500/10 text-amber-500"
                : isDarkMode
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
            title="Ver notas archivadas"
          >
            🗄️ Archivadas ({archivedCount})
          </button>
          <button
            onClick={() => {
              setShowTrash(!showTrash);
              setShowArchived(false);
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              showTrash
                ? "border-red-500 bg-red-500/10 text-red-500"
                : isDarkMode
                ? "border-slate-700 text-slate-400 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
            title="Papelera de notas"
          >
            🗑️ Papelera ({trashNotes.length})
          </button>
          {!showTrash && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <span className="text-lg leading-none">+</span> Nueva nota
            </button>
          )}
        </div>
      </div>

      {/* Estado vacío */}
      {visibleNotes.length === 0 && (
        <div
          className={`rounded-2xl border border-dashed p-12 text-center ${
            isDarkMode ? "border-slate-700" : "border-slate-300"
          }`}
        >
          <p className="text-4xl">
            {showTrash ? "🗑️" : showArchived ? "🗄️" : "📝"}
          </p>
          <p className={`mt-3 font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            {showTrash
              ? "La papelera de notas está vacía"
              : showArchived
              ? "No tienes notas archivadas"
              : "Aún no tienes notas"}
          </p>
          {!showTrash && !showArchived && (
            <button
              onClick={openNew}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Crear nota
            </button>
          )}
        </div>
      )}

      {/* Cuadrícula de notas */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${zoomWidths[zoom - 1]}px, 1fr))`,
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, null)}
      >
        {visibleNotes.map((note) => (
          <div
            key={note.id}
            draggable={!note.locked && !note.deleted && !showTrash}
            onDragStart={(e) => handleDragStart(e, note.id)}
            onDragEnter={(e) => e.preventDefault()}
            onDragOver={(e) => handleDragOver(e, note.id)}
            onDrop={(e) => {
              e.stopPropagation();
              handleDrop(e, note.id);
            }}
            onDragEnd={() => {
              setDraggedNoteId(null);
              setDragOverNoteId(null);
            }}
            className={`group relative flex select-none flex-col rounded-xl border-2 p-3 shadow-md transition hover:shadow-xl ${
              cardClasses[note.color] || cardClasses.yellow
            } ${zoom <= 2 ? "min-h-[120px]" : "min-h-[160px]"} ${
              note.pinned ? "ring-2 ring-blue-500" : ""
            } ${draggedNoteId === note.id ? "opacity-50" : ""} ${
              dragOverNoteId === note.id ? "ring-2 ring-blue-400" : ""
            } ${
              note.locked || note.deleted
                ? "cursor-default"
                : "cursor-grab active:cursor-grabbing"
            } ${showTrash ? "opacity-80" : ""}`}
          >
            {/* Barra de acciones */}
            <div
              className={`absolute right-2 top-2 z-10 flex gap-1 transition ${
                alwaysToolbar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {showTrash ? (
                <>
                  <button
                    onClick={() => handleRestore(note)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-black/10"
                    title="Restaurar nota"
                  >
                    ♻️
                  </button>
                  <button
                    onClick={() => handleDelete(note)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-red-500/20"
                    title="Eliminar definitivamente"
                  >
                    🗑️
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setFullscreenNote(note)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-black/10"
                    title="Pantalla completa"
                  >
                    ⛶
                  </button>
                  {!note.locked && (
                    <button
                      onClick={() => openEdit(note)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-black/10"
                      title="Editar"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    onClick={() => handleTogglePin(note)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-black/10"
                    title={note.pinned ? "Desfijar" : "Fijar arriba"}
                  >
                    📌
                  </button>
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === note.id ? null : note.id)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-black/10"
                    title="Más opciones"
                  >
                    ⋮
                  </button>
                </>
              )}
            </div>

            {/* Menú desplegable */}
            {openMenuId === note.id && (
              <div className="absolute right-2 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {showTrash ? (
                  <>
                    <button
                      onClick={() => handleRestore(note)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100"
                    >
                      ♻️ Restaurar
                    </button>
                    <button
                      onClick={() => handleDelete(note)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50"
                    >
                      🗑️ Eliminar definitivamente
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleLock(note)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100"
                    >
                      {note.locked ? "🔓 Desbloquear" : "🔒 Bloquear"}
                    </button>
                    <button
                      onClick={() => handleToggleArchive(note)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-100"
                    >
                      {note.archived ? "📤 Restaurar" : "🗄️ Archivar"}
                    </button>
                    {!note.locked && (
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          handleDelete(note);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50"
                      >
                        🗑️ Enviar a papelera
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {note.pinned && !showTrash && (
              <span className="absolute left-2 top-2 text-sm">📌</span>
            )}
            {note.locked && !showTrash && (
              <span
                className="absolute left-2 bottom-2 text-sm"
                title="Nota bloqueada"
              >
                🔒
              </span>
            )}

            <h3 className="mb-1 pr-20 text-sm font-bold text-slate-800">
              {note.title || "Sin título"}
            </h3>

            <div
              className={`note-content flex-1 overflow-hidden text-xs text-slate-700 ${previewMax}`}
              dangerouslySetInnerHTML={{ __html: toHtml(note.content) }}
            ></div>

            {renderLinks(note)}

            <p className="mt-2 text-[10px] text-slate-500">
              {new Date(note.updated_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Modal de nota con editor enriquecido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingNote ? "✏️ Editar nota" : "📝 Nueva nota"}
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
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Clave API de GitHub"
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nota
                </label>
                <div className="mb-1 flex flex-wrap gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1.5">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("bold")}
                    className="h-8 w-8 rounded-lg text-sm font-bold text-slate-200 transition hover:bg-slate-700"
                    title="Negrita"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("italic")}
                    className="h-8 w-8 rounded-lg text-sm italic text-slate-200 transition hover:bg-slate-700"
                    title="Cursiva"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("underline")}
                    className="h-8 w-8 rounded-lg text-sm underline text-slate-200 transition hover:bg-slate-700"
                    title="Subrayado"
                  >
                    U
                  </button>
                  <span className="mx-1 w-px bg-slate-700"></span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("insertUnorderedList")}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Lista con viñetas"
                  >
                    •≡
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("insertOrderedList")}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Lista numerada"
                  >
                    1≡
                  </button>
                  <span className="mx-1 w-px bg-slate-700"></span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("justifyLeft")}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Alinear izquierda"
                  >
                    ⇤
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("justifyCenter")}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Centrar"
                  >
                    ⇔
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("justifyRight")}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Alinear derecha"
                  >
                    ⇥
                  </button>
                  <span className="mx-1 w-px bg-slate-700"></span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertImage}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Insertar imagen"
                  >
                    🖼️
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertTable}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Insertar tabla"
                  >
                    ⊞
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec("removeFormat")}
                    className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700"
                    title="Limpiar formato"
                  >
                    🧹
                  </button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="note-content min-h-[140px] w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                ></div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  🔗 Enlaces e imágenes (uno por línea)
                </label>
                <textarea
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder={"https://github.com\nhttps://ejemplo.com/foto.png\n!https://cualquier-url-de-imagen"}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  💡 Las URLs de páginas se muestran como botón con icono. Las
                  imágenes (.png, .jpg, imgur, unsplash...) se muestran como
                  imagen. Si una imagen no se detecta, pon{" "}
                  <strong>!</strong> al inicio de la línea para forzarla.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  📐 Tamaño de las imágenes
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "sm", label: "Pequeño" },
                    { value: "md", label: "Mediano" },
                    { value: "lg", label: "Grande" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setImageSize(opt.value)}
                      className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                        imageSize === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Color
                </label>
                <div className="flex gap-2">
                  {noteColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full ${dotClasses[c]} transition ${
                        color === c
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                          : "hover:scale-110"
                      }`}
                      title={c}
                    />
                  ))}
                </div>
              </div>

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
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "💾 Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pantalla completa */}
      {fullscreenNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setFullscreenNote(null)}
          ></div>

          <div
            className={`note-content relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl border-2 p-8 shadow-2xl ${
              cardClasses[fullscreenNote.color] || cardClasses.yellow
            }`}
          >
            <button
              onClick={() => setFullscreenNote(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/10 text-slate-700 transition hover:bg-black/20"
              title="Cerrar"
            >
              ✕
            </button>

            <h2 className="mb-4 pr-12 text-2xl font-bold text-slate-800">
              {fullscreenNote.title || "Sin título"}
            </h2>
            <div
              className="whitespace-pre-wrap text-base text-slate-700"
              dangerouslySetInnerHTML={{ __html: toHtml(fullscreenNote.content) }}
            ></div>

            {renderLinks(fullscreenNote)}

            <p className="mt-6 text-xs text-slate-500">
              Actualizada el{" "}
              {new Date(fullscreenNote.updated_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}