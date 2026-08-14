import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmark DPB",
  description: "Best Bookmark - Tu gestor personal de marcadores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}