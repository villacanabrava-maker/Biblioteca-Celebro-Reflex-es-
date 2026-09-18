"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileCheck2,
  BookOpen,
  Brain,
  Sparkles,
  Layers,
  Search,
  Quote,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  Hash,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { ExtracaoCompletaDocumento } from "@/acoes/processamento";
import { clsx } from "clsx";

interface Props {
  dados: ExtracaoCompletaDocumento;
}

export function VisualizadorExtracaoLivro({ dados }: Props) {
  const { documento, obra, secoes, sinteses, fragmentos, conceitosVinculados, estatisticas } = dados;

  const [abaAtiva, setAbaAtiva] = useState<"estrutura" | "conhecimento" | "fragmentos" | "auditoria">("estrutura");
  const [secaoFiltroId, setSecaoFiltroId] = useState<string | "todas">("todas");
  const [buscaTermo, setBuscaTermo] = useState("");
  const [secaoExpandidaId, setSecaoExpandidaId] = useState<string | null>(secoes[0]?.id || null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Filtragem dos fragmentos
  const fragmentosFiltrados = useMemo(() => {
    return fragmentos.filter((f) => {
      const matchSecao = secaoFiltroId === "todas" || f.secao_id === secaoFiltroId;
      const matchBusca =
        !buscaTermo.trim() || f.conteudo.toLowerCase().includes(buscaTermo.toLowerCase());
      return matchSecao && matchBusca;
    });
  }, [fragmentos, secaoFiltroId, buscaTermo]);

  function copiarTexto(id: string, texto: string) {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header do Documento Processado */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/documentos-processados"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              <span>Voltar para Documentos Processados</span>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                {obra?.natureza === "autoral" ? "Núcleo Autoral" : "Referência Externa"}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium capitalize">
                {documento.estado_publicacao}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              {documento.titulo_processado}
            </h1>
            {obra && (
              <p className="text-sm text-slate-400 mt-1">
                Por <span className="text-slate-200 font-medium">{obra.autor_nome || "Você"}</span> &middot; Tipo:{" "}
                <span className="capitalize text-slate-300">{obra.tipo}</span>
              </p>
            )}
          </div>

          {/* Cards de Métricas da Extração */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Seções</span>
              <p className="text-lg font-bold text-white mt-0.5">{estatisticas.totalSecoes}</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Fragmentos</span>
              <p className="text-lg font-bold text-white mt-0.5">{estatisticas.totalFragmentos}</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Palavras</span>
              <p className="text-lg font-bold text-white mt-0.5">
                {estatisticas.totalPalavras.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Conceitos</span>
              <p className="text-lg font-bold text-white mt-0.5">{estatisticas.totalConceitos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra de Navegação em Abas */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1">
        <button
          onClick={() => setAbaAtiva("estrutura")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            abaAtiva === "estrutura"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>1. Árvore Estrutural ({secoes.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("conhecimento")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            abaAtiva === "conhecimento"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Brain className="w-4 h-4" />
          <span>2. Conhecimento & Sínteses ({sinteses.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("fragmentos")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            abaAtiva === "fragmentos"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Quote className="w-4 h-4" />
          <span>3. Evidências & Fragmentos ({fragmentos.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("auditoria")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            abaAtiva === "auditoria"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Dossiê de Auditoria</span>
        </button>
      </div>

      {/* 3. Conteúdo da Aba Selecionada */}

      {/* ABA 1: Árvore Estrutural */}
      {abaAtiva === "estrutura" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Estrutura Hierárquica da Obra
              </h2>
              <p className="text-xs text-slate-500">
                Divisão canônica extraída do livro (Partes, Capítulos e Subseções).
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {secoes.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Nenhuma seção cadastrada.</p>
            ) : (
              secoes.map((secao) => {
                const isExpandida = secaoExpandidaId === secao.id;
                const totalFrag = fragmentos.filter((f) => f.secao_id === secao.id).length;
                const sintese = sinteses.find((st) => st.secao_id === secao.id);

                return (
                  <div
                    key={secao.id}
                    className="border border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-300 bg-slate-50/50"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSecaoExpandidaId(isExpandida ? null : secao.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-mono text-xs font-bold">
                          {secao.ordem}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{secao.titulo}</h3>
                          <span className="text-[11px] text-slate-500 capitalize">
                            Tipo: {secao.tipo_secao} &middot; Nível {secao.nivel} &middot; {totalFrag} fragmentos
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSecaoFiltroId(secao.id);
                            setAbaAtiva("fragmentos");
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Ver fragmentos &rarr;
                        </button>
                        {isExpandida ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Conteúdo Expandido da Seção */}
                    {isExpandida && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                        {secao.resumo_secao && (
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1">Resumo da Seção:</span>
                            {secao.resumo_secao}
                          </div>
                        )}

                        {sintese && (
                          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl text-xs space-y-2">
                            <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Síntese Cognitiva da IA:
                            </span>
                            <p className="text-amber-950 leading-relaxed">{sintese.conteudo}</p>
                            {sintese.tese_principal && (
                              <p className="text-amber-900 font-medium">
                                <strong>Tese:</strong> {sintese.tese_principal}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ABA 2: Conhecimento & Sínteses Extraídas */}
      {abaAtiva === "conhecimento" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900">
              Conhecimento Extraído & Sínteses
            </h2>
            <p className="text-xs text-slate-500">
              Teses, argumentos, conceitos ontológicos e metáforas consolidadas pela IA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sinteses.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center col-span-2">
                Nenhuma síntese processada ainda.
              </p>
            ) : (
              sinteses.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold">
                        {st.tipo_sintese}
                      </span>
                    </div>

                    {st.tese_principal && (
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {st.tese_principal}
                      </h4>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                      {st.conteudo}
                    </p>
                  </div>

                  {st.conceitos_chave && st.conceitos_chave.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                      {st.conceitos_chave.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                        >
                          #{c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 3: Evidências & Fragmentos Textuais */}
      {abaAtiva === "fragmentos" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Evidências e Fragmentos Textuais
              </h2>
              <p className="text-xs text-slate-500">
                Trechos atômicos indexados com busca FTS e vetores HNSW 1536d.
              </p>
            </div>

            {/* Controles de Filtro */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar no texto..."
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {secaoFiltroId !== "todas" && (
                <button
                  onClick={() => setSecaoFiltroId("todas")}
                  className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl font-medium"
                >
                  Limpar Filtro de Seção
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {fragmentosFiltrados.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Nenhum fragmento encontrado.</p>
            ) : (
              fragmentosFiltrados.map((frag) => {
                const copiado = copiadoId === frag.id;

                return (
                  <div
                    key={frag.id}
                    className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/40 hover:bg-white hover:border-blue-300 transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-[11px]">
                          #{frag.ordem}
                        </span>
                        {frag.pagina_inicio && (
                          <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-mono">
                            Pág. {frag.pagina_inicio}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {frag.total_palavras} palavras
                        </span>
                      </div>

                      {/* Ações Rápidas por Fragmento */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copiarTexto(frag.id, frag.conteudo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Copiar trecho"
                        >
                          {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <Link
                          href={`/reflexoes/criar?trecho=${encodeURIComponent(frag.conteudo.slice(0, 300))}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Refletir sobre</span>
                        </Link>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-serif leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200/60">
                      “{frag.conteudo}”
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ABA 4: Dossiê de Auditoria */}
      {abaAtiva === "auditoria" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900">
              Dossiê de Integridade e Auditoria
            </h2>
            <p className="text-xs text-slate-500">
              Rastreabilidade computacional e conformidade com o Documento Mestre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Identificadores Canônicos:</span>
              <p className="text-xs font-mono text-slate-600 break-all">
                <strong>ID Documento:</strong> {documento.id}
              </p>
              <p className="text-xs font-mono text-slate-600 break-all">
                <strong>Versão da Obra:</strong> {documento.versao_obra_id}
              </p>
              <p className="text-xs font-mono text-slate-600 break-all">
                <strong>Usuário ID:</strong> {documento.usuario_id}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Métricas de Processamento:</span>
              <p className="text-xs text-slate-600">
                <strong>Estado de Publicação:</strong>{" "}
                <span className="capitalize font-medium text-emerald-600">{documento.estado_publicacao}</span>
              </p>
              <p className="text-xs text-slate-600">
                <strong>Tokens Estimados:</strong> {documento.total_tokens_estimado.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Data de Publicação:</strong>{" "}
                {new Date(documento.publicado_em || documento.criado_em).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
