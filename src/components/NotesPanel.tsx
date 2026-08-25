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

const noteColors = [
  "slate", "gray", "zinc", "stone", "brown",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose",
];

const cardClasses: Record<string, string> = {
  slate: "bg-slate-200 border-slate-400",
  gray: "bg-gray-200 border-gray-400",
  zinc: "bg-zinc-200 border-zinc-400",
  stone: "bg-stone-200 border-stone-400",
  brown: "bg-amber-200 border-amber-700",
  red: "bg-red-200 border-red-400",
  orange: "bg-orange-200 border-orange-400",
  amber: "bg-amber-200 border-amber-400",
  yellow: "bg-yellow-200 border-yellow-400",
  lime: "bg-lime-200 border-lime-400",
  green: "bg-green-200 border-green-400",
  emerald: "bg-emerald-200 border-emerald-400",
  teal: "bg-teal-200 border-teal-400",
  cyan: "bg-cyan-200 border-cyan-400",
  sky: "bg-sky-200 border-sky-400",
  blue: "bg-blue-200 border-blue-400",
  indigo: "bg-indigo-200 border-indigo-400",
  violet: "bg-violet-200 border-violet-400",
  purple: "bg-purple-200 border-purple-400",
  fuchsia: "bg-fuchsia-200 border-fuchsia-400",
  pink: "bg-pink-200 border-pink-400",
  rose: "bg-rose-200 border-rose-400",
};

const dotClasses: Record<string, string> = {
  slate: "bg-slate-400",
  gray: "bg-gray-400",
  zinc: "bg-zinc-400",
  stone: "bg-stone-400",
  brown: "bg-amber-700",
  red: "bg-red-400",
  orange: "bg-orange-400",
  amber: "bg-amber-400",
  yellow: "bg-yellow-400",
  lime: "bg-lime-400",
  green: "bg-green-400",
  emerald: "bg-emerald-400",
  teal: "bg-teal-400",
  cyan: "bg-cyan-400",
  sky: "bg-sky-400",
  blue: "bg-blue-400",
  indigo: "bg-indigo-400",
  violet: "bg-violet-400",
  purple: "bg-purple-400",
  fuchsia: "bg-fuchsia-400",
  pink: "bg-pink-400",
  rose: "bg-rose-400",
};

const imageSizeClasses: Record<string, string> = {
  sm: "h-20",
  md: "h-36",
  lg: "h-56",
};

const zoomWidths = [170, 210, 250, 300, 360];

const IMAGE_HOSTS = [
  "imgur.com", "unsplash.com", "picsum.photos", "cloudinary",
  "giphy.com", "tenor.com", "googleusercontent.com", "fbcdn.net",
  "twimg.com", "images.", "media.",
];

const parseLinks = (links: string): string[] =>
  links.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const isImageUrl = (url: string): boolean => {
  const clean = url.startsWith("!") ? url.slice(1).trim() : url;
  if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(clean)) return true;
  return IMAGE_HOSTS.some((h) => clean.includes(h));
};

const isVideoUrl = (url: string): boolean =>
  /\.(mp4|webm|mov|ogg|ogv)(\?.*)?$/i.test(url);

const cleanUrl = (url: string): string =>
  url.startsWith("!") ? url.slice(1).trim() : url;

