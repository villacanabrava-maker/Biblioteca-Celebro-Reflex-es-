# Estado Atual do Projeto

Atualizado em **16/09/2026** após revisão cruzada dos documentos canônicos, GitHub, Supabase, Vercel e documentação oficial das tecnologias em uso.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch oficial: `main`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, região `us-west-2`, PostgreSQL `17.6`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- Fase 2: incorporada à `main` e publicada
- Primeira entrega da Fase 3 / PR #9: incorporada à `main` pelo commit `3a3a25f450fa1bdc2b56ec8f91120718de21adc2`
- Segunda entrega da Fase 3 / PR #10: incorporada à `main` pelo commit `4931b492cc7828d121625151d97be1818fda50b3`

A feature flag `PROCESSAMENTO_WORKFLOW_ATIVO=false` permanece. O frontend não inicia um Pipeline ainda incompleto.

**Atenção operacional:** GitHub e Supabase já contêm a segunda entrega da Fase 3, mas a produção Vercel ainda aponta para o commit anterior `3a3a25f...`. O merge `4931b492...` não gerou deployment automático; a sincronização Git → Vercel está sendo auditada antes de declarar esta entrega publicada.

## Fase atual

**Pipeline Documental — execução determinística e durável em construção controlada.**

O modelo de dados já cobre Documento Processado, hierarquia, fragmentos, sínteses, vetores, elementos, evidências e grafo. A execução real está sendo construída na ordem canônica e sem IA nas etapas que podem ser resolvidas deterministicamente.

Fluxo implementado/previsto:

```text
validar_arquivo          ✅ main
  ↓
identificar_formato      ✅ main
  ↓
extrair_conteudo         ✅ main
  ↓
normalizar_conteudo      ← próxima etapa funcional
  ↓
identificar_estrutura
  ↓
criar_hierarquia
  ↓
criar_fragmentos
  ↓
criar_sinteses
  ↓
extrair_elementos
  ↓
classificar_taxonomia
  ↓
criar_embeddings
  ↓
criar_relacoes
  ↓
validar_resultado
  ↓
publicar_documento
```

Nenhum artefato parcial é tratado como Documento Processado ativo e nenhum processamento parcial alimenta o Cérebro Autoral.

## O que já está em `main`

- Next.js + React + TypeScript;
- sistema visual inicial;
- schemas canônicos;
- Sistema e Taxonomia Mestre versionados;
- Biblioteca e versões físicas;
- Storage privado `originais-biblioteca`;
- fronteira segura da Data API em `aplicacao`;
- Auth SSR com `@supabase/ssr` e `getClaims()`;
- login, cadastro, confirmação SSR e logout;
- upload TUS + SHA-256 incremental;
- deduplicação concorrente por usuário + SHA-256;
- Documento Processado hierárquico;
- FTS, pgvector/HNSW, elementos, evidências e grafo;
- proveniência e publicação atômica;
- Workflow durável server-only;
- máquina de estados monotônica/idempotente até `0019`;
- artefatos intermediários privados `0020`/`0021`;
- `validar_arquivo`, `identificar_formato` e `extrair_conteudo`;
- Supabase local reproduzível por migrations/seed;
- CI com `npm ci`, auditoria de dependências, lint, TypeScript, testes unitários e build.

## Primeira entrega da Fase 3 — consolidada

### `0017_api_backend_workflow_processamento`

Versão real: `20260916202853`.

Cria a fronteira server-only em `aplicacao` para preparar/consultar execuções e iniciar/concluir/falhar etapas. As RPCs são `SECURITY DEFINER`, usam `search_path = ''`, não são executáveis por `anon`/`authenticated` e são concedidas apenas ao backend.

### `0018_recuperacao_orquestracao_workflow`

Versão real: `20260916212133`.

Adiciona reserva de orquestração, contador de tentativas, marco de início, recuperação de reserva abandonada e reinício controlado.

### `0019_idempotencia_transicoes_workflow`

Versão real: `20260916221057`.

Adiciona row locks e transições monotônicas: retry/replay atrasado não pode regredir a execução, o percentual não diminui e falha atrasada não sobrescreve progresso posterior.

### `validar_arquivo`

