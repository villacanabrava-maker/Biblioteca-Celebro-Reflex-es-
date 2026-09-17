import React from "react";
import Link from "next/link";

interface LogotipoProps {
  tamanho?: "sm" | "md" | "lg";
  comSubtitulo?: boolean;
  linkHref?: string;
  className?: string;
}

export function PenaIcone({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20.24 3.76a6 6 0 0 0-8.49 0L3.5 12a2 2 0 0 0-.5.92L2 19l6.08-1a2 2 0 0 0 .92-.5l8.24-8.25a6 6 0 0 0 0-8.49z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M20.24 3.76a6 6 0 0 0-8.49 0L3.5 12a2 2 0 0 0-.5.92L2 19l6.08-1a2 2 0 0 0 .92-.5l8.24-8.25a6 6 0 0 0 0-8.49zM16 8L8 16M14 6l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logotipo({
  tamanho = "md",
  comSubtitulo = true,
  linkHref = "/",
  className = "",
}: LogotipoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-base font-semibold",
    md: "text-lg font-bold",
    lg: "text-2xl font-bold",
  };

  const conteudo = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 ${iconSizes[tamanho]}`}>
        <PenaIcone className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className={`tracking-tight text-slate-900 leading-tight ${textSizes[tamanho]}`}>
          Memória Reflexiva
        </span>
        {comSubtitulo && (
          <span className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
            Seu acervo. Sua inteligência. Novas reflexões.
          </span>
        )}
      </div>
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="inline-flex items-center group transition-opacity hover:opacity-95">
        {conteudo}
      </Link>
    );
  }

  return conteudo;
}
