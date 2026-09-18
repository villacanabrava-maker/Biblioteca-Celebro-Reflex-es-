"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, BookOpen, ShieldCheck, Ban, Sparkles, Layers3, Info } from "lucide-react";
import type {
  DimensaoCerebro,
  CaracteristicaCerebro,
  PropostaAtualizacaoCerebro,
  RegraCerebro,
  ResumoCerebro,
} from "@/tipos/cerebro";
import { AcordeaoDimensoes } from "./acordeao-dimensoes";
import { PainelPropostasAprendizado } from "./painel-propostas-aprendizado";

interface Props {
  resumo: ResumoCerebro;
  dimensoes: DimensaoCerebro[];
  caracteristicas: CaracteristicaCerebro[];
  regras: RegraCerebro[];
  propostas: PropostaAtualizacaoCerebro[];
}

type AbaCerebro = "visao_geral" | "dimensoes" | "regras" | "aprendizados";

export function PainelCerebroModerno({
  resumo,
  dimensoes,
  caracteristicas,
  regras,
  propostas,
}: Props) {
  const [abaAtiva, setAbaAtiva] = useState<AbaCerebro>("visao_geral");

  const possuiAnalise =
    caracteristicas.length > 0 || regras.length > 0 || resumo.total_caracteristicas > 0;

  const caracteristicasPrincipais = caracteristicas.slice(0, 6);
  const regrasPrincipais = regras.slice(0, 6);

  const metricas = [
    {
      rotulo: "Características",
      valor: resumo.total_caracteristicas,
      detalhe: "padrões autorais identificados",
      icone: Sparkles,
      classe: "bg-blue-50 text-blue-600",
    },
    {
      rotulo: "Regras",
      valor: resumo.total_regras,
      detalhe: "diretrizes metodológicas ativas",
      icone: ShieldCheck,
      classe: "bg-emerald-50 text-emerald-600",
    },
    {
      rotulo: "Anti-regras",
      valor: resumo.total_anti_regras,
      detalhe: "vetos e restrições reconhecidos",
      icone: Ban,
      classe: "bg-rose-50 text-rose-600",
    },
    {
      rotulo: "Núcleo autoral",
      valor: resumo.total_nucleo_autoral,
      detalhe: "características do corpus autoral",
      icone: Brain,
      classe: "bg-indigo-50 text-indigo-600",
    },
  ];

  const totalPropostasPendentes = propostas.filter(
    (proposta) => proposta.estado_decisao === "pendente"
  ).length;

  const abas: { id: AbaCerebro; rotulo: string }[] = [
    { id: "visao_geral", rotulo: "Visão geral" },
    { id: "dimensoes", rotulo: "Dimensões" },
    { id: "regras", rotulo: "Regras" },
    {
      id: "aprendizados",
      rotulo:
        totalPropostasPendentes > 0
          ? `Aprendizados (${totalPropostasPendentes})`
          : "Aprendizados",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
          <Brain className="h-4 w-4" />
          <span>Inteligência autoral</span>
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Cérebro Autoral
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Padrões, regras e dimensões identificados a partir do seu acervo processado.
          Aqui só aparecem informações sustentadas pelos dados disponíveis no Rflex01.
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              abaAtiva === aba.id
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "visao_geral" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metricas.map(({ rotulo, valor, detalhe, icone: Icone, classe }) => (
              <div key={rotulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{rotulo}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${classe}`}>
                    <Icone className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{valor}</div>
                <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
              </div>
            ))}
          </div>

          {!possuiAnalise ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Ainda não há análise autoral suficiente
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
                Processe materiais autorais na Biblioteca e depois use as dimensões do Cérebro
                para mapear características sustentadas por evidências do seu próprio acervo.
              </p>
              <Link
                href="/biblioteca"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4" />
                Ir para a Biblioteca
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-base font-bold text-slate-900">
                        Características identificadas
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Padrões extraídos e registrados no Cérebro Autoral
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAbaAtiva("dimensoes")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Ver dimensões
                    </button>
                  </div>

                  <div className="space-y-3">
                    {caracteristicasPrincipais.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        Nenhuma característica registrada.
                      </p>
                    ) : (
                      caracteristicasPrincipais.map((caracteristica) => (
                        <div
                          key={caracteristica.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              {caracteristica.titulo}
                            </h3>
                            <span className="text-xs font-semibold text-slate-500">
                              {Math.round(caracteristica.confianca_calculada * 100)}% confiança
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                            {caracteristica.descricao}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {caracteristica.dimensao_nome && (
                              <span>{caracteristica.dimensao_nome}</span>
                            )}
                            {caracteristica.total_evidencias > 0 && (
                              <span>• {caracteristica.total_evidencias} evidências</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-base font-bold text-slate-900">
                        Regras metodológicas
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Preferências e restrições registradas pelo sistema
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAbaAtiva("regras")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Ver regras
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {regrasPrincipais.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        Nenhuma regra registrada.
                      </p>
                    ) : (
                      regrasPrincipais.map((regra) => (
                        <div
                          key={regra.id}
                          className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5"
                        >
                          {regra.tipo_regra === "proscritiva" ? (
                            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                          ) : (
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{regra.enunciado}</p>
                            {regra.dimensao_nome && (
                              <p className="mt-1 text-xs text-slate-500">{regra.dimensao_nome}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p>
                  Confiança, evidências e contagens são exibidas somente quando já existem nos
                  registros do Cérebro. O Rflex01 não preenche lacunas com exemplos ou perfis simulados.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {abaAtiva === "dimensoes" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-blue-600" />
              <h2 className="font-serif text-base font-bold text-slate-900">
                Dimensões canônicas
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Explore cada dimensão e execute o mapeamento quando houver fragmentos autorais processados.
            </p>
          </div>
          <AcordeaoDimensoes
            dimensoes={dimensoes}
            caracteristicas={caracteristicas}
            regras={regras}
          />
        </div>
      )}

      {abaAtiva === "aprendizados" && (
        <PainelPropostasAprendizado propostas={propostas} />
      )}

      {abaAtiva === "regras" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-serif text-base font-bold text-slate-900">Regras do Cérebro</h2>
            <p className="mt-1 text-sm text-slate-500">
              Regras prescritivas, anti-regras e preferências já registradas.
            </p>
          </div>

          {regras.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              Nenhuma regra foi registrada ainda.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {regras.map((regra) => (
                <div key={regra.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    {regra.tipo_regra === "proscritiva" ? (
                      <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    ) : (
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{regra.enunciado}</h3>
                      {regra.explicacao && (
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{regra.explicacao}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="capitalize">{regra.tipo_regra.replace("_", " ")}</span>
                        {regra.dimensao_nome && <span>• {regra.dimensao_nome}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
