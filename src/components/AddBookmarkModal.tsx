"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TagSelector } from "./TagSelector";
import { IconPicker } from "./IconPicker";
import { applyAutoRules } from "@/utils/autoRules";

type Tag = {
  id: string;
  name: string;
  color: string;
};

type Collection = {
  id: string;
  name: string;
};

type AddBookmarkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  collections: Collection[];
};

export function AddBookmarkModal({
  isOpen,
  onClose,
  onSave,
  userId,
  collections,
}: AddBookmarkModalProps) {
  const supabase = createClient();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [icon, setIcon] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    id: string;
    url: string;
    title: string | null;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setTitle("");
      setDescription("");
      setSelectedCollection("");
      setSelectedTagIds([]);
      setDuplicateWarning(null);
      setIcon(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!url.trim() || url.trim().length < 8) {
        setDuplicateWarning(null);
        return;
      }

      const { data: existingBookmarks } = await supabase
        .from("bookmarks")
        .select("id, url, title")
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (existingBookmarks) {
        const { findDuplicate } = await import("@/utils/normalizeUrl");
        const duplicate = findDuplicate(url, existingBookmarks);
        setDuplicateWarning(duplicate);
      }
    };

    const timer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timer);
  }, [url, userId, supabase]);

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("user_id", userId)
      .order("name");

    if (!error) {
      setAllTags(data || []);
    }
  };

  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return null;
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const { data, error } = await supabase
      .from("tags")
      .insert({
        user_id: userId,
        name,
        slug,
        color,
      })
      .select()
      .single();

    if (error) {
      alert("Error al crear etiqueta: " + error.message);
      return;
    }

    if (data) {
      setAllTags((prev) => [...prev, data]);
      setSelectedTagIds((prev) => [...prev, data.id]);
    }
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    setSaving(true);

    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const domain = getDomain(finalUrl);

    // Verificar duplicados
    const { data: existingBookmarks } = await supabase
      .from("bookmarks")
      .select("id, url, title")
      .eq("user_id", userId)
      .eq("is_deleted", false);

    if (existingBookmarks) {
      const { findDuplicate } = await import("@/utils/normalizeUrl");
      const duplicate = findDuplicate(finalUrl, existingBookmarks);
      if (duplicate) {
        const shouldSave = confirm(
          `Este enlace ya está guardado como "${
            duplicate.title || duplicate.url
          }".\n\n¿Quieres guardarlo de todos modos?`
        );
        if (!shouldSave) {
          setSaving(false);
          return;
        }
      }
    }

   const { data: newBookmark, error: bookmarkError } = await supabase
  .from("bookmarks")
  .insert({
    user_id: userId,
    url: finalUrl,
    domain: domain,
    title: title.trim() || finalUrl,
    description: description.trim() || null,
    icon: icon || null,
    source: "manual",
  })
  .select()
  .single();

    if (bookmarkError) {
      alert("Error al guardar: " + bookmarkError.message);
      setSaving(false);
      return;
    }

    if (!newBookmark) {
      setSaving(false);
      return;
    }

    // NUEVO: Aplicar reglas automáticas si no se eligió colección manualmente
    let assignedCollectionId = selectedCollection;

    if (!selectedCollection) {
      const autoCollectionId = await applyAutoRules(
        supabase,
        userId,
        newBookmark.id,
        domain,
        finalUrl
      );

      if (autoCollectionId) {
        assignedCollectionId = autoCollectionId;
        const collectionName = collections.find(
          (c) => c.id === autoCollectionId
        )?.name;

        if (collectionName) {
          alert(
            `🎯 Regla automática aplicada\n\nEl marcador se asignó a la colección "${collectionName}" automáticamente.`
          );
        }
      }
    }

    // Asignar a la colección (manual o automática)
    if (assignedCollectionId) {
      await supabase.from("bookmark_collections").insert({
        bookmark_id: newBookmark.id,
        collection_id: assignedCollectionId,
        user_id: userId,
      });
    }

    if (selectedTagIds.length > 0) {
      const tagInserts = selectedTagIds.map((tagId) => ({
        bookmark_id: newBookmark.id,
        tag_id: tagId,
        user_id: userId,
      }));
      await supabase.from("bookmark_tags").insert(tagInserts);
    }

    setSaving(false);
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>➕</span> Agregar nuevo marcador
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              URL *
            </label>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="🔗 https://ejemplo.com"
              required
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Advertencia de duplicado */}
          {duplicateWarning && (
            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Este enlace ya está guardado
                  </p>
                  <p className="text-xs text-amber-400/70 truncate max-w-xs">
                    {duplicateWarning.title || duplicateWarning.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.open(duplicateWarning.url, "_blank");
                  }}
                  className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/30"
                >
                  Ver existente
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="rounded-lg px-2 py-1.5 text-xs text-amber-400/70 transition hover:text-amber-400"
                >
                  Ignorar
                </button>
              </div>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="📝 Título (opcional)"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="💬 Descripción (opcional)"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Colección */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Colección
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">📂 Sin colección (se aplican reglas automáticas)</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  📁 {collection.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              💡 Si dejas "Sin colección", se aplicarán las reglas automáticas.
            </p>
          </div>
{/* Icono personalizado */}
<div>
  <IconPicker value={icon} onChange={setIcon} isDarkMode={true} />
</div>
          {/* Etiquetas */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              🏷️ Etiquetas
            </label>
            <TagSelector
              allTags={allTags}
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTag}
              onCreateTag={handleCreateTag}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !url.trim()}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando..." : "💾 Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}