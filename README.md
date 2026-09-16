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

- branch oficial: `main`;
- PR #7 — **Fase 2: auditoria completa e modelo de dados do Pipeline** — incorporado por squash merge em 16/09/2026;
- commit de produção da Fase 2: `326286036566ccc46addfc4b071fd224cd1a5c09`.

Fluxo oficial:

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

Projeto oficial:

```text
cerebro-autoral
```

Repositório conectado:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Produção:

```text
https://cerebro-autoral.vercel.app
```

Após o merge do PR #7, o Vercel recebeu exatamente o commit `3262860…`, concluiu o deployment com estado **READY** e atualizou o domínio principal. O domínio responde HTTP 200, apresenta o login real e `/biblioteca` sem sessão continua redirecionando corretamente para o login. A consulta de erros de runtime após o deploy não encontrou erros.

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

## 6. Estado geral — 16/09/2026

| Bloco | Estado real |
|---|---|
| Fundação técnica | concluída / `main` |
| Sistema visual inicial | concluído / `main` |
| Schema `sistema` | concluído / `main` |
| Taxonomia Mestre — estrutura | concluída / `main` |
| Biblioteca — banco | concluída / `main` |
| Storage privado | concluído / `main` |
| API segura `aplicacao` | concluída / `main` |
| Supabase Auth SSR | concluído / `main` |
| Upload real + SHA-256 + TUS | concluído / `main` |
| Deduplicação por hash | concluída / `main` |
| Biblioteca com dados reais | concluída / `main` |
| Vercel canônico | concluído e validado pós-merge |
| Pipeline — execuções/idempotência | concluído / `main` |
| Versões base Pipeline/Taxonomia | concluídas / `main` |
| Documento Processado/hierarquia | concluído / `main` |
| Vetores/elementos/evidências/grafo | concluídos / `main` |
| Integridade de proveniência/publicação | concluída / `main` |
| Workflow real de processamento | **próxima etapa** |
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
- funções internas de trigger não são executáveis pelo navegador;
- não existem constraints pendentes `NOT VALID`;
- advisor de performance não acusa FKs sem índice;
- avisos restantes de performance são `unused_index`, esperados enquanto as tabelas estão vazias.

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

---

## 10. Taxonomia, Biblioteca e API

### Taxonomia

`Taxonomia 1.0` está ativa. A FK que estava adiada desde `0003` foi fechada em `0013`:

```text
classificacoes_elementos (elemento_id, usuario_id)
    → processamento.elementos (id, usuario_id)
```

`0014` adicionou o índice dedicado da FK. O vocabulário de `taxonomia.conceitos.estado` continua sem CHECK até formalização no Dicionário Mestre.

### Biblioteca e Storage

`biblioteca.obras` representa a obra lógica; `biblioteca.versoes_obras` preserva arquivos/versões. O bucket `originais-biblioteca` é privado e usa o caminho:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

### API segura

`aplicacao.listar_obras()` e `aplicacao.registrar_obra_arquivo(...)`:

- derivam identidade de `auth.uid()`;
- são `SECURITY DEFINER`;
- usam `search_path = ''`;
- `anon`/`PUBLIC` não executam;
- `authenticated` recebe somente os grants previstos;
- `biblioteca` não é exposta diretamente pela Data API.

A deduplicação usa lock transacional por usuário + SHA-256, evitando corrida concorrente sem inventar uma constraint `UNIQUE` que o Dicionário não exige.

---

## 11. Auth e upload

Auth SSR usa:

```text
@supabase/ssr
cookies
proxy.ts
getClaims()
```

Rotas públicas do Proxy são limitadas a `/login` e `/auth/*`. O `.gitignore` bloqueia todo `.env*`, exceto `.env.example`.

Upload:

```text
sessão validada
  ↓
UUID obra + UUID versão
  ↓
SHA-256 incremental
  ↓
TUS / Storage privado
  ↓
RPC valida caminho/hash
  ↓
deduplicação transacional
  ↓
obra + versão
```

TUS mantém retries da operação atual. Retomada entre reloads só voltará quando os IDs da operação forem persistentes, evitando associação de fingerprint antigo com UUID novo.

Configurações externas ainda a confirmar no Supabase Dashboard:

- Site URL `https://cerebro-autoral.vercel.app`;
- Redirect URLs de produção/preview quando necessário;
- template de confirmação SSR com `/auth/confirm` + `token_hash`;
- Leaked Password Protection, se o plano permitir.

---

## 12. Pipeline Documental — modelo de dados concluído

### Execução e idempotência

- `processamento.execucoes`;
- `processamento.etapas_execucao`.

Cada etapa poderá registrar chave de idempotência, ordem, tentativas, duração, estado e metadados operacionais.

### Documento Processado e hierarquia

- `processamento.documentos_processados`;
- `processamento.secoes`;
- `processamento.fragmentos`;
- `processamento.sinteses`.

