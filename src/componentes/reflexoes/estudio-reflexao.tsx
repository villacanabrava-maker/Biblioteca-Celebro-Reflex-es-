"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Brain,
  FileText,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type {
  EntradaReflexao,
  PlanoReflexao,
  VersaoReflexao,
  CitacaoEvidencia,
} from "@/tipos/reflexoes";
import type { RelatorioAuditoria } from "@/tipos/auditoria";
import { PainelPlanoCognitivo } from "./painel-plano-cognitivo";
import { LeitorVersaoReflexao } from "./leitor-versao-reflexao";
import { PainelAuditoriaCritica } from "./painel-auditoria-critica";
import { PainelRevisaoAutor } from "./painel-revisao-autor";

interface Props {
  entrada: EntradaReflexao;
  plano: PlanoReflexao | null;
  versoes: (VersaoReflexao & {
    citacoes: CitacaoEvidencia[];
    auditoria?: RelatorioAuditoria | null;
  })[];
}

export function EstudioReflexao({ entrada, plano, versoes }: Props) {
  const router = useRouter();

  const abaPadrao =
    versoes.length > 0
      ? "auditoria"
      : plano
      ? "plano"
      : "intencao";

  const [abaAtiva, setAbaAtiva] = useState<
    "intencao" | "plano" | "texto" | "auditoria" | "revisao"
  >(abaPadrao);

  const [versaoSelecionadaId, setVersaoSelecionadaId] = useState<string>(
    versoes[0]?.id || ""
  );

  const versaoAtual =
    versoes.find((v) => v.id === versaoSelecionadaId) || versoes[0];

  const relatorioAuditoriaAtual = versaoAtual?.auditoria || null;
  const conflitos = (entrada.conflitos_detectados as any[]) || [];
  const dossie = (entrada.dossie_contexto as any) || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Cabeçalho */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/reflexoes"
            className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Reflexões</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold truncate">{entrada.titulo}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-700">
                Formato: {entrada.formato_desejado}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-medium capitalize">
                Estado: {entrada.estado.replace("_", " ")}
              </span>
              {entrada.incorporado_biblioteca && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Obra na Biblioteca
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
              {entrada.titulo}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Tema Central: <span className="text-slate-800 font-medium">{entrada.tema_central}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navegação por Etapas do Estúdio */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setAbaAtiva("intencao")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "intencao"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. Estímulo & Dossiê</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("plano")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "plano"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>2. Plano Cognitivo</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("auditoria")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "auditoria"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>3. Auditor Crítico</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("texto")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "texto"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>4. Texto & Evidências ({versoes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("revisao")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
            abaAtiva === "revisao"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>5. Decisão & Incorporação</span>
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {abaAtiva === "intencao" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Estímulo Externo e Comentário Atual do Autor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ponto de partida ontológico para a formulação do pensamento novo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Reflexão / Estímulo Externo:
              </span>
              <p className="text-slate-800 leading-relaxed font-serif text-sm">
                “{entrada.reflexao_externa || entrada.provocacao_inicial}”
              </p>
              {entrada.tipo_origem_externa && (
                <span className="inline-block text-[10px] text-slate-400">
                  Origem: {entrada.tipo_origem_externa}
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Comentário Atual do Autor:
              </span>
              <p className="text-slate-800 leading-relaxed font-serif text-sm">
                “{entrada.comentario_autor || "Nenhum comentário pessoal adicional registrado."}”
              </p>
            </div>
          </div>

          {/* Conflitos Dialéticos Identificados */}
          {conflitos.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Tensões e Conflitos Dialéticos Mapeados ({conflitos.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {conflitos.map((c, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 capitalize">{c.tipo}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{c.descricao}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="bg-white/80 p-2 rounded-xl border border-amber-200/50">
                        <strong className="text-slate-500 block text-[10px] uppercase">Posição Externa:</strong>
                        <span className="text-slate-700">{c.posicao_externa}</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-amber-200/50">
                        <strong className="text-blue-600 block text-[10px] uppercase">Posição Autoral:</strong>
                        <span className="text-slate-700">{c.posicao_autoral}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memórias Recuperadas do Dossiê */}
          {dossie.fragmentos_selecionados && dossie.fragmentos_selecionados.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Memórias do Acervo Mobilizadas no Dossiê ({dossie.fragmentos_selecionados.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dossie.fragmentos_selecionados.map((m: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 block truncate">
                      {m.obra_titulo}
                    </span>
                    <p className="text-slate-600 font-serif line-clamp-3 text-[11px] leading-relaxed">
                      “{m.conteudo}”
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {abaAtiva === "plano" && (
        <PainelPlanoCognitivo
          plano={plano}
          entradaId={entrada.id}
          temVersao={versoes.length > 0}
          aoConcluirRedacao={() => {
            router.refresh();
            setAbaAtiva("auditoria");
          }}
        />
      )}

      {abaAtiva === "texto" && (
        <LeitorVersaoReflexao
          versoes={versoes}
          versaoSelecionadaId={versaoSelecionadaId}
          aoMudarVersao={(id) => setVersaoSelecionadaId(id)}
        />
      )}

      {abaAtiva === "auditoria" && (
        <PainelAuditoriaCritica
          relatorio={relatorioAuditoriaAtual}
          versaoId={versaoAtual?.id}
          aoReexecutar={() => router.refresh()}
        />
      )}

      {abaAtiva === "revisao" && (
        <PainelRevisaoAutor
          versaoId={versaoAtual?.id}
          entradaId={entrada.id}
          estadoEntrada={entrada.estado}
          incorporado={entrada.incorporado_biblioteca}
          obraIncorporadaId={entrada.obra_incorporada_id}
          aoSalvar={() => router.refresh()}
        />
      )}
    </div>
  );
}
