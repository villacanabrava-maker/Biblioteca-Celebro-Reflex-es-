# Estado Atual do Projeto

Atualizado em **16/09/2026** após nova auditoria cruzada dos documentos canônicos, GitHub, Supabase e Vercel.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch oficial: `main`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, região `us-west-2`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- Fase 2 / PR #7: incorporada à `main`
- Fase 3 / PR #9: **em validação; não incorporada ainda**

A produção continua na Fase 2 enquanto o PR #9 é validado. O Preview mais recente do PR #9 está `READY`. A feature flag `PROCESSAMENTO_WORKFLOW_ATIVO` permanece `false`, portanto o novo workflow não pode ser iniciado por usuários em produção/preview até ativação deliberada.

## Fase atual

**Pipeline Documental — workflow durável em implementação controlada.**

O modelo de dados do Pipeline está concluído. A Fase 3 inicia a execução real com uma primeira etapa determinística: validar no servidor o arquivo original privado, recalculando SHA-256 e tamanho antes de qualquer extração ou IA.

O macrofluxo canônico permanece:

```text
Biblioteca
  -> Processamento Inteligente
  -> Documento Processado
  -> Cérebro Autoral
  -> Recuperação Contextual
  -> Motor de Reflexões
  -> Revisão Humana
  -> Aprendizado Controlado
```

## Concluído em `main`

- Next.js + React + TypeScript;
- sistema visual inicial;
- schemas canônicos;
- sistema e Taxonomia Mestre versionados;
- Biblioteca e versões de obras;
- Storage privado `originais-biblioteca`;
- fronteira segura da Data API em `aplicacao`;
- Auth SSR com `@supabase/ssr` e `getClaims()`;
- login, cadastro, confirmação SSR e logout;
- upload TUS + SHA-256 incremental;
- deduplicação concorrente por usuário + SHA-256;
- Pipeline Documental modelado até `0016`;
- Documento Processado hierárquico;
- FTS, vetores, elementos, evidências e grafo;
- proveniência e publicação atômica endurecidas;
- lockfile versionado e CI reproduzível.

## Aplicado no Supabase e em validação no PR #9

### `0017_api_backend_workflow_processamento`

Versão real do Supabase: `20260916202853`.

Cria a fronteira server-only do workflow em `aplicacao`:

- `backend_iniciar_processamento`;
- `backend_obter_execucao`;
- `backend_iniciar_etapa`;
- `backend_concluir_etapa`;
- `backend_falhar_execucao`.

Essas RPCs são `SECURITY DEFINER`, usam `search_path = ''`, não são executáveis por `anon`/`authenticated` e são concedidas somente ao `service_role`.

### `0018_recuperacao_orquestracao_workflow`

Versão real do Supabase: `20260916212133`.

Adiciona:

- `workflow_reservado_em`;
- `workflow_iniciado_em`;
- `workflow_tentativas`;
- `backend_registrar_workflow_iniciado`;
- reserva de cinco minutos para impedir disparos concorrentes;
- recuperação de reserva abandonada;
- reinício controlado de execução `falhou`/`cancelado`;
- recuperação automática de `estado_processamento = em_processamento` quando uma etapa volta a executar.

A migration `0017` foi renomeada no GitHub para coincidir exatamente com o timestamp aplicado no Supabase. Nenhuma migration aplicada foi reexecutada ou reescrita no banco.

## Primeira etapa real do workflow

O PR #9 implementa:

```text
POST /api/processamento/iniciar
  -> autenticação por getClaims()
  -> RPC server-only prepara/reserva execução
  -> Vercel Workflow durável em sfo1
  -> validar_arquivo
  -> URL assinada privada curta
  -> leitura streaming
  -> SHA-256 servidor
  -> contagem real de bytes
  -> comparação com registro da Biblioteca
```

Se hash/tamanho divergem, a falha é determinística e terminal. Falhas transitórias de Storage/rede são lançadas para o mecanismo de retry de `use step`; o banco só recebe falha terminal após esgotamento dos retries.

O código não usa OpenAI nesta etapa.

## Stack/reprodutibilidade da Fase 3