A primeira etapa real recalcula SHA-256 e tamanho no servidor sobre o objeto privado. Divergência é falha determinística; indisponibilidade transitória de rede/Storage usa retries do Workflow. O Workflow SDK está fixado em `4.8.9` e a feature flag permanece desligada.

## Segunda entrega da Fase 3 — incorporada pelo PR #10

### `identificar_formato`

A identificação não confia apenas no nome enviado pelo navegador. A versão inicial cruza:

- extensão;
- MIME registrado;
- amostra limitada do conteúdo;
- assinatura `%PDF-` para PDF;
- validação UTF-8/controles para TXT/Markdown.

Formatos inicialmente processáveis:

- PDF com camada textual;
- TXT UTF-8;
- Markdown UTF-8.

DOCX permanece explicitamente **não suportado nesta versão** até validarmos o container OOXML e o parser apropriado. PDF escaneado sem camada textual é identificado como caso que requer OCR; OCR continua fora deste bloco.

### `0020_artefatos_intermediarios_processamento`

Versão real do Supabase: `20260916223016`.

Cria uma camada própria para resultados parciais de execução, sem transformá-los em Documento Processado:

- tabela interna `processamento.artefatos_execucao`;
- bucket privado `artefatos-processamento`;
- caminho determinístico `{usuario_id}/{execucao_id}/{tipo}.json`;
- hash SHA-256 do artefato;
- metadados/proveniência no PostgreSQL;
- conteúdo intermediário no Storage privado;
- RPCs `backend_obter_artefato_execucao` e `backend_registrar_artefato_execucao` somente para backend;
- unicidade por `(execucao_id, tipo)` e rejeição de retry divergente.

Essa camada existe porque o Documento Processado canônico só deve representar resultado integral/publicável, não texto parcial de uma etapa.

### `0021_politica_negacao_artefatos_processamento`

Versão real do Supabase: `20260916225622`.

Torna explícita a negação de acesso de `anon`/`authenticated` à tabela de artefatos. Os grants continuam revogados. Após essa migration, o advisor `RLS Enabled No Policy` desapareceu; a única pendência de segurança do advisor continua sendo a proteção de senhas vazadas do Supabase Auth.

### `extrair_conteudo`

A etapa de extração:

- baixa o original com limite de memória;
- recalcula novamente SHA-256 e tamanho antes de extrair;
- rejeita mudança do original entre validação e extração;
- extrai TXT/Markdown por UTF-8 determinístico;
- extrai PDF textual com `unpdf 1.8.1` / build serverless do PDF.js;
- processa páginas de PDF sequencialmente, preservando o número da página;
- não executa OCR nem IA;
- serializa resultado intermediário em JSON privado;
- calcula SHA-256 do artefato;
- registra o artefato por RPC server-only;
- reutiliza artefato já registrado em retry/crash idempotente;
- somente então avança para `normalizar_conteudo`.

Guardrails v1, versionados como decisão técnica e revisáveis:

```text
TXT/Markdown original: 20 MB
PDF original:          50 MB
PDF:                   até 1.000 páginas
Texto extraído:        até 12.000.000 caracteres
Artefato JSON:         até 30 MB
Imagem interna PDF:    até 16.777.216 pixels
Parsing PDF:           até 90 s
```

## Dependências e supply chain

Estado atual relevante:

```text
workflow 4.8.9
unpdf 1.8.1
nanoid override 5.1.16
undici override 7.29.0
npm 11.19.1
Node 22.x
```

O `unpdf 1.8.1` foi adicionado com lockfile gerado em runner limpo; `npm audit --omit=dev --audit-level=high` passou antes do commit do lockfile. O bootstrap temporário usado apenas para gerar o lockfile foi removido da branch antes do merge.

## CI e testes

O CI possui dois jobs independentes.

### Aplicação

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

Os testes usam o runner nativo do Node 22 e cobrem identificação de formato, PDF falso, TXT/Markdown UTF-8, binário disfarçado de texto, DOCX explicitamente fora do escopo, extração UTF-8 e extração de um PDF textual mínimo preservando página.

### Banco local

```text
Supabase CLI 2.117.0
supabase start
supabase db reset
supabase status
supabase stop --no-backup
```

