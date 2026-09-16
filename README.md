# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** O conteúdo canônico do produto continua sendo definido pelos quatro documentos fornecidos pelo proprietário; este arquivo registra o estado técnico real da implementação.

---

## 1. O que estamos construindo

O ativo principal é o **Cérebro Autoral**: uma representação estruturada, versionada e auditável da metodologia de pensamento, interpretação, associação, argumentação, escrita, revisão, arquitetura narrativa, recursos retóricos, identidade linguística, relação experiência–conceito, padrões de tensão/síntese, universo conceitual e evolução autoral.

A IA poderá interpretar, organizar, relacionar, recuperar contexto, planejar e redigir. Ela **não** define silenciosamente a identidade do usuário, não converte referência externa em autoria e não transforma saída livre de modelo em verdade canônica sem validação.

Macrofluxo:

```text
BIBLIOTECA
   ↓
PROCESSAMENTO INTELIGENTE
   ↓
DOCUMENTOS PROCESSADOS
   ↓
ANÁLISE TRANSVERSAL
   ↓
CÉREBRO AUTORAL
   ↓
RECUPERAÇÃO CONTEXTUAL
   ↓
MOTOR DE REFLEXÕES
   ↓
NOVA REFLEXÃO
   ↓
REVISÃO HUMANA
   ↓
APRENDIZADO CONTROLADO
```

Aprovar uma reflexão não significa incorporá-la automaticamente ao Cérebro. Conteúdo novo só vira evidência autoral por ação explícita e deve percorrer novamente Biblioteca → Processamento → Documento Processado → Cérebro.

---

## 2. Fontes de verdade

Documentos canônicos fornecidos pelo proprietário:

- Arquitetura Técnica de Implementação — Cérebro Autoral;
- Plano de Construção — Projeto Novo do Cérebro Autoral;
- Dicionário Mestre de Dados e Taxonomia v1.0;
- Carta de atuação do Engenheiro Principal / Produto.

No repositório:

- `README.md`: estado operacional mestre;
- `docs/DECISOES.md`: ADRs e refinamentos técnicos;
- `docs/ESTADO_ATUAL.md`: fotografia da fase atual;
- `docs/DESIGN_VISUAL.md`: direção visual;
- `supabase/migrations/`: história reproduzível do banco;
- `.github/workflows/ci.yml`: critérios automáticos mínimos para merge.

Os quatro documentos canônicos completos ainda não foram versionados integralmente em arquivos dedicados no GitHub. Essa lacuna é conhecida; eles continuam sendo a fonte de verdade e serão transpostos por domínio sem reinterpretação silenciosa.

---

## 3. Infraestrutura oficial

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

- branch oficial: `main`;
- Fase 2: incorporada e publicada;
- Fase 3: PR #9 `feature/workflow-processamento`, em validação;
- repositório atualmente **público**;
- API de Rulesets retorna `[]`;
- branch protection não é legível pelo conector atual por falta de permissão administrativa.

Antes de conteúdo intelectual real, a recomendação operacional é tornar o repositório privado e confirmar proteção obrigatória de `main` por PR + checks.

### Supabase

