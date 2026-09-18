"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Loader2, ShieldCheck, Ban, CheckCircle2, Cpu } from "lucide-react";
import type { DimensaoCerebro, CaracteristicaCerebro, RegraCerebro, PlanoCanonico } from "@/tipos/cerebro";
import { acionarAnaliseDimensao } from "@/acoes/cerebro";

interface Props {
  dimensoes: DimensaoCerebro[];
  caracteristicas: CaracteristicaCerebro[];
  regras: RegraCerebro[];
}

const INFO_PLANOS: Record<
  PlanoCanonico,
  { rotulo: string; descricao: string; corBadge: string; corBorda: string }
> = {
  conteudo: {
    rotulo: "Plano do Conteúdo",
    descricao: "Sobre o que o autor pensa — universos temáticos, teses centrais e repertório teórico.",
    corBadge: "bg-blue-50 text-blue-700 border-blue-200",
    corBorda: "border-blue-200",
  },
  metodo: {
    rotulo: "Plano do Método",
    descricao: "Como o autor raciocina — passos de análise, abertura, associação analógica e clímax argumentativo.",
    corBadge: "bg-amber-50 text-amber-700 border-amber-200",
    corBorda: "border-amber-200",
  },
  expressao: {
    rotulo: "Plano da Expressão",
    descricao: "Como o autor escreve — tom de voz, cadência frasal, vocabulário característico e densidade.",
    corBadge: "bg-violet-50 text-violet-700 border-violet-200",
    corBorda: "border-violet-200",
  },
};

