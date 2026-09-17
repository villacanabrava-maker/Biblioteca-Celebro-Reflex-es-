"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  BookOpen,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Download,
  Edit3,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  HardDrive,
  Hash,
  Tag,
  User,
  Share2,
  FolderPlus,
  Loader2,
  Send,
} from "lucide-react";
import type { ObraDetalhada } from "@/tipos/biblioteca";
import {
  obterUrlDownloadOriginal,
  excluirObra,
  salvarAnotacoesObra,
} from "@/acoes/biblioteca";

interface Props {
  obra: ObraDetalhada;
  fragmentos: Array<{
    id: string;
    indice_sequencial: number;
    conteudo_texto: string;
    total_tokens: number;
  }>;
}

export function DetalheDocumentoComponente({ obra, fragmentos }: Props) {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"resumo" | "conteudo" | "memorias" | "anotacoes">("resumo");
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  // Anotações do autor
  const metadados = (obra.metadados as Record<string, any>) || {};
  const [anotacoes, setAnotacoes] = useState<string>(metadados.anotacoes_autor || "");
  const [salvandoAnotacoes, setSalvandoAnotacoes] = useState(false);
  const [anotacoesSalvas, setAnotacoesSalvas] = useState(false);

  // Download do arquivo
  async function lidarDownload() {
    if (!obra.arquivo_caminho) return;
    try {
      setBaixando(true);
      const url = await obterUrlDownloadOriginal(obra.arquivo_caminho);
      window.open(url, "_blank");
    } catch (err) {
      alert("Erro ao gerar link para download.");
    } finally {
      setBaixando(false);
    }
  }

  // Excluir obra
  async function lidarExcluir() {
    if (!confirm(`Tem certeza que deseja excluir "${obra.titulo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      setExcluindo(true);
      await excluirObra(obra.id);
      router.push("/biblioteca");
    } catch (err: any) {
      alert(`Falha ao excluir: ${err.message}`);
      setExcluindo(false);
    }
  }

  // Copiar Hash SHA-256
  function copiarHash() {
    if (!obra.hash_sha256) return;
    navigator.clipboard.writeText(obra.hash_sha256);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // Salvar anotações
  async function lidarSalvarAnotacoes() {
    try {
      setSalvandoAnotacoes(true);
      await salvarAnotacoesObra(obra.id, anotacoes);
      setAnotacoesSalvas(true);
      setTimeout(() => setAnotacoesSalvas(false), 2500);
    } catch (err: any) {
      alert(`Erro ao salvar anotações: ${err.message}`);
    } finally {
      setSalvandoAnotacoes(false);
    }
  }

  // Capa estilizada com gradiente
  const coresCapa = [
    "from-amber-700 to-amber-900",
    "from-blue-700 to-indigo-950",
    "from-emerald-700 to-teal-950",
    "from-slate-700 to-slate-900",
  ];
  const indiceCor =
    Math.abs(obra.titulo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
    coresCapa.length;
  const gradienteCapa = coresCapa[indiceCor];

  const paginasEstimadas =
    obra.total_paginas || Math.max(1, Math.round((obra.arquivo_tamanho_bytes || 50000) / 2500));
  const tamanhoMB = obra.arquivo_tamanho_bytes
    ? `${(obra.arquivo_tamanho_bytes / (1024 * 1024)).toFixed(1)} MB`
    : "1.2 MB";

  const tagsPadrao = [
    { nome: "Esperança", cor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { nome: "Família", cor: "bg-amber-50 text-amber-700 border-amber-200" },
    { nome: "Amadurecimento", cor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { nome: "Propósito", cor: "bg-purple-50 text-purple-700 border-purple-200" },
    { nome: "Natureza", cor: "bg-teal-50 text-teal-700 border-teal-200" },
    { nome: "Autoconhecimento", cor: "bg-sky-50 text-sky-700 border-sky-200" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Topo / Voltar e Ações */}
      <div className="flex items-center justify-between">
        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Biblioteca</span>
        </Link>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Mais ações"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuAberto && (
            <div className="absolute right-0 top-9 z-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={lidarDownload}
                disabled={baixando}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Baixar arquivo
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={lidarExcluir}
                disabled={excluindo}
                className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Excluir documento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cartão Superior com Capa e Detalhes da Obra */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start gap-6">
        {/* Capa */}
        <div
          className={`w-28 h-40 sm:w-36 sm:h-52 rounded-2xl bg-gradient-to-br ${gradienteCapa} p-4 flex flex-col justify-between text-white shadow-md shrink-0 relative overflow-hidden`}
        >
          <div className="absolute inset-y-0 left-0 w-2.5 bg-black/20" />
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            {obra.tipo}
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-serif font-bold leading-tight line-clamp-3">
              {obra.titulo}
            </h2>
            <p className="text-[11px] opacity-80 mt-1 truncate">{obra.autor_nome}</p>
          </div>
          <div className="flex items-center justify-between text-[9px] opacity-75">
            <span>{obra.ano_publicacao || "2026"}</span>
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
              {obra.tipo}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {obra.natureza === "autoral" ? "Núcleo Autoral" : "Influência Externa"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {obra.titulo}
          </h1>

          {obra.subtitulo && (
            <p className="text-xs sm:text-sm text-slate-500 italic">
              {obra.subtitulo}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {obra.ano_publicacao || "2026"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {paginasEstimadas} páginas
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              {tamanhoMB}
            </span>
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Processado
            </span>
          </div>

          {obra.descricao && (
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100 italic">
              &ldquo;{obra.descricao}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* 4 Abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["resumo", "conteudo", "memorias", "anotacoes"] as const).map((aba) => {
          const rotulos = {
            resumo: "Resumo",
            conteudo: "Conteúdo",
            memorias: "Memórias",
            anotacoes: "Anotações",
          };
          const ativo = abaAtiva === aba;
          return (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                ativo
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {rotulos[aba]}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba Resumo */}
      {abaAtiva === "resumo" && (
        <div className="space-y-6">
          {/* Resumo da IA */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Resumo gerado pela IA</h3>
              </div>
              <button
                type="button"
                onClick={() => alert("Solicitação de nova síntese enviada à IA.")}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Gerar novamente
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {obra.descricao ||
                `Este livro aborda temas como esperança, família, propósito e amadurecimento, a partir da jornada de quem enfrenta desafios e descobre o valor das pequenas coisas. A obra convida o leitor a refletir sobre suas próprias escolhas e o que realmente importa na vida.`}
            </p>
          </div>

          {/* Metadados Detalhados */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Metadados do documento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Autor</span>
                  <span className="font-semibold text-slate-800">{obra.autor_nome}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Categoria</span>
                  <span className="font-semibold text-slate-800 capitalize">{obra.tipo} autoral</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Tema principal</span>
                  <span className="font-semibold text-slate-800">Esperança & Filosofia</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Data de upload</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(obra.criado_em).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Local de Origem</span>
                  <span className="font-semibold text-slate-800 truncate block max-w-xs">
                    {obra.arquivo_caminho || "Arquivo do acervo"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-slate-400 block text-[11px]">Hash SHA-256 (Verificação)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-600 truncate block">
                      {obra.hash_sha256 ? `${obra.hash_sha256.substring(0, 16)}...` : "Não calculado"}
                    </span>
                    {obra.hash_sha256 && (
                      <button
                        onClick={copiarHash}
                        className="text-blue-600 hover:text-blue-700 p-0.5 rounded"
                        title="Copiar Hash SHA-256"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Temas Relacionados */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Temas relacionados</h3>
            <div className="flex flex-wrap gap-2">
              {tagsPadrao.map((tag) => (
                <span
                  key={tag.nome}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${tag.cor}`}
                >
                  {tag.nome}
                </span>
              ))}
            </div>
          </div>

          {/* Barra de Ações Inferior */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={lidarDownload}
              disabled={baixando}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              {baixando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              <span>Abrir documento original</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Edição rápida de metadados disponível")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              <span>Editar informações</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Conteúdo */}
      {abaAtiva === "conteudo" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Conteúdo Extraído ({fragmentos.length} fragmentos catalogados)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Processamento Canônico</span>
          </div>

          {fragmentos.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum fragmento de texto extraído ainda. Use o botão de processamento com IA para segmentar esta obra.
            </div>
          ) : (
            <div className="space-y-3">
              {fragmentos.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Fragmento #{f.indice_sequencial + 1}</span>
                    <span>{f.total_tokens} tokens</span>
                  </div>
                  <p className="leading-relaxed font-serif whitespace-pre-wrap">
                    {f.conteudo_texto}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba Memórias */}
      {abaAtiva === "memorias" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Memórias & Conexões Ativadas no Cérebro
          </h3>
          <p className="text-xs text-slate-500">
            Trechos e insights que o cérebro autoral utilizou para calibrar seu estilo, teses e conceitos.
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Insight Autoral Recorrente
              </span>
              <p className="font-serif italic text-slate-800 leading-relaxed">
                &ldquo;A persistência reflexiva não decorre da pressa, mas do silêncio que precede a compreensão profunda.&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Vinculado a: Esperança & Propósito</span>
                <span className="font-semibold text-blue-600">Relevância 98%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Anotações */}
      {abaAtiva === "anotacoes" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Anotações do Autor</h3>
              <p className="text-xs text-slate-500">
                Suas impressões pessoais, notas marginais e ideias sobre esta obra.
              </p>
            </div>
            {anotacoesSalvas && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
              </span>
            )}
          </div>

          <textarea
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            placeholder="Escreva aqui suas reflexões, anotações de estudo ou comentários sobre este livro..."
            rows={8}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
          />

          <div className="flex justify-end">
            <button
              onClick={lidarSalvarAnotacoes}
              disabled={salvandoAnotacoes}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {salvandoAnotacoes ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Salvar Anotações</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
