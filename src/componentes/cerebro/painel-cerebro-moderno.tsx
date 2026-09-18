"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  BookOpen,
  ArrowRight,
  ChevronRight,
  FileText,
  HelpCircle,
  TrendingUp,
  History,
  Lightbulb,
  CheckCircle2,
  Info,
  ShieldCheck,
  Compass,
} from "lucide-react";
import type {
  DimensaoCerebro,
  CaracteristicaCerebro,
  RegraCerebro,
  ResumoCerebro,
} from "@/tipos/cerebro";
import { AcordeaoDimensoes } from "./acordeao-dimensoes";
import { PainelRegras } from "./painel-regras";

interface Props {
  resumo: ResumoCerebro;
  dimensoes: DimensaoCerebro[];
  caracteristicas: CaracteristicaCerebro[];
  regras: RegraCerebro[];
}

type AbaCerebro =
  | "visao_geral"
  | "estilo"
  | "temas"
  | "conceitos"
  | "historias"
  | "evolucao";

export function PainelCerebroModerno({
  resumo,
  dimensoes,
  caracteristicas,
  regras,
}: Props) {
  const [abaAtiva, setAbaAtiva] = useState<AbaCerebro>("visao_geral");
  const [modalEvidenciasAberto, setModalEvidenciasAberto] = useState(false);

  const abas: { id: AbaCerebro; rotulo: string }[] = [
    { id: "visao_geral", rotulo: "Visão Geral" },
    { id: "estilo", rotulo: "Estilo" },
    { id: "temas", rotulo: "Temas" },
    { id: "conceitos", rotulo: "Conceitos" },
    { id: "historias", rotulo: "Histórias" },
    { id: "evolucao", rotulo: "Evolução" },
  ];

  const badgesEstilo = [
    "Reflexivo",
    "Analítico",
    "Pessoal",
    "Curioso",
    "Empático",
    "Detalhista",
  ];

  const badgesTemas = [
    { nome: "Propósito", cor: "bg-purple-50 text-purple-700 border-purple-200" },
    { nome: "Autoconhecimento", cor: "bg-sky-50 text-sky-700 border-sky-200" },
    { nome: "Trabalho", cor: "bg-blue-50 text-blue-700 border-blue-200" },
    { nome: "Relacionamentos", cor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { nome: "Saúde", cor: "bg-amber-50 text-amber-700 border-amber-200" },
    { nome: "Espiritualidade", cor: "bg-rose-50 text-rose-700 border-rose-200" },
    { nome: "Esperança", cor: "bg-teal-50 text-teal-700 border-teal-200" },
    { nome: "Amadurecimento", cor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ];

  const fluxoPensamento = [
    { id: 1, rotulo: "Experiência" },
    { id: 2, rotulo: "Questionamento" },
    { id: 3, rotulo: "Interpretação" },
    { id: 4, rotulo: "Conexão" },
    { id: 5, rotulo: "Aprendizado" },
    { id: 6, rotulo: "Reflexão" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Topo: Título e Tooltip */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Meu Cérebro
          </h1>
          <button
            type="button"
            title="A IA aprende continuamente a partir de suas obras e reflexões aprovadas."
            className="text-slate-400 hover:text-blue-600"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          O que a IA aprendeu sobre você e seu método de pensamento
        </p>
      </div>

      {/* 2. Abas em Formato Pílula */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {abas.map((aba) => {
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                ativo
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {/* 3. Conteúdo da Aba Visão Geral */}
      {abaAtiva === "visao_geral" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Card Central de Análise da Memória */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Círculo SVG de Progresso */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.78)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Memória analisada
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-0.5">
                78%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                154 memórias identificadas • Última calibração:{" "}
                {new Date().toLocaleDateString("pt-BR")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <CheckCircle2 className="w-3 h-3" /> Concordo
                </button>
                <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                  ✕ Discordo
                </button>
              </div>
            </div>
          </div>

          {/* Citação Sintetizadora do Estilo */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl font-serif text-blue-600 leading-none select-none">
              &ldquo;
            </span>
            <p className="text-xs sm:text-sm font-medium text-blue-900 italic leading-relaxed flex-1">
              Você escreve com profundidade, curiosidade e um forte desejo de compreender a vida. Suas teses partem da observação cotidiana para construir sínteses universais.
            </p>
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          </div>

          {/* Card Meu Estilo de Escrita */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Meu estilo de escrita</h3>
                <p className="text-[11px] text-slate-500">Como você se expressa</p>
              </div>
              <button
                onClick={() => setAbaAtiva("estilo")}
                className="text-slate-400 hover:text-blue-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {badgesEstilo.map((b) => (
                <span
                  key={b}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/70"
                >
                  {b}
                </span>
              ))}
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Utiliza perguntas reflexivas no início de cada argumento</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Parte de experiências pessoais para fundamentar princípios</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Costuma terminar ensaios com sínteses abertas e provocativas</span>
              </li>
            </ul>
          </div>

          {/* Card Temas Recorrentes */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Temas recorrentes</h3>
                <p className="text-[11px] text-slate-500">O que mais aparece nas suas reflexões</p>
              </div>
              <button
                onClick={() => setAbaAtiva("temas")}
                className="text-slate-400 hover:text-blue-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {badgesTemas.map((t) => (
                <span
                  key={t.nome}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${t.cor}`}
                >
                  {t.nome}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setAbaAtiva("temas")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                Ver todos os temas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card Minha Forma de Pensar */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Minha forma de pensar</h3>
                <p className="text-[11px] text-slate-500">Padrões e tendências do seu pensamento</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Busca significados
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Conecta ideias
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                Questiona o óbvio
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                Pensa no longo prazo
              </span>
            </div>

            {/* Diagrama de Fluxo de Setas */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-2 min-w-max">
                {fluxoPensamento.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-mono">0{item.id}</span>
                      <span className="text-xs font-semibold text-slate-800">{item.rotulo}</span>
                    </div>
                    {index < fluxoPensamento.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botão Ver Evidências */}
          <div className="pt-2 text-center space-y-2">
            <button
              onClick={() => setModalEvidenciasAberto(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Ver evidências analíticas</span>
            </button>
            <p className="text-[11px] text-slate-400">
              Baseado em IA • Sujeito a revisão • Você pode corrigir ou aprimorar a qualquer momento.
            </p>
          </div>
        </div>
      )}

      {/* 4. Conteúdo das outras abas (Metodologia, Dimensões e Regras) */}
      {abaAtiva !== "visao_geral" && (
        <div className="space-y-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 capitalize">
                Detalhamento: {abaAtiva}
              </h2>
              <p className="text-xs text-slate-500">
                18 Dimensões Canônicas e Regras Prescritivas/Proscritivas do seu Cérebro Autoral
              </p>
            </div>
            <button
              onClick={() => setAbaAtiva("visao_geral")}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              ← Voltar à Visão Geral
            </button>
          </div>

          <AcordeaoDimensoes
            dimensoes={dimensoes}
            caracteristicas={caracteristicas}
            regras={regras}
          />
        </div>
      )}

      {/* Modal de Evidências */}
      {modalEvidenciasAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Evidências do Cérebro Autoral
              </h3>
              <button
                onClick={() => setModalEvidenciasAberto(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Todas as teses e conclusões foram extraídas das obras e reflexões do seu acervo com cálculo de confiança e rastreabilidade:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-800 block">
                  1. Preferência por metáforas orgânicas e reflexivas
                </span>
                <span className="text-slate-500 text-[11px] block">
                  Fonte: Manuscrito original &ldquo;O Pequeno Grande Príncipe do Norte&rdquo; (Cap. 3, 7 e 12)
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Confiabilidade: 94% • Confirmado pelo autor
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-800 block">
                  2. Distinção rigorosa entre técnica e propósito humano
                </span>
                <span className="text-slate-500 text-[11px] block">
                  Fonte: Reflexão &ldquo;Sobre o valor da espera&rdquo; e cartas pessoais
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Confiabilidade: 98% • Confirmado pelo autor
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalEvidenciasAberto(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
