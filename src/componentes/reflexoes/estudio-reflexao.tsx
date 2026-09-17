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
  Layers,
  ChevronRight,
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

  // Aba inicial baseada no progresso da reflexão
  const abaPadrao =
    versoes.length > 0
      ? "texto"
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Cabeçalho */}
      <div className="space-y-3 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <Link
            href="/reflexoes"
            className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Reflexões</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-neutral-200 truncate">{entrada.titulo}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {entrada.formato_desejado}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-300 capitalize">
                {entrada.estado.replace("_", " ")}
              </span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-neutral-100">
              {entrada.titulo}
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Tema: <span className="text-neutral-200">{entrada.tema_central}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navegação por Etapas do Estúdio */}
      <div className="flex items-center gap-2 border-b border-neutral-800 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setAbaAtiva("intencao")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            abaAtiva === "intencao"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. Intenção</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("plano")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            abaAtiva === "plano"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>2. Plano Cognitivo</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("texto")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            abaAtiva === "texto"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. Texto & Evidências ({versoes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("auditoria")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            abaAtiva === "auditoria"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>4. Auditor Crítico</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("revisao")}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            abaAtiva === "revisao"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>5. Revisão do Autor</span>
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {abaAtiva === "intencao" && (
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h3 className="font-serif text-lg font-medium text-neutral-100">
            Intenção Comunicativa do Autor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                Tema Central:
              </span>
              <p className="text-neutral-200 font-medium">{entrada.tema_central}</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                Formato:
              </span>
              <p className="text-neutral-200 font-medium capitalize">
                {entrada.formato_desejado}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block">
              Provocação Inicial (Centelha):
            </span>
            <p className="text-neutral-200 leading-relaxed font-serif text-sm">
              "{entrada.provocacao_inicial}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                Objetivo Comunicativo:
              </span>
              <p className="text-neutral-300">
                {entrada.objetivo_comunicativo || "Defesa e provocação de tese autoral"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                Público-Alvo:
              </span>
              <p className="text-neutral-300">
                {entrada.publico_alvo || "Interlocutores atentos"}
              </p>
            </div>
          </div>

          {entrada.restricoes_especificas && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold block">
                Restrições Específicas / Vetos:
              </span>
              <p className="text-neutral-300 leading-relaxed">
                {entrada.restricoes_especificas}
              </p>
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
            setAbaAtiva("texto");
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
          entradaId={entrada.id}
          aoReexecutar={() => router.refresh()}
        />
      )}

      {abaAtiva === "revisao" && (
        <PainelRevisaoAutor
          versaoId={versaoAtual?.id}
          entradaId={entrada.id}
          estadoEntrada={entrada.estado}
          aoSalvar={() => router.refresh()}
        />
      )}
    </div>
  );
}
