"use client";

import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  Keyboard,
  Gift,
  Share2,
  Bug,
} from "lucide-react";

type HelpMenuProps = {
  isDarkMode: boolean;
  onOpenShortcuts: () => void;
};

const CHANGELOG = [
  {
    version: "v1.2",
    items: [
      "Paleta de colores estilo Notion en colecciones",
      "Barra lateral colapsable (solo iconos)",
      "Bloc de notas pro: formato, enlaces, imágenes, arrastrar",
    ],
  },
  {
    version: "v1.1",
    items: [
      "Iconos personalizados (UI + emojis) en colecciones y marcadores",
      "Vista Kanban adaptativa a los temas",
    ],
  },
  {
    version: "v1.0",
    items: ["Primer despliegue público en Vercel", "Login con Magic Link"],
  },
];

export function HelpMenu({ isDarkMode, onOpenShortcuts }: HelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const itemClass = `flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${
    isDarkMode
      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  }`;

  const shareApp = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      alert("🔗 Enlace de tu app copiado al portapapeles.\n¡Compártelo donde quieras!");
    } catch {
      alert("Tu app: " + window.location.origin);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
          isDarkMode
            ? "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
            : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        title="Ayuda"
      >
        <HelpCircle size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border py-2 shadow-xl ${
            isDarkMode
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-white"
          }`}
        >
          <button
            onClick={() => {
              onOpenShortcuts();
              setIsOpen(false);
            }}
            className={itemClass}
          >
            <Keyboard size={15} /> Atajos de teclado
          </button>

          <button
            onClick={() => {
              setIsWhatsNewOpen(true);
              setIsOpen(false);
            }}
            className={itemClass}
          >
            <Gift size={15} /> Novedades
          </button>

          <button onClick={shareApp} className={itemClass}>
            <Share2 size={15} /> Compartir mi app
          </button>

          <a
            href="mailto:duglasscode@gmail.com?subject=Error%20en%20Bookmark%20DPB"
            className={itemClass}
            onClick={() => setIsOpen(false)}
          >
            <Bug size={15} /> Reportar un error
          </a>
        </div>
      )}

      {/* Modal Novedades */}
      {isWhatsNewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsWhatsNewOpen(false)}
          ></div>

          <div
            className={`relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
              isDarkMode
                ? "border-slate-700 bg-slate-900"
                : "border-slate-300 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                🎁 Novedades
              </h3>
              <button
                onClick={() => setIsWhatsNewOpen(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {CHANGELOG.map((release) => (
                <div key={release.version}>
                  <p className="mb-2 text-sm font-bold text-blue-500">
                    {release.version}
                  </p>
                  <ul className="space-y-1.5">
                    {release.items.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2 text-sm ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        <span className="mt-0.5 text-blue-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}