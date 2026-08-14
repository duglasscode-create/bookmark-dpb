"use client";

import { useState } from "react";
import { IconPicker } from "./IconPicker";

type Collection = {
  id: string;
  name: string;
};

type CollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, icon: string, parentId: string) => void;
  isSaving: boolean;
  collections?: Collection[];
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

export function CollectionModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  collections = [],
}: CollectionModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("none");
  const [icon, setIcon] = useState("📁");
  const [parentId, setParentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), color === "none" ? "" : color, icon || "📁", parentId);
      setName("");
      setColor("none");
      setIcon("📁");
      setParentId("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            📁 Nueva colección
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Nombre de la colección
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Recursos de diseño"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Colección padre */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Colección padre (opcional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">📂 Sin padre (colección raíz)</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  📁 {collection.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              💡 Elige una colección padre para crear una sub-colección.
            </p>
          </div>

          {/* Color (con opción SIN COLOR) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor("none")}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed transition ${
                  color === "none"
                    ? "border-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                    : "border-slate-600 hover:scale-110"
                }`}
                title="Sin color (solo icono)"
              >
                <span className="text-xs text-slate-400">✕</span>
              </button>
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`h-8 w-8 rounded-full ${colorClasses[colorOption]} transition ${
                    color === colorOption
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              💡 Elige ✕ para usar solo el icono, sin color.
            </p>
          </div>

          {/* Selector de iconos */}
          <IconPicker value={icon} onChange={setIcon} isDarkMode={true} />

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
              disabled={isSaving || !name.trim()}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Creando..." : "Crear colección"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}