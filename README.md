# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências e proveniência e utilizar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre do projeto.** Toda mudança relevante de arquitetura, banco, interface, integração, teste, deploy, segurança ou decisão deve atualizar este arquivo no mesmo ciclo de desenvolvimento.

---

## 1. Objetivo do produto

O principal ativo do aplicativo é o **Cérebro Autoral**. Ele deverá representar, de forma estruturada, versionada e auditável, metodologia de pensamento, interpretação, associação, argumentação, escrita e revisão; arquitetura narrativa e de parágrafo; formas de abertura, transição e conclusão; recursos retóricos; identidade linguística; relação experiência–conceito; padrões de tensão e síntese; universo conceitual e evolução autoral.

A IA pode interpretar, organizar, relacionar, recuperar contexto, planejar e redigir. Ela **não** define silenciosamente a identidade do usuário e **não** transforma respostas livres em verdade canônica no banco sem validação.

---

## 2. Macrofluxo canônico

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

Aprovar uma reflexão não significa incorporá-la automaticamente ao Cérebro. Uma nova produção só poderá virar evidência autoral por ação explícita e deverá percorrer novamente Biblioteca → Processamento → Documento Processado → Cérebro.

---

## 3. Fontes de verdade

A implementação deve permanecer coerente com os documentos canônicos fornecidos pelo proprietário do produto:

- Arquitetura Técnica de Implementação — Cérebro Autoral;
- Plano de Construção — Projeto Novo do Cérebro Autoral;
- Dicionário Mestre de Dados e Taxonomia v1.0;
- Carta de atuação do Engenheiro Principal / Produto.

No repositório:

- `README.md` acompanha o estado operacional;
- `docs/DECISOES.md` registra ADRs;
- `docs/ESTADO_ATUAL.md` resume o momento atual;
- `docs/DESIGN_VISUAL.md` preserva a direção visual;
- `supabase/migrations/` registra a evolução real e reproduzível do banco;
- código só é considerado concluído depois de CI verde.

Os documentos canônicos completos ainda não foram copiados integralmente para arquivos dedicados no repositório. Isso é uma lacuna documental conhecida; eles continuarão sendo tratados como fonte de verdade e serão versionados por domínio sem alterar silenciosamente seu conteúdo.

---

## 4. Infraestrutura canônica confirmada

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

- branch principal: `main`;
- branch atual: `feature/processamento`;
- PR atual: **#7 — Fase 2: auditar base e iniciar Pipeline Documental**.

Fluxo:

```text
feature/<etapa>
   ↓
Pull Request
   ↓
CI verde
   ↓
main
   ↓
Vercel Production
```

**Auditoria de 16/09/2026:** o repositório está atualmente `public`. Nenhum segredo conhecido de OpenAI/Supabase foi encontrado nas buscas realizadas, mas a visibilidade pública expõe código, arquitetura e documentação intelectual. A recomendação é torná-lo **privado antes do uso produtivo com conteúdo intelectual real**. O conector GitHub desta sessão não possui permissão administrativa para alterar a visibilidade.

A API acessível retorna zero rulesets. A leitura/alteração administrativa de branch protection não está disponível pelo conector atual; a proteção obrigatória da `main` continua como item externo a confirmar.

### Supabase

Projeto oficial:

```text
xzkzdaxxmizcgfkjgzoq
```

Usado para PostgreSQL, Auth, Storage privado, RLS, Data API controlada, Full Text Search e pgvector.

### Vercel

Projeto oficial confirmado:

```text
cerebro-autoral
```

Repositório conectado:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Domínio principal verificado:

```text
https://cerebro-autoral.vercel.app
```

O deploy de produção inspecionado está `READY`, originado da `main`. A página pública responde HTTP 200 e rotas protegidas como `/biblioteca` redirecionam para login sem sessão. A inspeção de runtime dos últimos 7 dias não encontrou clusters de erro.

---

## 5. Stack oficial atual

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- App Router;
- Node.js **`22.x`** fixado para alinhar CI e Vercel.

### Supabase

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- PostgreSQL;
- Auth;
- Storage;
- RLS;
- Full Text Search;
- pgvector `0.8.2`.

### Upload e integridade

- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- TUS com chunks de 6 MB;
- SHA-256 incremental;
- deduplicação por usuário + SHA-256 com lock transacional no banco.

### Inteligência artificial

