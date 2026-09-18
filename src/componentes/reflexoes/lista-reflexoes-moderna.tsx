"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Inbox,
  BookmarkCheck,
} from "lucide-react";
import type { ResumoReflexao } from "@/tipos/reflexoes";


interface Props {
  reflexoesIniciais: ResumoReflexao[];
}

const ABAS_STATUS = [
  { id: "todas", rotulo: "Todas" },
  { id: "rascunhos", rotulo: "Rascunhos" },
  { id: "em_revisao", rotulo: "Em revisão" },
  { id: "aprovadas", rotulo: "Aprovadas" },
  { id: "incorporadas", rotulo: "Incorporadas" },
];

export function ListaReflexoesModerna({ reflexoesIniciais }: Props) {
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("todas");

  const reflexoesCompletas = reflexoesIniciais;

  const reflexoesFiltradas = useMemo(() => {
    return reflexoesCompletas.filter((r) => {
      // Filtro de status
      if (abaAtiva !== "todas") {
        if (abaAtiva === "aprovadas" && r.estado_entrada !== "concluida") return false;
        if (abaAtiva === "em_revisao" && r.estado_entrada !== "em_auditoria" && r.estado_entrada !== "em_redacao") return false;
        if (abaAtiva === "incorporadas" && r.estado_entrada !== "concluida") return false;
        if (abaAtiva === "rascunhos" && r.estado_entrada !== "criada" && r.estado_entrada !== "planejada") return false;
      }

      // Filtro de busca
      if (busca.trim().length > 0) {
        const termo = busca.toLowerCase().trim();
        const coincideTitulo = (r.ultimo_titulo_gerado || r.titulo).toLowerCase().includes(termo);
        const coincideTema = r.tema_central.toLowerCase().includes(termo);
        if (!coincideTitulo && !coincideTema) return false;
      }

      return true;
    });
  }, [reflexoesCompletas, abaAtiva, busca]);

  // Capa em miniatura baseada em índice
  const gradientes = [
    "from-amber-600 to-orange-700",
    "from-blue-600 to-indigo-800",
    "from-teal-600 to-emerald-800",
    "from-purple-600 to-violet-800",
    "from-rose-600 to-amber-700",
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Abas de Status em Formato Pílula */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ABAS_STATUS.map((aba) => {
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

      {/* Barra de Busca e Botão "+ Nova Reflexão" */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar reflexões por título ou tema..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors"
          />
        </div>

        <Link
          href="/reflexoes/criar"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>+ Nova Reflexão</span>
        </Link>
      </div>

      {/* Lista de Reflexões */}
      {reflexoesFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma reflexão encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crie sua primeira reflexão para começar a desenvolver novas ideias a partir do seu acervo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reflexoesFiltradas.map((item, index) => {
            const gradiente = gradientes[index % gradientes.length];
            const tituloExibido = item.ultimo_titulo_gerado || item.titulo;
            const pontuacao = item.ultima_pontuacao_auditoria;
            const isAprovada = item.estado_entrada === "concluida";
            const isRascunho = item.estado_entrada === "criada" || item.estado_entrada === "planejada";

            return (
              <div
                key={item.entrada_id}
                className="group bg-white border border-slate-200 hover:border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Linha de status colorida */}
                <div className={`h-0.5 w-full ${isAprovada ? "bg-emerald-500" : isRascunho ? "bg-slate-300" : "bg-amber-400"}`} />

                <div className="p-4 flex items-start gap-4">
                  {/* Capa */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${gradiente} p-2 flex flex-col justify-end text-white shadow-sm shrink-0 relative overflow-hidden`}
                  >
                    <Sparkles className="w-3.5 h-3.5 opacity-80 mb-auto" />
                    <span className="text-[8px] font-semibold uppercase tracking-wider opacity-80 truncate">
                      {item.formato_desejado}
                    </span>
                  </div>

                  {/* Dados */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/reflexoes/${item.entrada_id}`}
                      className="block font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition-colors truncate"
                    >
                      {tituloExibido}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{new Date(item.criado_em).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.tema_central}
                      </span>
                      {item.total_versoes > 0 && (
                        <>
                          <span>•</span>
                          <span>{item.total_versoes}v</span>
                        </>
                      )}
                    </div>

                    {/* Status + Pontuação */}
                    <div className="flex items-center gap-2 mt-2">
                      {isAprovada ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aprovada
                          </span>
                          {pontuacao && (
                            <span className="text-[11px] font-bold text-slate-600">
                              {Math.round(pontuacao * 100)}% fidelidade
                            </span>
                          )}
                        </>
                      ) : isRascunho ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Calendar className="w-3 h-3" />
                          Rascunho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Em revisão
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link
                      href={`/reflexoes/${item.entrada_id}`}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Ver reflexão"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Rodapé com botões de ação contextuais */}
                <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-3 bg-slate-50/60">
                  {isRascunho && (
                    <Link
                      href={`/reflexoes/${item.entrada_id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Continuar redigindo
                    </Link>
                  )}
                  {!isRascunho && !isAprovada && (
                    <Link
                      href={`/reflexoes/${item.entrada_id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ver revisão
                    </Link>
                  )}
                  {isAprovada && (
                    <button
                      onClick={() => alert("Incorporação ao Cérebro — funcionalidade em breve.")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Incorporar ao Cérebro
                    </button>
                  )}

                  <span className="text-slate-300">|</span>

                  <Link
                    href={`/reflexoes/${item.entrada_id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Abrir
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