```text
Projeto: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Usado para PostgreSQL, Auth, Storage privado, RLS, Data API controlada, Full Text Search e pgvector.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

A produção atual continua na `main` da Fase 2 e está `READY`. O Preview mais recente do PR #9 também está `READY`.

**Pendência real:** o projeto Vercel ainda reporta `nodeVersion = 24.x`, enquanto o repositório e o CI exigem `22.x`. O conector disponível não permite alterar esse setting; ele deve ser alinhado no Dashboard da Vercel antes de concluir a Fase 3.

Projetos Vercel antigos de Memória Reflexiva/Reflexima são históricos e **não** fazem parte da infraestrutura canônica deste aplicativo novo.

---

## 4. Stack atual

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- App Router;
- Node `22.x` no `package.json` e CI.

### Dados e autenticação

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- PostgreSQL + RLS;
- Storage privado;
- Full Text Search;
- pgvector/HNSW.

### Upload

- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- SHA-256 incremental;
- TUS com retries da operação atual;
- deduplicação transacional por usuário + hash.

### Workflow

- Vercel Workflow SDK `4.8.8`;
- `withWorkflow()` em `next.config.ts`;
- workflows com `'use workflow'`;
- etapas duráveis/retryáveis com `'use step'`;
- execução do Pipeline fixada em `sfo1`, próxima ao Supabase `us-west-2`;
- `/.well-known/workflow/` excluído da autenticação do Proxy conforme integração do SDK.

### IA

- `openai` `7.15.0` instalado, mas **IA ainda não está ativada operacionalmente**;
- Zod `4.6.5`;
- modelos serão centralizados por configuração;
- saída estruturada deverá ser validada antes de persistência.

### Build/qualidade

- npm `11.19.1`;
- `package-lock.json` versionado;
- ESLint `9.39.5` por compatibilidade comprovada com `eslint-config-next 16.3.5`;
- `actions/checkout@v7`;
- `actions/setup-node@v7`;
- CI final em modo somente leitura com `npm ci`, auditoria de dependências de produção, lint, TypeScript e build.

O projeto saiu de npm 10 para npm 11 porque o PR #9 reproduziu um caso em que npm 10 gerava um lockfile que o próprio `npm ci` rejeitava por resolução transitiva de `chokidar`/`readdirp`. A mudança foi testada no CI, não feita por conveniência.

---

## 5. Estado real — 16/09/2026

| Bloco | Estado |
|---|---|
| Fundação técnica | concluída / `main` |
| Sistema visual inicial | concluído / `main` |
| Schema `sistema` | concluído / `main` |
| Taxonomia Mestre — estrutura/versionamento | concluída / `main` |
| Biblioteca — schema/API/Storage | concluída / `main` |
| Auth SSR | concluído / `main` |
| Upload TUS + SHA-256 | concluído / `main` |
| Deduplicação por hash | concluída / `main` |
| Obras reais no banco oficial | **0 — ainda sem corpus de teste** |
| Pipeline — modelo de dados | concluído / `main` |
| Documento Processado/hierarquia | concluído / `main` |
| Vetores/elementos/evidências/grafo | concluídos / `main` |
| Proveniência/publicação atômica | concluída / `main` |
| Pipeline — orquestração server-only | aplicada no Supabase / PR #9 |
| Pipeline — `validar_arquivo` | implementado / PR #9 / feature flag OFF |
| Pipeline — extração em diante | pendente |
| Cérebro Autoral | pendente |
| Recuperação híbrida | pendente |
| Motor de Reflexões | pendente |
| OpenAI operacional | bloqueada até rotação segura de chave |

O banco oficial neste momento possui `0` obras, `0` execuções e `0` Documentos Processados; possui 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia.

---

## 6. Histórico oficial de migrations

Os nomes abaixo coincidem com as versões registradas no Supabase. Migration aplicada não é reescrita para esconder correção; toda mudança posterior recebe nova migration.

| Versão | Migration | Finalidade |
|---|---|---|
| `20260916183543` | `0001_fundacao` | extensões e schemas canônicos |
| `20260916184023` | `0002_sistema` | modelos, prompts, pipeline e preferências |
| `20260916185118` | `0003_taxonomia` | estrutura da Taxonomia Mestre |
| `20260916185526` | `0004_biblioteca` | obras e versões físicas |
| `20260916185621` | `0005_indice_fk_biblioteca` | índice FK composta da Biblioteca |
| `20260916190006` | `0006_storage_biblioteca` | bucket privado e policies |
| `20260916190833` | `0007_api_aplicacao_biblioteca` | fronteira segura da Data API |
| `20260916192647` | `0008_processamento_execucoes` | execuções e etapas idempotentes |
| `20260916192731` | `0009_indice_fk_etapas_execucao` | índice FK do pipeline |
| `20260916194638` | `0010_seeds_versoes_base` | Taxonomia 1.0 e Pipeline 1.0 |
| `20260916195547` | `0011_processamento_documentos_hierarquia` | documento, seções, fragmentos e sínteses |
| `20260916195710` | `0012_indices_fk_processamento_hierarquia` | índices de FKs |
| `20260916200317` | `0013_processamento_elementos_vetores_grafo` | vetores, elementos, evidências, grafo e FK taxonômica |
| `20260916200419` | `0014_indice_fk_taxonomia_elementos` | índice FK Taxonomia → Elementos |
| `20260916200813` | `0015_integridade_proveniencia_publicacao` | evidência local e publicação coerente |
| `20260916200935` | `0016_deduplicacao_hash_biblioteca` | deduplicação concorrente por hash |
| `20260916202853` | `0017_api_backend_workflow_processamento` | RPCs server-only e 14 etapas canônicas |
| `20260916212133` | `0018_recuperacao_orquestracao_workflow` | reserva/reinício/recuperação do workflow |

A auditoria da Fase 3 encontrou que o arquivo `0017` havia sido criado no GitHub como `20260916203000...`, diferente do banco. Ele foi renomeado para `20260916202853...` sem reexecutar nem alterar a migration aplicada.

---

## 7. Segurança e fronteiras

Schemas internos:

```text
biblioteca
processamento
taxonomia
cerebro_autoral
reflexoes
auditoria
sistema
```

Superfície de API controlada:

```text
aplicacao
```

Confirmado no banco após `0018`:

- RLS nas tabelas pessoais implementadas;
- Storage privado por usuário;
- navegador não recebe `USAGE` nos schemas internos;
- RPCs públicas derivam identidade de `auth.uid()`;
- RPCs do workflow `backend_*` são `SECURITY DEFINER` + `search_path = ''`;
- `anon` não executa RPCs `backend_*`;
- `authenticated` não executa RPCs `backend_*`;
- `service_role` executa somente a fronteira server-only necessária em `aplicacao`;
- nenhuma constraint auditada permanece `NOT VALID`;
- advisor não aponta FK sem índice;
- `unused_index` é esperado enquanto as tabelas permanecem vazias.

### Alerta ainda aberto no Supabase Auth

O advisor oficial informa:

```text
Leaked Password Protection Disabled
```

Essa configuração deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir. O conector atual não a altera.

### Segredos

- nenhum segredo deve ser commitido;
- `.gitignore` ignora `.env*`, exceto `.env.example`;
- `SUPABASE_SECRET_KEY` é servidor-only;
- a chave OpenAI compartilhada anteriormente no chat é considerada exposta e **não será reutilizada**;
- antes da primeira etapa com IA, uma chave nova deve ser criada e configurada diretamente no ambiente servidor/Vercel.

---

## 8. Biblioteca e upload

`biblioteca.obras` representa a obra lógica e `biblioteca.versoes_obras` preserva cada arquivo/versão física. O original nunca é modificado pelo processamento.

Caminho privado:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

Fluxo atual:

```text
sessão validada
  ↓