- `openai` `7.15.0`;
- Zod `4.6.5`;
- modelos centralizados por configuração;
- Structured Outputs + validação antes da persistência.

### Qualidade e build

- ESLint `9.39.5`;
- `eslint-config-next` `16.3.5`;
- `actions/checkout@v7`;
- `actions/setup-node@v7`;
- `package-lock.json` versionado;
- CI com `npm ci`.

**Por que ESLint 9 e não 10:** o CI provou que `eslint-config-next 16.3.5` ainda carrega `eslint-plugin-react` incompatível com uma API removida no ESLint 10.10.0. O projeto permanece em 9.39.5 até o ecossistema Next suportar a major 10 de forma compatível.

---

## 6. Estado geral — auditoria de 16/09/2026

| Bloco | Estado real |
|---|---|
| Fundação técnica | concluída / `main` |
| Sistema visual inicial | concluído / `main` |
| Schema `sistema` | concluído / `main` |
| Taxonomia Mestre — estrutura | concluída / `main` |
| Biblioteca — banco | concluída / `main` |
| Storage privado | concluído / `main` |
| API segura `aplicacao` | concluída / `main` |
| Supabase Auth SSR | concluído / `main`; hardening no PR #7 |
| Upload real + SHA-256 + TUS | concluído / `main`; correções de retomada/deduplicação no PR #7 |
| Biblioteca com dados reais | concluída / `main` |
| Vercel canônico | concluído e verificado online |
| Pipeline — execuções/idempotência | `0008`–`0009` aplicadas |
| Versões base Pipeline/Taxonomia | `0010` aplicada |
| Documento Processado/hierarquia | `0011`–`0012` aplicadas |
| Vetores/elementos/evidências/grafo | `0013`–`0014` aplicadas |
| Integridade de proveniência/publicação | `0015` aplicada |
| Deduplicação real por SHA-256 | `0016` aplicada |
| Workflow real de processamento | próxima etapa |
| Cérebro Autoral | pendente |
| Motor de Reflexões | pendente |
| OpenAI operacional | bloqueada até rotação segura da chave exposta no chat |

---

## 7. Histórico oficial de migrations

Os nomes de arquivo no GitHub foram auditados e alinhados às versões registradas pelo Supabase. Isso corrigiu timestamps divergentes e um prefixo duplicado que poderiam tornar um replay limpo não determinístico.

| Versão Supabase | Migration | Finalidade |
|---|---|---|
| `20260916183543` | `0001_fundacao` | extensões e schemas canônicos |
| `20260916184023` | `0002_sistema` | modelos, prompts, pipeline e preferências |
| `20260916185118` | `0003_taxonomia` | estrutura da Taxonomia Mestre |
| `20260916185526` | `0004_biblioteca` | obras e versões físicas |
| `20260916185621` | `0005_indice_fk_biblioteca` | índice da FK composta da Biblioteca |
| `20260916190006` | `0006_storage_biblioteca` | bucket privado e policies |
| `20260916190833` | `0007_api_aplicacao_biblioteca` | fronteira segura da Data API |
| `20260916192647` | `0008_processamento_execucoes` | execuções e etapas idempotentes |
| `20260916192731` | `0009_indice_fk_etapas_execucao` | índice da FK composta do pipeline |
| `20260916194638` | `0010_seeds_versoes_base` | ativa Taxonomia 1.0 e Pipeline 1.0 |
| `20260916195547` | `0011_processamento_documentos_hierarquia` | Documento Processado, seções, fragmentos e sínteses |
| `20260916195710` | `0012_indices_fk_processamento_hierarquia` | índices de FKs detectados pelo advisor |
| `20260916200317` | `0013_processamento_elementos_vetores_grafo` | vetores, elementos, evidências, grafo e FK Taxonomia → Elementos |
| `20260916200419` | `0014_indice_fk_taxonomia_elementos` | índice da FK composta Taxonomia → Elementos |
| `20260916200813` | `0015_integridade_proveniencia_publicacao` | evidência no mesmo documento e publicação ativa coerente |
| `20260916200935` | `0016_deduplicacao_hash_biblioteca` | deduplicação concorrente por usuário + SHA-256 |

Regra permanente: migration aplicada nunca é reescrita para esconder correção. Correções de banco geram migration nova.

---

## 8. Schemas e extensões

Schemas canônicos:

```text
biblioteca
processamento
taxonomia
cerebro_autoral
reflexoes
auditoria
sistema
aplicacao
```

