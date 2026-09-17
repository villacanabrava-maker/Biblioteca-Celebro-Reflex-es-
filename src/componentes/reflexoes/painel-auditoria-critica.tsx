"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Ban,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import type { RelatorioAuditoria } from "@/tipos/auditoria";
import { reexecutarAuditoria } from "@/acoes/auditoria";

interface Props {
  relatorio?: RelatorioAuditoria | null;
  versaoId?: string;
  entradaId?: string;
  aoReexecutar?: () => void;
}

const INFO_VEREDITO: Record<
  string,
  { rotulo: string; descricao: string; corBorda: string; corBadge: string; icone: any }
> = {
  aprovado: {
    rotulo: "APROVADO COM EXCELÊNCIA",
    descricao: "O texto reflete com fidelidade rigorosa a metodologia, os conceitos e a voz do autor.",
    corBorda: "border-emerald-500/40",
    corBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icone: ShieldCheck,
  },
  ressalvas: {
    rotulo: "APROVADO COM RESSALVAS",
    descricao: "O texto preserva a essência autoral, mas contém pequenos desvios ou trechos a refinar.",
    corBorda: "border-amber-500/40",
    corBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icone: AlertTriangle,
  },
  rejeitado: {
    rotulo: "REJEITADO PELO AUDITOR",
    descricao: "Identificadas violações de anti-regras, alucinações conceituais ou tom artificial inaceitável.",
    corBorda: "border-rose-500/40",
    corBadge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icone: Ban,
  },
};

export function PainelAuditoriaCritica({
  relatorio,
  versaoId,
  entradaId,
  aoReexecutar,
}: Props) {
  const [reexecutando, setReexecutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!relatorio) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-neutral-200">
          Auditoria Crítica Pendente
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Assim que uma versão for redigida, o Auditor Crítico Independente avaliará a conformidade metodológica e ausência de alucinações.
        </p>
      </div>
    );
  }

  const vereditoConfig =
    INFO_VEREDITO[relatorio.veredito] || INFO_VEREDITO.ressalvas;
  const IconeVeredito = vereditoConfig.icone;

  const handleReauditar = async () => {
    if (!versaoId) return;
    try {
      setReexecutando(true);
      setErro(null);
      await reexecutarAuditoria(versaoId, entradaId);
      aoReexecutar?.();
    } catch (err: any) {
      console.error("Erro ao reexecutar auditoria:", err);
      setErro(err.message || "Falha ao reexecutar auditoria.");
    } finally {
      setReexecutando(false);
    }
  };

  const pilares = [
    {
      nome: "Fidelidade Ontológica (Taxonomia)",
      nota: Math.round(relatorio.pontuacao_fidelidade_ontologica * 100),
      desc: "Uso rigoroso dos termos e definições canônicas do autor",
    },
    {
      nome: "Fidelidade Metodológica (18 Dimensões)",
      nota: Math.round(relatorio.pontuacao_fidelidade_metodologica * 100),
      desc: "Aderência aos movimentos de pensamento e análise",
    },
    {
      nome: "Precisão de Evidências (Anti-alucinação)",
      nota: Math.round(relatorio.pontuacao_precisao_evidencias * 100),
      desc: "Fundamentação empírica lastreada no corpus original",
    },
    {
      nome: "Expressão & Voz Autoral",
      nota: Math.round(relatorio.pontuacao_expressao_estilo * 100),
      desc: "Ritmo, tom e expurgo de chavões artificiais de IA",
    },
    {
      nome: "Anti-regras (Respeito a Vetos)",
      nota: Math.round(relatorio.pontuacao_anti_regras * 100),
      desc: "Ausência total de infração a proscrições absolutas",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Principal do Veredito */}
      <div
        className={`bg-neutral-900/90 border ${vereditoConfig.corBorda} rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${vereditoConfig.corBadge}`}
          >
            <IconeVeredito className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${vereditoConfig.corBadge}`}
              >
                {vereditoConfig.rotulo}
              </span>
            </div>
            <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
              {vereditoConfig.descricao}
            </p>
          </div>
        </div>

        {/* Nota Global */}
        <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              Conformidade Geral
            </span>
            <div className="text-3xl font-serif font-semibold text-neutral-100">
              {Math.round(relatorio.pontuacao_geral * 100)}%
            </div>
          </div>

          {versaoId && (
            <button
              type="button"
              disabled={reexecutando}
              onClick={handleReauditar}
              className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
              title="Reexecutar Auditoria Crítica"
            >
              <RotateCcw
                className={`w-4 h-4 ${reexecutando ? "animate-spin text-amber-400" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {erro}
        </div>
      )}

      {/* Os 5 Pilares de Avaliação Crítica */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
          Avaliação nos 5 Pilares Canônicos
        </h4>

        <div className="space-y-4">
          {pilares.map((p) => {
            const corBarra =
              p.nota >= 85
                ? "bg-emerald-500"
                : p.nota >= 70
                ? "bg-amber-500"
                : "bg-rose-500";

            return (
              <div key={p.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-neutral-200">{p.nome}</span>
                    <span className="text-neutral-500 text-[11px] ml-2 hidden sm:inline">
                      • {p.desc}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-neutral-300">
                    {p.nota}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-neutral-950 border border-neutral-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                    style={{ width: `${p.nota}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regras Violadas (se houver) */}
      {relatorio.regras_violadas && relatorio.regras_violadas.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase font-semibold">
            <Ban className="w-4 h-4" />
            <span>Infrações Identificadas ({relatorio.regras_violadas.length})</span>
          </div>

          <div className="space-y-2.5">
            {relatorio.regras_violadas.map((rv, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950/70 border border-rose-500/20 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-rose-300">
                    Regra: "{rv.enunciado}"
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 uppercase">
                    Gravidade {rv.gravidade}
                  </span>
                </div>
                <p className="text-neutral-300">
                  <strong className="text-neutral-500">Trecho infrator:</strong>{" "}
                  <span className="italic">"{rv.trecho_infrator}"</span>
                </p>
                <p className="text-neutral-400 text-[11px]">{rv.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riscos de Alucinação */}
      {relatorio.riscos_alucinacao && relatorio.riscos_alucinacao.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Alertas de Consistência & Alucinação ({relatorio.riscos_alucinacao.length})</span>
          </div>

          <div className="space-y-2.5">
            {relatorio.riscos_alucinacao.map((ra, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950/70 border border-amber-500/20 text-xs space-y-1"
              >
                <p className="text-amber-200 font-medium italic">
                  "{ra.trecho_afirmacao}"
                </p>
                <p className="text-neutral-400 text-[11px]">{ra.explicacao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações de Melhoria */}
      {relatorio.recomendacoes_melhoria && relatorio.recomendacoes_melhoria.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
            Recomendações do Auditor para Refinamento
          </h4>

          <div className="space-y-2">
            {relatorio.recomendacoes_melhoria.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-start gap-2.5"
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-400 uppercase shrink-0 mt-0.5">
                  {rec.foco}
                </span>
                <p className="text-neutral-300 leading-relaxed">{rec.sugestao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parecer Crítico Completo */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-2">
        <h4 className="text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">
          Parecer Dissertativo do Auditor
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed font-serif whitespace-pre-wrap">
          {relatorio.analise_critica_completa}
        </p>
      </div>
    </div>
  );
}
