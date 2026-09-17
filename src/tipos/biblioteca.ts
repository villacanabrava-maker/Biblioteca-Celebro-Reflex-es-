/**
 * Tipos canônicos do domínio da Biblioteca
 * Idioma: Português do Brasil
 */

export type TipoObra =
  | "livro"
  | "reflexao"
  | "carta"
  | "relato"
  | "ensaio"
  | "artigo"
  | "caderno_notas"
  | "entrevista"
  | "outro";

export type NaturezaObra =
  | "autoral"           // Núcleo Autoral primário
  | "externa_aprovada"  // Influência Externa Deliberada
  | "referencia";       // Consulta técnica / neutra

export type EstadoProcessamento =
  | "pendente"
  | "em_processamento"
  | "processado"
  | "falha"
  | "reprocessando";

export interface ObraDetalhada {
  id: string;
  usuario_id: string;
  titulo: string;
  subtitulo: string | null;
  autor_nome: string;
  tipo: TipoObra;
  natureza: NaturezaObra;
  ano_publicacao: number | null;
  descricao: string | null;
  metadados: Record<string, unknown>;
  participa_cerebro: boolean;
  peso_autoral: number;
  criado_em: string;
  atualizado_em: string;
  total_versoes: number;
  versao_id: string | null;
  numero_versao: number | null;
  arquivo_caminho: string | null;
  arquivo_nome_original: string | null;
  arquivo_tamanho_bytes: number | null;
  arquivo_mime_type: string | null;
  hash_sha256: string | null;
  total_paginas: number;
  total_palavras_estimado: number;
  estado_processamento: EstadoProcessamento;
  erro_processamento: string | null;
}

export interface EstatisticasBiblioteca {
  total_obras: number;
  total_autorais: number;
  total_influencias_externas: number;
  total_no_cerebro: number;
  total_paginas: number;
  total_palavras: number;
}

export interface CadastroObraEntrada {
  titulo: string;
  subtitulo?: string;
  autor_nome?: string;
  tipo: TipoObra;
  natureza: NaturezaObra;
  ano_publicacao?: number;
  descricao?: string;
  participa_cerebro: boolean;
  peso_autoral: number;
  arquivo_caminho: string;
  arquivo_nome_original: string;
  arquivo_tamanho_bytes: number;
  arquivo_mime_type: string;
  hash_sha256: string;
  metadados?: Record<string, unknown>;
}
