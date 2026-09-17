import { z } from "zod";

export const tipoObraSchema = z.enum([
  "livro",
  "reflexao",
  "carta",
  "relato",
  "ensaio",
  "artigo",
  "caderno_notas",
  "entrevista",
  "outro",
]);

export const naturezaObraSchema = z.enum([
  "autoral",
  "externa_aprovada",
  "referencia",
]);

export const cadastrarObraSchema = z.object({
  titulo: z
    .string()
    .min(2, "O título deve ter pelo menos 2 caracteres.")
    .max(300, "O título não pode exceder 300 caracteres."),
  subtitulo: z.string().max(400).optional().nullable(),
  autor_nome: z
    .string()
    .min(2, "O nome do autor deve ter pelo menos 2 caracteres.")
    .default("Autor"),
  tipo: tipoObraSchema,
  natureza: naturezaObraSchema.default("autoral"),
  papel_fonte: z.enum(["autoral", "externa"]).optional().default("autoral"),
  participacao_cerebro: z
    .enum(["nucleo_autoral", "referencia", "influencia_deliberada", "excluida"])
    .optional()
    .default("nucleo_autoral"),
  escopos_influencia: z.array(z.string()).optional().default([]),
  intensidade_influencia: z.enum(["leve", "moderada", "forte"]).optional().nullable(),
  ano_publicacao: z
    .number()
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 5)
    .optional()
    .nullable(),
  descricao: z.string().max(4000).optional().nullable(),
  participa_cerebro: z.boolean().default(true),
  peso_autoral: z
    .number()
    .min(0, "O peso autoral mínimo é 0.00")
    .max(1, "O peso autoral máximo é 1.00")
    .default(1.0),
  arquivo_caminho: z.string().min(5, "Caminho do arquivo inválido."),
  arquivo_nome_original: z.string().min(1, "Nome do arquivo original obrigatório."),
  arquivo_tamanho_bytes: z.number().positive("Tamanho do arquivo deve ser positivo."),
  arquivo_mime_type: z.string().min(3, "MIME type obrigatório."),
  hash_sha256: z
    .string()
    .length(64, "O hash SHA-256 deve conter exatamente 64 caracteres hexadecimais."),
  metadados: z.record(z.unknown()).optional().default({}),
});

export type CadastrarObraInput = z.input<typeof cadastrarObraSchema>;
export type CadastrarObraOutput = z.output<typeof cadastrarObraSchema>;