UUID obra + versão
  ↓
SHA-256 incremental no navegador
  ↓
TUS / Storage privado
  ↓
RPC valida caminho/hash
  ↓
deduplicação transacional
  ↓
obra + versão física
```

A retomada TUS entre reloads continua desativada até existir uma operação persistente com IDs estáveis. Isso evita associar fingerprint antigo a UUID novo.

---

## 9. Modelo do Documento Processado

Estrutura hierárquica:

```text
obra
  → parte
    → capítulo
      → seção
        → fragmento
```

Tabelas principais:

- `processamento.documentos_processados`;
- `processamento.secoes`;
- `processamento.fragmentos`;
- `processamento.sinteses`;
- `processamento.vetores`;
- `processamento.elementos`;
- `processamento.evidencias`;
- `processamento.relacoes_elementos`.

Fragmentos possuem FTS automático. Vetores v1 usam `vector(1536)` + HNSW/cosine. Evidências não podem apontar para fragmentos de outro Documento Processado. Um Documento Processado `ativo` exige `publicado_em` e existe no máximo um ativo por usuário/obra.

---

## 10. Fase 3 — workflow real

`0017` cria a camada server-only e registra as 14 etapas canônicas:

```text
validar_arquivo
identificar_formato
extrair_conteudo
normalizar_conteudo
identificar_estrutura
criar_hierarquia
criar_fragmentos
criar_sinteses
extrair_elementos
classificar_taxonomia
criar_embeddings
criar_relacoes
validar_resultado
publicar_documento
```

`0018` adiciona uma reserva de orquestração de cinco minutos, contador de tentativas e marco de início do workflow. Isso impede que duas requisições concorrentes disparem duas execuções duráveis e permite recuperar uma reserva abandonada ou uma execução falha/cancelada.

### Primeira etapa implementada: `validar_arquivo`

```text
API autenticada
  ↓
