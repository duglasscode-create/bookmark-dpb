"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TagBadge } from "./TagBadge";

type Tag = {
  id: string;
  name: string;
  color: string;
};

type Collection = {
  id: string;
  name: string;
};

type EditBookmarkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  bookmark: {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    note: string | null;
    domain: string | null;
  } | null;
  userId: string;
  collections: Collection[];
  allTags: Tag[];
};

export function EditBookmarkModal({
  isOpen,
  onClose,
  onSave,
  bookmark,
  userId,
  collections,
  allTags,
}: EditBookmarkModalProps) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // NUEVO: Estado para el recordatorio
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [existingReminder, setExistingReminder] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bookmark) {
      setTitle(bookmark.title || "");
      setDescription(bookmark.description || "");
      setNote(bookmark.note || "");
      setReminderDate("");
      setReminderNote("");
      setExistingReminder(null);
      loadBookmarkData();
    }
  }, [isOpen, bookmark]);

  const loadBookmarkData = async () => {
    if (!bookmark) return;

    setLoadingTags(true);

    // Cargar colección
    const { data: collectionData } = await supabase
      .from("bookmark_collections")
      .select("collection_id")
      .eq("bookmark_id", bookmark.id)
      .limit(1);

    if (collectionData && collectionData.length > 0) {
      setSelectedCollection(collectionData[0].collection_id);
    } else {
      setSelectedCollection("");
    }

    // Cargar etiquetas
    const { data: tagData } = await supabase
      .from("bookmark_tags")
      .select("tag_id")
      .eq("bookmark_id", bookmark.id);

    if (tagData) {
      setSelectedTagIds(tagData.map((t) => t.tag_id));
    } else {
      setSelectedTagIds([]);
    }

    // NUEVO: Cargar recordatorio existente
    const { data: reminderData } = await supabase
      .from("reminders")
      .select("id, remind_at, note")
      .eq("bookmark_id", bookmark.id)
      .eq("user_id", userId)
      .order("remind_at", { ascending: true })
      .limit(1);

    if (reminderData && reminderData.length > 0) {
      const reminder = reminderData[0];
      setExistingReminder(reminder.id);
      // Convertir a formato datetime-local
      const date = new Date(reminder.remind_at);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setReminderDate(localDateTime);
      setReminderNote(reminder.note || "");
    }

    setLoadingTags(false);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    if (!bookmark) return;

    setSaving(true);

    // Actualizar título, descripción y nota
    const { error: bookmarkError } = await supabase
      .from("bookmarks")
      .update({
        title: title.trim() || bookmark.url,
        description: description.trim() || null,
        note: note.trim() || null,
      })
      .eq("id", bookmark.id);

    if (bookmarkError) {
      alert("Error al actualizar: " + bookmarkError.message);
      setSaving(false);
      return;
    }

    // Actualizar colección
    await supabase
      .from("bookmark_collections")
      .delete()
      .eq("bookmark_id", bookmark.id);

    if (selectedCollection) {
      await supabase.from("bookmark_collections").insert({
        bookmark_id: bookmark.id,
        collection_id: selectedCollection,
        user_id: userId,
      });
    }

    // Actualizar etiquetas
    await supabase
      .from("bookmark_tags")
      .delete()
      .eq("bookmark_id", bookmark.id);

    if (selectedTagIds.length > 0) {
      const tagInserts = selectedTagIds.map((tagId) => ({
        bookmark_id: bookmark.id,
        tag_id: tagId,
        user_id: userId,
      }));

      await supabase.from("bookmark_tags").insert(tagInserts);
    }

    // NUEVO: Manejar recordatorio
    if (reminderDate) {
      const remindAt = new Date(reminderDate).toISOString();

      if (existingReminder) {
        // Actualizar recordatorio existente
        await supabase
          .from("reminders")
          .update({
            remind_at: remindAt,
            note: reminderNote.trim() || null,
            is_notified: false,
          })
          .eq("id", existingReminder);
      } else {
        // Crear nuevo recordatorio
        await supabase.from("reminders").insert({
          user_id: userId,
          bookmark_id: bookmark.id,
          remind_at: remindAt,
          note: reminderNote.trim() || null,
        });
      }
    } else if (existingReminder) {
      // Si se quitó la fecha, eliminar el recordatorio existente
      await supabase.from("reminders").delete().eq("id", existingReminder);
    }

    setSaving(false);
    onSave();
    onClose();
  };

  if (!isOpen || !bookmark) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            ✏️ Editar marcador
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* URL (solo lectura) */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            URL
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
            <span className="text-lg">🔗</span>
            <span className="truncate text-sm text-slate-300">
              {bookmark.url}
            </span>
          </div>
        </div>

        {/* Título */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del marcador"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Descripción */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción..."
            rows={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Nota adhesiva */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300 flex items-center gap-2">
            <span>📝</span> Nota personal
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="¿Por qué guardaste esto? Ideas, recordatorios..."
            rows={2}
            className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
          />
        </div>

        {/* NUEVO: Recordatorio */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300 flex items-center gap-2">
            <span>⏰</span> Recordatorio
          </label>
          <input
            type="datetime-local"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {reminderDate && (
            <input
              type="text"
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="Nota del recordatorio (opcional)..."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            💡 Recibirás una notificación en tu navegador cuando llegue la hora.
          </p>
        </div>

        {/* Colección */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Colección
          </label>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">📂 Sin colección</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                📁 {collection.name}
              </option>
            ))}
          </select>
        </div>

        {/* Etiquetas */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            🏷️ Etiquetas
          </label>

          {loadingTags ? (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              Cargando etiquetas...
            </div>
          ) : allTags.length === 0 ? (
            <p className="text-sm text-slate-500">
              No tienes etiquetas creadas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className={`transition ${
                    selectedTagIds.includes(tag.id)
                      ? "opacity-100 ring-2 ring-white/50"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <TagBadge name={tag.name} color={tag.color} size="md" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "💾 Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}