"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();

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
    }

    setLoading(false);
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
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Uso personal · Gratis · Sin contraseñas
        </p>
      </div>
    </div>
  );
}