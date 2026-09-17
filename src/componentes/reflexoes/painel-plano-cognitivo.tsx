"use client";

import { useState } from "react";
import {
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { PlanoReflexao } from "@/tipos/reflexoes";
import { acionarRedacaoReflexao } from "@/acoes/reflexoes";

interface Props {
  plano: PlanoReflexao | null;
  entradaId: string;
  temVersao: boolean;
  aoConcluirRedacao?: () => void;
}

export function PainelPlanoCognitivo({
  plano,
  entradaId,
  temVersao,
  aoConcluirRedacao,
}: Props) {
  const [redigindo, setRedigindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!plano) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center">
        <Brain className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-neutral-200">
          Nenhum Plano Cognitivo Gerado
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          O plano de reflexão define a tese, a ordem dos argumentos e as regras do autor antes da redação.
        </p>
      </div>
    );
  }

  const handleRedigir = async () => {
    try {
      setRedigindo(true);
      setErro(null);
      await acionarRedacaoReflexao({ entradaId, planoId: plano.id });
      aoConcluirRedacao?.();
    } catch (err: any) {
      console.error("Erro ao redigir reflexão:", err);
      setErro(err.message || "Falha ao gerar redação e auditoria.");
    } finally {
      setRedigindo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tese Central */}
      <div className="bg-gradient-to-br from-amber-500/10 via-neutral-900/80 to-neutral-900/80 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
          <Brain className="w-4 h-4" />
          <span>Tese Central Autoral</span>
        </div>
        <p className="font-serif text-xl font-medium text-neutral-100 leading-relaxed">
          "{plano.tese_central}"
        </p>
      </div>

      {erro && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Movimentos Argumentativos */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
          Movimentos Argumentativos ({plano.movimentos_argumentativos.length})
        </h4>

        <div className="space-y-3">
          {plano.movimentos_argumentativos.map((mov) => (
            <div
              key={mov.ordem}
              className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-neutral-950 border border-neutral-800 text-amber-400 font-mono text-xs font-semibold flex items-center justify-center">
                    {mov.ordem}
                  </span>
                  <h5 className="font-serif text-sm font-medium text-neutral-200">
                    {mov.tipo}
                  </h5>
                </div>

                {mov.dimensao_metodologica && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                    {mov.dimensao_metodologica}
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed pl-8.5">
                {mov.descricao}
              </p>

              {mov.conceitos_chave && mov.conceitos_chave.length > 0 && (
                <div className="pt-2 border-t border-neutral-800/60 flex items-center gap-2 pl-8.5">
                  <span className="text-[10px] font-mono text-neutral-500">Conceitos:</span>
                  <div className="flex flex-wrap gap-1">
                    {mov.conceitos_chave.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contra-argumentos Antecipados */}
      {plano.contra_argumentos_antecipados && plano.contra_argumentos_antecipados.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
            Contra-argumentos Antecipados & Refutação Autoral
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plano.contra_argumentos_antecipados.map((ca, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold block mb-1">
                    Objeção Provável:
                  </span>
                  <p className="text-xs text-neutral-300 font-medium">
                    "{ca.objecao}"
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block mb-1">
                    Resposta & Tensão Autoral:
                  </span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {ca.resposta_autoral}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regras e Conceitos Ativados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plano.conceitos_mobilizados && plano.conceitos_mobilizados.length > 0 && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              Conceitos da Taxonomia Mobilizados
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {plano.conceitos_mobilizados.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-amber-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {plano.regras_acionadas && plano.regras_acionadas.length > 0 && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              Regras do Cérebro Ativadas
            </h5>
            <div className="space-y-1">
              {plano.regras_acionadas.map((r, i) => (
                <div key={i} className="text-xs text-neutral-300 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Ação de Redação */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-neutral-200 block">
            {temVersao ? "Deseja redigir uma nova versão?" : "Pronto para redigir o ensaio?"}
          </span>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            O redator autoral construirá o texto em Markdown e o auditor crítico analisará a fidelidade em seguida.
          </p>
        </div>

        <button
          type="button"
          disabled={redigindo}
          onClick={handleRedigir}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-neutral-950 font-semibold rounded-xl text-xs shadow-lg transition-all whitespace-nowrap shrink-0"
        >
          {redigindo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redigindo e Auditando com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{temVersao ? "Gerar Nova Versão com IA" : "Aprovar Plano & Redigir Reflexão"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
