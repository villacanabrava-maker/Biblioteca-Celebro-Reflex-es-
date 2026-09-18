"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, Ban, AlertCircle, RotateCcw } from "lucide-react";
import type { RelatorioAuditoria } from "@/tipos/auditoria";
import { reexecutarAuditoria } from "@/acoes/auditoria";

interface Props {
  relatorio?: RelatorioAuditoria | null;
  versaoId?: string;
  entradaId?: string;
  aoReexecutar?: () => void;
  aoAuditarNovamente?: () => void;
}

const INFO_VEREDITO: Record<
  string,
  { rotulo: string; descricao: string; corBorda: string; corBadge: string; icone: any }
> = {
  aprovado: {
    rotulo: "APROVADO COM EXCELÊNCIA",
    descricao: "O texto reflete com fidelidade rigorosa a metodologia, os conceitos e a voz do autor.",
    corBorda: "border-emerald-200 bg-emerald-50/40",
    corBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icone: ShieldCheck,
  },
  ressalvas: {
    rotulo: "APROVADO COM RESSALVAS",
    descricao: "O texto preserva a essência autoral, mas contém pequenos desvios ou trechos a refinar.",
    corBorda: "border-amber-200 bg-amber-50/40",
    corBadge: "bg-amber-50 text-amber-800 border-amber-200",
    icone: AlertTriangle,
  },
  rejeitado: {
    rotulo: "REJEITADO PELO AUDITOR",
    descricao: "Identificadas violações de anti-regras, alucinações conceituais ou tom artificial inaceitável.",
    corBorda: "border-rose-200 bg-rose-50/40",
    corBadge: "bg-rose-50 text-rose-700 border-rose-200",
    icone: Ban,
  },
};

export function PainelAuditoriaCritica({
  relatorio,
  versaoId,
  entradaId,
  aoReexecutar,
  aoAuditarNovamente,
}: Props) {
  const [reexecutando, setReexecutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!relatorio) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800">
          Auditoria Crítica Pendente
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
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
      (aoReexecutar || aoAuditarNovamente)?.();
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
        className={`border ${vereditoConfig.corBorda} rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${vereditoConfig.corBadge}`}
          >
            <IconeVeredito className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${vereditoConfig.corBadge}`}
              >
                {vereditoConfig.rotulo}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed mt-1">
              {vereditoConfig.descricao}
            </p>
          </div>
        </div>

        {/* Nota Global */}
        <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Conformidade Geral
            </span>
            <div className="text-3xl font-serif font-bold text-slate-900">
              {Math.round(relatorio.pontuacao_geral * 100)}%
            </div>
          </div>

          {versaoId && (
            <button
              type="button"
              disabled={reexecutando}
              onClick={handleReauditar}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50"
              title="Reexecutar Auditoria Crítica"
            >
              <RotateCcw
                className={`w-4 h-4 ${reexecutando ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erro}</span>
        </div>
      )}

      {/* Os 5 Pilares de Avaliação Crítica */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Avaliação nos 5 Pilares Metodológicos
        </h4>

        <div className="space-y-4 pt-1">
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
                    <span className="font-bold text-slate-800">{p.nome}</span>
                    <span className="text-slate-400 text-[11px] ml-2 hidden sm:inline">
                      • {p.desc}
                    </span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {p.nota}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
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
        <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 text-xs uppercase font-bold">
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Infrações Identificadas ({relatorio.regras_violadas.length})</span>
          </div>

          <div className="space-y-2.5">
            {relatorio.regras_violadas.map((rv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-rose-200 text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900">
                    Regra: “{rv.enunciado}”
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase">
                    Gravidade: {rv.gravidade}
                  </span>
                </div>
                <p className="text-slate-800">
                  <strong className="text-slate-500">Trecho infrator:</strong>{" "}
                  <span className="italic">“{rv.trecho_infrator}”</span>
                </p>
                <p className="text-slate-600 text-[11px]">{rv.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riscos de Alucinação */}
      {relatorio.riscos_alucinacao && relatorio.riscos_alucinacao.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 text-xs uppercase font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Alertas de Consistência & Alucinação ({relatorio.riscos_alucinacao.length})</span>
          </div>

          <div className="space-y-2.5">
            {relatorio.riscos_alucinacao.map((ra, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-amber-200 text-xs space-y-1 shadow-xs"
              >
                <p className="text-amber-900 font-medium italic">
                  “{ra.trecho_afirmacao}”
                </p>
                <p className="text-slate-600 text-[11px]">{ra.explicacao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações de Melhoria */}
      {relatorio.recomendacoes_melhoria && relatorio.recomendacoes_melhoria.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Recomendações do Auditor para Refinamento
          </h4>

          <div className="space-y-2 pt-1">
            {relatorio.recomendacoes_melhoria.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5"
              >
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase shrink-0 mt-0.5">
                  {rec.foco}
                </span>
                <p className="text-slate-700 leading-relaxed">{rec.sugestao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parecer Crítico Completo */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-2 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Parecer Crítico Dissertativo do Auditor
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
          {relatorio.analise_critica_completa}
        </p>
      </div>
    </div>
  );
}
