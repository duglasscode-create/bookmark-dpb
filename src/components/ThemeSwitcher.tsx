"use client";

import { useState, useEffect, useRef } from "react";

type Theme = "dark" | "light" | "system" | "custom";

type ThemeSwitcherProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isDarkMode: boolean;
};

const themeOptions = [
  { value: "dark" as Theme, icon: "🌙", label: "Oscuro" },
  { value: "light" as Theme, icon: "☀️", label: "Claro" },
  { value: "custom" as Theme, icon: "🎨", label: "Personalizado" },
  { value: "system" as Theme, icon: "💻", label: "Sistema" },
];

export function ThemeSwitcher({ theme, onThemeChange, isDarkMode }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const currentTheme = themeOptions.find((t) => t.value === theme);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
          isDarkMode
            ? "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
            : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        title={`Tema actual: ${currentTheme?.label} - Cambiar tema (T)`}
      >
        <span className="text-base">{currentTheme?.icon}</span>
        <span className="hidden md:inline">{currentTheme?.label}</span>
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border py-2 shadow-xl ${
            isDarkMode
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Tema
          </p>

          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onThemeChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${
                theme === option.value
                  ? isDarkMode
                    ? "bg-blue-600/20 text-blue-400"
                    : "bg-blue-50 text-blue-700"
                  : isDarkMode
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{option.icon}</span>
              <span className="flex-1 text-left">{option.label}</span>
              {theme === option.value && (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}