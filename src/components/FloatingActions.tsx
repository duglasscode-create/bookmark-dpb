"use client";

import { BookmarkPlus, FolderPlus, StickyNote } from "lucide-react";

type FloatingActionsProps = {
  isDarkMode: boolean;
  onAddBookmark: () => void;
  onNewCollection: () => void;
  onGoNotes: () => void;
};

export function FloatingActions({
  isDarkMode,
  onAddBookmark,
  onNewCollection,
  onGoNotes,
}: FloatingActionsProps) {
  const baseClass = `flex h-11 w-11 items-center justify-center rounded-xl transition hover:scale-105 ${
    isDarkMode
      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
  }`;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border px-2 py-1.5 shadow-2xl ${
        isDarkMode
          ? "border-slate-700 bg-slate-800/90 backdrop-blur"
          : "border-slate-200 bg-white/90 backdrop-blur"
      }`}
    >
      <button
        onClick={onAddBookmark}
        className={baseClass}
        title="Nuevo marcador (N)"
      >
        <BookmarkPlus size={20} />
      </button>
      <button
        onClick={onNewCollection}
        className={baseClass}
        title="Nueva colección"
      >
        <FolderPlus size={20} />
      </button>
      <button onClick={onGoNotes} className={baseClass} title="Notas (9)">
        <StickyNote size={20} />
      </button>
    </div>
  );
}