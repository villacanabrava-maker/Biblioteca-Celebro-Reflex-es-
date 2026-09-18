"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  X,
  UploadCloud,
  FileText,
  BookOpen,
  Mail,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  PenTool,
  Send,
} from "lucide-react";
import {
  calcularHashSha256,
  iniciarUploadTus,
  obterTokenAutenticadoBrowser,
} from "@/infraestrutura/storage/cliente-tus";
import { cadastrarObra } from "@/acoes/biblioteca";
import type { TipoObra, NaturezaObra, ObraDetalhada } from "@/tipos/biblioteca";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (obra: ObraDetalhada) => void;
  usuarioId: string;
}

type ModoEntrada =
  | "arquivo"
  | "escrever_texto"
  | "relato"
  | "carta"
  | "reflexao"
;

type EtapaUpload =
  | "formulario"
  | "calculando_hash"
  | "enviando_arquivo"
  | "registrando"
  | "concluido";

export function ModalAdicionarConteudo({
  aberto,
  aoFechar,
  aoSalvar,
  usuarioId,
}: Props) {
  const [modo, setModo] = useState<ModoEntrada>("arquivo");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  // Campos do formulário
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [autorNome, setAutorNome] = useState("Autor");
  const [anoPublicacao, setAnoPublicacao] = useState<number | undefined>(
    new Date().getFullYear()
  );
  const [descricao, setDescricao] = useState("");
  const [conteudoTexto, setConteudoTexto] = useState("");
  const [tagsTexto, setTagsTexto] = useState("");

  // Eixos Canônicos de Classificação de Fonte (Master Document v2.0)
  const [papelFonte, setPapelFonte] = useState<"autoral" | "externa">("autoral");
  const [participacaoCerebro, setParticipacaoCerebro] = useState<
    "nucleo_autoral" | "referencia" | "influencia_deliberada" | "excluida"
  >("nucleo_autoral");
  const [escoposInfluencia, setEscoposInfluencia] = useState<string[]>([
    "pensamento",
    "interpretacao",
  ]);
  const [intensidadeInfluencia, setIntensidadeInfluencia] = useState<
    "leve" | "moderada" | "forte"
  >("moderada");

  // Estados de envio
  const [etapa, setEtapa] = useState<EtapaUpload>("formulario");
  const [progressoEnvio, setProgressoEnvio] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  const opcoesTipo: {
    id: ModoEntrada;
    titulo: string;
    descricao: string;
    icone: any;
    tipoObra: TipoObra;
  }[] = [
    {
      id: "arquivo",
      titulo: "Arquivo",
      descricao: "PDF, DOCX, TXT, EPUB ou MD",
      icone: UploadCloud,
      tipoObra: "livro",
    },
    {
      id: "escrever_texto",
      titulo: "Escrever texto",
      descricao: "Cole ou escreva diretamente",
      icone: PenTool,
      tipoObra: "artigo",
    },
    {
      id: "relato",
      titulo: "Adicionar relato",
      descricao: "Registre uma experiência",
      icone: FileText,
      tipoObra: "relato",
    },
    {
      id: "carta",
      titulo: "Adicionar carta",
      descricao: "Guarde uma correspondência",
      icone: Mail,
      tipoObra: "carta",
    },
    {
      id: "reflexao",
      titulo: "Adicionar reflexão",
      descricao: "Registre uma reflexão pessoal",
      icone: Compass,
      tipoObra: "reflexao",
    },
  ];

  function inferirMetadadosDoArquivo(file: File) {
    setArquivo(file);
    const nomeBase = file.name.replace(/\.[^/.]+$/, "");
    const tituloSugerido = nomeBase
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!titulo) {
      setTitulo(tituloSugerido);
    }
  }

  function lidarDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(true);
  }

  function lidarDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
  }

  function lidarDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      inferirMetadadosDoArquivo(e.dataTransfer.files[0]);
    }
  }

  function lidarSelecaoArquivo(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      inferirMetadadosDoArquivo(e.target.files[0]);
    }
  }

  async function submeterFormulario(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      setErro("O título da obra é obrigatório.");
      return;
    }

    let arquivoParaUpload: File;

    if (modo === "arquivo") {
      if (!arquivo) {
        setErro("Por favor, selecione um arquivo para upload.");
        return;
      }
      arquivoParaUpload = arquivo;
    } else {
      if (!conteudoTexto.trim()) {
        setErro("Por favor, digite ou cole o conteúdo do texto.");
        return;
      }
      const nomeArquivo = `${titulo.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() || "texto"}.txt`;
      const blob = new Blob([conteudoTexto], { type: "text/plain;charset=utf-8" });
      arquivoParaUpload = new File([blob], nomeArquivo, { type: "text/plain" });
    }

    setErro(null);

    try {
      // 1. Obter Sessão e Token Autenticado no Browser
      setEtapa("calculando_hash");
      const authInfo = await obterTokenAutenticadoBrowser();
      const idUsuarioEfetivo = authInfo.usuarioId || usuarioId;

      // 2. Calcular Hash SHA-256 no browser
      const hashSha256 = await calcularHashSha256(arquivoParaUpload);

      // 3. Montar caminho de destino rigorosamente isolado: /{auth.uid()}/{timestamp}/{nome}
      const timestamp = Date.now();
      const nomeSanitizado = arquivoParaUpload.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const caminhoDestino = `${idUsuarioEfetivo}/${timestamp}/${nomeSanitizado}`;

      // 4. Upload TUS com o Bearer Token da sessão autenticada (evita 403)
      setEtapa("enviando_arquivo");
      setProgressoEnvio(0);

      await new Promise<void>((resolve, reject) => {
        iniciarUploadTus({
          arquivo: arquivoParaUpload,
          caminhoDestino,
          tokenAutenticacao: authInfo.token,
          aoProgredir: (porcentagem) => {
            setProgressoEnvio(porcentagem);
          },
          aoSucesso: () => {
            resolve();
          },
          aoErro: (err) => {
            reject(err);
          },
        }).catch(reject);
      });

      // 5. Registrar no Banco de Dados
      setEtapa("registrando");
      const opcaoSelecionada = opcoesTipo.find((o) => o.id === modo);
      const tipoObra: TipoObra = opcaoSelecionada ? opcaoSelecionada.tipoObra : "livro";

      const resultado = await cadastrarObra({
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || undefined,
        autor_nome: autorNome.trim() || (papelFonte === "autoral" ? "Autor" : "Fonte Externa"),
        tipo: tipoObra,
        natureza:
          papelFonte === "autoral"
            ? "autoral"
            : participacaoCerebro === "influencia_deliberada"
            ? "externa_aprovada"
            : "referencia",
        papel_fonte: papelFonte,
        participacao_cerebro: participacaoCerebro,
        escopos_influencia:
          participacaoCerebro === "influencia_deliberada" ? escoposInfluencia : [],
        intensidade_influencia:
          participacaoCerebro === "influencia_deliberada" ? intensidadeInfluencia : null,
        ano_publicacao: anoPublicacao,
        descricao: descricao.trim() || undefined,
        participa_cerebro: participacaoCerebro !== "excluida",
        peso_autoral: papelFonte === "autoral" ? 1.0 : 0.0,
        arquivo_caminho: caminhoDestino,
        arquivo_nome_original: arquivoParaUpload.name,
        arquivo_tamanho_bytes: arquivoParaUpload.size,
        arquivo_mime_type: arquivoParaUpload.type || "text/plain",
        hash_sha256: hashSha256,
        metadados: {
          tags: tagsTexto
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          origem_upload: modo,
        },
      });

      setEtapa("concluido");
      setTimeout(() => {
        aoSalvar(resultado.obra);
        aoFechar();
      }, 700);
    } catch (err: unknown) {
      console.error("Erro no fluxo de envio:", err);
      const mensagem =
        err instanceof Error ? err.message : "Erro inesperado ao realizar upload.";
      setErro(mensagem);
      setEtapa("formulario");
    }
  }

  const emProcesso = etapa !== "formulario";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Adicionar conteúdo à Biblioteca
              </h2>
              <p className="text-xs text-slate-500">
                Envie um arquivo ou registre um texto no seu acervo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            disabled={emProcesso}
            aria-label="Fechar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grade com os 6 Tipos de Conteúdo */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Como deseja adicionar?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {opcoesTipo.map((op) => {
              const selecionado = modo === op.id;
              const Icone = op.icone;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setModo(op.id)}
                  disabled={emProcesso}
                  className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                    selecionado
                      ? "bg-white border-blue-600 shadow-sm ring-2 ring-blue-600/10"
                      : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selecionado
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {op.titulo}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {op.descricao}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={submeterFormulario} className="p-6 space-y-5">
          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Área de Seleção de Arquivo (Quando modo == arquivo ou lote) */}
          {modo === "arquivo" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Arquivo do Documento (PDF, DOCX, TXT, EPUB) *
              </label>
              <input
                ref={inputArquivoRef}
                type="file"
                accept=".pdf,.epub,.docx,.txt,.md"
                onChange={lidarSelecaoArquivo}
                className="hidden"
              />

              {!arquivo ? (
                <div
                  onDragOver={lidarDragOver}
                  onDragLeave={lidarDragLeave}
                  onDrop={lidarDrop}
                  onClick={() => inputArquivoRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    arrastando
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PDF, DOCX, TXT, EPUB ou Markdown.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {arquivo.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(arquivo.size / (1024 * 1024)).toFixed(2)} MB • {arquivo.type || "Documento"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArquivo(null)}
                    className="text-xs text-rose-600 hover:underline px-2"
                  >
                    Trocar
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Área de Texto Direto */
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Conteúdo do Texto / Relato / Carta *
              </label>
              <textarea
                value={conteudoTexto}
                onChange={(e) => setConteudoTexto(e.target.value)}
                placeholder="Escreva ou cole aqui as reflexões, relatos ou cartas do seu acervo..."
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
              />
            </div>
          )}

          {/* Dados do Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título do Documento *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: O Pequeno Grande Príncipe do Norte"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subtítulo ou Assunto
              </label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Uma jornada sobre esperança e família"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Autor
              </label>
              <input
                type="text"
                value={autorNome}
                onChange={(e) => setAutorNome(e.target.value)}
                placeholder="Nome do autor ou fonte"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ano de Publicação / Criação
              </label>
              <input
                type="number"
                value={anoPublicacao || ""}
                onChange={(e) => setAnoPublicacao(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Ex: 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags e Temas Relacionados (separados por vírgula)
            </label>
            <input
              type="text"
              value={tagsTexto}
              onChange={(e) => setTagsTexto(e.target.value)}
              placeholder="Ex: Esperança, Família, Propósito, Maturidade"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Classificação Canônica de Fontes (Dois Eixos - Documento Mestre v2.0) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Classificação da Autoria da Fonte
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPapelFonte("autoral");
                    setParticipacaoCerebro("nucleo_autoral");
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    papelFonte === "autoral"
                      ? "bg-blue-50 border-blue-600 text-blue-800 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block font-bold">Meu material (Autoral)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Produção intelectual própria
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPapelFonte("externa");
                    setParticipacaoCerebro("referencia");
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    papelFonte === "externa"
                      ? "bg-purple-50 border-purple-600 text-purple-800 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block font-bold">Material de terceiros (Externo)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Livro, artigo ou autor externo
                  </span>
                </button>
              </div>
            </div>

            {/* Participação no Cérebro Autoral */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Participação no Cérebro Autoral
              </label>
              {papelFonte === "autoral" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setParticipacaoCerebro("nucleo_autoral")}
                    className={`px-3 py-2 rounded-xl text-xs border text-left transition-all ${
                      participacaoCerebro === "nucleo_autoral"
                        ? "bg-blue-600 text-white border-blue-600 font-semibold"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Núcleo Autoral
                    <span className="block text-[10px] opacity-80 font-normal">
                      Alimenta metodologias e Cérebro
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipacaoCerebro("excluida")}
                    className={`px-3 py-2 rounded-xl text-xs border text-left transition-all ${
                      participacaoCerebro === "excluida"
                        ? "bg-slate-800 text-white border-slate-800 font-semibold"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Excluir do Cérebro
                    <span className="block text-[10px] opacity-80 font-normal">
                      Apenas arquivado no acervo
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setParticipacaoCerebro("referencia")}
                      className={`px-3 py-2 rounded-xl text-xs border text-left transition-all ${
                        participacaoCerebro === "referencia"
                          ? "bg-purple-600 text-white border-purple-600 font-semibold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      Somente Referência
                      <span className="block text-[10px] opacity-80 font-normal">
                        Consulta técnica/apoio
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipacaoCerebro("influencia_deliberada")}
                      className={`px-3 py-2 rounded-xl text-xs border text-left transition-all ${
                        participacaoCerebro === "influencia_deliberada"
                          ? "bg-amber-600 text-white border-amber-600 font-semibold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      Influência Deliberada
                      <span className="block text-[10px] opacity-80 font-normal">
                        Autorizada explicitamente
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipacaoCerebro("excluida")}
                      className={`px-3 py-2 rounded-xl text-xs border text-left transition-all ${
                        participacaoCerebro === "excluida"
                          ? "bg-slate-800 text-white border-slate-800 font-semibold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      Excluir
                      <span className="block text-[10px] opacity-80 font-normal">
                        Não influencia
                      </span>
                    </button>
                  </div>

                  {participacaoCerebro === "influencia_deliberada" && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900">
                          Dimensões de Influência Autorizadas:
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-900 font-semibold">
                          <span>Intensidade:</span>
                          {(["leve", "moderada", "forte"] as const).map((grau) => (
                            <button
                              key={grau}
                              type="button"
                              onClick={() => setIntensidadeInfluencia(grau)}
                              className={`px-2 py-0.5 rounded capitalize ${
                                intensidadeInfluencia === grau
                                  ? "bg-amber-600 text-white font-bold"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {grau}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                        {[
                          { id: "pensamento", label: "Pensamento" },
                          { id: "interpretacao", label: "Interpretação" },
                          { id: "associacao", label: "Associação" },
                          { id: "argumentacao", label: "Argumentação" },
                          { id: "escrita", label: "Escrita" },
                          { id: "narrativa", label: "Narrativa" },
                          { id: "retorica", label: "Retórica" },
                          { id: "universo_conceitual", label: "Universo conceitual" },
                        ].map((dim) => {
                          const ativa = escoposInfluencia.includes(dim.id);
                          return (
                            <button
                              key={dim.id}
                              type="button"
                              onClick={() => {
                                if (ativa) {
                                  setEscoposInfluencia(
                                    escoposInfluencia.filter((e) => e !== dim.id)
                                  );
                                } else {
                                  setEscoposInfluencia([...escoposInfluencia, dim.id]);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg border text-left transition-all ${
                                ativa
                                  ? "bg-amber-600 text-white border-amber-600 font-medium"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {ativa ? "✓ " : "+ "}
                              {dim.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barra de Progresso durante envio */}
          {emProcesso && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  {etapa === "calculando_hash" && "Calculando integridade SHA-256..."}
                  {etapa === "enviando_arquivo" && `Enviando arquivo via TUS (${progressoEnvio}%)...`}
                  {etapa === "registrando" && "Registrando obra no seu acervo..."}
                  {etapa === "concluido" && "Upload concluído com sucesso!"}
                </span>
                <span>{progressoEnvio}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressoEnvio}%` }}
                />
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={aoFechar}
              disabled={emProcesso}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={emProcesso}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {emProcesso ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Adicionar à biblioteca</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