Schemas nativos `auth` e `storage` permanecem nativos.

Extensões confirmadas:

- `vector` `0.8.2`;
- `unaccent` `1.1`;
- `pg_trgm` `1.6`.

---

## 9. Auditoria de segurança do Supabase

Confirmado no banco real:

- `authenticated` possui `USAGE` somente no schema público controlado `aplicacao`;
- `authenticated` não possui `USAGE` nos schemas internos;
- `anon` não possui `USAGE` nos schemas internos;
- `service_role` também não possui `USAGE` direto nos schemas internos; o futuro backend deverá usar RPCs server-only em `aplicacao` em vez de abrir tabelas internas na Data API;
- Data API (`authenticator`) limitada a `public, graphql_public, aplicacao`;
- RLS ativo nas tabelas pessoais implementadas;
- Storage privado com policies por `auth.uid()`;
- RPCs públicas com `SECURITY DEFINER`, `search_path = ''` e grants explícitos;
- funções internas de trigger não são executáveis por navegador;
- não existem constraints pendentes `NOT VALID`;
- após `0014`, o advisor de performance não acusa FKs sem índice;
- avisos de performance restantes são `unused_index`, esperados enquanto as tabelas estão vazias.

### Alerta de segurança ainda aberto — Auth

O advisor oficial do Supabase informa:

```text
Leaked Password Protection Disabled
```

A proteção contra senhas comprometidas usa Pwned Passwords/HaveIBeenPwned e, segundo a documentação atual do Supabase, está disponível no plano Pro e acima. O conector desta sessão não expõe essa configuração.

Antes de abrir o aplicativo para usuários reais:

1. ativar proteção contra senhas vazadas, se o plano permitir;
2. confirmar política de senha mínima/forte;
3. considerar MFA em etapa posterior de endurecimento.

Referência: `https://supabase.com/docs/guides/auth/password-security`.

---

## 10. Schema `sistema`

Implementado:

- `sistema.modelos_ia`;
- `sistema.prompts`;
- `sistema.versoes_prompts`;
- `sistema.versoes_pipeline`;
- `sistema.configuracoes_usuario`.

`0010` criou `Pipeline 1.0` ativo. `sistema.modelos_ia` continua vazio propositalmente porque os documentos canônicos deixam a escolha exata de modelos deliberadamente aberta.

---

## 11. Taxonomia Mestre

Implementado:

- `taxonomia.versoes`;
- `taxonomia.conceitos`;
- `taxonomia.termos`;
- `taxonomia.relacoes`;
- `taxonomia.classificacoes_elementos`.

`0010` criou `Taxonomia 1.0` ativa sem inventar conceitos.

A FK que estava formalmente adiada em `0003` já foi fechada em `0013`:

```text
classificacoes_elementos (elemento_id, usuario_id)
    → processamento.elementos (id, usuario_id)
```

`0014` adicionou o índice dedicado exigido pelo advisor.

O vocabulário de `taxonomia.conceitos.estado` continua deliberadamente sem CHECK até formalização no Dicionário Mestre.

---

## 12. Biblioteca, Storage e autoria

`biblioteca.obras` representa a obra lógica. `biblioteca.versoes_obras` preserva cada arquivo físico e cada versão.

Autoria:

```text
autoral
externa
```

Participação no Cérebro:

```text
autoral_prioritaria
externa_referencia
externa_influencia
excluida_cerebro
```

`autoral_prioritaria` exige autoria autoral. `externa_influencia` exige autoria externa; a validação contra uma influência ativa será adicionada quando `cerebro_autoral.influencias_externas` existir.

Bucket privado:

```text
originais-biblioteca
```

Caminho:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

Confirmado no banco:

```text
public = false
file_size_limit = null
allowed_mime_types = null
```

MIME e tamanho máximo permanecem abertos porque formatos finais e OCR ainda não estão congelados nos documentos canônicos.

---

## 13. API segura `aplicacao`

`aplicacao.listar_obras()` e `aplicacao.registrar_obra_arquivo(...)`:

- derivam identidade de `auth.uid()`;
- são `SECURITY DEFINER`;
- usam `search_path = ''`;
- `anon`/`PUBLIC` não executam;
- `authenticated` recebe somente os grants previstos;
- `biblioteca` não é exposta diretamente pela Data API.

`registrar_obra_arquivo` valida título, idioma, MIME, tamanho, SHA-256, caminho exato e existência do objeto no Storage antes de inserir obra + primeira versão.

