/**
 * Tipos canônicos do domínio de Reflexões
 * Idioma: Português do Brasil
 */

export type FormatoReflexao =
  | "ensaio"
  | "artigo"
  | "aforismo"
  | "newsletter"
  | "dialogo"
  | "tese";

export type TipoOrigemExterna =
  | "texto"
  | "artigo"
  | "mensagem"
  | "documento"
  | "audio_transcricao"
  | "observacao";

export type TipoFonteReflexao =
  | "texto"
  | "documento"
  | "link"
  | "audio"
  | "biblioteca";

export interface FonteReflexaoPreparada {
  tipo: TipoFonteReflexao;
  titulo?: string;
  autorNome?: string;
  urlOrigem?: string;
  obraId?: string;
  storageBucket?: string;
  storageCaminho?: string;
  arquivoNomeOriginal?: string;
  arquivoMimeType?: string;
  arquivoTamanhoBytes?: number;
  hashSha256?: string;
  conteudoExtraido: string;
  conteudoConfirmado?: string;
  metadados?: Record<string, unknown>;
}

export interface FonteReflexao {
  id: string;
  entrada_id: string;
  usuario_id: string;
  tipo_fonte: TipoFonteReflexao;
  titulo?: string | null;
  autor_nome?: string | null;
  url_origem?: string | null;
  obra_id?: string | null;
  storage_bucket?: string | null;
  storage_caminho?: string | null;
  arquivo_nome_original?: string | null;
  arquivo_mime_type?: string | null;
  arquivo_tamanho_bytes?: number | null;
  hash_sha256?: string | null;
  conteudo_extraido: string;
  conteudo_confirmado?: string | null;
  estado: "pronta" | "falha";
  erro_processamento?: string | null;
  metadados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
}

export type EstadoEntradaReflexao =
  | "criada"
  | "planejada"
  | "em_redacao"
  | "em_auditoria"
  | "concluida"
  | "arquivada";

export type EstadoPlanoReflexao = "proposto" | "aprovado_pelo_autor" | "rejeitado";

export type EstadoVersaoReflexao =
  | "rascunho"
  | "em_auditoria"
  | "auditado"
  | "aprovado"
  | "publicado";

export interface ConflitoDetectado {
  id?: string;
  tipo: string;
  descricao: string;
  posicao_externa: string;
  posicao_autoral: string;
  impacto_reflexao: string;
}

export interface DossieItemFragmento {
  id: string;
  conteudo: string;
  obra_titulo: string;
  aderencia?: number;
}

export interface DossieItemConceito {
  termo: string;
  definicao: string;
  dominio: string;
}

export interface DossieContextual {
  fragmentos_selecionados: DossieItemFragmento[];
  conceitos_chave: DossieItemConceito[];
  regras_sugeridas: { tipo: string; enunciado: string }[];
  conflitos_detectados?: ConflitoDetectado[];
}

export interface MovimentoArgumentativo {
  ordem: number;
  tipo: string;
  descricao: string;
  dimensao_metodologica?: string;
  conceitos_chave?: string[];
}

export interface ContraArgumentoAntecipado {
  objecao: string;
  resposta_autoral: string;
  grau_relevancia?: "alta" | "media" | "baixa";
}

export interface EntradaReflexao {
  id: string;
  usuario_id: string;
  titulo: string;
  tema_central: string;
  provocacao_inicial: string;
  reflexao_externa?: string | null;
  tipo_origem_externa?: TipoOrigemExterna | null;
  comentario_autor?: string | null;
  dossie_contexto?: DossieContextual | null;
  conflitos_detectados?: ConflitoDetectado[] | null;
  incorporado_biblioteca?: boolean;
  obra_incorporada_id?: string | null;
  objetivo_comunicativo?: string | null;
  publico_alvo?: string | null;
  formato_desejado: FormatoReflexao;
  restricoes_especificas?: string | null;
  estado: EstadoEntradaReflexao;
  criado_em: string;
  atualizado_em: string;
}

export interface PlanoReflexao {
  id: string;
  entrada_id: string;
  usuario_id: string;
  tese_central: string;
  movimentos_argumentativos: MovimentoArgumentativo[];
  conceitos_mobilizados: string[];
  fontes_mobilizadas: string[];
  regras_acionadas: string[];
  contra_argumentos_antecipados: ContraArgumentoAntecipado[];
  estado: EstadoPlanoReflexao;
  criado_em: string;
}

export interface VersaoReflexao {
  id: string;
  entrada_id: string;
  plano_id?: string | null;
  usuario_id: string;
  numero_versao: number;
  titulo_gerado: string;
  conteudo_markdown: string;
  sumario_executivo?: string | null;
  total_palavras: number;
  estado: EstadoVersaoReflexao;
  criado_em: string;
  atualizado_em: string;
}

export interface CitacaoEvidencia {
  id: string;
  versao_reflexao_id: string;
  fragmento_id?: string | null;
  tipo_fonte: "nucleo_autoral" | "influencia_externa";
  trecho_afirmacao_gerada: string;
  trecho_original_citado: string;
  obra_titulo?: string | null;
  grau_aderencia?: number | null;
  criado_em: string;
}

export interface ResumoReflexao {
  entrada_id: string;
  usuario_id: string;
  titulo: string;
  tema_central: string;
  provocacao_inicial?: string;
  reflexao_externa?: string | null;
  tipo_origem_externa?: TipoOrigemExterna | null;
  comentario_autor?: string | null;
  formato_desejado: FormatoReflexao;
  estado_entrada: EstadoEntradaReflexao;
  incorporado_biblioteca?: boolean;
  obra_incorporada_id?: string | null;
  criado_em: string;
  atualizado_em: string;
  total_versoes: number;
  ultima_versao_numero?: number | null;
  ultima_versao_id?: string | null;
  ultimo_titulo_gerado?: string | null;
  ultimo_estado_versao?: EstadoVersaoReflexao | null;
  ultimo_veredito_auditoria?: "aprovado" | "ressalvas" | "rejeitado" | null;
  ultima_pontuacao_auditoria?: number | null;
}