reserva server-only
  ↓
Vercel Workflow sfo1
  ↓
URL assinada privada de curta duração
  ↓
streaming do original
  ↓
SHA-256 servidor + bytes reais
  ↓
comparação com Biblioteca
```

- divergência de hash/tamanho: falha determinística terminal;
- Storage/rede temporariamente indisponível: erro é entregue ao retry automático do `use step`;
- somente após esgotar retries a execução é marcada como falha terminal;
- sucesso conclui `validar_arquivo` e posiciona a execução em `identificar_formato`.

A feature flag permanece:

```text
PROCESSAMENTO_WORKFLOW_ATIVO=false
```

O frontend ainda não dispara esse endpoint. Portanto a Fase 3 pode ser incorporada sem ativar processamento incompleto para usuários.

---

## 11. Testes e CI

O projeto só pode entrar em `main` com CI verde.

CI final da Fase 3:

```text
Node 22.x
npm 11.19.1
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm run build
contents: read
```

Além do CI, a auditoria verifica Supabase migrations, grants, RLS, constraints, advisors e Vercel Preview.

### Limite atual do teste E2E

O banco oficial ainda não contém obra real autenticada. Por isso o caminho positivo `upload real → workflow → hash validado` só poderá ser exercitado quando criarmos/registrarmos uma obra de teste. A feature flag continuará `false` até esse teste acontecer.

---

## 12. Pendências externas obrigatórias

1. **Vercel:** alterar Node.js do projeto `cerebro-autoral` de 24.x para 22.x.
2. **Supabase Auth:** habilitar Leaked Password Protection, se o plano permitir, e confirmar Site URL/Redirects/template SSR.
3. **GitHub:** tornar o repositório privado antes de corpus intelectual real e confirmar branch protection/ruleset de `main`.
4. **OpenAI:** rotacionar a chave exposta e configurar a nova somente no ambiente servidor antes da primeira etapa com IA.

Nenhuma dessas pendências autoriza contornar RLS, abrir schemas internos ou colocar segredo em código.

---

## 13. Próxima etapa

Depois de o PR #9 ficar inteiramente verde e ser incorporado sem ativar a feature flag:

```text
validar_arquivo
  ↓
identificar_formato
  ↓
extrair_conteudo
  ↓
normalizar_conteudo
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

As próximas etapas determinísticas (`identificar_formato`, extração e normalização) serão implementadas antes de ativar qualquer análise de IA.

---

## 14. Ordem macro daqui para frente

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Dicionário/Taxonomia — estrutura | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Pipeline — modelo de dados | concluído |
| Pipeline — workflow | **em construção** |
| Documentos Processados — execução real | pendente do workflow |
| Taxonomia inteligente | pendente |
| Recuperação híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações/segurança/otimização | contínuo |

---

## 15. Regra permanente

Este README deve permitir que uma pessoa não técnica descubra, sem inferência:

- o que é o aplicativo;
- o que já existe;
- o que está em `main` e o que está somente em PR;
- o que está realmente ativo em produção;
- quais migrations foram aplicadas;
- quais testes passaram ou ainda não podem ser executados;
- quais erros foram encontrados e corrigidos;
- quais alertas externos permanecem;
- quais decisões arquiteturais estão vigentes;
- como autoria, segurança e proveniência são preservadas;
- qual é a próxima etapa.
