"use client";

import { useState, useEffect } from "react";

type ReaderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  initialTitle?: string;
};

type Theme = "light" | "dark" | "sepia";

export function ReaderModal({
  isOpen,
  onClose,
  url,
  initialTitle,
}: ReaderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState("");
  const [byline, setByline] = useState("");
  const [siteName, setSiteName] = useState("");

  // Preferencias de lectura
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState(18);
  const [maxWidth, setMaxWidth] = useState(720);

  // Cargar contenido cuando se abre
  useEffect(() => {
    if (isOpen && url) {
      fetchContent();
    }
  }, [isOpen, url]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const fetchContent = async () => {
    setLoading(true);
    setError("");
    setContent("");

    try {
      const response = await fetch(
        `/api/reader?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();

      if (data.success !== false) {
        setTitle(data.title || url);
        setContent(data.content || "");
        setByline(data.byline || "");
        setSiteName(data.siteName || "");
      } else {
        setError(data.error || "Error al cargar");
        setContent(data.content || "");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 28));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 14));
  };

  const increaseWidth = () => {
    setMaxWidth((prev) => Math.min(prev + 80, 1200));
  };

  const decreaseWidth = () => {
    setMaxWidth((prev) => Math.max(prev - 80, 520));
  };

  if (!isOpen) return null;

  // Estilos según tema
  const themeStyles = {
    light: {
      bg: "bg-stone-50",
      text: "text-stone-900",
      muted: "text-stone-600",
      control: "bg-white border-stone-200 text-stone-900",
      controlHover: "hover:bg-stone-100",
      link: "text-blue-600",
    },
    dark: {
      bg: "bg-slate-950",
      text: "text-slate-100",
      muted: "text-slate-400",
      control: "bg-slate-900 border-slate-700 text-slate-100",
      controlHover: "hover:bg-slate-800",
      link: "text-blue-400",
    },
    sepia: {
      bg: "bg-amber-50",
      text: "text-amber-950",
      muted: "text-amber-800",
      control: "bg-amber-100 border-amber-300 text-amber-950",
      controlHover: "hover:bg-amber-200",
      link: "text-amber-800",
    },
  };

  const styles = themeStyles[theme];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Fondo completo */}
      <div className={`absolute inset-0 ${styles.bg}`}></div>

      {/* Barra superior de controles */}
      <div
        className={`relative z-10 flex items-center justify-between border-b ${
          theme === "light"
            ? "border-stone-200"
            : theme === "sepia"
            ? "border-amber-200"
            : "border-slate-800"
        } ${styles.bg} px-4 py-3`}
      >
        {/* Izquierda: Cerrar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${styles.control} ${styles.controlHover}`}
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Cerrar
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${styles.control} ${styles.controlHover}`}
            title="Abrir en nueva pestaña"
          >
            🔗 Original
          </a>
        </div>

        {/* Centro: Controles de texto */}
        <div className="flex items-center gap-1">
          {/* Tamaño de fuente */}
          <div
            className={`flex items-center gap-1 rounded-lg border ${styles.control}`}
          >
            <button
              onClick={decreaseFontSize}
              className={`px-3 py-1.5 text-sm font-medium transition ${styles.controlHover}`}
              title="Reducir texto"
            >
              A-
            </button>
            <span className="px-2 text-xs opacity-60">{fontSize}px</span>
            <button
              onClick={increaseFontSize}
              className={`px-3 py-1.5 text-sm font-medium transition ${styles.controlHover}`}
              title="Aumentar texto"
            >
              A+
            </button>
          </div>

          {/* Ancho de lectura */}
          <div
            className={`flex items-center gap-1 rounded-lg border ${styles.control}`}
          >
            <button
              onClick={decreaseWidth}
              className={`px-3 py-1.5 text-sm font-medium transition ${styles.controlHover}`}
              title="Reducir ancho"
            >
              ⬅
            </button>
            <span className="px-2 text-xs opacity-60">Ancho</span>
            <button
              onClick={increaseWidth}
              className={`px-3 py-1.5 text-sm font-medium transition ${styles.controlHover}`}
              title="Aumentar ancho"
            >
              ➡
            </button>
          </div>

          {/* Temas */}
          <div
            className={`flex items-center gap-1 rounded-lg border ${styles.control} p-1`}
          >
            <button
              onClick={() => setTheme("light")}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                theme === "light"
                  ? "bg-stone-900 text-white"
                  : styles.controlHover
              }`}
              title="Tema claro"
            >
              ☀️
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                theme === "dark"
                  ? "bg-slate-100 text-slate-900"
                  : styles.controlHover
              }`}
              title="Tema oscuro"
            >
              🌙
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                theme === "sepia"
                  ? "bg-amber-900 text-amber-50"
                  : styles.controlHover
              }`}
              title="Tema sepia"
            >
              📜
            </button>
          </div>
        </div>

        {/* Derecha: Espaciador */}
        <div className="w-24"></div>
      </div>

      {/* Contenido del artículo */}
      <div className={`relative z-10 flex-1 overflow-y-auto ${styles.bg}`}>
        <div
          className="mx-auto px-6 py-10"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className={`mb-4 h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent opacity-50`}
              ></div>
              <p className={styles.muted}>Cargando artículo...</p>
            </div>
          ) : (
            <article className={styles.text}>
              {/* Título */}
              <h1
                className="mb-4 font-serif font-bold leading-tight"
                style={{ fontSize: `${fontSize + 12}px` }}
              >
                {title}
              </h1>

              {/* Metadatos */}
              {(byline || siteName) && (
                <div className={`mb-8 text-sm ${styles.muted}`}>
                  {byline && <span>{byline}</span>}
                  {byline && siteName && <span> · </span>}
                  {siteName && <span className="italic">{siteName}</span>}
                </div>
              )}

              {/* Contenido */}
              <div
                className={`reader-content leading-relaxed ${styles.text}`}
                style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>
          )}
        </div>
      </div>

      {/* Estilos para el contenido del artículo */}
      <style jsx global>{`
        .reader-content {
          font-family: Georgia, "Times New Roman", serif;
        }

        .reader-content p {
          margin-bottom: 1.5em;
        }

        .reader-content h1,
        .reader-content h2,
        .reader-content h3,
        .reader-content h4 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 700;
          margin-top: 2em;
          margin-bottom: 0.75em;
          line-height: 1.3;
        }

        .reader-content h2 {
          font-size: 1.5em;
        }

        .reader-content h3 {
          font-size: 1.25em;
        }

        .reader-content a {
          color: ${theme === "light"
            ? "#2563eb"
            : theme === "sepia"
            ? "#92400e"
            : "#60a5fa"};
          text-decoration: underline;
        }

        .reader-content a:hover {
          opacity: 0.8;
        }

        .reader-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
          border-radius: 8px;
        }

        .reader-content blockquote {
          border-left: 4px solid currentColor;
          padding-left: 1.5em;
          margin: 1.5em 0;
          font-style: italic;
          opacity: 0.85;
        }

        .reader-content ul,
        .reader-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .reader-content li {
          margin-bottom: 0.5em;
        }

        .reader-content pre,
        .reader-content code {
          font-family: "Courier New", monospace;
          background: rgba(0, 0, 0, 0.05);
          padding: 0.2em 0.4em;
          border-radius: 4px;
        }

        .reader-content pre {
          padding: 1em;
          overflow-x: auto;
          margin: 1.5em 0;
        }

        .reader-content pre code {
          background: none;
          padding: 0;
        }

        .reader-content figure {
          margin: 2em 0;
          text-align: center;
        }

        .reader-content figcaption {
          font-size: 0.875em;
          margin-top: 0.5em;
          opacity: 0.7;
          font-style: italic;
        }

        .reader-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }

        .reader-content th,
        .reader-content td {
          border: 1px solid currentColor;
          padding: 0.5em;
          text-align: left;
        }
      `}</style>
    </div>
  );
}