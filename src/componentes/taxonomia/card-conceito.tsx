"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { decidirConceitoSugerido } from "@/acoes/taxonomia";
import type { ConceitoTaxonomico } from "@/tipos/taxonomia";

interface Props {
  conceito: ConceitoTaxonomico;
}

const CORES_DOMINIO: Record<string, string> = {
  intelectual: "border-blue-200 bg-blue-50 text-blue-700",
  axiologico: "border-amber-200 bg-amber-50 text-amber-700",
  reflexivo: "border-violet-200 bg-violet-50 text-violet-700",
  narrativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  entidades: "border-teal-200 bg-teal-50 text-teal-700",
  temporal: "border-orange-200 bg-orange-50 text-orange-700",
  retorico: "border-rose-200 bg-rose-50 text-rose-700",
  linguistico: "border-cyan-200 bg-cyan-50 text-cyan-700",
  estrutural: "border-slate-200 bg-slate-100 text-slate-700",
  autoral: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function CardConceito({ conceito }: Props) {
  const router = useRouter();
  const [processando, setProcessando] = useState<"confirmar" | "rejeitar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const emRevisao = conceito.estado === "revisao";
  const totalOcorrencias =
    (conceito.total_fragmentos || 0) + (conceito.total_reflexoes || 0);
  const estiloBadge =
    CORES_DOMINIO[conceito.dominio] ||
    "border-slate-200 bg-slate-100 text-slate-700";

  async function decidir(decisao: "confirmar" | "rejeitar") {
    try {
      setProcessando(decisao);
      setErro(null);
      await decidirConceitoSugerido({ conceitoId: conceito.id, decisao });
      router.refresh();
    } catch (falha: unknown) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível registrar sua decisão."
      );
    } finally {
      setProcessando(null);
    }
  }

  return (
    <article
      className={`flex flex-col justify-between space-y-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        emRevisao ? "border-amber-300" : "border-slate-200 hover:border-blue-200"
      }`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${estiloBadge}`}
            >
              {conceito.dominio}
            </span>

            {emRevisao && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                <Sparkles className="h-3 w-3" />
                Sugestão da IA · em revisão
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500">
            {totalOcorrencias > 0
              ? `${totalOcorrencias} ocorrência${totalOcorrencias === 1 ? "" : "s"}`
              : "Sem ocorrências"}
          </span>
        </div>

        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            {conceito.termo_preferencial}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {conceito.definicao}
          </p>
        </div>

        {conceito.origem === "ia" && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span>Origem: extração automática</span>
            <span>•</span>
            <span>Confiança: {Math.round(Number(conceito.confianca || 0) * 100)}%</span>
            {conceito.total_fragmentos > 0 && (
              <>
                <span>•</span>
                <span>{conceito.total_fragmentos} fragmento(s)</span>
              </>
            )}
            {conceito.total_reflexoes > 0 && (
              <>
                <span>•</span>
                <span>{conceito.total_reflexoes} reflexão(ões)</span>
              </>
            )}
          </div>
        )}
      </div>

      {conceito.termos_sinonimos && conceito.termos_sinonimos.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">
            Sinônimos e variações
          </span>
          <div className="flex flex-wrap gap-1.5">
            {conceito.termos_sinonimos.map((termo) => (
              <span
                key={termo.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
              >
                {termo.termo}
              </span>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {erro}
        </div>
      )}

      {emRevisao && (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={Boolean(processando)}
            onClick={() => void decidir("rejeitar")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {processando === "rejeitar" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            Rejeitar
          </button>
          <button
            type="button"
            disabled={Boolean(processando)}
            onClick={() => void decidir("confirmar")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {processando === "confirmar" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Confirmar conceito
          </button>
        </div>
      )}
    </article>
  );
}
