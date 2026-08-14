"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  parseBookmarksHTML,
  getDomainFromUrl,
  generateSlug,
  type ImportedBookmark,
  type ImportedFolder,
} from "@/utils/parseBookmarks";

type ImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userId: string;
};

type ImportStep = "select" | "preview" | "importing" | "done";

export function ImportModal({
  isOpen,
  onClose,
  onComplete,
  userId,
}: ImportModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("select");
  const [fileName, setFileName] = useState("");
  const [bookmarks, setBookmarks] = useState<ImportedBookmark[]>([]);
  const [folders, setFolders] = useState<ImportedFolder[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setError("Por favor selecciona un archivo HTML (.html o .htm)");
      return;
    }

    setError("");
    setFileName(file.name);

    const text = await file.text();
    const result = parseBookmarksHTML(text);

    if (result.bookmarks.length === 0) {
      setError("No se encontraron marcadores en el archivo");
      return;
    }

    setBookmarks(result.bookmarks);
    setFolders(result.folders);
    setStep("preview");
  };

  const handleImport = async () => {
    setStep("importing");
    setImporting(true);
    setImportProgress(0);
    setImportedCount(0);

    try {
      const folderToCollectionId: Record<string, string> = {};

      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const slug = generateSlug(folder.name);

        const { data, error } = await supabase
          .from("collections")
          .insert({
            user_id: userId,
            name: folder.name,
            slug: `${slug}-${Date.now()}`,
            color: "blue",
            icon: "📁",
            position: i,
          })
          .select()
          .single();

        if (!error && data) {
          folderToCollectionId[folder.name] = data.id;
        }
      }

      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < bookmarks.length; i += batchSize) {
        const batch = bookmarks.slice(i, i + batchSize);

        for (const bookmark of batch) {
          const { data: newBookmark, error: bookmarkError } = await supabase
            .from("bookmarks")
            .insert({
              user_id: userId,
              url: bookmark.url,
              domain: getDomainFromUrl(bookmark.url),
              title: bookmark.title,
              description: null,
              source: "import",
            })
            .select()
            .single();

          if (!bookmarkError && newBookmark) {
            imported++;

            if (bookmark.folder && folderToCollectionId[bookmark.folder]) {
              await supabase.from("bookmark_collections").insert({
                bookmark_id: newBookmark.id,
                collection_id: folderToCollectionId[bookmark.folder],
                user_id: userId,
              });
            }
          }
        }

        setImportProgress(Math.round(((i + batch.length) / bookmarks.length) * 100));
        setImportedCount(imported);
      }

      setStep("done");
    } catch (err) {
      setError("Error durante la importación: " + (err as Error).message);
      setStep("select");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setFileName("");
    setBookmarks([]);
    setFolders([]);
    setError("");
    setImportProgress(0);
    setImportedCount(0);
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            📥 Importar marcadores
          </h3>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {step === "select" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
              <p className="mb-4 text-4xl">📂</p>
              <p className="mb-2 font-medium text-white">
                Selecciona tu archivo de marcadores
              </p>
              <p className="mb-4 text-sm text-slate-400">
                Exporta tus marcadores desde Chrome, Firefox, Edge o Safari
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".html,.htm"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Seleccionar archivo HTML
              </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <p className="mb-2 text-sm font-medium text-slate-300">
                💡 Cómo exportar desde tu navegador:
              </p>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>
                  <strong>Chrome:</strong> ⋮ → Marcadores → Administrador → ⋯ → Exportar
                </li>
                <li>
                  <strong>Firefox:</strong> ☰ → Marcadores → Administrar → Exportar HTML
                </li>
                <li>
                  <strong>Edge:</strong> ⋯ → Favoritos → ⋯ → Exportar favoritos
                </li>
              </ul>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="mb-2 text-sm font-medium text-white">
                📄 Archivo: {fileName}
              </p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-slate-700/50 p-3">
                  <p className="text-2xl font-bold text-blue-400">
                    {bookmarks.length}
                  </p>
                  <p className="text-xs text-slate-400">Marcadores</p>
                </div>
                <div className="rounded-lg bg-slate-700/50 p-3">
                  <p className="text-2xl font-bold text-emerald-400">
                    {folders.length}
                  </p>
                  <p className="text-xs text-slate-400">Carpetas → Colecciones</p>
                </div>
              </div>
            </div>

            {folders.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/30 p-4">
                <p className="mb-2 text-xs font-medium uppercase text-slate-500">
                  Carpetas que se convertirán en colecciones:
                </p>
                <div className="flex flex-wrap gap-2">
                  {folders.map((folder, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      📁 {folder.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <p className="mb-2 text-xs font-medium uppercase text-slate-500">
                Primeros marcadores:
              </p>
              <div className="space-y-1">
                {bookmarks.slice(0, 5).map((bookmark, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-xs">🔗</span>
                    <span className="truncate text-slate-300">
                      {bookmark.title || bookmark.url}
                    </span>
                  </div>
                ))}
                {bookmarks.length > 5 && (
                  <p className="text-xs text-slate-500">
                    ... y {bookmarks.length - 5} más
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("select")}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
              >
                ← Volver
              </button>
              <button
                onClick={handleImport}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                📥 Importar {bookmarks.length} marcadores
              </button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 text-center">
            <div className="py-8">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mb-2 font-medium text-white">
                Importando marcadores...
              </p>
              <p className="text-sm text-slate-400">
                {importedCount} de {bookmarks.length} importados
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500">{importProgress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <div className="py-8">
              <p className="mb-4 text-5xl">🎉</p>
              <p className="mb-2 text-lg font-semibold text-white">
                ¡Importación completada!
              </p>
              <p className="text-slate-400">
                Se importaron <strong className="text-blue-400">{importedCount}</strong>{" "}
                marcadores en{" "}
                <strong className="text-emerald-400">{folders.length}</strong>{" "}
                colecciones.
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Ver mis marcadores
            </button>
          </div>
        )}
      </div>
    </div>
  );
}