/**
 * Tipos canônicos do domínio de Auditoria Crítica Independente
 * Idioma: Português do Brasil
 */

export type VereditoAuditoria = "aprovado" | "ressalvas" | "rejeitado";

export interface ItemRegraViolada {
  regra_id?: string;
  enunciado: string;
  trecho_infrator: string;
  motivo: string;
  gravidade: "alta" | "media" | "baixa";
}

export interface ItemRiscoAlucinacao {
  trecho_afirmacao: string;
  explicacao: string;
  grau_risco: "alto" | "medio" | "baixo";
}

export interface ItemRecomendacao {
  foco: string;
  sugestao: string;
  prioridade: "imediata" | "desejavel";
}

export interface RelatorioAuditoria {
  id: string;
  versao_reflexao_id: string;
  usuario_id: string;
  veredito: VereditoAuditoria;
  pontuacao_geral: number;
  pontuacao_fidelidade_ontologica: number;
  pontuacao_fidelidade_metodologica: number;
  pontuacao_precisao_evidencias: number;
  pontuacao_expressao_estilo: number;
  pontuacao_anti_regras: number;
  regras_violadas: ItemRegraViolada[];
  riscos_alucinacao: ItemRiscoAlucinacao[];
  recomendacoes_melhoria: ItemRecomendacao[];
  analise_critica_completa: string;
  criado_em: string;
  numero_versao?: number;
  titulo_gerado?: string;
  entrada_id?: string;
  entrada_titulo?: string;
}
