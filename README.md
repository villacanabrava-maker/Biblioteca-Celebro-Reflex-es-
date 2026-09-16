# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os quatro documentos fornecidos pelo proprietário continuam sendo a fonte canônica do produto; este arquivo registra o estado técnico real, testes, riscos, decisões e próximos passos.

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

- `README.md`: painel mestre operacional;
- `docs/DECISOES.md`: ADRs e refinamentos técnicos;
- `docs/ESTADO_ATUAL.md`: fotografia técnica da fase atual;
- `docs/DESIGN_VISUAL.md`: direção visual;
- `supabase/migrations/`: história reproduzível do banco;
- `supabase/config.toml`: configuração local reproduzível do Supabase;
- `supabase/seed.sql`: seed local não sensível;
- `.github/workflows/ci.yml`: portões automáticos de qualidade e reconstrução.

Os quatro documentos canônicos completos ainda não foram transpostos integralmente para arquivos dedicados no GitHub. Essa lacuna é conhecida. A transposição será feita por domínio, preservando terminologia e separando claramente conteúdo original de refinamentos técnicos posteriores.

---

## 3. Infraestrutura oficial

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

- branch oficial: `main`;
- Fase 2: incorporada e publicada;
- primeira entrega da Fase 3: incorporada à `main` pelo PR #9;
- segunda entrega da Fase 3: identificação e extração documental em validação no PR #10;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false` permanece;
- repositório atualmente **público**;
- API de Rulesets retorna `[]`;
- nenhum segredo deve existir no código ou histórico.

Antes de corpus intelectual real, permanece recomendado tornar o repositório privado e criar Ruleset para `main` exigindo Pull Request + checks obrigatórios + bloqueio de force push. O conector atual consegue auditar Rulesets, mas não criá-los.

### Supabase

