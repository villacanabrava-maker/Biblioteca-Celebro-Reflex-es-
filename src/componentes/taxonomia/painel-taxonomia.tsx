"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  Network,
  BookOpen,
  Layers,
  GitBranch,
  Sparkles,
} from "lucide-react";
import type { ConceitoTaxonomico, ArestaGrafoTaxonomia } from "@/tipos/taxonomia";
import { CardConceito } from "./card-conceito";
import { GrafoTaxonomia } from "./grafo-taxonomia";
import { ModalAdicionarConceito } from "./modal-adicionar-conceito";

interface Props {
  conceitosIniciais: ConceitoTaxonomico[];
  arestasIniciais: ArestaGrafoTaxonomia[];
}

const DOMINIOS: { id: string; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos os domínios" },
  { id: "intelectual", rotulo: "Intelectual" },
  { id: "axiologico", rotulo: "Axiológico" },
  { id: "reflexivo", rotulo: "Reflexivo" },
  { id: "narrativo", rotulo: "Narrativo" },
  { id: "temporal", rotulo: "Temporal" },
  { id: "retorico", rotulo: "Retórico" },
  { id: "linguistico", rotulo: "Linguístico" },
  { id: "estrutural", rotulo: "Estrutural" },
  { id: "autoral", rotulo: "Núcleo autoral" },
];

export function PainelTaxonomia({ conceitosIniciais, arestasIniciais }: Props) {
  const [busca, setBusca] = useState("");
  const [dominioSelecionado, setDominioSelecionado] = useState("todos");
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "grafo">("cards");
  const [modalAberto, setModalAberto] = useState(false);

  const conceitosFiltrados = useMemo(() => {
    return conceitosIniciais.filter((conceito) => {
      const matchDominio =
        dominioSelecionado === "todos" || conceito.dominio === dominioSelecionado;
      const termo = busca.toLowerCase().trim();
      const matchBusca =
        !termo ||
        conceito.termo_preferencial.toLowerCase().includes(termo) ||
        conceito.definicao.toLowerCase().includes(termo) ||
        conceito.termos_sinonimos?.some((sinonimo) =>
          sinonimo.termo.toLowerCase().includes(termo)
        );

      return matchDominio && matchBusca;
    });
  }, [conceitosIniciais, busca, dominioSelecionado]);

  const metricas = useMemo(() => {
    return {
      totalConceitos: conceitosIniciais.length,
      dominiosAtivos: new Set(conceitosIniciais.map((conceito) => conceito.dominio)).size,
      totalConexoes: arestasIniciais.length,
      totalOcorrencias: conceitosIniciais.reduce(
        (total, conceito) => total + (conceito.total_fragmentos || 0),
        0
      ),
    };
  }, [conceitosIniciais, arestasIniciais]);

  const cards = [
    {
      rotulo: "Conceitos",
      valor: metricas.totalConceitos,
      detalhe: "conceitos registrados",
      icone: BookOpen,
      classe: "bg-blue-50 text-blue-600",
    },
    {
      rotulo: "Domínios",
      valor: metricas.dominiosAtivos,
      detalhe: "campos com conceitos",
      icone: Layers,
      classe: "bg-violet-50 text-violet-600",
    },
    {
      rotulo: "Conexões",
      valor: metricas.totalConexoes,
      detalhe: "relações no grafo",
      icone: GitBranch,
      classe: "bg-indigo-50 text-indigo-600",
    },
    {
      rotulo: "Ocorrências",
      valor: metricas.totalOcorrencias,
      detalhe: "fragmentos associados",
      icone: Sparkles,
      classe: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ rotulo, valor, detalhe, icone: Icone, classe }) => (
          <div key={rotulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{rotulo}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${classe}`}>
                <Icone className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{valor}</div>
            <div className="mt-1 text-xs text-slate-500">{detalhe}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar conceito, definição ou sinônimo..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        <select
          value={dominioSelecionado}
          onChange={(evento) => setDominioSelecionado(evento.target.value)}
          aria-label="Filtrar conceitos por domínio"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          {DOMINIOS.map((dominio) => (
            <option key={dominio.id} value={dominio.id}>
              {dominio.rotulo}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setModoVisualizacao("cards")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              modoVisualizacao === "cards"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setModoVisualizacao("grafo")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              modoVisualizacao === "grafo"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            Grafo
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo conceito
        </button>
      </div>

      {modoVisualizacao === "cards" ? (
        conceitosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-slate-900">
              Nenhum conceito encontrado
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {busca || dominioSelecionado !== "todos"
                ? "Altere a busca ou o filtro de domínio."
                : "Cadastre o primeiro conceito para começar o mapa de ideias do seu acervo."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {conceitosFiltrados.map((conceito) => (
              <CardConceito key={conceito.id} conceito={conceito} />
            ))}
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
          <GrafoTaxonomia conceitos={conceitosFiltrados} arestas={arestasIniciais} />
        </div>
      )}

      <ModalAdicionarConceito
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSucesso={() => setModalAberto(false)}
      />
    </div>
  );
}
