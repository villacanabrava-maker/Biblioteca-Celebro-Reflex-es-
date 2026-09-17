"use client";

import { useState } from "react";
import { BookOpen, FileText, CheckCircle2, Quote, ExternalLink, ChevronDown, Sparkles } from "lucide-react";
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
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center">
        <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-neutral-200">
          Nenhuma Versão Redigida Ainda
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Acesse a aba "2. Plano Cognitivo" e clique em "Aprovar Plano & Redigir" para produzir o ensaio.
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
        <div className="flex items-center gap-2 p-2 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-x-auto">
          <span className="text-xs font-mono text-neutral-500 px-2 uppercase tracking-wider">
            Versões:
          </span>
          {versoes.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => aoMudarVersao?.(v.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                v.id === versaoAtual.id
                  ? "bg-amber-500 text-neutral-950 font-semibold shadow-sm"
                  : "bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
              }`}
            >
              V{v.numero_versao} ({v.total_palavras} pal.)
            </button>
          ))}
        </div>
      )}

      {/* Cartão de Título & Sumário Executivo */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-400 font-semibold">
              Versão {versaoAtual.numero_versao}
            </span>
            <span className="capitalize px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-300 text-[10px]">
              {versaoAtual.estado}
            </span>
          </div>

          <span>{versaoAtual.total_palavras} palavras</span>
        </div>

        <h2 className="font-serif text-2xl md:text-3xl font-medium text-neutral-100 leading-tight">
          {versaoAtual.titulo_gerado}
        </h2>

        {versaoAtual.sumario_executivo && (
          <div className="pt-3 border-t border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold block mb-1">
              Síntese Executiva
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed italic">
              "{versaoAtual.sumario_executivo}"
            </p>
          </div>
        )}
      </div>

      {/* Corpo do Texto Redigido em Markdown */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 md:p-8">
        <div className="prose prose-invert prose-neutral max-w-none font-serif text-sm md:text-base leading-relaxed text-neutral-200 whitespace-pre-wrap">
          {versaoAtual.conteudo_markdown}
        </div>
      </div>

      {/* Seção de Citações & Evidências de Proveniência */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarEvidencias(!mostrarEvidencias)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Quote className="w-4 h-4 text-amber-400" />
            <span className="font-serif text-base font-medium text-neutral-100">
              Citações & Proveniência Autoral ({versaoAtual.citacoes.length})
            </span>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform ${
              mostrarEvidencias ? "rotate-180 text-amber-400" : ""
            }`}
          />
        </button>

        {mostrarEvidencias && (
          <div className="p-5 border-t border-neutral-800/80 bg-neutral-950/40 space-y-4">
            {versaoAtual.citacoes.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">
                Nenhuma citação explícita foi mapeada diretamente para esta versão.
              </p>
            ) : (
              <div className="space-y-3">
                {versaoAtual.citacoes.map((cit, idx) => (
                  <div
                    key={cit.id || idx}
                    className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                        Evidência {idx + 1} • Obra: "{cit.obra_titulo || "Autoral"}"
                      </span>

                      {cit.grau_aderencia !== null && cit.grau_aderencia !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-emerald-400">
                          Aderência: {Math.round(cit.grau_aderencia * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Afirmação no Texto Gerado */}
                    <div>
                      <span className="text-[10px] text-neutral-500 font-mono block">
                        No texto gerado:
                      </span>
                      <p className="text-xs text-neutral-200 font-medium mt-0.5">
                        "{cit.trecho_afirmacao_gerada}"
                      </p>
                    </div>

                    {/* Trecho Original do Autor */}
                    <div className="pt-2 border-t border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 font-mono block">
                        Trecho no corpus original:
                      </span>
                      <p className="text-xs text-neutral-400 italic mt-0.5 font-serif">
                        "{cit.trecho_original_citado}"
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
