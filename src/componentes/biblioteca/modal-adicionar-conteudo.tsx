"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { calcularHashSha256, iniciarUploadTus } from "@/infraestrutura/storage/cliente-tus";
import { cadastrarObra } from "@/acoes/biblioteca";
import type { TipoObra, NaturezaObra, ObraDetalhada } from "@/tipos/biblioteca";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (obra: ObraDetalhada) => void;
  usuarioId: string;
}

type EtapaUpload = "formulario" | "calculando_hash" | "enviando_arquivo" | "registrando" | "concluido";

export function ModalAdicionarConteudo({ aberto, aoFechar, aoSalvar, usuarioId }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  // Campos do formulário
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [autorNome, setAutorNome] = useState("Autor");
  const [tipo, setTipo] = useState<TipoObra>("livro");
  const [natureza, setNatureza] = useState<NaturezaObra>("autoral");
  const [anoPublicacao, setAnoPublicacao] = useState<number | undefined>(new Date().getFullYear());
  const [descricao, setDescricao] = useState("");
  const [participaCerebro, setParticipaCerebro] = useState(true);
  const [pesoAutoral, setPesoAutoral] = useState(1.0);

  // Estados de envio
  const [etapa, setEtapa] = useState<EtapaUpload>("formulario");
  const [progressoEnvio, setProgressoEnvio] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto) return null;

  function inferirMetadadosDoArquivo(file: File) {
    setArquivo(file);
    // Limpar extensão e caracteres especiais para sugerir o título
    const nomeBase = file.name.replace(/\.[^/.]+$/, "");
    const tituloSugerido = nomeBase
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!titulo) {
      setTitulo(tituloSugerido);
    }

    // Inferência de tipo por extensão
    if (file.name.endsWith(".epub")) {
      setTipo("livro");
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
    if (!arquivo) {
      setErro("Por favor, selecione um arquivo original para upload.");
      return;
    }
    if (!titulo.trim()) {
      setErro("O título da obra é obrigatório.");
      return;
    }

    setErro(null);

    try {
      // 1. Calcular Hash SHA-256 no browser
      setEtapa("calculando_hash");
      const hashSha256 = await calcularHashSha256(arquivo);

      // 2. Montar caminho de destino no storage: /{usuarioId}/{uuidTemp}/original.ext
      const timestamp = Date.now();
      const nomeSanitizado = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const caminhoDestino = `${usuarioId}/${timestamp}/${nomeSanitizado}`;

      // 3. Upload Resumível via TUS direto para o Supabase Storage
      setEtapa("enviando_arquivo");
      setProgressoEnvio(0);

      await new Promise<void>((resolve, reject) => {
        iniciarUploadTus({
          arquivo,
          caminhoDestino,
          aoProgredir: (porcentagem) => {
            setProgressoEnvio(porcentagem);
          },
          aoSucesso: () => {
            resolve();
          },
          aoErro: (err) => {
            reject(err);
          },
        });
      });

      // 4. Registrar Obra e Versão no Banco
      setEtapa("registrando");
      const resultado = await cadastrarObra({
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || undefined,
        autor_nome: autorNome.trim() || "Autor",
        tipo,
        natureza,
        ano_publicacao: anoPublicacao,
        descricao: descricao.trim() || undefined,
        participa_cerebro: participaCerebro,
        peso_autoral: pesoAutoral,
        arquivo_caminho: caminhoDestino,
        arquivo_nome_original: arquivo.name,
        arquivo_tamanho_bytes: arquivo.size,
        arquivo_mime_type: arquivo.type || "application/octet-stream",
        hash_sha256: hashSha256,
        metadados: {},
      });

      setEtapa("concluido");
      setTimeout(() => {
        aoSalvar(resultado.obra);
        aoFechar();
      }, 800);
    } catch (err: unknown) {
      console.error("Erro no fluxo de cadastro:", err);
      const mensagem = err instanceof Error ? err.message : "Erro desconhecido durante o upload.";
      setErro(mensagem);
      setEtapa("formulario");
    }
  }

  const emProcesso = etapa !== "formulario";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-medium text-neutral-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              Adicionar Conteúdo ao Acervo
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Envio direto de manuscritos, livros e ensaios com preservação do original
            </p>
          </div>
          <button
            onClick={aoFechar}
            disabled={emProcesso}
            aria-label="Fechar janela"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={submeterFormulario} className="p-6 space-y-6">
          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{erro}</span>
            </div>
          )}

          {/* Área de Arquivo */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-2">
              Arquivo Original (PDF, EPUB, DOCX, TXT, MD) *
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
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  arrastando
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-neutral-700/80 hover:border-neutral-500 hover:bg-neutral-800/40"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-800/80 mx-auto flex items-center justify-center text-neutral-400 mb-3">
                  <UploadCloud className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-neutral-200">
                  Arraste o arquivo aqui ou clique para selecionar
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Upload direto via TUS. Suporta arquivos de até 500 MB.
                </p>
              </div>
            ) : (
              <div className="bg-neutral-800/50 border border-neutral-700/60 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-200 line-clamp-1">
                      {arquivo.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {(arquivo.size / (1024 * 1024)).toFixed(2)} MB • {arquivo.type || "Documento"}
                    </p>
                  </div>
                </div>
                {!emProcesso && (
                  <button
                    type="button"
                    onClick={() => {
                      setArquivo(null);
                      if (inputArquivoRef.current) inputArquivoRef.current.value = "";
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Trocar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                Título da Obra *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={emProcesso}
                placeholder="Ex: A Poética do Silêncio"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                Subtítulo (Opcional)
              </label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                disabled={emProcesso}
                placeholder="Ex: Ensaios sobre a Presença"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Tipo e Autor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                Tipo de Obra *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoObra)}
                disabled={emProcesso}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/60"
              >
                <option value="livro">Livro</option>
                <option value="reflexao">Reflexão</option>
                <option value="carta">Carta</option>
                <option value="relato">Relato</option>
                <option value="ensaio">Ensaio</option>
                <option value="artigo">Artigo</option>
                <option value="caderno_notas">Caderno de Notas</option>
                <option value="entrevista">Entrevista</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                Nome do Autor
              </label>
              <input
                type="text"
                value={autorNome}
                onChange={(e) => setAutorNome(e.target.value)}
                disabled={emProcesso}
                placeholder="Ex: Autor"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
                Ano de Publicação
              </label>
              <input
                type="number"
                value={anoPublicacao ?? ""}
                onChange={(e) => setAnoPublicacao(e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={emProcesso}
                placeholder="Ex: 2024"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Natureza da Obra: Núcleo Autoral vs Influência Externa */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-2 flex items-center justify-between">
              <span>Natureza Epistemológica da Obra *</span>
              <span className="text-[11px] text-amber-400/80 lowercase italic font-normal">
                (fontes externas nunca viram autoria silenciosamente)
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card Núcleo Autoral */}
              <div
                onClick={() => !emProcesso && setNatureza("autoral")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  natureza === "autoral"
                    ? "bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-2 text-amber-300 font-medium text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Núcleo Autoral (Obra Primária)
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Obra do próprio autor. Modela diretamente a voz, o método e as 18 dimensões do Cérebro.
                </p>
              </div>

              {/* Card Influência Externa */}
              <div
                onClick={() => !emProcesso && setNatureza("externa_aprovada")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  natureza === "externa_aprovada"
                    ? "bg-blue-500/10 border-blue-500/60 shadow-lg shadow-blue-500/5"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-2 text-blue-300 font-medium text-sm mb-1">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Influência Externa Deliberada
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Obra de referência/influência consciente. Dialoga com o pensamento sem virar autoria.
                </p>
              </div>
            </div>
          </div>

          {/* Participação no Cérebro e Peso */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Participar do Cérebro Autoral Ativo
                </span>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Quando ativo, fragmentos desta obra alimentarão a geração de novas reflexões.
                </p>
              </div>
              <input
                type="checkbox"
                checked={participaCerebro}
                onChange={(e) => setParticipaCerebro(e.target.checked)}
                disabled={emProcesso}
                className="w-5 h-5 rounded border-neutral-700 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
              />
            </div>

            {participaCerebro && (
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>Peso de Influência Autoral:</span>
                  <span className="font-mono text-amber-300 font-medium">
                    {(pesoAutoral * 100).toFixed(0)}% ({pesoAutoral.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={pesoAutoral}
                  onChange={(e) => setPesoAutoral(parseFloat(e.target.value))}
                  disabled={emProcesso}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Status do Envio em Andamento */}
          {emProcesso && (
            <div className="p-4 bg-neutral-950 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 flex items-center gap-2 font-medium">
                  {etapa === "calculando_hash" && (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      Calculando integridade SHA-256...
                    </>
                  )}
                  {etapa === "enviando_arquivo" && (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      Enviando arquivo via TUS direto ao Supabase ({progressoEnvio}%)...
                    </>
                  )}
                  {etapa === "registrando" && (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      Registrando metadados e ativando no acervo...
                    </>
                  )}
                  {etapa === "concluido" && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Obra cadastrada com sucesso!
                    </>
                  )}
                </span>
                <span className="font-mono text-neutral-400">
                  {etapa === "enviando_arquivo" ? `${progressoEnvio}%` : ""}
                </span>
              </div>

              {etapa === "enviando_arquivo" && (
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${progressoEnvio}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Rodapé e Botões */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={aoFechar}
              disabled={emProcesso}
              className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={emProcesso || !arquivo || !titulo.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {emProcesso ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Salvar e Enviar ao Acervo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
