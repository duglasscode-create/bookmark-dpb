import { NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL requerida" },
      { status: 400 }
    );
  }

  try {
    // Hacer fetch de la página
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000), // 15 segundos de timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({
        success: true,
        title: url,
        content: `<p>Este tipo de contenido no se puede mostrar en modo lectura.</p><p><a href="${url}" target="_blank">Abrir en nueva pestaña</a></p>`,
        excerpt: "",
        byline: null,
        siteName: null,
      });
    }

    const html = await response.text();

    // Parsear HTML
    const { document } = parseHTML(html);

    // Usar Readability para extraer el contenido principal
    const reader = new Readability(document as any);
    const article = reader.parse();

    if (!article || !article.content) {
      return NextResponse.json({
        success: true,
        title: document.title || url,
        content: `<p>No se pudo extraer el contenido de esta página.</p><p><a href="${url}" target="_blank">Abrir en nueva pestaña</a></p>`,
        excerpt: "",
        byline: null,
        siteName: null,
      });
    }

    return NextResponse.json({
      success: true,
      title: article.title || document.title || url,
      content: article.content,
      excerpt: article.excerpt || "",
      byline: article.byline || null,
      siteName: article.siteName || null,
      length: article.length || 0,
    });
  } catch (error) {
    console.error("Error extrayendo contenido:", error);
    return NextResponse.json({
      success: false,
      error: "No se pudo cargar el contenido",
      title: url,
      content: `<p>No se pudo extraer el contenido de esta página. Es posible que el sitio bloquee el acceso automático.</p><p><a href="${url}" target="_blank" rel="noopener noreferrer">Abrir en nueva pestaña</a></p>`,
    });
  }
}