Esse job prova que todas as migrations e o seed recriam o banco a partir do repositório, sem usar dados pessoais e sem conectar o runner ao banco de produção.

O merge `4931b492...` passou novamente pelos dois jobs na `main`: aplicação e reconstrução local do banco concluíram com sucesso.

## Supabase remoto

O projeto oficial permanece saudável. `0020` e `0021` estão aplicadas e coincidem com o GitHub. A auditoria confirmou:

- RLS ativo em `processamento.artefatos_execucao`;
- policy explícita de negação para `anon`/`authenticated`;
- nenhum privilégio direto de tabela para `anon`, `authenticated` ou `service_role`;
- bucket `artefatos-processamento` privado;
- RPCs de artefatos não executáveis por `anon`/`authenticated` e executáveis somente por `service_role`;
- RPCs `SECURITY DEFINER` com `search_path = ''`.

O banco ainda não possui corpus real de Biblioteca/Processamento; por isso o E2E positivo `upload → workflow → artefato extraído` ainda não foi executado com uma obra real autenticada.

Advisor de segurança atual: somente a pendência externa **Leaked Password Protection Disabled**. Essa configuração deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir. Advisors de performance apontam somente `unused_index`, esperado em banco sem corpus.

## Vercel — divergência operacional aberta

A produção pública está `READY`, porém ainda no commit `3a3a25f450fa1bdc2b56ec8f91120718de21adc2` (primeira entrega da Fase 3).

O PR #10 foi incorporado à `main` como `4931b492cc7828d121625151d97be1818fda50b3`, mas **nenhum deployment Vercel foi criado após esse merge**, mesmo depois de o CI da `main` ficar verde. A tentativa de usar a ação manual do conector também não executou nada porque o conector expôs uma função sem os parâmetros que seu backend exige.

Foi aberta uma branch operacional `chore/sincronizar-producao-fase3` com alteração não funcional em código para provocar um novo evento Git/Preview e diagnosticar se o problema está apenas no caminho de produção.

O Dashboard ainda anuncia Node `24.x`, mas `engines.node = 22.x` força os builds deste projeto a Node 22. O setting administrativo deve ser alinhado para evitar ambiguidade futura.

## GitHub

- repositório canônico correto;
- PR #10 incorporado à `main`;
- merge `4931b492...` com CI pós-merge totalmente verde;
- branch operacional `chore/sincronizar-producao-fase3` criada para auditar a publicação Vercel;
- repositório ainda **público**;
- Rulesets continuam vazios;
- CI inclui testes unitários do processamento.

Antes de corpus intelectual real, ainda é recomendado tornar o repositório privado e configurar Ruleset da `main` exigindo PR + checks e bloqueando force push.

## OpenAI

A chave antiga foi rotacionada e uma chave nova foi configurada diretamente na Vercel. Nenhum segredo é versionado. A IA continua desligada nesta parte do Pipeline por desenho: validação, identificação, extração e normalização devem ser determinísticas.

Quando a camada cognitiva começar, a arquitetura prevista permanece: Responses API, `store: false`, Structured Outputs/JSON Schema, validação Zod, modelos centralizados em `MODELO_IA_*` e proveniência/auditoria.

## Próximo passo técnico

A prioridade imediata é **sincronizar a produção Vercel com a `main`** e provar que o domínio público está executando a segunda entrega da Fase 3, mantendo `PROCESSAMENTO_WORKFLOW_ATIVO=false`.

Depois dessa sincronização, a próxima branch funcional implementará `normalizar_conteudo`.

A normalização deverá primeiro ler o artefato privado `conteudo_extraido`, conferir tamanho/hash, validar sua estrutura e só então aplicar transformações determinísticas como normalização Unicode/line endings/whitespace preservando páginas, parágrafos e proveniência. O resultado deverá ser um novo artefato `conteudo_normalizado`, também privado e idempotente.

## Regra permanente

Nenhuma chave administrativa, segredo ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser reescrita para esconder correções. Toda mudança estrutural é cumulativa, testável e documentada. O usuário continua sendo a autoridade final sobre autoria e incorporação ao Cérebro Autoral, e nenhuma saída parcial do Pipeline vira evidência autoral por atalho.
