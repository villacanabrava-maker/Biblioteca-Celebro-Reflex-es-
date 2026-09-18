# Índice da Documentação — Rflex01

**Objetivo:** permitir que uma pessoa abra o repositório e saiba rapidamente qual documento consultar, sem confundir estado atual, histórico e instruções auxiliares.

## Ordem de confiança

Quando houver divergência, use esta ordem:

1. estado real de `main` no GitHub;
2. projeto Supabase canônico `reflex-01`;
3. projeto Vercel canônico `rflex01`;
4. `docs/STATUS_PROJETO.md`;
5. documentação histórica e planos anteriores.

Documentação nunca substitui a verificação das integrações reais.

## Documentos operacionais atuais

| Documento | Papel |
|---|---|
| `docs/STATUS_PROJETO.md` | Estado canônico resumido do produto e das integrações. |
| `docs/MAPA_REPOSITORIO.md` | Mapa técnico: onde ficam páginas, back-end, domínios, IA, Supabase, testes e configurações. |
| `docs/RELATORIO_ETAPA_2_ORGANIZACAO.md` | Relatório da organização conservadora da Etapa 2, após concluída. |
| `README.md` | Entrada curta do repositório. A reconstrução abrangente está reservada para a Etapa 3. |
| `GEMINI.md` | Diretrizes auxiliares para agentes/ferramentas de desenvolvimento; não é documentação de produto. |

## Registros de arquitetura

| Documento | Papel |
|---|---|
| `docs/adr/0001-fundacao-arquitetural.md` | Decisões arquiteturais fundamentais e seus motivos. |

## Documentos de transição e histórico recente

| Documento | Classificação | Observação |
|---|---|---|
| `docs/PLANO_ACAO_RELATO_NAVEGACAO.md` | Histórico de execução | Checklist derivado do relato de navegação. As frentes registradas ali foram encerradas para aquela fase. |
| `docs/RELATORIO_ENCERRAMENTO_ETAPA_2026-09-18.md` | Baseline histórica recente | Registra o fechamento da fase anterior e os riscos conhecidos naquele momento. |

Esses arquivos são preservados porque ajudam a explicar decisões e evolução. Eles não devem ser lidos como lista automática de tarefas atuais.

## Relatório esperado da Etapa 1

O Prompt da Etapa 2 cita `RELATORIO_ETAPA_1_ESTADO_ATUAL.md` como ponto de partida. Na baseline `01089c517df589dad8f71b93686fd7c033346ed9`, esse arquivo **não estava versionado**.

Por isso, a Etapa 2 foi revalidada diretamente contra GitHub, Supabase, Vercel e código, usando `STATUS_PROJETO.md` e `RELATORIO_ENCERRAMENTO_ETAPA_2026-09-18.md` apenas como fontes auxiliares.

## Diretórios que também contêm instruções

- `.agents/skills/`: instruções para subagentes de revisão, QA, design e ideação. Não fazem parte do runtime do aplicativo.
- `supabase/migrations/`: histórico executável do schema e da segurança do banco. Não mover ou reordenar migrations aplicadas.
- `tests/`: testes automatizados por domínio.
- `.github/workflows/ci.yml`: pipeline de validação do GitHub Actions.

## Regra para documentos futuros

Antes de criar um novo documento:

1. verifique se o assunto já está coberto por um documento atual;
2. prefira atualizar a fonte existente quando o propósito for o mesmo;
3. use relatório datado para registrar fechamento de etapa;
4. marque claramente quando um documento é histórico;
5. nunca registre segredos, tokens, senhas ou valores de chaves.
