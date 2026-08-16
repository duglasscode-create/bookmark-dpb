"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(
        hash ? hash.substring(1) : search ? search.substring(1) : ""
      );

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          console.error("Error en sesión:", error);
          router.replace("/login");
          return;
        }
        router.replace("/dashboard");
        return;
      }

      // Intentar con session existente (cuando Supabase ya redirigió)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Entrando...</p>
      </div>
    </div>
  );
}