### Deduplicação real (`0016`)

O Dicionário define `hash_sha256` para integridade e deduplicação, mas não exige `UNIQUE (usuario_id, hash_sha256)`. Para respeitar essa semântica e ainda evitar corrida concorrente, a RPC agora:

1. normaliza o SHA-256;
2. adquire `pg_advisory_xact_lock` derivado de usuário + hash;
3. consulta se o mesmo usuário já possui aquele hash;
4. se já existir, retorna `arquivo_duplicado_por_hash`;
5. o frontend remove o upload redundante e informa que o arquivo já existe.

O Pipeline continuará responsável por recalcular/verificar SHA-256 no servidor antes de processar, para não confiar definitivamente no hash informado pelo navegador.

---

## 14. Supabase Auth SSR

Padrão implementado:

```text
@supabase/ssr
createBrowserClient
createServerClient
cookies
proxy.ts
getClaims()
```

No servidor, autorização usa `supabase.auth.getClaims()`. `getSession()` não é usado como prova de identidade server-side; no navegador é usado somente para obter o access token que o Storage valida remotamente.

Login, cadastro, confirmação SSR e logout estão implementados.

### Hardening do PR #7

A identificação de rotas públicas no Proxy foi estreitada para:

```text
/login
/auth/*
```

Isso evita que um caminho apenas começando com texto parecido com `/login` ou `/auth` seja considerado público por engano.

O `.gitignore` passou a ignorar qualquer `.env*`, liberando apenas `.env.example`, reduzindo risco de commit acidental de `.env.production` ou arquivos equivalentes.

### Configurações ainda a confirmar no Dashboard

O conector atual não expõe Site URL, Redirect URLs nem templates de e-mail. Deve ser confirmado:

```text
Site URL = https://cerebro-autoral.vercel.app
```

O template de confirmação SSR deve direcionar para `/auth/confirm` usando `token_hash`, conforme a documentação atual do Supabase para fluxo PKCE/SSR.

---

## 15. Upload real — estado após auditoria

Fluxo:

```text
sessão validada
  ↓
UUID obra + UUID versão
  ↓
SHA-256 incremental
  ↓
TUS / Storage privado
  ↓
RPC valida objeto/caminho/hash
  ↓
deduplicação transacional
  ↓
obra + versão
  ↓
estado recebido
```

Configuração:

- endpoint direto do Storage;
- retries progressivos na operação;
- chunks de 6 MB;
- sem `x-upsert`;
- SHA-256 em blocos;
- tentativa de compensação/remover objeto se o registro falhar.

### Correção de auditoria — retomada entre reloads

A versão anterior chamava `findPreviousUploads()` mesmo criando novos `obraId` e `versaoId` por submissão. Isso podia retomar um upload antigo em caminho com UUIDs anteriores e tentar registrar um caminho novo.

No PR #7, a retomada implícita foi removida. TUS mantém retries na operação atual. Retomada entre reloads/tentativas só será reintroduzida quando os IDs da operação de upload forem persistidos explicitamente.

---

## 16. Pipeline Documental — estrutura implementada

### Execução e idempotência (`0008`–`0009`)

`processamento.execucoes` registra versão da obra, pipeline, taxonomia, estado, etapa, progresso, timestamps e erro seguro.

Estados:

```text
recebido
validando
extraindo
normalizando
estruturando
segmentando
sintetizando
analisando
classificando
vetorizando
relacionando
validando_resultado
finalizando
concluido
falhou
cancelado
```

`processamento.etapas_execucao` possui chave de idempotência única, ordem, tentativas, duração e metadados operacionais.

### Documento Processado e hierarquia (`0011`–`0012`)

Criados:

- `processamento.documentos_processados`;
- `processamento.secoes`;
- `processamento.fragmentos`;
- `processamento.sinteses`.

A estrutura preserva hierarquia editorial e não reduz um livro a chunks planos. `fragmentos.vetor_textual` é gerado automaticamente de `conteudo_contextualizado` e indexado com GIN.

Somente um Documento Processado `ativo` por usuário/obra pode existir ao mesmo tempo.

### Vetores e grafo intelectual (`0013`–`0014`)

Criados:

- `processamento.vetores`;
- `processamento.elementos`;
- `processamento.evidencias`;
- `processamento.relacoes_elementos`.

Vetores v1:

```text
extensions.vector(1536)
HNSW
vector_cosine_ops
```

A dimensionalidade 1536 vem do Dicionário Mestre v1; qualquer mudança exige migration/versionamento explícito.

Elementos possuem tipo controlado, importância 0–1, confiança 0–1, estado de revisão e referências ao modelo/prompt que os produziram. Evidências apontam para fragmentos concretos. Relações podem ligar elementos de documentos diferentes do mesmo usuário, formando o grafo intelectual previsto.

### Proveniência e publicação atômica (`0015`)

Duas garantias adicionais foram incorporadas:

- Documento Processado `ativo` exige `publicado_em` preenchido;
- uma `evidencia` só pode relacionar elemento e fragmento pertencentes ao **mesmo Documento Processado**.

Isso impede proveniência cruzada acidental entre documentos do mesmo usuário, sem impedir relações intelectuais legítimas entre elementos de documentos diferentes.

---

## 17. OpenAI — estado e segurança

A camada de IA ainda não está ativada operacionalmente.

Variável permitida no servidor:

```text
OPENAI_API_KEY
```

Uma chave foi enviada diretamente no chat durante desenvolvimento. Ela é tratada como **exposta** e não será usada no ambiente real. Antes de ativar IA, deve ser rotacionada no provedor e a nova chave configurada diretamente como secret do servidor/Vercel, sem voltar ao chat, GitHub ou README.

Configurações lógicas previstas:

```text
MODELO_IA_EXTRACAO
MODELO_IA_ANALISE
MODELO_IA_CEREBRO
MODELO_IA_REDACAO
MODELO_IA_AUDITORIA
MODELO_IA_EMBEDDING
```

---

## 18. CI e reprodutibilidade

A auditoria encontrou e corrigiu:

- CI em Node 22 enquanto Vercel podia escolher Node 24 → `engines.node = 22.x`;
- ausência de lockfile → `package-lock.json` gerado por runner que passou lint/TypeScript/build e versionado;
- instalação aberta no CI → `npm ci`;
- Actions antigas → v7;
- permissão temporária de escrita usada somente para bootstrap do lockfile → removida; workflow voltou a `contents: read`;
- tentativa de ESLint 10 incompatível → pin compatível em 9.39.5.

O CI final deve passar, no mesmo commit que será incorporado:

```text
npm ci
npm run lint
npm run typecheck
npm run build
```

---

## 19. Frontend e design

Rotas principais:

```text
/
/login
/biblioteca
/biblioteca/adicionar
/cerebro-autoral
/criar-reflexao
/reflexoes
/configuracoes
/auth/confirm
/auth/signout
```

`/biblioteca` usa `dynamic = 'force-dynamic'` porque contém dados autenticados dependentes da requisição.

`docs/DESIGN_VISUAL.md` foi revisado e continua coerente com o produto: acervo pessoal, profundidade editorial, azul-marinho/azul de ação, ausência de métricas fictícias e visibilidade de autoria/proveniência.

---

## 20. Resultado da auditoria completa

### Confirmado correto

- repositório canônico identificado;
- Supabase correto e isolado do projeto anterior;
- Vercel novo correto e ligado ao repo canônico;
- produção `READY` e site respondendo;
- proteção de rotas sem sessão funcionando;
- nenhum cluster de erro de runtime encontrado;
- schemas internos fechados;
- Data API limitada a `aplicacao`;
- RLS e policies coerentes;
- RPCs com privilégios mínimos;
- Storage privado e segregado por usuário;
- constraints existentes validadas;
- extensões necessárias instaladas;
- migrations `0001`–`0016` registradas no Supabase e versionadas no GitHub;
- FKs atualmente detectadas pelo advisor possuem índices adequados;
- pacote de dependências possui lockfile reproduzível.

### Erros/inconsistências encontrados e corrigidos