- Node `22.x` no repositório e CI;
- npm `11.19.1`;
- `workflow` `4.8.8`;
- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- ESLint `9.39.5` por compatibilidade comprovada com a cadeia Next atual;
- `package-lock.json` versionado;
- CI final: `contents: read` + `npm ci` + auditoria de dependências de produção + lint + TypeScript + build.

O npm 11 substituiu npm 10 porque os testes do PR demonstraram um lockfile transitivo que `npm install` gerava, mas o próprio `npm ci` rejeitava (`chokidar`/`readdirp`). Com npm 11, a árvore passou a ser reproduzível.

## Auditoria do Supabase — estado atual

Confirmado no banco real após `0018`:

- projeto saudável;
- 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia;
- banco ainda sem obras/documentos processados/execuções reais;
- todas as constraints dos schemas auditados estão validadas;
- schemas internos continuam fechados para o navegador;
- RLS ativo nas tabelas pessoais implementadas;
- Storage privado e segregado por usuário;
- RPCs `backend_*` server-only com `SECURITY DEFINER` e `search_path = ''`;
- `anon_execute = false`;
- `authenticated_execute = false`;
- `service_execute = true`;
- advisor de performance sem FKs não indexadas;
- avisos de performance atuais são apenas `unused_index`, esperados em banco vazio.

### Alerta externo ainda aberto no Supabase Auth

O advisor oficial continua reportando **Leaked Password Protection Disabled**. Essa proteção deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir. O conector disponível não expõe essa configuração.

## Vercel — auditoria atual

Confirmado:

- projeto canônico `cerebro-autoral` ligado ao repositório canônico novo;
- projeto legado não é usado como infraestrutura oficial;
- produção da `main` continua `READY`;
- Preview mais recente do PR #9 está `READY`;
- intermediários `ERROR` do PR #9 correspondem aos testes deliberados de lockfile/SDK e foram superados pelo Preview mais recente.

### Divergência externa a corrigir

O projeto Vercel ainda reporta `nodeVersion = 24.x`, enquanto GitHub/CI/package.json exigem Node `22.x`. O conector atual não oferece alteração dessa configuração. Antes de concluir a Fase 3, o Dashboard da Vercel deve ser alinhado para Node 22.x.

## GitHub — auditoria atual

- repositório canônico correto;
- PR #9 aberto e mergeável;
- repositório continua **público**;
- endpoint de Rulesets retorna lista vazia;
- branch protection não pôde ser inspecionada pelo conector por falta de permissão administrativa.

Antes de conteúdo intelectual real, recomenda-se tornar o repositório privado e confirmar proteção obrigatória da `main`.

## Limite dos testes atuais

Como o banco oficial ainda possui `0` obras, `0` execuções e `0` Documentos Processados, ainda não existe um arquivo real autenticado com o qual executar o caminho positivo completo do workflow. Nesta etapa foram e continuam sendo testados:

- migrations e replay coerente;
- constraints e FKs;
- RLS/grants;
- RPCs server-only;
- advisors Supabase;
- compilação do Workflow SDK;
- instalação reproduzível;
- lint;
- TypeScript;
- build;
- Preview Vercel.

O teste E2E positivo com um documento real será feito antes de ativar `PROCESSAMENTO_WORKFLOW_ATIVO=true`.

## OpenAI

A chave fornecida anteriormente no chat é tratada como exposta e não será usada. Antes de ativar qualquer etapa de IA, deve ser rotacionada e a nova chave configurada diretamente no ambiente servidor/Vercel, nunca no chat ou GitHub.

## Próximo passo técnico

1. concluir CI final e auditoria de dependências do PR #9;
2. atualizar README/ADRs e PR #9;
3. incorporar somente com CI verde;
4. validar novo Preview/Production sem ativar a feature flag;
5. alinhar Node 22 no Dashboard da Vercel;
6. criar uma obra de teste autenticada e executar `validar_arquivo` ponta a ponta;
7. implementar `identificar_formato` e `extrair_conteudo` de modo determinístico/idempotente;
8. manter IA desativada até rotação segura da chave e versionamento explícito de modelos/prompts.

## Regra permanente

Nenhuma chave administrativa, segredo ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser alterada para esconder correções. Toda mudança estrutural é cumulativa, testável e documentada; o usuário continua sendo a autoridade final sobre autoria e incorporação ao Cérebro Autoral.
