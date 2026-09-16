# Estado Atual do Projeto

Atualizado em **16/09/2026** após auditoria cruzada dos documentos canônicos, GitHub, Supabase, Vercel e documentação oficial atual das tecnologias utilizadas.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch oficial: `main`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, região `us-west-2`, PostgreSQL `17.6`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- Fase 2: incorporada à `main` e em produção
- Primeira entrega da Fase 3: validada tecnicamente no PR #9, sem ativar a feature flag

A produção continua segura porque `PROCESSAMENTO_WORKFLOW_ATIVO=false`. A infraestrutura do workflow pode ser incorporada sem permitir que usuários iniciem um Pipeline ainda incompleto.

## Fase atual

**Pipeline Documental — workflow durável em construção controlada.**

O modelo de dados já está estruturado até Documento Processado, fragmentos, sínteses, vetores, elementos, evidências e grafo. A execução real começa por uma etapa determinística: validar no servidor o arquivo original privado, recalculando SHA-256 e tamanho antes de qualquer extração ou IA.

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
- Biblioteca e versões físicas;
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

## Fase 3 aplicada no Supabase e validada no PR #9

### `0017_api_backend_workflow_processamento`

Versão: `20260916202853`.

Cria RPCs server-only em `aplicacao`:

- `backend_iniciar_processamento`;
- `backend_obter_execucao`;
- `backend_iniciar_etapa`;
- `backend_concluir_etapa`;
- `backend_falhar_execucao`.

Elas são `SECURITY DEFINER`, usam `search_path = ''`, não são executáveis por `anon`/`authenticated` e são concedidas apenas ao backend.

### `0018_recuperacao_orquestracao_workflow`

Versão: `20260916212133`.

Adiciona reserva de orquestração, contador de tentativas, marco de início, recuperação de reserva abandonada e reinício controlado de execução falha/cancelada.

### `0019_idempotencia_transicoes_workflow`

Versão: `20260916221057`.

Endurece a máquina de estados do workflow:

- `FOR UPDATE` nas transições críticas;
- chamadas atrasadas não podem regredir execução que já avançou;
- retry de etapa concluída não reexecuta a transição global;
- percentual é monotônico;
- falha atrasada não pode transformar execução já terminal/mais avançada em falha;
- confirmação de início não altera execução terminal.

A migration foi primeiro testada dentro de transação com `ROLLBACK` e somente depois aplicada no projeto oficial.

## Primeira etapa real: `validar_arquivo`

Fluxo implementado:

```text
POST /api/processamento/iniciar
  -> getClaims()
  -> RPC server-only prepara/reserva execução
  -> Vercel Workflow durável
  -> validar_arquivo
  -> URL assinada privada curta
  -> leitura streaming
  -> SHA-256 servidor
  -> contagem real de bytes
  -> comparação com Biblioteca
```

Divergência de hash/tamanho é falha determinística. Falha transitória de Storage/rede é entregue aos retries de `use step`; somente depois do esgotamento é registrada falha terminal.

O Workflow SDK está em `4.8.9`. A opção `region` foi removida de `start()` porque a linha estável 4.8.x instalada não a aceita, mesmo que documentação mais nova mostre esse recurso. Não adotaremos 5.0 beta apenas por essa diferença.

## Dependências e supply chain

O `npm audit` encontrou vulnerabilidades altas transitivas dentro do Workflow SDK. A correção validada é:

```text
workflow 4.8.9
nanoid override 5.1.16
undici override 7.29.0
```

Após a correção, o CI passou:

- `npm ci`;
- `npm audit --omit=dev --audit-level=high`;
- ESLint;
- TypeScript;
- build Next.js.

Não foi usado `npm audit fix --force` e o portão de segurança não foi removido.

## Supabase local reproduzível

Foram adicionados:

- `supabase/config.toml` sem segredos;
- `supabase/seed.sql` sem dados pessoais;
- exclusões de `supabase/.temp/` e `.branches/` no `.gitignore`.

