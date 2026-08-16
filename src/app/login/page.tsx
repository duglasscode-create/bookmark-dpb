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

  // Código de 6 dígitos
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Verificar sesión al montar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase.auth]);

  // Enviar código de 6 dígitos al email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // No crear usuarios nuevos, solo loguear existentes
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("✨ Código de 6 dígitos enviado. Revisa tu correo.");
      setSent(true);
    }

    setLoading(false);
  };

  // Verificar el código
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setError("Código incorrecto o expirado: " + error.message);
    } else {
      router.replace("/dashboard");
    }

    setVerifying(false);
  };

  // Volver a empezar
  const handleReset = () => {
    setEmail("");
    setCode("");
    setSent(false);
    setMessage("");
    setError("");
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
          {!sent ? (
            <>
              <h2 className="mb-6 text-center text-lg font-semibold text-slate-200">
                Entra con tu email
              </h2>

              <form onSubmit={handleSendCode} className="space-y-4">
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
                  {loading ? "Enviando..." : "Enviar código de 6 dígitos"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="mb-6 text-center text-lg font-semibold text-slate-200">
                Introduce el código
              </h2>

              <p className="mb-4 text-center text-sm text-slate-400">
                Enviamos un código de 6 dígitos a{" "}
                <span className="font-medium text-slate-200">{email}</span>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Código de 6 dígitos
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifying ? "Verificando..." : "🔑 Entrar"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  ← Usar otro correo
                </button>
              </form>

              {message && (
                <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-center text-sm text-emerald-400">
                  {message}
                </div>
              )}
            </>
          )}

          {/* Errores */}
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