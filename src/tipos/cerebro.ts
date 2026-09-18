/**
 * Tipos canônicos do domínio do Cérebro Autoral
 * Idioma: Português do Brasil
 */

export type PlanoCanonico = "conteudo" | "metodo" | "expressao";

export type TipoRegra =
  | "prescritiva"       // O que o autor sempre faz ou busca fazer
  | "proscritiva"       // Anti-regra: o que o autor NUNCA faz ou rejeita expressamente
  | "preferencia"       // Inclinação estilística
  | "restricao_estilo"; // Limitação de vocabulário ou sintaxe

export interface DimensaoCerebro {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  ordem: number;
  plano: PlanoCanonico;
  ativa: boolean;
  total_caracteristicas: number;
  total_regras: number;
  confianca_media: number;
}

export interface CaracteristicaCerebro {
  id: string;
  dimensao_id: string;
  usuario_id: string;
  titulo: string;
  descricao: string;
  formula_metodologica: string | null;
  origem: "nucleo_autoral" | "influencia_externa" | "hibrido";
  confianca_calculada: number;
  total_evidencias: number;
  total_contraevidencias: number;
  total_obras_distintas: number;
  periodo_inicio?: number | null;
  periodo_fim?: number | null;
  estado_revisao: string;
  criado_em: string;
  atualizado_em: string;
  dimensao_codigo?: string;
  dimensao_nome?: string;
  dimensao_plano?: PlanoCanonico;
  total_regras_associadas?: number;
}

export interface RegraCerebro {
  id: string;
  usuario_id: string;
  dimensao_id: string | null;
  caracteristica_id: string | null;
  tipo_regra: TipoRegra;
  enunciado: string;
  explicacao: string | null;
  peso: number;
  ativa: boolean;
  criado_em: string;
  dimensao_codigo?: string;
  dimensao_nome?: string;
  dimensao_plano?: PlanoCanonico;
  caracteristica_titulo?: string;
}

export type TipoPropostaAtualizacaoCerebro =
  | "nova_caracteristica"
  | "atualizacao_regra"
  | "nova_metodologia"
  | "depreciacao";

export type EstadoDecisaoProposta =
  | "pendente"
  | "confirmada"
  | "editada"
  | "rejeitada";

export interface EvidenciaEdicaoAutoral {
  indice: number;
  tipo: "adicao" | "remocao" | "substituicao";
  antes: string;
  depois: string;
  palavras_removidas: number;
  palavras_adicionadas: number;
}

export interface DadosPropostaAtualizacao {
  origem?: {
    tipo?: string;
    entrada_id?: string;
    versao_base_id?: string;
    versao_editada_id?: string;
  };
  dimensao?: {
    id?: string;
    codigo?: string;
    nome?: string;
  };
  aprendizado?: {
    titulo?: string;
    descricao?: string;
    enunciado_regra?: string | null;
    tipo_regra?: TipoRegra | null;
  };
  alteracoes_referencia?: number[];
  evidencias_edicao?: EvidenciaEdicaoAutoral[];
  [chave: string]: unknown;
}

export interface PropostaAtualizacaoCerebro {
  id: string;
  usuario_id: string;
  versao_cerebro_id?: string | null;
  tipo_proposta: TipoPropostaAtualizacaoCerebro;
  estado_decisao: EstadoDecisaoProposta;
  dados_propostos: DadosPropostaAtualizacao;
  justificativa_ia: string;
  confianca_calculada: number;
  decidido_em?: string | null;
  notas_autor?: string | null;
  criado_em: string;
}

export interface ResumoCerebro {
  usuario_id: string;
  total_caracteristicas: number;
  total_regras: number;
  total_anti_regras: number;
  total_nucleo_autoral: number;
  total_influencias_externas: number;
  confianca_media_geral: number;
}