O CI usa Supabase CLI `2.117.0` e executa:

```text
supabase start
supabase db reset
supabase status
supabase stop --no-backup
```

Esse teste já conseguiu subir um ambiente novo, aplicar todas as migrations e reconstruir o banco pelo histórico versionado.

## Auditoria do Supabase remoto

Confirmado após `0019`:

- projeto saudável;
- 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia;
- 1 usuário Auth;
- 0 obras;
- 0 versões de obras;
- 0 execuções;
- 0 Documentos Processados;
- 0 fragmentos;
- 0 elementos;
- constraints auditadas validadas;
- schemas internos fechados para browser;
- RLS ativo nas tabelas pessoais;
- Storage privado segregado por usuário;
- RPCs `backend_*` server-only;
- advisor de performance sem FK sem índice;
- avisos atuais de performance são `unused_index`, esperados no banco vazio.

### Alerta externo do Supabase Auth

Continua aberto:

```text
Leaked Password Protection Disabled
```

A configuração deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir. O conector atual não oferece alteração desse setting.

## Vercel

Confirmado:

- projeto canônico correto e ligado ao GitHub novo;
- produção da `main` continua `READY`;
- Preview do commit validado da Fase 3 está `READY`;
- os Preview `ERROR` intermediários correspondem a erros encontrados e corrigidos durante a auditoria, incluindo uso indevido de `region` em Workflow 4.8.x;
- runtime logs recentes não mostraram erro/fatal no Preview validado.

O Dashboard ainda informa `nodeVersion = 24.x`, porém os builds usam Node `22.x` porque `package.json` exige `22.x`. O setting deve ser alinhado manualmente para eliminar a divergência de configuração.

## GitHub

- repositório canônico correto;
- PR #9 aberto/mergeável durante a consolidação desta entrega;
- CI de aplicação validado;
- CI de banco local adicionado;
- repositório ainda **público**;
- endpoint de Rulesets retorna `[]`.

Antes de corpus intelectual real, a recomendação é tornar o repositório privado e configurar Ruleset da `main` exigindo PR + checks e bloqueando force push. CodeQL default setup também é recomendado quando a configuração da conta permitir.

## OpenAI

A chave antiga exposta foi rotacionada. O proprietário confirmou que uma chave nova foi configurada diretamente na Vercel. Nenhuma chave é armazenada no GitHub.

A IA permanece operacionalmente desligada porque ainda estamos nas etapas determinísticas do Pipeline, não por falta de credencial.

Diretrizes já pesquisadas para a futura camada de IA:

- Responses API;
- `store: false` para conteúdo intelectual privado;
- Structured Outputs/JSON Schema;
- validação Zod antes de persistir;
- modelos centralizados em `MODELO_IA_*`;
- envio somente do contexto necessário, não de corpus inteiro sem necessidade.

## Limite do E2E atual

O banco oficial ainda não tem uma obra real. Portanto o caminho positivo `upload → workflow → hash validado` ainda precisa de uma fixture/obra controlada de teste. A feature flag permanecerá desligada até esse teste.

## Próximo passo técnico

Depois da consolidação da primeira entrega da Fase 3:

1. implementar `identificar_formato` deterministicamente;
2. definir tipos de arquivo inicialmente suportados sem prometer OCR ainda;
3. implementar `extrair_conteudo` e `normalizar_conteudo` de forma idempotente;
4. criar uma fixture E2E segura e testar `upload → validar_arquivo` ponta a ponta;
5. preparar a camada centralizada OpenAI sem ativá-la nas etapas determinísticas;
6. somente depois avançar para análise/síntese/taxonomia com IA e Structured Outputs.

## Regra permanente

Nenhuma chave administrativa, segredo ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser reescrita para esconder correções. Toda mudança estrutural é cumulativa, testável e documentada; o usuário continua sendo a autoridade final sobre autoria e incorporação ao Cérebro Autoral.