const getFileLabel = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.pathname.includes("/storage/v1/object/public/")) {
      const parts = decodeURIComponent(u.pathname).split("/");
      return parts[parts.length - 1].replace(/^\d+-/, "") || "archivo";
    }
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const getFileEmoji = (url: string): string => {
  if (/\.pdf(\?.*)?$/i.test(url)) return "📄";
  if (/\.(txt|md)(\?.*)?$/i.test(url)) return "📃";
  if (/\.(mp3|wav|m4a)(\?.*)?$/i.test(url)) return "🎵";
  if (/\.(zip|rar|7z)(\?.*)?$/i.test(url)) return "🗜️";
  if (/\.(docx?|xlsx?|pptx?)(\?.*)?$/i.test(url)) return "📑";
  return "📎";
};

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
  const [fullscreenNote, setFullscreenNote] = useState<Note | null>(null);
  const [drawerNoteId, setDrawerNoteId] = useState<string | null>(null);
  const [toolbarNoteId, setToolbarNoteId] = useState<string | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const cardEditorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const drawerNote = drawerNoteId
    ? notes.find((n) => n.id === drawerNoteId) || null
    : null;

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

  const execCard = (noteId: string, command: string) => {
    const el = cardEditorRefs.current[noteId];
    if (!el) return;
    el.focus();
    document.execCommand(command, false);
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

  const handleDelete = async (note: Note) => {
    if (showTrash || note.deleted) {
      const confirmed = confirm(
        `¿Eliminar DEFINITIVAMENTE la nota "${note.title || "Sin título"}"?\n\nEsta acción NO se puede deshacer.`
      );
      if (!confirmed) return;
      await supabase.from("notes").delete().eq("id", note.id).eq("user_id", userId);
    } else {
      await supabase
        .from("notes")
        .update({ deleted: true, pinned: false })
        .eq("id", note.id)
        .eq("user_id", userId);
    }
    setDrawerNoteId(null);
    fetchNotes();
  };

  const handleRestore = async (note: Note) => {
    await supabase.from("notes").update({ deleted: false }).eq("id", note.id).eq("user_id", userId);
    setDrawerNoteId(null);
    fetchNotes();
  };

  const handleTogglePin = async (note: Note) => {
    await supabase.from("notes").update({ pinned: !note.pinned }).eq("id", note.id).eq("user_id", userId);
    fetchNotes();
  };

  const handleToggleLock = async (note: Note) => {
    await supabase.from("notes").update({ locked: !note.locked }).eq("id", note.id).eq("user_id", userId);
    fetchNotes();
  };

  const handleToggleArchive = async (note: Note) => {
    await supabase.from("notes").update({ archived: !note.archived }).eq("id", note.id).eq("user_id", userId);
    setDrawerNoteId(null);
    fetchNotes();
  };

  const handleUpdateColor = async (note: Note, newColor: string) => {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, color: newColor } : n)));
    await supabase.from("notes").update({ color: newColor }).eq("id", note.id).eq("user_id", userId);
  };

  const handleInlineSave = async (note: Note) => {
    const el = cardEditorRefs.current[note.id];
    if (!el) return;
    const html = el.innerHTML;
    if (html === note.content) return;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, content: html } : n)));
    await supabase
      .from("notes")
      .update({ content: html, updated_at: new Date().toISOString() })
      .eq("id", note.id)
      .eq("user_id", userId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${userId}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage.from("note-files").upload(path, file, { upsert: false });

        if (!error) {
          const { data } = supabase.storage.from("note-files").getPublicUrl(path);
          if (data?.publicUrl) newUrls.push(data.publicUrl);
        } else {
          alert(`No se pudo subir "${file.name}": ${error.message}`);
        }
      } catch (err) {
        console.error("Error subiendo archivo:", err);
      }
    }

    if (newUrls.length > 0) {
      setLinks((prev) => (prev.trim() ? prev.trim() + "\n" : "") + newUrls.join("\n"));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      const reordered = ids.map((id, index) => ({ ...byId.get(id)!, position: index }));
      return [...others, ...reordered];
    });

    await Promise.all(
      ids.map((id, index) => supabase.from("notes").update({ position: index }).eq("id", id))
    );
  };

  const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain") || draggedNoteId;
    await reorderTo(draggedId, targetId);
    setDraggedNoteId(null);
    setDragOverNoteId(null);
  };

  const renderLinks = (note: Note) => {
    const urls = parseLinks(note.links);
    if (urls.length === 0) return null;

    const images = urls.filter((u) => isImageUrl(u) && !isVideoUrl(u));
    const videos = urls.filter(isVideoUrl);
    const webs = urls.filter((u) => !isImageUrl(u) && !isVideoUrl(u));
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
                  const anchor = (e.target as HTMLImageElement).parentElement as HTMLAnchorElement;
                  anchor.innerHTML = `<span class="flex items-center gap-2 p-2 text-xs text-slate-700">🖼️ ${getDomain(url)}</span>`;
                }}
              />
            </a>
          );
        })}
        {videos.map((raw) => {
          const url = cleanUrl(raw);
          return (
            <video
              key={raw}
              src={url}
              controls
              draggable={false}
              className={`w-full ${sizeClass} rounded-lg border border-black/10 object-cover`}
            />
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
              <span className="shrink-0 text-sm">{getFileEmoji(url)}</span>
              <span className="truncate font-medium">{getFileLabel(url)}</span>
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

  const drawerItemClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
    isDarkMode ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  }`;

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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {visibleNotes.length} nota{visibleNotes.length !== 1 ? "s" : ""} ·
          {showTrash
            ? " Papelera: restaura o elimina definitivamente"
            : " Arrastra para reordenar · ⋮ abre el panel de opciones"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!showTrash && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
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

      {visibleNotes.length === 0 && (
        <div
          className={`rounded-2xl border border-dashed p-12 text-center ${
            isDarkMode ? "border-slate-700" : "border-slate-300"
          }`}
        >
          <p className="text-4xl">{showTrash ? "🗑️" : showArchived ? "🗄️" : "📝"}</p>
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

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${zoomWidths[zoom - 1]}px, 1fr))` }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, null)}
      >
        {visibleNotes.map((note) => (
          <div
            key={note.id}
            draggable={!note.locked && !note.deleted && !showTrash && toolbarNoteId !== note.id}
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
            } ${zoom <= 2 ? "min-h-[120px]" : "min-h-[160px]"} ${note.pinned ? "ring-2 ring-blue-500" : ""} ${
              draggedNoteId === note.id ? "opacity-50" : ""
            } ${dragOverNoteId === note.id ? "ring-2 ring-blue-400" : ""} ${
              note.locked || note.deleted ? "cursor-default" : "cursor-grab active:cursor-grabbing"
            } ${showTrash ? "opacity-80" : ""}`}
          >
            <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
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
                    onClick={() => setDrawerNoteId(note.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-black/10"
                    title="Panel de opciones"
                  >
                    ⋮
                  </button>
                </>
              )}
            </div>

            {note.pinned && !showTrash && (
              <span className="absolute left-2 top-2 text-sm">📌</span>
            )}
            {note.locked && !showTrash && (
              <span className="absolute bottom-2 left-2 text-sm" title="Nota bloqueada">
                🔒
              </span>
            )}

            <h3 className="mb-1 mt-7 text-sm font-bold text-slate-800">
              {note.title || "Sin título"}
            </h3>

            {toolbarNoteId === note.id && !note.locked && !note.deleted ? (
              <>
                <div className="mb-1 flex flex-wrap gap-1 rounded-lg border border-black/10 bg-white/70 p-1">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCard(note.id, "bold")}
                    className="h-6 w-6 rounded text-[11px] font-bold text-slate-700 transition hover:bg-black/10"
                    title="Negrita"
                  >
                    B
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCard(note.id, "italic")}
                    className="h-6 w-6 rounded text-[11px] italic text-slate-700 transition hover:bg-black/10"
                    title="Cursiva"
                  >
                    I
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCard(note.id, "underline")}
                    className="h-6 w-6 rounded text-[11px] underline text-slate-700 transition hover:bg-black/10"
                    title="Subrayado"
                  >
                    U
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCard(note.id, "insertUnorderedList")}
                    className="h-6 w-6 rounded text-[11px] text-slate-700 transition hover:bg-black/10"
                    title="Lista"
                  >
                    •≡
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCard(note.id, "removeFormat")}
                    className="h-6 w-6 rounded text-[11px] text-slate-700 transition hover:bg-black/10"
                    title="Limpiar formato"
                  >
                    🧹
                  </button>
                </div>
                <div
                  ref={(el) => {
                    cardEditorRefs.current[note.id] = el;
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={() => handleInlineSave(note)}
                  className={`note-content flex-1 overflow-hidden text-xs text-slate-700 ${previewMax}`}
                  dangerouslySetInnerHTML={{ __html: toHtml(note.content) }}
                ></div>
              </>
            ) : (
              <div
                className={`note-content flex-1 overflow-hidden text-xs text-slate-700 ${previewMax}`}
                dangerouslySetInnerHTML={{ __html: toHtml(note.content) }}
              ></div>
            )}

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

      {drawerNote && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setDrawerNoteId(null)}
          ></div>

          <div
            className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col overflow-y-auto border-l p-4 shadow-2xl ${
              isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`truncate text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {drawerNote.title || "Sin título"}
              </h3>
              <button
                onClick={() => setDrawerNoteId(null)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                ✕
              </button>
            </div>

            <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              🎨 Style
            </p>
            <div className="mb-4 grid grid-cols-8 gap-2">
              {noteColors.map((c) => (
                <button
                  key={c}
                  onClick={() => handleUpdateColor(drawerNote, c)}
                  className={`h-6 w-6 rounded-full ${dotClasses[c]} transition ${
                    drawerNote.color === c ? "ring-2 ring-blue-500 ring-offset-2" : "hover:scale-110"
                  } ${isDarkMode ? "ring-offset-slate-900" : "ring-offset-white"}`}
                  title={c}
                />
              ))}
            </div>

            {!drawerNote.deleted && (
              <button
                onClick={() => setToolbarNoteId(toolbarNoteId === drawerNote.id ? null : drawerNote.id)}
                disabled={drawerNote.locked}
                className={`mb-4 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  toolbarNoteId === drawerNote.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-500"
                    : isDarkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
                title="Editar directamente sobre la nota"
              >
                <span>🛠️ Show Toolbar</span>
                <span
                  className={`relative h-5 w-9 rounded-full transition ${
                    toolbarNoteId === drawerNote.id ? "bg-blue-500" : isDarkMode ? "bg-slate-700" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      toolbarNoteId === drawerNote.id ? "left-4" : "left-0.5"
                    }`}
                  ></span>
                </span>
              </button>
            )}

            <div className={`mb-2 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}></div>

            {drawerNote.deleted ? (
              <>
                <button onClick={() => handleRestore(drawerNote)} className={drawerItemClass}>
                  ♻️ Restaurar
                </button>
                <button
                  onClick={() => handleDelete(drawerNote)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-500/10"
                >
                  🗑️ Eliminar definitivamente
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setDrawerNoteId(null);
                    openEdit(drawerNote);
                  }}
                  className={drawerItemClass}
                >
                  ✏️ Editar
                </button>
                <button onClick={() => setFullscreenNote(drawerNote)} className={drawerItemClass}>
                  ⛶ Pantalla completa
                </button>
                <button onClick={() => handleTogglePin(drawerNote)} className={drawerItemClass}>
                  📌 {drawerNote.pinned ? "Desfijar" : "Fijar"}
                </button>
                <button onClick={() => handleToggleLock(drawerNote)} className={drawerItemClass}>
                  {drawerNote.locked ? "🔓 Desbloquear" : "🔒 Bloquear"}
                </button>
                <button onClick={() => handleToggleArchive(drawerNote)} className={drawerItemClass}>
                  {drawerNote.archived ? "📤 Restaurar" : "🗄️ Archivar"}
                </button>
                {!drawerNote.locked && (
                  <button
                    onClick={() => handleDelete(drawerNote)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-500/10"
                  >
                    🗑️ Enviar a papelera
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
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
                <label className="mb-2 block text-sm font-medium text-slate-300">Título</label>
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
                <label className="mb-2 block text-sm font-medium text-slate-300">Nota</label>
                <div className="mb-1 flex flex-wrap gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1.5">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className="h-8 w-8 rounded-lg text-sm font-bold text-slate-200 transition hover:bg-slate-700" title="Negrita">B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className="h-8 w-8 rounded-lg text-sm italic text-slate-200 transition hover:bg-slate-700" title="Cursiva">I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className="h-8 w-8 rounded-lg text-sm underline text-slate-200 transition hover:bg-slate-700" title="Subrayado">U</button>
                  <span className="mx-1 w-px bg-slate-700"></span>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700" title="Lista con viñetas">•≡</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700" title="Lista numerada">1≡</button>
                  <span className="mx-1 w-px bg-slate-700"></span>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertImage} className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700" title="Insertar imagen">🖼️</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertTable} className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700" title="Insertar tabla">⊞</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} className="h-8 w-8 rounded-lg text-sm text-slate-200 transition hover:bg-slate-700" title="Limpiar formato">🧹</button>
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
                  🔗 Enlaces y archivos (uno por línea)
                </label>
                <textarea
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder={"https://github.com\nhttps://ejemplo.com/foto.png\n!https://cualquier-url-de-imagen"}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-600 disabled:opacity-50"
                  >
                    📎 {uploading ? "Subiendo..." : "Subir archivos locales"}
                  </button>
                  <span className="text-[10px] text-slate-500">imágenes, gif, video, pdf, txt...</span>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  💡 Las imágenes y gif se ven como imagen, los videos con reproductor,
                  y pdf/txt/audio como botón con su nombre.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">📐 Tamaño de las imágenes</label>
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
                        imageSize === opt.value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Color</label>
                <div className="flex flex-wrap gap-2">
                  {noteColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full ${dotClasses[c]} transition ${
                        color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "hover:scale-110"
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

      {fullscreenNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setFullscreenNote(null)}></div>

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