```text
Projeto: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Responsabilidades: PostgreSQL, Auth, Storage privado, RLS, Data API controlada, Full Text Search e pgvector.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

A produção baseada em `main` permanece `READY`. A produção da primeira entrega da Fase 3 está publicada e o Preview da segunda entrega também está `READY`.

O Dashboard da Vercel ainda reporta `nodeVersion = 24.x`, mas o build respeita `engines.node = 22.x` do `package.json` e usa Node 22. Mesmo assim, o setting do projeto deve ser alinhado manualmente para 22.x para eliminar ambiguidade operacional.

Projetos antigos de Memória Reflexiva/Reflexima são históricos e **não** fazem parte da infraestrutura canônica deste aplicativo.

---

## 4. Stack validada em 16/09/2026

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- App Router;
- `proxy.ts` conforme convenção do Next.js 16;
- Node `22.x`;
- npm `11.19.1`.

### Supabase

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- PostgreSQL 17;
- RLS;
- Storage privado;
- FTS;
- pgvector/HNSW;
- Supabase CLI `2.117.0` fixado no CI de banco local.

### Upload

- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- SHA-256 incremental;
- upload TUS privado;
- retries na operação atual;
- deduplicação transacional por usuário + hash.

### Processamento de arquivos

- `unpdf` `1.8.1` para PDF textual em Node/serverless;
- TXT/Markdown por decodificação UTF-8 determinística;
- PDF processado página a página, sem fan-out irrestrito;
- limites explícitos de tamanho, páginas, pixels, caracteres e tempo;
- PDF sem camada textual é rejeitado como `PDF_SEM_TEXTO_EXTRAIVEL`; OCR será decidido em etapa própria;
- DOCX permanece explicitamente fora do escopo desta versão até validação segura do container OOXML;
- extensão, MIME e conteúdo são combinados; nenhum desses sinais é confiado isoladamente.

### Workflow

- Vercel Workflow SDK `4.8.9` estável;
- `withWorkflow()` em `next.config.ts`;
- workflows com `'use workflow'`;
- steps com `'use step'`;
- `/.well-known/workflow/` excluído do Proxy de sessão;
- **região não é forçada em `start()` enquanto usamos 4.8.x**, pois a assinatura estável instalada não aceita `region`, apesar de documentação mais nova apresentar esse campo.

### Correções de segurança transitivas

O `npm audit` encontrou vulnerabilidades altas dentro da árvore do Workflow SDK. Em vez de remover o audit ou usar `npm audit fix --force`, a árvore foi atualizada e testada com:

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

- `nanoid 5.1.16` está fora da faixa vulnerável detectada;
- `undici 7.29.0` substitui a versão transitiva vulnerável;
- `npm ci` + `npm audit --omit=dev --audit-level=high` passam no CI.

### IA

- SDK `openai` `7.15.0` instalado;
- Zod `4.6.5`;
- a chave OpenAI anteriormente exposta foi rotacionada;
- uma chave nova foi configurada diretamente na Vercel pelo proprietário, sem ser adicionada ao GitHub;
- **IA ainda não está ativada no Pipeline**;
- Responses API deverá usar `store: false` para conteúdo intelectual privado;
- saídas estruturadas deverão usar JSON Schema/Structured Outputs e validação Zod antes de persistência;
- modelos serão centralizados por `MODELO_IA_*`, nunca espalhados no código.

### Qualidade

- `package-lock.json` versionado;
- ESLint `9.39.5`, mantido por compatibilidade comprovada com a cadeia atual do Next.js 16;
- `actions/checkout@v7`;
- `actions/setup-node@v7`;
- CI em `contents: read`;
- instalação por `npm ci`;
- `npm test` cobre identificação de formato, spoofing, TXT/Markdown e extração de um PDF textual real mínimo.

---

## 5. Estado real

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
| Obras reais no banco oficial | **0 — ainda sem corpus** |
| Pipeline — modelo de dados | concluído / `main` |
| Documento Processado/hierarquia | concluído / `main` |
| Vetores/elementos/evidências/grafo | concluídos / `main` |
| Proveniência/publicação atômica | concluída / `main` |
| Pipeline — orquestração server-only | concluída / `main`, feature flag OFF |
| Pipeline — `validar_arquivo` | implementado / feature flag OFF |
| Pipeline — `identificar_formato` | implementado e testado |
| Pipeline — `extrair_conteudo` | implementado e testado para PDF textual/TXT/Markdown |
| Artefatos intermediários privados | `0020`/`0021` aplicadas no Supabase |
| Idempotência/concorrência do workflow | reforçada até `0019` |
| Supabase local reproduzível | implementado e testado no CI |
| Pipeline — `normalizar_conteudo` em diante | pendente |
| OpenAI server-side | credencial configurada; camada operacional ainda pendente |
| Cérebro Autoral | pendente |
| Recuperação híbrida | pendente |
| Motor de Reflexões | pendente |

O banco oficial possui atualmente `1` usuário Auth e `0` obras, `0` versões de obra, `0` execuções, `0` Documentos Processados, `0` fragmentos e `0` elementos. Há 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia.

---

## 6. Histórico oficial de migrations

Migration aplicada não é reescrita. Toda correção posterior recebe nova migration. Os nomes abaixo coincidem com o histórico real do Supabase:

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
| `20260916221057` | `0019_idempotencia_transicoes_workflow` | locks e transições monotônicas/idempotentes |
| `20260916223016` | `0020_artefatos_intermediarios_processamento` | metadados/RPCs/bucket privado para artefatos parciais |
| `20260916225622` | `0021_politica_negacao_artefatos_processamento` | policy explícita de negação para clientes |

O CI sobe um Supabase local limpo e executa todas essas migrations e `seed.sql`; em seguida executa `supabase db reset` para provar que a reconstrução é repetível.

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

Superfície controlada da Data API:

```text
aplicacao
```

Auditorias confirmaram:

- RLS nas tabelas pessoais;
- Storage privado por usuário;
- browser sem `USAGE` nos schemas internos;
- browser sem privilégios diretos de tabela nos schemas internos;
- RPCs públicas derivam identidade de `auth.uid()`;
- RPCs `backend_*` são `SECURITY DEFINER` com `search_path = ''`;
- `anon` e `authenticated` não executam RPCs `backend_*`;
- somente a credencial de backend executa a fronteira server-only necessária;
- `processamento.artefatos_execucao` tem RLS + policy explícita de negação e grants diretos revogados;
- nenhuma constraint auditada permanece `NOT VALID`;
- advisors não apontam FK sem índice;
- `unused_index` permanece apenas informativo enquanto o banco está vazio.

### Supabase Auth — pendência externa

O advisor ainda informa:

```text
Leaked Password Protection Disabled
```

A proteção deve ser habilitada no Dashboard antes de usuários reais, se o plano permitir. O conector atual não expõe essa configuração.

### GitHub — pendências externas

- repositório ainda público;
- Rulesets retornam `[]`;
- antes de corpus real: tornar privado e exigir PR + checks para `main`;
- CodeQL default setup é recomendado quando a configuração da conta permitir.

### Segredos

- `.env*` ignorado, exceto `.env.example`;
- `SUPABASE_SECRET_KEY` somente no servidor;
- `OPENAI_API_KEY` somente no ambiente servidor/Vercel;
- nenhuma chave real deve aparecer em README, commits, logs ou frontend.

---

## 8. Biblioteca e upload

`biblioteca.obras` representa a obra lógica e `biblioteca.versoes_obras` preserva cada versão física. O original nunca é modificado pelo Pipeline.

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

A retomada TUS entre reloads permanece desativada até existir uma operação persistente com IDs estáveis. Isso evita associar fingerprint antigo a UUID novo.

---

## 9. Documento Processado e artefatos intermediários

Estrutura hierárquica final:

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

Fragmentos possuem FTS automático. Vetores v1 usam `vector(1536)` + HNSW/cosine. Evidências devem permanecer no mesmo Documento Processado. Um Documento Processado `ativo` exige `publicado_em` e existe no máximo um ativo por usuário/obra.

Conteúdo parcial **não** é gravado como Documento Processado. `0020` criou `processamento.artefatos_execucao` e o bucket privado `artefatos-processamento` para artefatos intermediários como `conteudo_extraido` e `conteudo_normalizado`. O banco guarda hash, tamanho, MIME, metadados e proveniência; o conteúdo grande fica no Storage privado. `0021` torna explícito que clientes não têm acesso direto a essa tabela.

---

## 10. Pipeline durável

`0017` registra as 14 etapas canônicas:

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

`0018` adiciona reserva de orquestração, contador de tentativas, marco de início e recuperação de reserva abandonada/execução falha ou cancelada.

`0019` adiciona locks e regras monotônicas para impedir que retry atrasado, replay ou concorrência regredam uma execução que já avançou. Início, conclusão e falha só alteram o estado quando a etapa recebida é realmente a etapa atual da execução.

### `validar_arquivo`

```text
API autenticada
  ↓
