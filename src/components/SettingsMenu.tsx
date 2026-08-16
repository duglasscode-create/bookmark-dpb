"use client";

import { useState, useEffect, useRef } from "react";
import {
  SlidersHorizontal,
  Sun,
  Moon,
  Monitor,
  Download,
  Tags,
} from "lucide-react";
import { ExportButton } from "./ExportButton";
import { LogoutButton } from "./LogoutButton";

type Theme = "dark" | "light" | "system";

type SettingsMenuProps = {
  isDarkMode: boolean;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onImport: () => void;
  onManageTags: () => void;
  userId: string;
};

export function SettingsMenu({
  isDarkMode,
  theme,
  onThemeChange,
  onImport,
  onManageTags,
  userId,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const dataButtonClass = `flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
    isDarkMode
      ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
      : "border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  }`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
          isDarkMode
            ? "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
            : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        title="Ajustes"
      >
        <SlidersHorizontal size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border py-2 shadow-xl ${
            isDarkMode
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-white"
          }`}
        >
          {/* Tema */}
          <p
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Apariencia
          </p>
          <div className="mx-4 mb-2 flex gap-2">
            <button
              onClick={() => onThemeChange("light")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                theme === "light"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : isDarkMode
                  ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
              title="Fondo blanco e interfaz luminosa"
            >
              <Sun size={14} /> Claro
            </button>
            <button
              onClick={() => onThemeChange("dark")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : isDarkMode
                  ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
              title="Fondo oscuro, ideal para poca luz"
            >
              <Moon size={14} /> Oscuro
            </button>
            <button
              onClick={() => onThemeChange("system")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                theme === "system"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : isDarkMode
                  ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
              title="Seguir el tema del dispositivo"
            >
              <Monitor size={14} /> Auto
            </button>
          </div>

          <div
            className={`my-1 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
          ></div>

          {/* Datos: importar y exportar con el mismo diseño */}
          <p
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Datos
          </p>
          <div className="space-y-2 px-4 py-1">
            <button onClick={() => { onImport(); setIsOpen(false); }} className={dataButtonClass}>
              <Download size={15} /> Importar marcadores
            </button>
            <ExportButton userId={userId} />
          </div>

          <div
            className={`my-1 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
          ></div>

          <button onClick={() => { onManageTags(); setIsOpen(false); }} className={itemClass}>
            <Tags size={15} /> Gestionar etiquetas
          </button>

          <div
            className={`my-1 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
          ></div>

          <div className={itemClass}>
            <span className="w-full">
              <LogoutButton />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}