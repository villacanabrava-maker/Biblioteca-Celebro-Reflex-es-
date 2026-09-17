/**
 * Tipos canônicos do domínio de Processamento Documental e Vetorial
 * Idioma: Português do Brasil
 */

import type { NaturezaObra, TipoObra } from "./biblioteca";

export type EstadoPublicacao = "candidato" | "ativo" | "arquivado" | "rejeitado";

export type EstadoExecucao = "iniciado" | "em_execucao" | "concluido" | "falha" | "cancelado";

export type EstadoEtapa = "pendente" | "em_execucao" | "concluido" | "falha" | "ignorado";

export interface DocumentoProcessado {
  id: string;
  versao_obra_id: string;
  usuario_id: string;
  titulo_processado: string;
  total_secoes: number;
  total_fragmentos: number;
  total_palavras: number;
  total_tokens_estimado: number;
  estado_publicacao: EstadoPublicacao;
  publicado_em: string | null;
  metadados: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
  // Campos enriquecidos da view
  obra_id?: string;
  obra_titulo?: string;
  autor_nome?: string;
  obra_tipo?: TipoObra;
  obra_natureza?: NaturezaObra;
  participa_cerebro?: boolean;
}

export interface SecaoDocumental {
  id: string;
  documento_processado_id: string;
  usuario_id: string;
  secao_pai_id: string | null;
  nivel: number;
  ordem: number;
  titulo: string;
  tipo_secao: string;
  resumo_secao: string | null;
  criado_em: string;
}

export interface FragmentoTextual {
  id: string;
  documento_processado_id: string;
  secao_id: string | null;
  usuario_id: string;
  ordem: number;
  conteudo: string;
  total_palavras: number;
  total_caracteres: number;
  total_tokens_estimado: number;
  posicao_inicio_char?: number | null;
  posicao_fim_char?: number | null;
  pagina_inicio?: number | null;
  pagina_fim?: number | null;
  secao_titulo?: string | null;
  secao_nivel?: number | null;
  obra_id?: string;
  obra_titulo?: string;
  obra_natureza?: NaturezaObra;
  participa_cerebro?: boolean;
}

export interface ExecucaoProcessamento {
  id: string;
  versao_obra_id: string;
  usuario_id: string;
  pipeline_versao: string;
  estado: EstadoExecucao;
  correlacao_id: string;
  iniciado_em: string;
  concluido_em: string | null;
  erro_mensagem: string | null;
  total_tokens: number;
  custo_estimado_usd: number;
  total_etapas?: number;
  etapas_concluidas?: number;
}

export interface EtapaExecucao {
  id: string;
  execucao_id: string;
  nome_etapa: string;
  estado: EstadoEtapa;
  chave_idempotencia: string;
  payload_entrada: Record<string, unknown>;
  resultado: Record<string, unknown>;
  erro_detalhe: string | null;
  duracao_ms: number;
  criado_em: string;
  concluido_em: string | null;
}

export interface ResultadoBuscaHibrida {
  fragmento_id: string;
  obra_id: string;
  obra_titulo: string;
  obra_natureza: NaturezaObra;
  secao_titulo: string | null;
  conteudo: string;
  score_similaridade: number;
  score_vetorial: number;
  score_textual: number;
}
