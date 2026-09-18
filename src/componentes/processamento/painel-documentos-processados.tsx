"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FileCheck2, BookOpen, Sparkles, Layers, ArrowRight, Search, Filter, LayoutGrid, List, Quote, Database } from "lucide-react";
import type { DocumentoProcessadoResumo } from "@/acoes/processamento";
import { clsx } from "clsx";

interface Props {
  documentos?: DocumentoProcessadoResumo[];
}

export function PainelDocumentosProcessados({ documentos = [] }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroAutoria, setFiltroAutoria] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modoExibicao, setModoExibicao] = useState<"grid" | "lista">("grid");

  // Métricas gerais computadas
  const metricas = useMemo(() => {
    const totalObras = documentos.length;
    const totalFragmentos = documentos.reduce((acc, d) => acc + (d.total_fragmentos || 0), 0);
    const totalPalavras = documentos.reduce((acc, d) => acc + (d.total_palavras || 0), 0);
    const totalSecoes = documentos.reduce((acc, d) => acc + (d.total_secoes || 0), 0);
    const totalAutorais = documentos.filter((d) => d.autoria === "autoral").length;
    const totalReferencias = totalObras - totalAutorais;

    return {
      totalObras,
      totalFragmentos,
      totalPalavras,
      totalSecoes,
      totalAutorais,
      totalReferencias,
    };
  }, [documentos]);

  // Filtragem dinâmica
  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const matchBusca =
        !busca.trim() ||
        doc.titulo_processado.toLowerCase().includes(busca.toLowerCase()) ||
        (doc.autor_nome && doc.autor_nome.toLowerCase().includes(busca.toLowerCase())) ||
        doc.obra_tipo.toLowerCase().includes(busca.toLowerCase());

      const matchAutoria =
        filtroAutoria === "todos" ||
        (filtroAutoria === "autoral" && doc.autoria === "autoral") ||
        (filtroAutoria === "externa" && doc.autoria !== "autoral");

      const matchTipo = filtroTipo === "todos" || doc.obra_tipo === filtroTipo;

      return matchBusca && matchAutoria && matchTipo;
    });
  }, [documentos, busca, filtroAutoria, filtroTipo]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Topo & Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span className="uppercase tracking-wider font-mono text-[11px]">Pipeline Cognitivo de IA</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Documentos Processados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Auditoria, decomposição e materiais computacionais extraídos das suas obras.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/biblioteca"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Gerenciar Biblioteca</span>
          </Link>
          <Link
            href="/reflexoes/criar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Nova Reflexão</span>
          </Link>
        </div>
      </div>

      {/* 2. Painel de Métricas da Extração */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Obras Processadas
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metricas.totalObras}</p>
          <p className="text-[11px] text-slate-500">
            {metricas.totalAutorais} autorais &middot; {metricas.totalReferencias} referências
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Fragmentos Vetorizados
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metricas.totalFragmentos}</p>
          <p className="text-[11px] text-indigo-600 font-medium">
            Embeddings 1536d com HNSW
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total de Palavras
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Quote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {metricas.totalPalavras > 1000
              ? `${(metricas.totalPalavras / 1000).toFixed(1)}k`
              : metricas.totalPalavras}
          </p>
          <p className="text-[11px] text-slate-500">
            Indexadas no vocabulário
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Seções Hierárquicas
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metricas.totalSecoes}</p>
          <p className="text-[11px] text-slate-500">
            Capítulos & subseções
          </p>
        </div>
      </div>

      {/* 3. Barra de Controles, Busca e Filtros */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Campo de Busca com Ícone */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título da obra, autor ou tipo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
            />
          </div>

          {/* Alternador de Layout Grid / Lista */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-end sm:self-auto shrink-0">
            <button
              onClick={() => setModoExibicao("grid")}
              className={clsx(
                "p-1.5 rounded-xl text-xs font-medium transition-all",
                modoExibicao === "grid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              title="Exibição em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModoExibicao("lista")}
              className={clsx(
                "p-1.5 rounded-xl text-xs font-medium transition-all",
                modoExibicao === "lista"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              title="Exibição em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros em Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Filtros:
          </span>

          {/* Filtro Autoria */}
          <button
            onClick={() => setFiltroAutoria("todos")}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-medium transition-all",
              filtroAutoria === "todos"
                ? "bg-slate-900 text-white font-semibold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Todas as Obras
          </button>
          <button
            onClick={() => setFiltroAutoria("autoral")}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-medium transition-all",
              filtroAutoria === "autoral"
                ? "bg-blue-600 text-white font-semibold"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            Núcleo Autoral
          </button>
          <button
            onClick={() => setFiltroAutoria("externa")}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-medium transition-all",
              filtroAutoria === "externa"
                ? "bg-purple-600 text-white font-semibold"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            )}
          >
            Influências & Referências
          </button>
        </div>
      </div>

      {/* 4. Lista ou Grade de Documentos */}
      {documentosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Nenhum documento encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente mudar os termos da busca ou os filtros de autoria.
            </p>
          </div>
          <button
            onClick={() => {
              setBusca("");
              setFiltroAutoria("todos");
              setFiltroTipo("todos");
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : modoExibicao === "grid" ? (
        /* MODO GRADE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documentosFiltrados.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Badges e Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.obra_tipo}
                  </span>
                  <span
                    className={clsx(
                      "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                      doc.autoria === "autoral"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    )}
                  >
                    {doc.autoria === "autoral" ? "Núcleo Autoral" : "Referência Externa"}
                  </span>
                </div>

                {/* Título & Autor */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {doc.titulo_processado}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Autor: <span className="font-medium text-slate-700">{doc.autor_nome}</span>
                  </p>
                </div>

                {/* Métricas Extraídas */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono block">Seções</span>
                    <span className="text-xs font-bold text-slate-800">{doc.total_secoes}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono block">Fragmentos</span>
                    <span className="text-xs font-bold text-slate-800">{doc.total_fragmentos}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-mono block">Palavras</span>
                    <span className="text-xs font-bold text-slate-800">
                      {doc.total_palavras > 1000
                        ? `${(doc.total_palavras / 1000).toFixed(1)}k`
                        : doc.total_palavras}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas do Card */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/reflexoes/criar?fonteId=${doc.obra_id}`}
                  className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  title="Criar reflexão baseada neste documento"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Refletir</span>
                </Link>

                <Link
                  href={`/documentos-processados/${doc.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all group/link"
                >
                  <span>Inspecionar</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODO LISTA DENSA */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {documentosFiltrados.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                        {doc.titulo_processado}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {doc.obra_tipo}
                      </span>
                      <span
                        className={clsx(
                          "text-[10px] px-2 py-0.5 rounded-full",
                          doc.autoria === "autoral"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        )}
                      >
                        {doc.autoria === "autoral" ? "Núcleo Autoral" : "Referência"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Autor: <span className="font-medium text-slate-700">{doc.autor_nome}</span> &middot;{" "}
                      {doc.total_secoes} seções &middot; {doc.total_fragmentos} fragmentos &middot;{" "}
                      {doc.total_palavras.toLocaleString("pt-BR")} palavras
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Link
                    href={`/documentos-processados/${doc.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all"
                  >
                    <span>Inspecionar Extração</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
