"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type ShareCollection = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_public: boolean;
  share_slug: string | null;
};

type ShareCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  collection: ShareCollection | null;
  onUpdate: () => void;
};

export function ShareCollectionModal({
  isOpen,
  onClose,
  collection,
  onUpdate,
}: ShareCollectionModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // Obtener el origen de forma segura (solo en el cliente)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen || !collection) return null;

  const shareUrl = collection.share_slug
    ? `${origin}/c/${collection.share_slug}`
    : null;

  const handleToggleShare = async () => {
    setLoading(true);

    if (collection.is_public) {
      // Dejar de compartir
      const { error } = await supabase
        .from("collections")
        .update({ is_public: false, share_slug: null })
        .eq("id", collection.id);

      if (!error) {
        onUpdate();
      } else {
        alert("Error al dejar de compartir: " + error.message);
      }
    } else {
      // Compartir: generar slug único
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const shareSlug = `${collection.slug}-${randomSuffix}`;

      const { error } = await supabase
        .from("collections")
        .update({ is_public: true, share_slug: shareSlug })
        .eq("id", collection.id);

      if (!error) {
        onUpdate();
      } else {
        alert("Error al compartir: " + error.message);
      }
    }

    setLoading(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("No se pudo copiar el enlace");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {collection.is_public ? "🔗 Colección pública" : "🔒 Compartir colección"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Info de la colección */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <span className="text-3xl">{collection.icon || "📁"}</span>
          <div>
            <p className="font-medium text-white">{collection.name}</p>
            <p className="text-xs text-slate-400">
              {collection.is_public
                ? "Visible para cualquiera con el enlace"
                : "Solo tú puedes verla"}
            </p>
          </div>
        </div>

        {/* Enlace para compartir (si es pública) */}
        {collection.is_public && shareUrl && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Enlace para compartir
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-300 outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? "✅ Copiado" : "📋 Copiar"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Cualquiera con este enlace podrá ver la colección y sus marcadores.
            </p>
          </div>
        )}

        {/* Descripción de lo que hará */}
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-sm text-slate-400">
            {collection.is_public ? (
              <>
                ⚠️ Al dejar de compartir, el enlace dejará de funcionar y la
                colección volverá a ser privada.
              </>
            ) : (
              <>
                💡 Al compartir, se generará un enlace único que podrás enviar a
                quien quieras. Podrás dejar de compartir cuando desees.
              </>
            )}
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cerrar
          </button>
          <button
            onClick={handleToggleShare}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              collection.is_public
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? "Procesando..."
              : collection.is_public
              ? "🔒 Dejar de compartir"
              : "🔗 Hacer pública"}
          </button>
        </div>
      </div>
    </div>
  );
}