export function AcordeaoDimensoes({ dimensoes, caracteristicas, regras }: Props) {
  const [planoFiltro, setPlanoFiltro] = useState<string>("todos");
  const [dimensaoAbertaId, setDimensaoAbertaId] = useState<string | null>(
    dimensoes[0]?.id || null
  );
  const [analisandoId, setAnalisandoId] = useState<string | null>(null);
  const [mensagemStatus, setMensagemStatus] = useState<{
    dimensaoId: string;
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  const dimensoesFiltradas = dimensoes.filter(
    (d) => planoFiltro === "todos" || d.plano === planoFiltro
  );

  const handleMapearIA = async (dimensaoId: string) => {
    try {
      setAnalisandoId(dimensaoId);
      setMensagemStatus(null);
      const resultado = await acionarAnaliseDimensao(dimensaoId);
      setMensagemStatus({
        dimensaoId,
        tipo: "sucesso",
        texto: `Análise concluída com sucesso! ${resultado.totalCaracteristicas} características e ${resultado.totalRegras} regras registradas no Cérebro.`,
      });
    } catch (err: any) {
      setMensagemStatus({
        dimensaoId,
        tipo: "erro",
        texto: err.message || "Erro ao processar análise da dimensão.",
      });
    } finally {
      setAnalisandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Planos Canônicos */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPlanoFiltro("todos")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            planoFiltro === "todos"
              ? "bg-blue-600 text-white shadow-sm font-semibold border border-blue-600"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Todas as dimensões
        </button>

        {(["conteudo", "metodo", "expressao"] as PlanoCanonico[]).map((plano) => {
          const info = INFO_PLANOS[plano];
          const ativo = planoFiltro === plano;

          return (
            <button
              key={plano}
              type="button"
              onClick={() => setPlanoFiltro(plano)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                ativo
                  ? `${info.corBadge} font-semibold shadow-md`
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {info.rotulo}
            </button>
          );
        })}
      </div>

      {/* Lista de Dimensões em Acordeão */}
      <div className="space-y-3">
        {dimensoesFiltradas.map((dimensao) => {
          const estaAberta = dimensaoAbertaId === dimensao.id;
          const estaAnalisando = analisandoId === dimensao.id;
          const infoPlano = INFO_PLANOS[dimensao.plano];

          // Características desta dimensão
          const caracsDim = caracteristicas.filter(
            (c) => c.dimensao_id === dimensao.id
          );

          // Regras associadas a esta dimensão
          const regrasDim = regras.filter(
            (r) => r.dimensao_id === dimensao.id
          );

          return (
            <div
              key={dimensao.id}
              className={`bg-white border rounded-2xl shadow-sm transition-all overflow-hidden ${
                estaAberta
                  ? "border-blue-200 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Header do Item do Acordeão */}
              <button
                type="button"
                onClick={() =>
                  setDimensaoAbertaId(estaAberta ? null : dimensao.id)
                }
                className="w-full p-4 flex items-center justify-between text-left gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 border border-slate-200 text-blue-600 font-semibold shrink-0">
                    {dimensao.codigo}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-medium text-slate-900 truncate">
                        {dimensao.nome}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border capitalize hidden sm:inline-block ${infoPlano.corBadge}`}
                      >
                        {dimensao.plano}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {dimensao.descricao}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-slate-700 font-mono">
                      {caracsDim.length} carac. • {regrasDim.length} regras
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dimensao.confianca_media > 0
                        ? `${Math.round(dimensao.confianca_media * 100)}% confiança`
                        : "Não analisado"}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      estaAberta ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Conteúdo Expandido da Dimensão */}
              {estaAberta && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-5">
                  {/* Faixa de Descrição & Ação do Motor IA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                        Sobre esta dimensão
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                        {dimensao.descricao}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={estaAnalisando}
                      onClick={() => handleMapearIA(dimensao.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-xs shadow-md transition-all whitespace-nowrap shrink-0"
                    >
                      {estaAnalisando ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analisando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Analisar dimensão</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mensagem de Feedback da IA */}
                  {mensagemStatus &&
                    mensagemStatus.dimensaoId === dimensao.id && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                          mensagemStatus.tipo === "sucesso"
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border border-rose-200 text-rose-700"
                        }`}
                      >
                        {mensagemStatus.tipo === "sucesso" ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <Ban className="w-4 h-4 shrink-0" />
                        )}
                        <span>{mensagemStatus.texto}</span>
                      </div>
                    )}

                  {/* Listagem de Características */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase font-mono tracking-wider">
                        Características mapeadas ({caracsDim.length})
                      </h4>
                    </div>

                    {caracsDim.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-dashed border-slate-300 bg-white rounded-xl">
                        <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">
                          Nenhuma característica mapeada ainda para esta dimensão.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Clique no botão “Analisar dimensão” acima para extrair o padrão autoral a partir dos fragmentos.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {caracsDim.map((carac) => {
                          const regrasDaCarac = regras.filter(
                            (r) => r.caracteristica_id === carac.id
                          );

                          return (
                            <div
                              key={carac.id}
                              className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-serif text-sm font-medium text-slate-900">
                                    {carac.titulo}
                                  </h5>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                                      carac.origem === "nucleo_autoral"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {carac.origem === "nucleo_autoral"
                                      ? "Núcleo Autoral"
                                      : "Influência Externa"}
                                  </span>
                                </div>

                                <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                                  <span>
                                    Confiança:{" "}
                                    <strong className="text-slate-800">
                                      {Math.round(carac.confianca_calculada * 100)}%
                                    </strong>
                                  </span>
                                  {carac.total_evidencias > 0 && (
                                    <span className="text-[11px] text-slate-400">
                                      ({carac.total_evidencias} evidências)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed">
                                {carac.descricao}
                              </p>

                              {/* Fórmula Metodológica */}
                              {carac.formula_metodologica && (
                                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                                  <span className="text-[10px] font-mono text-blue-600 font-semibold block uppercase tracking-wider mb-1">
                                    Fórmula de Pensamento:
                                  </span>
                                  <p className="text-slate-800 italic font-serif">
                                    “{carac.formula_metodologica}”
                                  </p>
                                </div>
                              )}

                              {/* Regras Vinculadas à Característica */}
                              {regrasDaCarac.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                                    Regras associadas:
                                  </span>
                                  <div className="space-y-1">
                                    {regrasDaCarac.map((r) => (
                                      <div
                                        key={r.id}
                                        className="text-xs flex items-start gap-2 text-slate-700"
                                      >
                                        {r.tipo_regra === "proscritiva" ? (
                                          <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                        ) : (
                                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        )}
                                        <span className="leading-snug">
                                          {r.enunciado}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
