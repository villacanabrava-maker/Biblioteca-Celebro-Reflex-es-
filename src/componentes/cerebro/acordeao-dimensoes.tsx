"use client";

import { useState } from "react";
import {
  ChevronDown,
  Sparkles,
  Loader2,
  ShieldCheck,
  Ban,
  CheckCircle2,
  BookOpen,
  Cpu,
  Layers,
  ArrowRight,
  Flame,
} from "lucide-react";
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
    corBadge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    corBorda: "border-blue-500/30",
  },
  metodo: {
    rotulo: "Plano do Método",
    descricao: "Como o autor raciocina — passos de análise, abertura, associação analógica e clímax argumentativo.",
    corBadge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    corBorda: "border-amber-500/30",
  },
  expressao: {
    rotulo: "Plano da Expressão",
    descricao: "Como o autor escreve — tom de voz, cadência frasal, vocabulário característico e densidade.",
    corBadge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    corBorda: "border-purple-500/30",
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
              ? "bg-neutral-100 text-neutral-900 shadow-md font-semibold"
              : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Todas as 18 Dimensões
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
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200"
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
              className={`bg-neutral-900/70 border rounded-2xl transition-all overflow-hidden ${
                estaAberta
                  ? "border-neutral-700 shadow-xl shadow-black/50"
                  : "border-neutral-800/80 hover:border-neutral-700/60"
              }`}
            >
              {/* Header do Item do Acordeão */}
              <button
                type="button"
                onClick={() =>
                  setDimensaoAbertaId(estaAberta ? null : dimensao.id)
                }
                className="w-full p-4 flex items-center justify-between text-left gap-4 hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-amber-400 font-semibold shrink-0">
                    {dimensao.codigo}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-medium text-neutral-100 truncate">
                        {dimensao.nome}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border capitalize hidden sm:inline-block ${infoPlano.corBadge}`}
                      >
                        {dimensao.plano}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {dimensao.descricao}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-neutral-300 font-mono">
                      {caracsDim.length} carac. • {regrasDim.length} regras
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {dimensao.confianca_media > 0
                        ? `${Math.round(dimensao.confianca_media * 100)}% confiança`
                        : "Não analisado"}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                      estaAberta ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Conteúdo Expandido da Dimensão */}
              {estaAberta && (
                <div className="p-5 border-t border-neutral-800/80 bg-neutral-950/40 space-y-5">
                  {/* Faixa de Descrição & Ação do Motor IA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                        Definição Epistemológica da Dimensão
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                        {dimensao.descricao}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={estaAnalisando}
                      onClick={() => handleMapearIA(dimensao.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-neutral-950 font-medium rounded-xl text-xs shadow-md transition-all whitespace-nowrap shrink-0"
                    >
                      {estaAnalisando ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analisando com gpt-4o...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mapear Dimensão com IA</span>
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
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
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
                      <h4 className="text-xs font-semibold text-neutral-300 uppercase font-mono tracking-wider">
                        Características Mapeadas ({caracsDim.length})
                      </h4>
                    </div>

                    {caracsDim.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-dashed border-neutral-800 rounded-xl">
                        <Cpu className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-xs text-neutral-400">
                          Nenhuma característica mapeada ainda para esta dimensão.
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Clique no botão “Mapear Dimensão com IA” acima para extrair o padrão autoral a partir dos fragmentos.
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
                              className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-serif text-sm font-medium text-neutral-100">
                                    {carac.titulo}
                                  </h5>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                                      carac.origem === "nucleo_autoral"
                                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                        : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                    }`}
                                  >
                                    {carac.origem === "nucleo_autoral"
                                      ? "Núcleo Autoral"
                                      : "Influência Externa"}
                                  </span>
                                </div>

                                <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                                  <span>
                                    Confiança:{" "}
                                    <strong className="text-neutral-200">
                                      {Math.round(carac.confianca_calculada * 100)}%
                                    </strong>
                                  </span>
                                  {carac.total_evidencias > 0 && (
                                    <span className="text-[11px] text-neutral-500">
                                      ({carac.total_evidencias} evidências)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-neutral-300 leading-relaxed">
                                {carac.descricao}
                              </p>

                              {/* Fórmula Metodológica */}
                              {carac.formula_metodologica && (
                                <div className="p-2.5 rounded-lg bg-neutral-950 border border-amber-500/20 text-xs">
                                  <span className="text-[10px] font-mono text-amber-400 font-semibold block uppercase tracking-wider mb-1">
                                    Fórmula de Pensamento:
                                  </span>
                                  <p className="text-neutral-200 italic font-serif">
                                    “{carac.formula_metodologica}”
                                  </p>
                                </div>
                              )}

                              {/* Regras Vinculadas à Característica */}
                              {regrasDaCarac.length > 0 && (
                                <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                                    Regras & Vetos Derivados:
                                  </span>
                                  <div className="space-y-1">
                                    {regrasDaCarac.map((r) => (
                                      <div
                                        key={r.id}
                                        className="text-xs flex items-start gap-2 text-neutral-300"
                                      >
                                        {r.tipo_regra === "proscritiva" ? (
                                          <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                        ) : (
                                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
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
