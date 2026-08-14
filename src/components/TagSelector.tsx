"use client";

import { useState } from "react";
import { TagBadge } from "./TagBadge";

type Tag = {
  id: string;
  name: string;
  color: string;
};

type TagSelectorProps = {
  allTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => void;
};

const tagColors = [
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

const colorPreview: Record<string, string> = {
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

export function TagSelector({
  allTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: TagSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");

  // Cambiado de handleSubmit a handleClick (sin form)
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    onCreateTag(newTagName.trim(), newTagColor);
    setNewTagName("");
    setNewTagColor("blue");
    setShowCreateForm(false);
  };

  // Permitir crear con Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <div className="space-y-3">
      {/* Etiquetas existentes */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
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

      {/* Formulario para crear nueva etiqueta (SIN <form>) */}
      {showCreateForm ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="space-y-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nombre de la etiqueta..."
              autoFocus
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />

            {/* Selector de color */}
            <div className="flex flex-wrap gap-2">
              {tagColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`h-6 w-6 rounded-full ${colorPreview[color]} transition ${
                    newTagColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800"
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTagName("");
                  setNewTagColor("blue");
                }}
                className="rounded-lg px-4 py-1.5 text-sm text-slate-400 transition hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-600 px-3 py-1.5 text-sm text-slate-400 transition hover:border-blue-500 hover:text-blue-400"
        >
          <span>+</span> Nueva etiqueta
        </button>
      )}
    </div>
  );
}