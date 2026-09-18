import { z } from "zod";

export const SENHA_MINIMA_CARACTERES = 8;

const cadastroContaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Por favor, informe seu nome completo.")
    .max(120, "O nome informado é muito longo."),
  email: z
    .string()
    .trim()
    .email("Informe um endereço de e-mail válido.")
    .transform((valor) => valor.toLowerCase()),
  senha: z
    .string()
    .min(
      SENHA_MINIMA_CARACTERES,
      `A senha deve conter no mínimo ${SENHA_MINIMA_CARACTERES} caracteres.`
    )
    .max(128, "A senha deve conter no máximo 128 caracteres."),
});

export type DadosCadastroConta = z.infer<typeof cadastroContaSchema>;

export function validarDadosCadastroConta(dados: unknown):
  | { sucesso: true; dados: DadosCadastroConta }
  | { sucesso: false; erro: string } {
  const resultado = cadastroContaSchema.safeParse(dados);

  if (!resultado.success) {
    return {
      sucesso: false,
      erro: resultado.error.issues[0]?.message || "Dados de cadastro inválidos.",
    };
  }

  return {
    sucesso: true,
    dados: resultado.data,
  };
}