reserva server-only
  ↓
Vercel Workflow
  ↓
URL assinada privada
  ↓
streaming do original
  ↓
SHA-256 servidor + bytes reais
  ↓
comparação com Biblioteca
```

- divergência de hash/tamanho: falha determinística;
- falha transitória de rede/Storage: retry do Workflow;
- falha terminal só após esgotamento de retries;
- sucesso posiciona a execução em `identificar_formato`.

### `identificar_formato`

Primeira allowlist operacional:

```text
PDF textual
TXT UTF-8
Markdown UTF-8
```

A identificação combina extensão, MIME e assinatura/conteúdo. PDF exige `%PDF-` na região inicial. TXT/Markdown rejeitam NUL, controles binários anormais e amostra UTF-8 inválida. DOCX não é aceito ainda; ele será implementado somente com validação OOXML segura.

### `extrair_conteudo`

- TXT/Markdown: decodificação UTF-8 completa, preservando o conteúdo para a normalização posterior;
- PDF: `unpdf`/PDF.js serverless, leitura página a página e preservação do número da página;
- original é novamente verificado por hash e tamanho antes da extração;
- limites v1: 20 MiB para texto, 50 MiB para PDF, 1.000 páginas, 12 milhões de caracteres, ~16 MP por imagem declarada e 90 s para extração PDF;
- PDF sem camada textual não é enviado para IA: retorna `PDF_SEM_TEXTO_EXTRAIVEL` e fica aguardando estratégia de OCR futura;
- resultado é serializado em JSON, recebe SHA-256 próprio e é salvo como `conteudo_extraido.json` no bucket `artefatos-processamento`;
- sucesso avança para `normalizar_conteudo`.

A feature flag permanece:

```text
PROCESSAMENTO_WORKFLOW_ATIVO=false
```

O frontend ainda não dispara o Pipeline incompleto.

---

## 11. CI e testes

O projeto possui dois jobs independentes.

### Aplicação

```text
Node 22.x
npm 11.19.1
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

A suíte `tests/processamento/processamento-documental.test.mjs` cobre:

- PDF válido versus arquivo falso com extensão `.pdf`;
- TXT/Markdown UTF-8;
- rejeição de binário disfarçado de texto;
- DOCX explicitamente fora do escopo v1;
- BOM, conteúdo vazio e UTF-8 inválido;
- extração real de texto de um PDF mínimo preservando a página.

### Banco local

```text
Supabase CLI 2.117.0
supabase start
supabase db reset
supabase status
supabase stop --no-backup
```

Esse segundo job prova que todas as migrations e o seed podem reconstruir um banco novo. Ele não usa dados pessoais nem conecta o runner ao banco de produção.

Além do CI, a revisão de uma fase verifica migrations remotas, grants, RLS, constraints, advisors, Preview Vercel e runtime logs.

### Limite atual de E2E

Ainda não há obra real no banco oficial. Portanto o caminho positivo `upload real → workflow → validar → identificar → extrair` ainda não foi exercitado com corpus. A feature flag continuará `false` até existir uma obra de teste controlada e esse fluxo passar de ponta a ponta.

---

## 12. Pesquisa tecnológica contínua

A arquitetura é revisada contra documentação oficial antes de decisões importantes.

Constatações atuais:

- Next.js 16: App Router permanece atual; `middleware.ts` foi substituído por `proxy.ts`;
- Supabase: migrations + `config.toml` + seed e ambiente local são parte do fluxo recomendado;
- Supabase Functions/RPC: `SECURITY DEFINER` exige `search_path` controlado e grants explícitos;
- GitHub: Rulesets podem exigir PR, status checks, bloquear force push e integrar security scanning;
- Vercel Workflow: usamos a linha estável 4.8.x; recursos documentados por versões posteriores não são assumidos automaticamente;
- `unpdf`/PDF.js: PDFs não confiáveis exigem limites de páginas, imagens e tempo; o parser não substitui validação de upload;
- OWASP: extensão, MIME e assinatura não são suficientes isoladamente; usamos defesa em profundidade e allowlist;
- OpenAI: Responses API + Structured Outputs continuam a base prevista; para conteúdo privado adotaremos `store: false` e minimização de contexto enviado.

Ser moderno neste projeto significa **pesquisar e verificar**, não adicionar mais tecnologias sem necessidade.

---

## 13. Pendências externas obrigatórias

1. **Supabase Auth:** habilitar Leaked Password Protection antes de usuários reais, se o plano permitir, e confirmar Site URL/Redirects/template SSR.
2. **GitHub:** tornar o repositório privado antes de corpus intelectual real e criar Ruleset para `main` exigindo PR + checks; considerar CodeQL default setup.
3. **Vercel:** alinhar o setting do projeto de Node 24.x para 22.x; atualmente o `package.json` já força os builds a Node 22.
4. **E2E:** criar/usar uma obra controlada de teste antes de ligar `PROCESSAMENTO_WORKFLOW_ATIVO`.

A OpenAI **não é mais uma pendência de rotação**: a chave antiga foi rotacionada e a nova foi configurada na Vercel. A IA continua desativada apenas porque o Pipeline determinístico ainda não chegou à etapa correta para usá-la.

---

## 14. Próxima etapa

A sequência imediata permanece determinística:

```text
validar_arquivo        ✅ implementado
  ↓
identificar_formato    ✅ implementado
  ↓
extrair_conteudo       ✅ implementado para PDF textual/TXT/Markdown
  ↓
normalizar_conteudo     ← próxima implementação
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

A camada OpenAI será centralizada e preparada antes das primeiras etapas realmente cognitivas, mas não será chamada durante validação de arquivo, identificação de formato, extração textual ou normalização que possam ser resolvidas deterministicamente.

---

## 15. Ordem macro

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Dicionário/Taxonomia — estrutura | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Pipeline — modelo de dados | concluído |
| Pipeline — workflow | **em construção, validação/formato/extração implementados** |
| Documentos Processados — execução real | pendente do workflow completo |
| Taxonomia inteligente | pendente |
| Recuperação híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações/segurança/otimização | contínuo |

---

## 16. Regra permanente

Este README deve permitir que uma pessoa não técnica descubra, sem inferência:

- o que é o aplicativo;
- o que já existe;
- o que está ativo em produção;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais erros foram encontrados e corrigidos;
- quais alertas externos permanecem;
- quais decisões arquiteturais estão vigentes;
- como autoria, segurança e proveniência são preservadas;
- qual é a próxima etapa.
