"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Feather, Mail, Compass, FileText, Layers, Sparkles, Download, Trash2, MoreVertical, CheckCircle2, Clock, Loader2, Cpu, Eye, Zap, Tag } from "lucide-react";
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
    case "livro": return <BookOpen className="w-3.5 h-3.5" />;
    case "reflexao": return <Sparkles className="w-3.5 h-3.5" />;
    case "carta": return <Mail className="w-3.5 h-3.5" />;
    case "relato": return <Compass className="w-3.5 h-3.5" />;
    case "ensaio": return <Feather className="w-3.5 h-3.5" />;
    case "artigo": return <FileText className="w-3.5 h-3.5" />;
    default: return <Layers className="w-3.5 h-3.5" />;
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
  if (!bytes || bytes <= 0) return "Tamanho não informado";
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
  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const [baixando, setBaixando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const menuId = `menu-acoes-obra-${obra.id}`;

  useEffect(() => {
    if (!menuAberto) return;

    function lidarEscape(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      evento.preventDefault();
      setMenuAberto(false);
      botaoMenuRef.current?.focus();
    }

    document.addEventListener("keydown", lidarEscape);
    return () => document.removeEventListener("keydown", lidarEscape);
  }, [menuAberto]);

  async function lidarDownload() {
    if (!obra.arquivo_caminho) return;
    try {
      setBaixando(true);
      const url = await obterUrlDownloadOriginal(
        obra.arquivo_caminho,
        obra.titulo,
        obra.arquivo_nome_original
      );
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
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

  const totalPaginas = obra.total_paginas > 0 ? obra.total_paginas : null;

  // Cores de capa dinâmicas para gerar estilo livro
  const coresCapa = [
    "from-amber-700 to-amber-900",
    "from-blue-700 to-indigo-950",
    "from-emerald-700 to-teal-950",
    "from-slate-700 to-slate-900",
  ];
  const indiceCor = Math.abs(obra.titulo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % coresCapa.length;
  const gradienteCapa = coresCapa[indiceCor];

  const estaProcessado = obra.estado_processamento === "processado";
  const estaProcessando = obra.estado_processamento === "em_processamento" || obra.estado_processamento === "reprocessando";
  const estaPendente = !estaProcessado && !estaProcessando;
  const tagsObra = Array.isArray(obra.metadados?.tags)
    ? obra.metadados.tags.filter(
        (tag): tag is string => typeof tag === "string" && tag.trim().length > 0
      )
    : [];
  const tagsVisiveis = tagsObra.slice(0, 3);
  const totalTagsOcultas = Math.max(0, tagsObra.length - tagsVisiveis.length);
  const temAcaoSecundaria =
    (estaProcessado && Boolean(aoVerFragmentos)) ||
    (estaPendente && Boolean(aoIniciarProcessamento)) ||
    estaProcessando;
  const tituloId = `obra-titulo-${obra.id}`;

  return (
    <article
      aria-labelledby={tituloId}
      className="group relative bg-white border border-slate-200 hover:border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
    >
      {/* Linha Superior Colorida por Status */}
      <div className={`h-1 w-full ${estaProcessado ? "bg-emerald-500" : estaProcessando ? "bg-blue-500" : "bg-amber-400"}`} />

      <div className="p-4 flex items-start gap-3 sm:gap-4 flex-1">
        {/* Miniatura / Capa Estilizada do Livro */}
        <div
          aria-hidden="true"
          className={`w-16 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br ${gradienteCapa} p-2 flex flex-col justify-between text-white shadow-md shrink-0 relative overflow-hidden transition-transform group-hover:scale-[1.03]`}
          style={{ minHeight: "7rem" }}
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
          <span className="text-[9px] font-medium tracking-tight opacity-75 uppercase truncate">
            {obra.tipo}
          </span>
          <p className="text-[10px] font-serif font-bold leading-tight line-clamp-3">
            {obra.titulo}
          </p>
          <div className="flex items-center justify-between text-[8px] opacity-75">
            <span>{obra.ano_publicacao || "Ano não informado"}</span>
            <BookOpen className="w-2.5 h-2.5" />
          </div>
        </div>

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

          <h3
            id={tituloId}
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate group-hover:text-blue-600"
          >
            <Link
              href={`/biblioteca/${obra.id}`}
              className="transition-colors after:absolute after:inset-0 after:z-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-blue-500 focus-visible:after:ring-inset"
            >
              {obra.titulo}
            </Link>
          </h3>

          {obra.subtitulo && (
            <p className="text-xs text-slate-500 italic truncate mt-0.5">
              {obra.subtitulo}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1.5">
            <span>{obra.ano_publicacao || "Ano não informado"}</span>
            {totalPaginas !== null && (
              <>
                <span>•</span>
                <span>{totalPaginas} págs</span>
              </>
            )}
            <span>•</span>
            <span>{formatarBytes(obra.arquivo_tamanho_bytes)}</span>
          </div>

          {tagsVisiveis.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3 w-3 text-slate-400" />
              {tagsVisiveis.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
              {totalTagsOcultas > 0 && (
                <span className="text-[10px] font-medium text-slate-400">
                  +{totalTagsOcultas}
                </span>
              )}
            </div>
          )}

          {/* Badge de Estado */}
          <div className="mt-2.5">
            {estaProcessado ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Processado
              </span>
            ) : estaProcessando ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                Processando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Pendente de análise
              </span>
            )}
          </div>
        </div>

        {/* Menu de Ações (Três Pontinhos) */}
        <div className="relative z-20 shrink-0">
          <button
            ref={botaoMenuRef}
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label={`Ações da obra ${obra.titulo}`}
            aria-expanded={menuAberto}
            aria-controls={menuId}
            aria-haspopup="true"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuAberto && (
            <>
              {/* Overlay para fechar ao clicar fora */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuAberto(false)}
              />
              <div
                id={menuId}
                className="absolute right-0 top-9 z-20 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
              >
                <Link
                  href={`/biblioteca/${obra.id}`}
                  onClick={() => setMenuAberto(false)}
                  className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  Ver Detalhes do Documento
                </Link>

                {obra.arquivo_caminho && (
                  <button
                    type="button"
                    onClick={lidarDownload}
                    disabled={baixando}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                  >
                    {baixando ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    Baixar Arquivo Original
                  </button>
                )}

                {aoVerFragmentos && estaProcessado && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      aoVerFragmentos(obra);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Ver Fragmentos / Chunks
                  </button>
                )}

                {aoIniciarProcessamento && estaPendente && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      aoIniciarProcessamento(obra);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    Processar com IA
                  </button>
                )}

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={lidarExcluir}
                  disabled={excluindo}
                  className="w-full px-3.5 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors disabled:opacity-50 font-medium"
                >
                  {excluindo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Excluir Documento
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Barra de Ações Inline na Base do Card */}
      <div className="relative z-20 border-t border-slate-100 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 bg-slate-50/60">
        <Link
          href={`/biblioteca/${obra.id}`}
          className="inline-flex min-h-6 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Eye className="w-3.5 h-3.5" />
          Abrir
        </Link>

        {temAcaoSecundaria && (
          <>
            <span aria-hidden="true" className="text-slate-300">|</span>

            {estaProcessado && aoVerFragmentos ? (
              <button
                type="button"
                onClick={() => aoVerFragmentos(obra)}
                className="inline-flex min-h-6 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ver Fragmentos
              </button>
            ) : estaPendente && aoIniciarProcessamento ? (
              <button
                type="button"
                onClick={() => aoIniciarProcessamento(obra)}
                className="inline-flex min-h-6 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Zap className="w-3.5 h-3.5" />
                Processar com IA
              </button>
            ) : estaProcessando ? (
              <span className="inline-flex min-h-6 items-center gap-1.5 text-xs font-medium text-blue-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processando...
              </span>
            ) : null}
          </>
        )}

        <span aria-hidden="true" className="text-slate-300">|</span>

        <button
          type="button"
          onClick={lidarDownload}
          disabled={baixando || !obra.arquivo_caminho}
          className="inline-flex min-h-6 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          {baixando ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Baixar
        </button>
      </div>
    </article>
  );
}
