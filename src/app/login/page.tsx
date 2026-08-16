"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Estados para el método iPad / PWA (pegar enlace mágico)
  const [magicLink, setMagicLink] = useState("");
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Detectar si llegamos con parámetros de auth en la URL (cuando se abre el enlace mágico)
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const params = new URLSearchParams(
      hash ? hash.substring(1) : search ? search.substring(1) : ""
    );

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      // Limpiar la URL y redirigir al dashboard
      supabase.auth.setSession({ access_token, refresh_token }).then(() => {
        router.replace("/dashboard");
      });
    }
  }, [router, supabase.auth]);

  // Verificar sesión al montar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("✨ ¡Revisa tu correo! Te enviamos un enlace mágico para entrar.");
      setSent(true);
    }

    setLoading(false);
  };

  // NUEVO: Verificar enlace mágico pegado (fix para iPad / PWA)
  const handleVerifyMagicLink = async () => {
    setVerifyingLink(true);
    setLinkError("");

    try {
      const url = magicLink.trim();
      if (!url) {
        throw new Error("Pega el enlace mágico que te llegó al correo.");
      }

      // Parsear la URL (puede venir con hash # o query ?)
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch {
        throw new Error("El enlace no es válido.");
      }

      // Supabase envía los parámetros después del # o como ?
      const hashPart = urlObj.hash ? urlObj.hash.substring(1) : "";
      const searchPart = urlObj.search ? urlObj.search.substring(1) : "";
      const params = new URLSearchParams(hashPart || searchPart);

      const token_hash = params.get("token") || params.get("token_hash");
      const type = params.get("type");
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      // Caso 1: La URL ya trae access_token (cuando Supabase lo envía así)
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) throw error;
        router.replace("/dashboard");
        return;
      }

      // Caso 2: URL con token_hash (magic link clásico de Supabase)
      if (token_hash && type === "magiclink") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "magiclink",
          email,
        });
        if (error) throw error;
        router.replace("/dashboard");
        return;
      }

      throw new Error(
        "No se encontraron los parámetros del enlace. Asegúrate de copiar el enlace completo."
      );
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setVerifyingLink(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl">
            🔖
          </div>
          <h1 className="text-3xl font-bold">Bookmark DPB</h1>
          <p className="mt-2 text-slate-400">Best Bookmark</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-200">
            Entra con tu email
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar enlace mágico"}
            </button>
          </form>

          {/* Mensajes */}
          {message && (
            <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* NUEVO: Bloque para iPad / PWA (pegar enlace mágico) */}
          {sent && (
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-3 flex items-start gap-2">
                <span className="text-xl">📱</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">
                    ¿Usas iPad o app instalada?
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Si el enlace del email no entra aquí automáticamente,
                    cópialo del correo y pégalo:
                  </p>
                </div>
              </div>

              <textarea
                value={magicLink}
                onChange={(e) => setMagicLink(e.target.value)}
                placeholder="Pega aquí el enlace mágico completo..."
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none"
              />

              <button
                onClick={handleVerifyMagicLink}
                disabled={verifyingLink || !magicLink.trim()}
                className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyingLink ? "Verificando..." : "🔑 Entrar con este enlace"}
              </button>

              {linkError && (
                <div className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
                  {linkError}
                </div>
              )}

              <p className="mt-3 text-[10px] text-slate-500">
                💡 En Gmail del iPad: mantén pulsado el enlace → "Copiar enlace"
                → vuelve aquí y pégalo.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Uso personal · Gratis · Sin contraseñas
        </p>
      </div>
    </div>
  );
}