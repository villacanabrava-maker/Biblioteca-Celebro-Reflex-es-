import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rflex01 — Memória Reflexiva",
  description: "Rflex01 — plataforma pessoal de inteligência autoral baseada no Cérebro Autoral.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