A estrutura preserva obra → parte → capítulo → seção → fragmento. `fragmentos.vetor_textual` é gerado de `conteudo_contextualizado` e possui índice GIN.

### Representação intelectual

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

Elementos possuem tipo controlado, importância/confiança 0–1, revisão e proveniência de modelo/prompt. Evidências só podem apontar para fragmentos do mesmo Documento Processado. Relações podem conectar elementos de documentos diferentes do mesmo usuário.

Um Documento Processado `ativo` exige `publicado_em` e existe no máximo um ativo por usuário/obra.

---

## 13. OpenAI — estado e segurança

A IA ainda não está ativada operacionalmente.

Variável permitida:

```text
OPENAI_API_KEY
```

A chave enviada anteriormente no chat é tratada como **exposta** e não será usada. Antes de ativar IA, deve ser rotacionada no provedor e a nova chave configurada diretamente no secret do servidor/Vercel, sem voltar ao chat ou GitHub.

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

## 14. CI e reprodutibilidade

Estado confirmado da Fase 2:

```text
Node 22.x
package-lock.json versionado
npm ci
lint verde
TypeScript verde
build verde
contents: read
```

O CI final do PR #7 passou no mesmo head incorporado à `main`. Depois do merge, o Vercel também construiu o squash commit com sucesso.

---

## 15. Resultado da auditoria completa

### Corrigido e incorporado à `main`

- Vercel canônico confirmado;
- documentação desatualizada corrigida;
- migrations alinhadas ao histórico real do Supabase;
- Pipeline/Taxonomia base ativados;
- FKs sem índice corrigidas;
- retomada TUS insegura removida;
- deduplicação SHA-256 implementada;
- proveniência de evidências endurecida;
- publicação ativa endurecida;
- Node/CI/Vercel alinhados;
- lockfile e `npm ci` adicionados;
- ESLint fixado em versão compatível;
- Proxy e `.gitignore` endurecidos;
- modelo de dados completo do Pipeline criado até `0016`;
- Vercel revalidado após o merge sem erros de runtime.

### Pendências externas / segurança

- tornar o repositório GitHub privado antes de conteúdo intelectual real;
- configurar ruleset/branch protection da `main`;
- confirmar Site URL/Redirect URLs/template SSR do Supabase Auth;
- ativar Leaked Password Protection se o plano permitir;
- rotacionar a chave OpenAI antes de ativar IA.

---

## 16. Próxima etapa de construção

A próxima etapa é **executar o Pipeline de verdade**, sem abrir schemas internos:

```text
arquivo original privado
  ↓
validação + recálculo do hash no servidor
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

O backend utilizará RPCs server-only em `aplicacao`, concedidas apenas ao backend, mantendo `processamento` e demais schemas internos fora da Data API.

A ativação da IA só começará depois da rotação segura da chave e do registro versionado de modelos/prompts.

---

## 17. Ordem de construção daqui para frente

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Sistema | concluído |
| Taxonomia — estrutura/versionamento | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Vercel Production | concluído |
| Pipeline — modelo de dados | **concluído em `main` e produção** |
| Pipeline — workflow real de processamento | **próxima etapa** |
| Recuperação híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações/segurança/otimização | contínuo |

---

## 18. Histórico resumido

### 16/09/2026 — Fundação

Next.js/React/TypeScript, CI inicial, `0001_fundacao`, schemas e extensões.

### 16/09/2026 — Sistema e Taxonomia

`0002_sistema`, `0003_taxonomia`, RLS/privilégios, PRs #2 e #3.

### 16/09/2026 — Biblioteca e Storage

`0004`–`0006`, autoria separada de participação no Cérebro e originais privados; PRs #4 e #5.

### 16/09/2026 — Auth e upload real

`0007`, Auth SSR, login/cadastro/logout, TUS, SHA-256 e Biblioteca real; PR #6.

### 16/09/2026 — Auditoria e Pipeline Documental

PR #7 incorporado: `0008`–`0016`, execução/idempotência, versões base, Documento Processado, hierarquia, FTS, sínteses, vetores HNSW 1536, elementos, evidências, grafo, integração com Taxonomia, publicação/proveniência endurecidas e deduplicação real por hash. Deploy Vercel pós-merge validado como READY.

---

## 19. Regra permanente deste README

Este arquivo deve sempre permitir que uma pessoa não técnica descubra:

- o que é o aplicativo;
- o que já foi construído;
- o que realmente está funcionando;
- o que está somente em desenvolvimento;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais erros foram encontrados/corrigidos;
- quais alertas de segurança continuam abertos;
- quais decisões arquiteturais estão vigentes;
- como segurança, autoria e proveniência são protegidas;
- quais configurações externas continuam pendentes;
- qual é a próxima etapa;
- o que ainda falta para concluir o produto.
