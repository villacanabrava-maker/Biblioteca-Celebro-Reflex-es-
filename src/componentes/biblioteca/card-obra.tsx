"use client";

import { useState } from "react";
import {
  BookOpen,
  Feather,
  Mail,
  Compass,
  FileText,
  FileSpreadsheet,
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
      return <BookOpen className="w-4 h-4" />;
    case "reflexao":
      return <Sparkles className="w-4 h-4" />;
    case "carta":
      return <Mail className="w-4 h-4" />;
    case "relato":
      return <Compass className="w-4 h-4" />;
    case "ensaio":
      return <Feather className="w-4 h-4" />;
    case "artigo":
      return <FileText className="w-4 h-4" />;
    case "caderno_notas":
      return <FileSpreadsheet className="w-4 h-4" />;
    default:
      return <Layers className="w-4 h-4" />;
  }
}

function formatarBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const unidades = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${unidades[i]}`;
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
    outro: "Outro",
  };
  return mapa[tipo] || "Obra";
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
      `Tem certeza que deseja excluir a obra "${obra.titulo}"? Esta ação removerá os arquivos associados.`
    );
    if (!confirmou) return;

    try {
      setExcluindo(true);
      await excluirObra(obra.id);
      aoExcluir?.(obra.id);
    } catch (err) {
      alert("Erro ao excluir obra.");
    } finally {
      setExcluindo(false);
      setMenuAberto(false);
    }
  }

  const ehAutoral = obra.natureza === "autoral";
  const ehExterna = obra.natureza === "externa_aprovada";

  return (
    <div
      className={`group relative bg-neutral-900/70 border transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-black/40 ${
        ehAutoral
          ? "border-amber-500/20 hover:border-amber-500/40 hover:bg-neutral-900/90"
          : ehExterna
          ? "border-blue-500/20 hover:border-blue-500/40 hover:bg-neutral-900/90"
          : "border-neutral-800 hover:border-neutral-700"
      }`}
    >
      {/* Faixa decorativa superior */}
      <div className="flex items-start justify-between gap-3 mb-4">
        {/* Badges de Tipo e Natureza */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge Natureza */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
              ehAutoral
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : ehExterna
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
            }`}
          >
            {ehAutoral && <Sparkles className="w-3 h-3 text-amber-400" />}
            {ehExterna && <Compass className="w-3 h-3 text-blue-400" />}
            {ehAutoral
              ? "Núcleo Autoral"
              : ehExterna
              ? "Influência Externa"
              : "Referência"}
          </span>

          {/* Badge Tipo */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
            {obterIconeTipo(obra.tipo)}
            {formatarRotuloTipo(obra.tipo)}
          </span>
        </div>

        {/* Menu de Ações */}
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Ações da obra"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuAberto && (
            <div className="absolute right-0 top-9 z-20 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1.5 backdrop-blur-md">
              {obra.arquivo_caminho && (
                <button
                  onClick={lidarDownload}
                  disabled={baixando}
                  className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {baixando ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
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
                  className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Ver Fragmentos Processados
                </button>
              )}

              {aoIniciarProcessamento && obra.estado_processamento !== "processado" && (
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    aoIniciarProcessamento(obra);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-amber-300 flex items-center gap-2 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  Processar com IA
                </button>
              )}

              <div className="h-px bg-neutral-800 my-1" />

              <button
                onClick={lidarExcluir}
                disabled={excluindo}
                className="w-full px-3 py-2 text-xs text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {excluindo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Excluir Obra
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="space-y-2 mb-6">
        <h3 className="font-serif text-lg md:text-xl font-medium text-neutral-100 line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors">
          {obra.titulo}
        </h3>

        {obra.subtitulo && (
          <p className="text-xs md:text-sm text-neutral-400 italic line-clamp-1">
            {obra.subtitulo}
          </p>
        )}

        {obra.descricao && (
          <p className="text-xs text-neutral-400/90 line-clamp-2 leading-relaxed pt-1">
            {obra.descricao}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1 font-mono">
          <span>{obra.autor_nome}</span>
          {obra.ano_publicacao && (
            <>
              <span>•</span>
              <span>{obra.ano_publicacao}</span>
            </>
          )}
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Status de Processamento */}
        <div className="flex items-center gap-1.5">
          {obra.estado_processamento === "processado" && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Processado
            </span>
          )}
          {obra.estado_processamento === "em_processamento" && (
            <span className="inline-flex items-center gap-1 text-blue-400 font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processando
            </span>
          )}
          {obra.estado_processamento === "pendente" && (
            <span className="inline-flex items-center gap-1 text-amber-400/90">
              <Clock className="w-3.5 h-3.5" />
              Pendente
            </span>
          )}
          {obra.estado_processamento === "falha" && (
            <span className="inline-flex items-center gap-1 text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Falha
            </span>
          )}
        </div>

        {/* Metadados do Arquivo */}
        <div className="text-neutral-400 flex items-center gap-2 font-mono text-[11px]">
          {obra.total_paginas > 0 && (
            <span>{obra.total_paginas} págs</span>
          )}
          {obra.arquivo_tamanho_bytes && (
            <span>{formatarBytes(obra.arquivo_tamanho_bytes)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
