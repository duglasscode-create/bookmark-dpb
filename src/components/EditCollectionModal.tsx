"use client";

import { useState, useEffect } from "react";
import { IconPicker } from "./IconPicker";

type Collection = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  parent_id?: string | null;
};

type EditCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    collectionId: string,
    name: string,
    color: string,
    icon: string,
    parentId: string
  ) => void;
  isSaving: boolean;
  collection: Collection | null;
  allCollections: Collection[];
  isDarkMode: boolean;
};

const colorOptions = [
  "blue", "purple", "pink", "red", "orange", "amber",
  "emerald", "teal", "cyan", "indigo", "violet", "fuchsia",
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

export function EditCollectionModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  collection,
  allCollections,
  isDarkMode,
}: EditCollectionModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("none");
  const [icon, setIcon] = useState("📁");
  const [parentId, setParentId] = useState("");

  useEffect(() => {
    if (isOpen && collection) {
      setName(collection.name);
      setColor(collection.color || "none");
      setIcon(collection.icon || "📁");
      setParentId(collection.parent_id || "");
    }
  }, [isOpen, collection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && collection) {
      onSave(
        collection.id,
        name.trim(),
        color === "none" ? "" : color,
        icon || "📁",
        parentId
      );
    }
  };

  if (!isOpen || !collection) return null;

  const possibleParents = allCollections.filter((c) => c.id !== collection.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
          isDarkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-300 bg-white"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            ✏️ Editar colección
          </h3>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              isDarkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Nombre de la colección
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Recursos de diseño"
              autoFocus
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800 text-white placeholder-slate-500"
                  : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Colección padre */}
          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Colección padre (opcional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800 text-white"
                  : "border-slate-300 bg-white text-slate-900"
              }`}
            >
              <option value="">📂 Sin padre (colección raíz)</option>
              {possibleParents.map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color (con opción SIN COLOR) */}
          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor("none")}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed transition ${
                  color === "none"
                    ? isDarkMode
                      ? "border-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                      : "border-slate-900 ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
                    : isDarkMode
                    ? "border-slate-600 hover:scale-110"
                    : "border-slate-400 hover:scale-110"
                }`}
                title="Sin color (solo icono)"
              >
                <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>✕</span>
              </button>
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`h-8 w-8 rounded-full ${colorClasses[colorOption]} transition ${
                    color === colorOption
                      ? `ring-2 ring-offset-2 ${
                          isDarkMode
                            ? "ring-white ring-offset-slate-900"
                            : "ring-slate-900 ring-offset-white"
                        }`
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
            <p className={`mt-1.5 text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              💡 Elige ✕ para usar solo el icono, sin color.
            </p>
          </div>

          {/* Selector de iconos */}
          <IconPicker value={icon} onChange={setIcon} isDarkMode={isDarkMode} />

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl border px-4 py-3 font-medium transition ${
                isDarkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "💾 Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}