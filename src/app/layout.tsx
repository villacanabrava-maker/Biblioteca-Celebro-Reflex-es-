import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cérebro Autoral",
  description: "Plataforma de Inteligência Autoral Personalizada",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
