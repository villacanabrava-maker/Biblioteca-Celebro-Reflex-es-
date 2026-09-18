"use client";

import { useState } from "react";
import {
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
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
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
        <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800">
          Nenhum Plano Cognitivo Gerado
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          O plano de reflexão define a tese, os movimentos dialéticos e os conceitos ativados antes da redação.
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
      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-3xl p-6 sm:p-8 relative shadow-sm">
        <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span>Tese Central do Cérebro Autoral</span>
        </div>
        <p className="font-serif text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed">
          “{plano.tese_central}”
        </p>
      </div>

      {erro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erro}</span>
        </div>
      )}

      {/* Movimentos Argumentativos */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Movimentos Dialéticos ({plano.movimentos_argumentativos.length})
        </h4>

        <div className="space-y-3">
          {plano.movimentos_argumentativos.map((mov) => (
            <div
              key={mov.ordem}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 hover:border-slate-300 transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {mov.ordem}
                  </span>
                  <h5 className="font-serif text-sm font-bold text-slate-900">
                    {mov.tipo}
                  </h5>
                </div>

                {mov.dimensao_metodologica && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {mov.dimensao_metodologica}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                {mov.descricao}
              </p>

              {mov.conceitos_chave && mov.conceitos_chave.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 pl-8 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Conceitos:</span>
                  <div className="flex flex-wrap gap-1">
                    {mov.conceitos_chave.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold"
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
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Contra-argumentos Antecipados & Resposta Autoral
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plano.contra_argumentos_antecipados.map((ca, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs"
              >
                <div>
                  <span className="text-[10px] uppercase text-rose-600 font-bold block mb-1">
                    Objeção Provável:
                  </span>
                  <p className="text-xs text-slate-800 italic">
                    “{ca.objecao}”
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase text-blue-700 font-bold block mb-1">
                    Resposta Autoral:
                  </span>
                  <p className="text-xs text-slate-700">
                    {ca.resposta_autoral}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ação de Redação */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {temVersao ? "Já existe uma versão gerada." : "Pronto para gerar a redação autoral."}
        </span>

        <button
          type="button"
          onClick={handleRedigir}
          disabled={redigindo}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
        >
          {redigindo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redigindo e Auditando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{temVersao ? "Gerar Nova Versão" : "Aprovar Plano e Redigir Reflexão"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
