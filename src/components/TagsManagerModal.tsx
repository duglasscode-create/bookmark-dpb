"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Tag = {
  id: string;
  name: string;
  color: string;
};

type TagWithCount = Tag & {
  count: number;
};

const colorOptions = [
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "amber",
  "emerald",
  "teal",
  "cyan",
  "indigo",
  "violet",
  "fuchsia",
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
};

type TagsManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTagsChanged: () => void;
};

export function TagsManagerModal({
  isOpen,
  onClose,
  userId,
  onTagsChanged,
}: TagsManagerModalProps) {
  const supabase = createClient();
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para crear nueva etiqueta
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");
  const [creating, setCreating] = useState(false);

  // Estado para editar
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Cargar etiquetas al abrir
  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    setLoading(true);

    // Cargar etiquetas
    const { data: tagsData } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("user_id", userId)
      .order("name");

    if (tagsData) {
      // Calcular contador de uso de cada etiqueta
      const { data: tagRelations } = await supabase
        .from("bookmark_tags")
        .select("tag_id")
        .eq("user_id", userId);

      const countMap: Record<string, number> = {};
      tagRelations?.forEach((rel) => {
        countMap[rel.tag_id] = (countMap[rel.tag_id] || 0) + 1;
      });

      const tagsWithCount = tagsData.map((tag) => ({
        ...tag,
        count: countMap[tag.id] || 0,
      }));

      setTags(tagsWithCount);
    }

    setLoading(false);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);

    const slug = newTagName.trim().toLowerCase().replace(/\s+/g, "-");

    const { error } = await supabase.from("tags").insert({
      user_id: userId,
      name: newTagName.trim(),
      slug,
      color: newTagColor,
    });

    if (!error) {
      setNewTagName("");
      setNewTagColor("blue");
      fetchTags();
      onTagsChanged();
    } else {
      alert("Error al crear etiqueta: " + error.message);
    }

    setCreating(false);
  };

  const handleStartEdit = (tag: TagWithCount) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditName("");
    setEditColor("");
  };

  const handleSaveEdit = async () => {
    if (!editingTagId || !editName.trim()) return;

    const { error } = await supabase
      .from("tags")
      .update({
        name: editName.trim(),
        slug: editName.trim().toLowerCase().replace(/\s+/g, "-"),
        color: editColor,
      })
      .eq("id", editingTagId);

    if (!error) {
      handleCancelEdit();
      fetchTags();
      onTagsChanged();
    } else {
      alert("Error al actualizar etiqueta: " + error.message);
    }
  };

  const handleDeleteTag = async (tag: TagWithCount) => {
    const message =
      tag.count > 0
        ? `¿Eliminar la etiqueta "${tag.name}"?\n\n⚠️ Esta etiqueta se usa en ${tag.count} marcador${
            tag.count !== 1 ? "s" : ""
          }. Se quitará de todos ellos, pero los marcadores NO se eliminarán.`
        : `¿Eliminar la etiqueta "${tag.name}"?\n\nEsta etiqueta no se está usando.`;

    if (!confirm(message)) return;

    try {
      // Eliminar las relaciones con marcadores
      await supabase
        .from("bookmark_tags")
        .delete()
        .eq("tag_id", tag.id)
        .eq("user_id", userId);

      // Eliminar la etiqueta
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tag.id)
        .eq("user_id", userId);

      if (!error) {
        fetchTags();
        onTagsChanged();
      } else {
        alert("Error al eliminar etiqueta: " + error.message);
      }
    } catch (error) {
      console.error("Error eliminando etiqueta:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🏷️ Gestionar etiquetas
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Crear nueva etiqueta */}
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h4 className="mb-3 text-sm font-medium text-slate-300">
            ➕ Crear nueva etiqueta
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nombre de la etiqueta"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <button
              onClick={handleCreateTag}
              disabled={creating || !newTagName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "..." : "Crear"}
            </button>
          </div>
          {/* Selector de color */}
          <div className="mt-3 flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => setNewTagColor(color)}
                className={`h-7 w-7 rounded-full ${colorClasses[color]} transition ${
                  newTagColor === color
                    ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                    : "hover:scale-110"
                }`}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Lista de etiquetas */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-300">
            📋 Tus etiquetas ({tags.length})
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : tags.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
              <p className="text-sm text-slate-500">No tienes etiquetas creadas</p>
              <p className="text-xs text-slate-600 mt-1">
                Crea tu primera etiqueta usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group rounded-xl border border-slate-700 bg-slate-800/50 p-3 transition hover:border-slate-600"
                >
                  {editingTagId === tag.id ? (
                    // Modo edición
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                      />
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={`h-6 w-6 rounded-full ${colorClasses[color]} transition ${
                              editColor === color
                                ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                                : "hover:scale-110"
                            }`}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName.trim()}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          💾 Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo normal
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-4 w-4 shrink-0 rounded-full ${
                          colorClasses[tag.color] || "bg-slate-500"
                        }`}
                      ></span>
                      <span className="flex-1 truncate text-sm font-medium text-white">
                        {tag.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {tag.count} marcador{tag.count !== 1 ? "s" : ""}
                      </span>
                      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => handleStartEdit(tag)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                          title="Editar etiqueta"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                          title="Eliminar etiqueta"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}