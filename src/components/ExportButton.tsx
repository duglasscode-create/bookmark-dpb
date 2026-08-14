"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ExportButtonProps = {
  userId: string;
};

export function ExportButton({ userId }: ExportButtonProps) {
  const supabase = createClient();
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleExport = async () => {
    setExporting(true);
    setStatus("idle");

    try {
      // 1. Obtener colecciones
      const { data: collections, error: colError } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", userId)
        .order("position");

      if (colError) throw colError;

      // 2. Obtener etiquetas
      const { data: tags, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (tagsError) throw tagsError;

      // 3. Obtener marcadores (incluyendo los de la papelera)
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");

      if (bookmarksError) throw bookmarksError;

      // 4. Obtener relaciones marcador-colección
      const bookmarkIds = bookmarks?.map((b) => b.id) || [];
      let bookmarkCollections: any[] = [];

      if (bookmarkIds.length > 0) {
        const { data: bcData } = await supabase
          .from("bookmark_collections")
          .select("*")
          .eq("user_id", userId);

        bookmarkCollections = bcData || [];
      }

      // 5. Obtener relaciones marcador-etiqueta
      let bookmarkTags: any[] = [];

      if (bookmarkIds.length > 0) {
        const { data: btData } = await supabase
          .from("bookmark_tags")
          .select("*")
          .eq("user_id", userId);

        bookmarkTags = btData || [];
      }

      // 6. Construir el objeto de backup
      const backup = {
        app: "Bookmark DPB",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        userId: userId,
        stats: {
          totalBookmarks: bookmarks?.length || 0,
          totalCollections: collections?.length || 0,
          totalTags: tags?.length || 0,
        },
        data: {
          collections: collections || [],
          tags: tags || [],
          bookmarks: bookmarks || [],
          bookmarkCollections: bookmarkCollections,
          bookmarkTags: bookmarkTags,
        },
      };

      // 7. Crear y descargar el archivo
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const fileName = `bookmark-dpb-backup-${dateStr}.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus("success");

      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("Error exportando:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></span>
            Exportando...
          </>
        ) : (
          <>📤 Exportar backup</>
        )}
      </button>

      {/* Mensaje de estado */}
      {status === "success" && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-400 text-center">
          ✅ Backup descargado correctamente
        </div>
      )}
      {status === "error" && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 text-center">
          ❌ Error al exportar
        </div>
      )}
    </div>
  );
}