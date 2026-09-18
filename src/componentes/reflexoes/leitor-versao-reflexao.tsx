"use client";

import { useState } from "react";
import { FileText, Quote, ChevronDown } from "lucide-react";
import type { VersaoReflexao, CitacaoEvidencia } from "@/tipos/reflexoes";

interface Props {
  versoes: (VersaoReflexao & { citacoes: CitacaoEvidencia[] })[];
  versaoSelecionadaId?: string;
  aoMudarVersao?: (versaoId: string) => void;
}

export function LeitorVersaoReflexao({
  versoes,
  versaoSelecionadaId,
  aoMudarVersao,
}: Props) {
  const [mostrarEvidencias, setMostrarEvidencias] = useState(true);

  if (versoes.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800">
          Nenhuma Versão Redigida Ainda
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Acesse a aba “2. Plano Cognitivo” e clique em “Aprovar Plano e Redigir Reflexão” para produzir o ensaio.
        </p>
      </div>
    );
  }

  const versaoAtual =
    versoes.find((v) => v.id === versaoSelecionadaId) || versoes[0];

  return (
    <div className="space-y-6">
      {/* Seletor de Versões */}
      {versoes.length > 1 && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 px-2 uppercase tracking-wider">
            Versões:
          </span>
          {versoes.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => aoMudarVersao?.(v.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                v.id === versaoAtual.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              V{v.numero_versao} ({v.total_palavras} pal.)
            </button>
          ))}
        </div>
      )}

      {/* Cartão de Título & Sumário Executivo */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
              Versão {versaoAtual.numero_versao}
            </span>
            <span className="capitalize px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 text-[10px] font-semibold">
              {versaoAtual.estado}
            </span>
          </div>

          <span className="font-medium">{versaoAtual.total_palavras} palavras</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {versaoAtual.titulo_gerado}
        </h2>

        {versaoAtual.sumario_executivo && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider text-blue-700 font-bold block mb-1">
              Síntese Executiva
            </span>
            <p className="text-sm text-slate-700 leading-7 italic font-serif max-w-3xl">
              “{versaoAtual.sumario_executivo}”
            </p>
          </div>
        )}
      </div>

      {/* Corpo do Texto Redigido em Markdown */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="leitura-confortavel mx-auto font-serif text-slate-800 whitespace-pre-wrap">
          {versaoAtual.conteudo_markdown}
        </div>
      </div>

      {/* Seção de Citações & Evidências de Proveniência */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setMostrarEvidencias(!mostrarEvidencias)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Quote className="w-5 h-5 text-blue-600" />
            <span className="font-serif text-base font-bold text-slate-900">
              Citações & Proveniência Autoral ({versaoAtual.citacoes.length})
            </span>
          </div>

          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${
              mostrarEvidencias ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </button>

        {mostrarEvidencias && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
            {versaoAtual.citacoes.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Nenhuma citação explícita foi vinculada diretamente para esta versão.
              </p>
            ) : (
              <div className="space-y-3">
                {versaoAtual.citacoes.map((cit, idx) => (
                  <div
                    key={cit.id || idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Evidência {idx + 1} • Obra: “{cit.obra_titulo || "Acervo Autoral"}”
                      </span>

                      {cit.grau_aderencia !== null && cit.grau_aderencia !== undefined && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          Aderência: {Math.round(cit.grau_aderencia * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Afirmação no Texto Gerado */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        No texto da reflexão:
                      </span>
                      <p className="text-sm text-slate-800 font-medium mt-1 leading-6">
                        “{cit.trecho_afirmacao_gerada}”
                      </p>
                    </div>

                    {/* Trecho Original do Autor */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Trecho no corpus autoral:
                      </span>
                      <p className="text-sm text-slate-600 italic mt-1 font-serif leading-6">
                        “{cit.trecho_original_citado}”
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
