"use client";

import { useState } from "react";

type Collection = {
  id: string;
  name: string;
};

type BulkActionsBarProps = {
  selectedCount: number;
  collections: Collection[];
  onDeleteSelected: () => void;
  onMoveToCollection: (collectionId: string) => void;
  onFavoriteSelected: () => void;
  onClearSelection: () => void;
};

export function BulkActionsBar({
  selectedCount,
  collections,
  onDeleteSelected,
  onMoveToCollection,
  onFavoriteSelected,
  onClearSelection,
}: BulkActionsBarProps) {
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDeleteSelected();
    setConfirmDelete(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 shadow-2xl shadow-black/50">
        {/* Contador */}
        <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-sm text-slate-300">
            seleccionado{selectedCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Mover a colección */}
          <div className="relative">
            <button
              onClick={() => setShowCollectionPicker(!showCollectionPicker)}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              📁 Mover
              <svg
                className={`h-3 w-3 transition ${showCollectionPicker ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCollectionPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-slate-700 bg-slate-800 py-2 shadow-xl">
                <button
                  onClick={() => {
                    onMoveToCollection("");
                    setShowCollectionPicker(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                >
                  📂 Sin colección
                </button>
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => {
                      onMoveToCollection(collection.id);
                      setShowCollectionPicker(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                  >
                    📁 {collection.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favorito */}
          <button
            onClick={onFavoriteSelected}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            title="Marcar como favoritos"
          >
            ⭐
          </button>

          {/* Eliminar */}
          <button
            onClick={handleDeleteClick}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              confirmDelete
                ? "bg-red-600 text-white"
                : "border border-red-500/30 text-red-400 hover:bg-red-500/10"
            }`}
          >
            {confirmDelete ? "¿Confirmar?" : "🗑️"}
          </button>

          {/* Cancelar */}
          <button
            onClick={onClearSelection}
            className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Cancelar selección"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}