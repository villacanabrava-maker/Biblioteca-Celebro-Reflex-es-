"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Feather,
  Mail,
  Compass,
  FileText,
  Layers,
  Sparkles,
  Download,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Cpu,
  ExternalLink,
} from "lucide-react";
import type { ObraDetalhada, TipoObra } from "@/tipos/biblioteca";
import { obterUrlDownloadOriginal, excluirObra } from "@/acoes/biblioteca";

interface Props {
  obra: ObraDetalhada;
  aoExcluir?: (id: string) => void;
  aoIniciarProcessamento?: (obra: ObraDetalhada) => void;
  aoVerFragmentos?: (obra: ObraDetalhada) => void;
}

function obterIconeTipo(tipo: TipoObra) {
  switch (tipo) {
    case "livro":
      return <BookOpen className="w-3.5 h-3.5" />;
    case "reflexao":
      return <Sparkles className="w-3.5 h-3.5" />;
    case "carta":
      return <Mail className="w-3.5 h-3.5" />;
    case "relato":
      return <Compass className="w-3.5 h-3.5" />;
    case "ensaio":
      return <Feather className="w-3.5 h-3.5" />;
    case "artigo":
      return <FileText className="w-3.5 h-3.5" />;
    default:
      return <Layers className="w-3.5 h-3.5" />;
  }
}

function formatarRotuloTipo(tipo: TipoObra): string {
  const mapa: Record<TipoObra, string> = {
    livro: "Livro",
    reflexao: "Reflexão",
    carta: "Carta",
    relato: "Relato",
    ensaio: "Ensaio",
    artigo: "Artigo",
    caderno_notas: "Caderno de Notas",
    entrevista: "Entrevista",
    outro: "Documento",
  };
  return mapa[tipo] || "Documento";
}

function formatarBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "1.2 MB";
  const unidades = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${unidades[i]}`;
}

export function CardObra({
  obra,
  aoExcluir,
  aoIniciarProcessamento,
  aoVerFragmentos,
}: Props) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function lidarDownload() {
    if (!obra.arquivo_caminho) return;
    try {
      setBaixando(true);
      const url = await obterUrlDownloadOriginal(obra.arquivo_caminho);
      window.open(url, "_blank");
    } catch (err) {
      alert("Erro ao gerar link de download do arquivo.");
    } finally {
      setBaixando(false);
      setMenuAberto(false);
    }
  }

  async function lidarExcluir() {
    const confirmou = confirm(
      `Deseja realmente remover a obra "${obra.titulo}" do seu acervo?`
    );
    if (!confirmou) return;

    try {
      setExcluindo(true);
      await excluirObra(obra.id);
      aoExcluir?.(obra.id);
    } catch (err: any) {
      alert(`Falha ao excluir obra: ${err.message}`);
    } finally {
      setExcluindo(false);
      setMenuAberto(false);
    }
  }

  const paginasEstimadas = obra.total_paginas || Math.max(1, Math.round((obra.arquivo_tamanho_bytes || 50000) / 2500));

  // Cores de capa dinâmicas para gerar estilo livro
  const coresCapa = [
    "from-amber-700 to-amber-900",
    "from-blue-700 to-indigo-950",
    "from-emerald-700 to-teal-950",
    "from-slate-700 to-slate-900",
  ];
  const indiceCor = Math.abs(obra.titulo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % coresCapa.length;
  const gradienteCapa = coresCapa[indiceCor];

  return (
    <div className="group relative bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
      {/* Miniatura / Capa Estilizada do Livro */}
      <Link
        href={`/biblioteca/${obra.id}`}
        className={`w-16 h-22 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br ${gradienteCapa} p-2 flex flex-col justify-between text-white shadow-sm shrink-0 relative overflow-hidden group-hover:scale-[1.02] transition-transform`}
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
        <span className="text-[9px] font-medium tracking-tight opacity-75 uppercase truncate">
          {obra.tipo}
        </span>
        <p className="text-[10px] font-serif font-bold leading-tight line-clamp-3">
          {obra.titulo}
        </p>
        <div className="flex items-center justify-between text-[8px] opacity-75">
          <span>{obra.ano_publicacao || "2026"}</span>
          <BookOpen className="w-2.5 h-2.5" />
        </div>
      </Link>

      {/* Conteúdo Central */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {obterIconeTipo(obra.tipo)}
            {formatarRotuloTipo(obra.tipo)}
          </span>

          {obra.natureza === "autoral" ? (
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              Autoral
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Externa
            </span>
          )}
        </div>

        <Link href={`/biblioteca/${obra.id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
            {obra.titulo}
          </h3>
        </Link>

        {obra.subtitulo && (
          <p className="text-xs text-slate-500 italic truncate mt-0.5">
            {obra.subtitulo}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-2">
          <span>{obra.ano_publicacao || "2026"}</span>
          <span>•</span>
          <span>{paginasEstimadas} páginas</span>
          <span>•</span>
          <span>{formatarBytes(obra.arquivo_tamanho_bytes)}</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          {obra.estado_processamento === "processado" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Processado
            </span>
          ) : obra.estado_processamento === "em_processamento" || obra.estado_processamento === "reprocessando" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              Processando
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Pendente de análise
            </span>
          )}

          <Link
            href={`/biblioteca/${obra.id}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Abrir <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Menu de Ações (Três Pontinhos) */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          aria-label="Ações da obra"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuAberto && (
          <div className="absolute right-0 top-9 z-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <Link
              href={`/biblioteca/${obra.id}`}
              onClick={() => setMenuAberto(false)}
              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Ver Detalhes do Documento
            </Link>

            {obra.arquivo_caminho && (
              <button
                onClick={lidarDownload}
                disabled={baixando}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {baixando ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                )}
                Baixar Arquivo Original
              </button>
            )}

            {aoVerFragmentos && obra.estado_processamento === "processado" && (
              <button
                onClick={() => {
                  setMenuAberto(false);
                  aoVerFragmentos(obra);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Ver Fragmentos / Chunks
              </button>
            )}

            {aoIniciarProcessamento && obra.estado_processamento !== "processado" && (
              <button
                onClick={() => {
                  setMenuAberto(false);
                  aoIniciarProcessamento(obra);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Processar com IA
              </button>
            )}

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={lidarExcluir}
              disabled={excluindo}
              className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors disabled:opacity-50 font-medium"
            >
              {excluindo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Excluir Documento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
