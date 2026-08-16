"use client";

import { useState } from "react";
import { IconPicker } from "./IconPicker";
import { COLOR_OPTIONS, blockBgStyle, blockTextStyle } from "@/utils/notionColors";

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

export function CollectionModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  collections = [],
}: CollectionModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("default");
  const [icon, setIcon] = useState("📁");
  const [parentId, setParentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), color, icon || "📁", parentId);
      setName("");
      setColor("default");
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

            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
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

          {/* Color (paleta Notion) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    color === opt.value
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: `var(--blk-${opt.value}-bg)`,
                    color: `var(--blk-${opt.value}-text)`,
                    borderColor: `var(--blk-${opt.value}-icon)`,
                  }}
                  title={opt.label}
                >
                  A
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              💡 "Predeterminado" = sin color de fondo (solo icono).
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