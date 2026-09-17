"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  BookOpen,
  Sparkles,
  Compass,
  FileQuestion,
} from "lucide-react";
import type { ObraDetalhada, TipoObra } from "@/tipos/biblioteca";
import { CardObra } from "./card-obra";
import { ModalAdicionarConteudo } from "./modal-adicionar-conteudo";

interface Props {
  obrasIniciais: ObraDetalhada[];
  usuarioId: string;
}

const ABAS_TIPO: { id: string; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "livro", rotulo: "Livros" },
  { id: "reflexao", rotulo: "Reflexões" },
  { id: "carta", rotulo: "Cartas" },
  { id: "relato", rotulo: "Relatos" },
  { id: "ensaio", rotulo: "Ensaios" },
  { id: "artigo", rotulo: "Artigos" },
  { id: "caderno_notas", rotulo: "Cadernos" },
];

export function ListaObras({ obrasIniciais, usuarioId }: Props) {
  const [obras, setObras] = useState<ObraDetalhada[]>(obrasIniciais);
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [naturezaFiltro, setNaturezaFiltro] = useState<"todas" | "autoral" | "externa_aprovada">("todas");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // Filtragem client-side ágil
  const obrasFiltradas = useMemo(() => {
    return obras.filter((obra) => {
      // Filtro por tipo
      if (abaAtiva !== "todos" && obra.tipo !== abaAtiva) {
        return false;
      }

      // Filtro por natureza epistemológica
      if (naturezaFiltro !== "todas" && obra.natureza !== naturezaFiltro) {
        return false;
      }

      // Filtro de busca textual
      if (busca.trim().length > 0) {
        const termo = busca.toLowerCase().trim();
        const coincideTitulo = obra.titulo.toLowerCase().includes(termo);
        const coincideSubtitulo = obra.subtitulo?.toLowerCase().includes(termo);
        const coincideAutor = obra.autor_nome.toLowerCase().includes(termo);
        const coincideDescricao = obra.descricao?.toLowerCase().includes(termo);

        if (!coincideTitulo && !coincideSubtitulo && !coincideAutor && !coincideDescricao) {
          return false;
        }
      }

      return true;
    });
  }, [obras, abaAtiva, naturezaFiltro, busca]);

  function lidarExcluirObra(id: string) {
    setObras((atuais) => atuais.filter((o) => o.id !== id));
  }

  function lidarSalvarObra(novaObra: ObraDetalhada) {
    setObras((atuais) => [novaObra, ...atuais]);
  }

  return (
    <div>
      {/* Barra de Controles e Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, autor, fragmento ou tema..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filtro por Natureza e Botão Adicionar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={naturezaFiltro}
              onChange={(e) => setNaturezaFiltro(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
            >
              <option value="todas">Todas as Fontes</option>
              <option value="autoral">Apenas Núcleo Autoral</option>
              <option value="externa_aprovada">Apenas Influências Externas</option>
            </select>
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Conteúdo</span>
          </button>
        </div>
      </div>

      {/* Abas Horizontais de Tipos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-neutral-800/60">
        {ABAS_TIPO.map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                ativa
                  ? "bg-neutral-100 text-neutral-950 shadow-md"
                  : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {/* Grid de Obras */}
      {obrasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {obrasFiltradas.map((obra) => (
            <CardObra
              key={obra.id}
              obra={obra}
              aoExcluir={lidarExcluirObra}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 mx-auto flex items-center justify-center text-neutral-400 mb-4">
            {busca || abaAtiva !== "todos" || naturezaFiltro !== "todas" ? (
              <FileQuestion className="w-7 h-7 text-neutral-500" />
            ) : (
              <BookOpen className="w-7 h-7 text-amber-400" />
            )}
          </div>

          <h3 className="font-serif text-lg text-neutral-200 font-medium mb-1">
            {busca || abaAtiva !== "todos" || naturezaFiltro !== "todas"
              ? "Nenhuma obra encontrada para estes filtros"
              : "Seu acervo de obras está vazio"}
          </h3>

          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
            {busca || abaAtiva !== "todos" || naturezaFiltro !== "todas"
              ? "Tente ajustar o termo de busca ou selecionar outra categoria para ver os itens catalogados."
              : "Adicione seus livros, ensaios, reflexões ou influências deliberadas para formar a base do seu Cérebro Autoral."}
          </p>

          {!(busca || abaAtiva !== "todos" || naturezaFiltro !== "todas") && (
            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Conteúdo
            </button>
          )}
        </div>
      )}

      {/* Modal Adicionar Conteúdo */}
      <ModalAdicionarConteudo
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={lidarSalvarObra}
        usuarioId={usuarioId}
      />
    </div>
  );
}