- README dizia que Vercel não existia → corrigido;
- `docs/ESTADO_ATUAL.md` estava na Fase 0 → corrigido;
- timestamps dos arquivos de migration não batiam com o Supabase → corrigidos;
- prefixo de migration duplicado → corrigido;
- Pipeline/Taxonomia não tinham versões ativas → `0010`;
- FKs sem índices → `0009`, `0012` e `0014`;
- retomada TUS podia misturar caminhos/UUIDs → corrigida;
- SHA-256 era armazenado, mas não havia deduplicação efetiva → `0016`;
- evidência podia, em tese, cruzar documentos do mesmo usuário → `0015`;
- estado `ativo` não exigia `publicado_em` → `0015`;
- CI/Vercel podiam usar majors Node diferentes → Node 22.x fixado;
- ausência de lockfile → corrigida;
- `npm install` não determinístico no CI → `npm ci`;
- ESLint 10 incompatível → pin compatível em 9.39.5;
- rotas públicas do Proxy eram reconhecidas por prefixo amplo → endurecido;
- `.gitignore` não bloqueava todo `.env*` → endurecido;
- Documento Processado, hierarquia, vetores, elementos, evidências e grafo agora existem conforme o Dicionário.

### Pendências externas / de segurança

- repositório GitHub público: recomendado torná-lo privado;
- ruleset/branch protection da `main`: precisa confirmação administrativa;
- Site URL/Redirect URLs/template SSR do Supabase Auth: precisa confirmação no Dashboard;
- **Leaked Password Protection**: habilitar no Supabase Auth se o plano permitir;
- OpenAI: rotacionar a chave exposta antes de ativar IA.

---

## 21. Próxima etapa de construção

A fundação de dados do Pipeline está pronta. O próximo bloco deixa de ser apenas schema e passa a ser **execução real do processamento documental**:

```text
arquivo original privado
  ↓
validação + recalculo de hash no servidor
  ↓
extração de texto
  ↓
normalização
  ↓
identificação de estrutura editorial
  ↓
seções hierárquicas
  ↓
fragmentos contextualizados
  ↓
sínteses
  ↓
elementos + evidências
  ↓
classificação taxonômica
  ↓
embeddings
  ↓
relações
  ↓
validação
  ↓
publicação atômica do Documento Processado
```

Cada estágio deverá usar `processamento.etapas_execucao`, chave de idempotência, retries controlados, observabilidade e publicação candidata → ativa somente após validação.

Como `service_role` não recebe acesso direto aos schemas internos, o workflow deverá usar **RPCs server-only em `aplicacao`** para executar operações internas com privilégio mínimo.

A ativação da IA só começará depois de a chave OpenAI ser rotacionada e armazenada diretamente no ambiente servidor.

---

## 22. Ordem de construção daqui para frente

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Sistema | concluído |
| Taxonomia — estrutura/versionamento | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Vercel Production | concluído |
| Pipeline — modelo de dados completo | **concluído no Supabase; PR #7 em validação** |
| Pipeline — workflow real de processamento | próxima etapa |
| Recuperação híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações/segurança/otimização | contínuo |

---

## 23. Histórico resumido

### 16/09/2026 — Fundação

Next.js/React/TypeScript, CI inicial, `0001_fundacao`, schemas e extensões.

### 16/09/2026 — Sistema e Taxonomia

`0002_sistema`, `0003_taxonomia`, RLS/privilégios, PRs #2 e #3.

### 16/09/2026 — Biblioteca e Storage

`0004_biblioteca`, `0005_indice_fk_biblioteca`, `0006_storage_biblioteca`, autoria separada de participação no Cérebro e originais privados; PRs #4 e #5.

### 16/09/2026 — Auth e upload real

`0007_api_aplicacao_biblioteca`, `@supabase/ssr`, login/cadastro/logout, TUS, SHA-256, Biblioteca real e renderização dinâmica; PR #6.

### 16/09/2026 — Vercel e auditoria

Projeto `cerebro-autoral` confirmado, site verificado, GitHub/Supabase/Vercel auditados, migrations alinhadas e build tornado reproduzível.

### 16/09/2026 — Pipeline Documental

`0008`–`0016`: execução/idempotência, versões base, Documento Processado, hierarquia editorial, FTS, sínteses, vetores HNSW 1536, elementos, evidências, grafo intelectual, integração com Taxonomia, publicação/proveniência endurecidas e deduplicação real por hash.

---

## 24. Regra permanente deste README

Este arquivo deve sempre permitir que uma pessoa não técnica descubra:

- o que é o aplicativo;
- o que já foi construído;
- o que realmente está funcionando;
- o que está somente em branch;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais erros foram encontrados/corrigidos;
- quais alertas de segurança continuam abertos;
- quais decisões arquiteturais estão vigentes;
- como segurança, autoria e proveniência são protegidas;
- quais configurações externas continuam pendentes;
- qual é a próxima etapa;
- o que ainda falta para concluir o produto.
