"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  GitCompareArrows,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { decidirPropostaAtualizacaoCerebro } from "@/acoes/cerebro";
import type { PropostaAtualizacaoCerebro } from "@/tipos/cerebro";

interface Props {
  propostas: PropostaAtualizacaoCerebro[];
}

type FiltroPropostas = "pendentes" | "historico";

function rotuloTipo(tipo: PropostaAtualizacaoCerebro["tipo_proposta"]) {
  switch (tipo) {
    case "nova_caracteristica":
      return "Característica candidata";
    case "atualizacao_regra":
      return "Regra candidata";
    case "nova_metodologia":
      return "Metodologia candidata";
    case "depreciacao":
      return "Depreciação candidata";
    default:
      return "Proposta";
  }
}

export function PainelPropostasAprendizado({ propostas }: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<FiltroPropostas>("pendentes");
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});

  const pendentes = useMemo(
    () => propostas.filter((proposta) => proposta.estado_decisao === "pendente"),
    [propostas]
  );
  const historico = useMemo(
    () => propostas.filter((proposta) => proposta.estado_decisao !== "pendente"),
    [propostas]
  );

  const exibidas = filtro === "pendentes" ? pendentes : historico;

  async function decidir(
    propostaId: string,
    decisao: "confirmada" | "rejeitada"
  ) {
    try {
      setProcessandoId(propostaId);
      setErro(null);

      await decidirPropostaAtualizacaoCerebro({
        propostaId,
        decisao,
        notasAutor: notas[propostaId],
      });

      router.refresh();
    } catch (falha: unknown) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível registrar sua decisão."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Aprendizados derivados das suas edições
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              O sistema compara a versão da IA com sua edição e transforma somente sinais
              sustentados em propostas. Nada passa a orientar novas reflexões sem sua decisão.
            </p>
          </div>

          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setFiltro("pendentes")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === "pendentes"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Pendentes ({pendentes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("historico")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === "historico"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Histórico ({historico.length})
            </button>
          </div>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {erro}
        </div>
      )}

      {exibidas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <GitCompareArrows className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-3 font-serif text-base font-bold text-slate-900">
            {filtro === "pendentes"
              ? "Nenhuma proposta pendente"
              : "Nenhuma decisão registrada ainda"}
          </h3>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">
            {filtro === "pendentes"
              ? "Quando uma edição do autor revelar um padrão suficientemente sustentado, a proposta aparecerá aqui para revisão."
              : "As propostas confirmadas ou rejeitadas permanecem preservadas para auditoria histórica."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exibidas.map((proposta) => {
            const aprendizado = proposta.dados_propostos.aprendizado || {};
            const dimensao = proposta.dados_propostos.dimensao || {};
            const origem = proposta.dados_propostos.origem || {};
            const evidencias = Array.isArray(
              proposta.dados_propostos.evidencias_edicao
            )
              ? proposta.dados_propostos.evidencias_edicao
              : [];
            const pendente = proposta.estado_decisao === "pendente";
            const processando = processandoId === proposta.id;

            return (
              <article
                key={proposta.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {rotuloTipo(proposta.tipo_proposta)}
                      </span>
                      {dimensao.nome && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {dimensao.nome}
                        </span>
                      )}
                      {!pendente && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            proposta.estado_decisao === "rejeitada"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {proposta.estado_decisao === "rejeitada"
                            ? "Rejeitada"
                            : "Confirmada pelo autor"}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-serif text-lg font-bold text-slate-900">
                      {aprendizado.titulo || "Aprendizado candidato"}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {aprendizado.descricao || proposta.justificativa_ia}
                    </p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <span className="block text-xs text-slate-500">Confiança limitada</span>
                    <strong className="text-base text-slate-900">
                      {Math.round(Number(proposta.confianca_calculada || 0) * 100)}%
                    </strong>
                  </div>
                </div>

                {aprendizado.enunciado_regra && (
                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                      Formulação candidata
                    </span>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                      {aprendizado.enunciado_regra}
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Por que a IA sugeriu isto
                  </span>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {proposta.justificativa_ia}
                  </p>
                </div>

                {evidencias.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      Evidências da edição ({evidencias.length})
                    </h4>
                    {evidencias.map((evidencia) => (
                      <div
                        key={`${proposta.id}-evidencia-${evidencia.indice}`}
                        className="grid gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-2"
                      >
                        <div className="rounded-xl bg-rose-50 p-3">
                          <span className="text-xs font-semibold text-rose-700">Antes</span>
                          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-6 text-slate-700">
                            {evidencia.antes || "—"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3">
                          <span className="text-xs font-semibold text-emerald-700">Depois</span>
                          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-6 text-slate-800">
                            {evidencia.depois || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                  {origem.versao_editada_id && <span>Origem: edição de reflexão</span>}
                  {dimensao.codigo && <span>• {dimensao.codigo}</span>}
                </div>

                {pendente ? (
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nota opcional sobre sua decisão
                      <textarea
                        value={notas[proposta.id] || ""}
                        onChange={(evento) =>
                          setNotas((atual) => ({
                            ...atual,
                            [proposta.id]: evento.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Ex.: esta preferência vale apenas para ensaios longos..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </label>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={Boolean(processandoId)}
                        onClick={() => void decidir(proposta.id, "rejeitada")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {processando ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Rejeitar
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(processandoId)}
                        onClick={() => void decidir(proposta.id, "confirmada")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {processando ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Confirmar aprendizado
                      </button>
                    </div>
                  </div>
                ) : (
                  proposta.notas_autor && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Nota do autor
                      </span>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {proposta.notas_autor}
                      </p>
                    </div>
                  )
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
