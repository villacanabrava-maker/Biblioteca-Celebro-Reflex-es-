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
- Continuação da Fase 3 / PR #10: **em validação, ainda não incorporada**

A produção permanece protegida porque `PROCESSAMENTO_WORKFLOW_ATIVO=false`. O frontend não inicia um Pipeline ainda incompleto.

## Fase atual

**Pipeline Documental — execução determinística e durável em construção controlada.**

O modelo de dados já cobre Documento Processado, hierarquia, fragmentos, sínteses, vetores, elementos, evidências e grafo. A execução real está sendo construída na ordem canônica e sem IA nas etapas que podem ser resolvidas deterministicamente.

Fluxo implementado/previsto:

```text
validar_arquivo          ✅ main
  ↓
identificar_formato      ✅ PR #10
  ↓
extrair_conteudo         ✅ PR #10
  ↓
normalizar_conteudo      ← próxima etapa
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
- Supabase local reproduzível por migrations/seed;
- CI com `npm ci`, auditoria de dependências, lint, TypeScript e build.

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

## PR #10 — identificação e extração documental

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

O `unpdf 1.8.1` foi adicionado com lockfile gerado em runner limpo; `npm audit --omit=dev --audit-level=high` passou antes do commit do lockfile. O bootstrap temporário usado apenas para gerar o lockfile foi removido da branch.

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

## Supabase remoto

O projeto oficial permanece saudável. O banco ainda não possui corpus real de Biblioteca/Processamento; por isso o E2E positivo `upload → workflow → artefato extraído` ainda não foi executado com uma obra real autenticada.

Advisor de segurança atual: somente a pendência externa **Leaked Password Protection Disabled**. Essa configuração deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir.

## Vercel

A produção da `main` está `READY` no commit da primeira entrega da Fase 3. O PR #10 gera Preview a cada commit e só poderá ser incorporado com Preview `READY` no head final.

O Dashboard ainda anuncia Node `24.x`, mas `engines.node = 22.x` força os builds deste projeto a Node 22. O setting administrativo deve ser alinhado para evitar ambiguidade futura.

## GitHub

- repositório canônico correto;
- PR #10 em validação;
- repositório ainda **público**;
- Rulesets continuam vazios;
- CI agora inclui testes unitários do processamento.

Antes de corpus intelectual real, ainda é recomendado tornar o repositório privado e configurar Ruleset da `main` exigindo PR + checks e bloqueando force push.

## OpenAI

A chave antiga foi rotacionada e uma chave nova foi configurada diretamente na Vercel. Nenhum segredo é versionado. A IA continua desligada nesta parte do Pipeline por desenho: validação, identificação, extração e normalização devem ser determinísticas.

Quando a camada cognitiva começar, a arquitetura prevista permanece: Responses API, `store: false`, Structured Outputs/JSON Schema, validação Zod, modelos centralizados em `MODELO_IA_*` e proveniência/auditoria.

## Próximo passo técnico

Após o PR #10 passar no **head final** por testes, build, reconstrução local do banco e Preview Vercel, a próxima branch implementará `normalizar_conteudo`.

A normalização deverá primeiro ler o artefato privado `conteudo_extraido`, conferir tamanho/hash, validar sua estrutura e só então aplicar transformações determinísticas como normalização Unicode/line endings/whitespace preservando páginas, parágrafos e proveniência. O resultado deverá ser um novo artefato `conteudo_normalizado`, também privado e idempotente.

## Regra permanente

Nenhuma chave administrativa, segredo ou credencial privada deve ser commitida. Nenhuma migration aplicada deve ser reescrita para esconder correções. Toda mudança estrutural é cumulativa, testável e documentada. O usuário continua sendo a autoridade final sobre autoria e incorporação ao Cérebro Autoral, e nenhuma saída parcial do Pipeline vira evidência autoral por atalho.
