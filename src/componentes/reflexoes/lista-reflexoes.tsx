"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Sparkles, CheckCircle2, ShieldCheck, FileText, Layers } from "lucide-react";
import type { ResumoReflexao, FormatoReflexao } from "@/tipos/reflexoes";
import { CardReflexao } from "./card-reflexao";
import { ModalNovaReflexao } from "./modal-nova-reflexao";

interface Props {
  reflexoesIniciais: ResumoReflexao[];
}

export function ListaReflexoes({ reflexoesIniciais }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroFormato, setFiltroFormato] = useState<string>("todos");
  const [modalAberto, setModalAberto] = useState(false);

  // Filtragem combinada
  const reflexoesFiltradas = useMemo(() => {
    return reflexoesIniciais.filter((r) => {
      const matchEstado = filtroEstado === "todos" || r.estado_entrada === filtroEstado;
      const matchFormato = filtroFormato === "todos" || r.formato_desejado === filtroFormato;
      const termo = busca.toLowerCase().trim();
      const matchBusca =
        !termo ||
        r.titulo.toLowerCase().includes(termo) ||
        r.tema_central.toLowerCase().includes(termo) ||
        (r.ultimo_titulo_gerado && r.ultimo_titulo_gerado.toLowerCase().includes(termo));

      return matchEstado && matchFormato && matchBusca;
    });
  }, [reflexoesIniciais, busca, filtroEstado, filtroFormato]);

  // Métricas
  const metricas = useMemo(() => {
    const total = reflexoesIniciais.length;
    const concluidas = reflexoesIniciais.filter((r) => r.estado_entrada === "concluida").length;
    const comAuditoria = reflexoesIniciais.filter(
      (r) => r.ultima_pontuacao_auditoria !== null && r.ultima_pontuacao_auditoria !== undefined
    );
    const mediaAuditoria =
      comAuditoria.length > 0
        ? Math.round(
            (comAuditoria.reduce((acc, r) => acc + (r.ultima_pontuacao_auditoria || 0), 0) /
              comAuditoria.length) *
              100
          )
        : 0;
    const totalVersoes = reflexoesIniciais.reduce((acc, r) => acc + (r.total_versoes || 0), 0);

    return { total, concluidas, mediaAuditoria, totalVersoes };
  }, [reflexoesIniciais]);

  return (
    <div className="space-y-6">
      {/* Métricas do Estúdio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Reflexões</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.total}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Obras reflexivas iniciadas</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Aprovadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.concluidas}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Auditadas e chanceladas</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Média Auditor</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">
            {metricas.mediaAuditoria > 0 ? `${metricas.mediaAuditoria}%` : "—"}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Conformidade e rigor autoral</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Versões</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.totalVersoes}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Iterações redigidas</div>
        </div>
      </div>

      {/* Barra de Controles: Busca, Filtros e Botão Criar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900/70 border border-neutral-800 p-3 rounded-2xl">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, tema central ou reflexão..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filtro Formato */}
        <select
          value={filtroFormato}
          onChange={(e) => setFiltroFormato(e.target.value)}
          aria-label="Filtrar por formato de reflexão"
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
        >
          <option value="todos">Todos os Formatos</option>
          <option value="ensaio">Ensaio Epistêmico</option>
          <option value="artigo">Artigo de Opinião</option>
          <option value="aforismo">Aforismos</option>
          <option value="newsletter">Carta / Newsletter</option>
          <option value="dialogo">Diálogo</option>
          <option value="tese">Tese</option>
        </select>

        {/* Filtro Estado */}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado da reflexão"
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
        >
          <option value="todos">Todos os Estados</option>
          <option value="criada">Criada</option>
          <option value="planejada">Planejada</option>
          <option value="em_redacao">Em Redação</option>
          <option value="em_auditoria">Em Auditoria</option>
          <option value="concluida">Concluída / Aprovada</option>
        </select>

        {/* Botão Nova Reflexão */}
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-medium rounded-xl text-xs shadow-md transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Reflexão</span>
        </button>
      </div>

      {/* Listagem */}
      {reflexoesFiltradas.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center">
          <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-serif text-base text-neutral-300">Nenhuma reflexão encontrada</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {busca || filtroEstado !== "todos" || filtroFormato !== "todos"
              ? "Tente redefinir os filtros de busca para encontrar as reflexões desejadas."
              : "Inicie sua primeira reflexão autoral para ativar o ciclo de planejamento, redação e auditoria crítica."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reflexoesFiltradas.map((reflexao) => (
            <CardReflexao key={reflexao.entrada_id} reflexao={reflexao} />
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <ModalNovaReflexao
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
