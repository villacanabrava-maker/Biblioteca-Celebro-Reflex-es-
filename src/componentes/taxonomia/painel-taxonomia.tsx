"use client";

import { useState, useMemo } from "react";
import { Plus, Search, LayoutGrid, Network, BookOpen, Layers, GitBranch, Sparkles } from "lucide-react";
import type { ConceitoTaxonomico, ArestaGrafoTaxonomia, DominioTaxonomico } from "@/tipos/taxonomia";
import { CardConceito } from "./card-conceito";
import { GrafoTaxonomia } from "./grafo-taxonomia";
import { ModalAdicionarConceito } from "./modal-adicionar-conceito";

interface Props {
  conceitosIniciais: ConceitoTaxonomico[];
  arestasIniciais: ArestaGrafoTaxonomia[];
}

const DOMINIOS: { id: string; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos os Domínios" },
  { id: "intelectual", rotulo: "Intelectual" },
  { id: "axiologico", rotulo: "Axiológico (Valores)" },
  { id: "reflexivo", rotulo: "Reflexivo" },
  { id: "narrativo", rotulo: "Narrativo" },
  { id: "temporal", rotulo: "Temporal" },
  { id: "retorico", rotulo: "Retórico" },
  { id: "linguistico", rotulo: "Linguístico" },
  { id: "estrutural", rotulo: "Estrutural" },
  { id: "autoral", rotulo: "Núcleo Autoral" },
];

export function PainelTaxonomia({ conceitosIniciais, arestasIniciais }: Props) {
  const [busca, setBusca] = useState("");
  const [dominioSelecionado, setDominioSelecionado] = useState("todos");
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "grafo">("cards");
  const [modalAberto, setModalAberto] = useState(false);

  // Filtros combinados
  const conceitosFiltrados = useMemo(() => {
    return conceitosIniciais.filter((c) => {
      const matchDominio = dominioSelecionado === "todos" || c.dominio === dominioSelecionado;
      const termoNormalizado = busca.toLowerCase().trim();
      const matchBusca =
        !termoNormalizado ||
        c.termo_preferencial.toLowerCase().includes(termoNormalizado) ||
        c.definicao.toLowerCase().includes(termoNormalizado) ||
        c.termos_sinonimos?.some((s) => s.termo.toLowerCase().includes(termoNormalizado));

      return matchDominio && matchBusca;
    });
  }, [conceitosIniciais, busca, dominioSelecionado]);

  // Métricas
  const metricas = useMemo(() => {
    const totalConceitos = conceitosIniciais.length;
    const dominiosAtivos = new Set(conceitosIniciais.map((c) => c.dominio)).size;
    const totalConexoes = arestasIniciais.length;
    const totalOcorrencias = conceitosIniciais.reduce((acc, c) => acc + (c.total_fragmentos || 0), 0);

    return { totalConceitos, dominiosAtivos, totalConexoes, totalOcorrencias };
  }, [conceitosIniciais, arestasIniciais]);

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Conceitos</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.totalConceitos}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Conceitos canônicos ativos</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Domínios</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.dominiosAtivos}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Campos ontológicos com termos</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Conexões</span>
            <GitBranch className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.totalConexoes}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Arestas ontológicas no grafo</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Ocorrências</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-serif text-neutral-100">{metricas.totalOcorrencias}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Fragmentos autorais associados</div>
        </div>
      </div>

      {/* Barra de Controles: Busca, Domínios, Alternador e Ação */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900/70 border border-neutral-800 p-3 rounded-2xl">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por conceito, definição ou sinônimo..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filtro por Domínio */}
        <select
          value={dominioSelecionado}
          onChange={(e) => setDominioSelecionado(e.target.value)}
          aria-label="Filtrar conceitos por domínio ontológico"
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500 transition-colors"
        >
          {DOMINIOS.map((dom) => (
            <option key={dom.id} value={dom.id}>
              {dom.rotulo}
            </option>
          ))}
        </select>

        {/* Alternador de Modo de Visualização */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setModoVisualizacao("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              modoVisualizacao === "cards"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVisualizacao("grafo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              modoVisualizacao === "grafo"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Grafo</span>
          </button>
        </div>

        {/* Botão Novo Conceito */}
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-medium rounded-xl text-xs shadow-md transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Conceito</span>
        </button>
      </div>

      {/* Conteúdo Principal: Cards ou Grafo */}
      {modoVisualizacao === "cards" ? (
        conceitosFiltrados.length === 0 ? (
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="font-serif text-base text-neutral-300">Nenhum conceito encontrado</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {busca || dominioSelecionado !== "todos"
                ? "Tente alterar os termos de busca ou o filtro de domínio."
                : "Cadastre o primeiro conceito para inaugurar o vocabulário canônico do autor."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {conceitosFiltrados.map((conceito) => (
              <CardConceito key={conceito.id} conceito={conceito} />
            ))}
          </div>
        )
      ) : (
        <GrafoTaxonomia conceitos={conceitosFiltrados} arestas={arestasIniciais} />
      )}

      {/* Modal de Cadastro de Conceito */}
      <ModalAdicionarConceito
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSucesso={() => setModalAberto(false)}
      />
    </div>
  );
}
