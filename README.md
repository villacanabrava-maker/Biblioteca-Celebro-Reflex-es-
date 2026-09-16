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

## 3. Fontes de verdade do projeto

A implementação deve permanecer coerente com os documentos canônicos fornecidos pelo proprietário do produto:

- Arquitetura Técnica de Implementação — Cérebro Autoral;
- Plano de Construção — Projeto Novo do Cérebro Autoral;
- Dicionário Mestre de Dados e Taxonomia v1.0;
- Carta de atuação do Engenheiro Principal / Produto.

No repositório, `README.md` acompanha o estado operacional; `docs/DECISOES.md` registra decisões; `docs/ESTADO_ATUAL.md` resume o momento atual; migrations registram a evolução real do banco.

---

## 4. Infraestrutura canônica confirmada

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Branch principal: `main`.
Branch de trabalho atual: `feature/processamento`.

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

**Auditoria 16/09/2026:** o repositório está atualmente `public`. Nenhum segredo OpenAI/Supabase conhecido foi encontrado nas buscas de segurança realizadas, mas a visibilidade pública expõe código, arquitetura e documentação intelectual. A decisão recomendada é torná-lo privado antes de uso produtivo com conteúdo real. O conector GitHub desta sessão não possui ação administrativa para alterar a visibilidade.

Não existe ruleset registrado no repositório segundo a API acessível. A leitura de branch protection exige permissão administrativa que o conector atual não possui; portanto proteção obrigatória da `main` continua como item de infraestrutura a confirmar/configurar.

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

Ligação confirmada:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Domínio principal verificado:

```text
https://cerebro-autoral.vercel.app
```

O deploy de produção atual está `READY`, originado da `main`. A página pública responde HTTP 200, mostra o login real e rotas protegidas como `/biblioteca` redirecionam para login sem sessão. A inspeção de runtime dos últimos 7 dias não encontrou clusters de erro.

---

## 5. Stack oficial atual

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- App Router;
- Node.js **`22.x`** fixado no `package.json` para alinhar CI e Vercel.

### Supabase

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- PostgreSQL;
- Auth;
- Storage;
- RLS;
- Full Text Search;
- pgvector.

### Upload e integridade

- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- TUS com chunks de 6 MB;
- SHA-256 incremental.

### Inteligência artificial

- `openai` `7.15.0`;
- Zod `4.6.5`;
- modelos centralizados por configuração;
- Structured Outputs + validação antes da persistência.

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
| Supabase Auth SSR | concluído / `main` |
| Upload real + SHA-256 + TUS | concluído / `main`; correção de retomada em `feature/processamento` |
| Biblioteca com dados reais | concluída / `main` |
| Vercel canônico | **concluído e verificado online** |
| Pipeline — execuções/idempotência | migrations `0008` e `0009` aplicadas / branch em andamento |
| Versões base Pipeline/Taxonomia | migration `0010` aplicada |
| Documento Processado/hierarquia | próxima implementação |
| Cérebro Autoral | pendente |
| Motor de Reflexões | pendente |
| OpenAI operacional | bloqueada até rotação segura da chave exposta no chat |

---

## 7. Migrations aplicadas — histórico oficial

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

Regra permanente: migration aplicada nunca é reescrita para esconder correção. Correções de banco geram migration nova. Renomear arquivo para coincidir com a versão **já registrada** no Supabase foi uma correção somente de reprodutibilidade do repositório e não reexecutou SQL.

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

Extensões confirmadas no banco:

- `vector` `0.8.2`;
- `unaccent` `1.1`;
- `pg_trgm` `1.6`.

---

## 9. Auditoria de segurança do Supabase

Verificado no banco real:

- `authenticated` possui `USAGE` somente no schema público controlado `aplicacao`;
- `authenticated` não possui `USAGE` em `biblioteca`, `processamento`, `sistema`, `taxonomia`, `cerebro_autoral`, `reflexoes` ou `auditoria`;
- `anon` não possui `USAGE` nos schemas internos;
- RLS está ativo nas tabelas pessoais já implementadas;
- `biblioteca.obras` e `biblioteca.versoes_obras` possuem 4 policies cada;
- `processamento.execucoes` e `processamento.etapas_execucao` possuem 4 policies cada;
- `sistema.configuracoes_usuario` possui 4 policies;
- `taxonomia.classificacoes_elementos` possui 4 policies;
- `storage.objects` possui 4 policies específicas para `originais-biblioteca`;
- não há constraints criadas como `NOT VALID` pendentes de validação;
- advisor de segurança permanece sem alertas após as migrations do Pipeline.

A Data API do papel `authenticator` está explicitamente restrita a:

```text
public, graphql_public, aplicacao
```

---

## 10. Schema `sistema`

Implementado:

- `sistema.modelos_ia`;
- `sistema.prompts`;
- `sistema.versoes_prompts`;
- `sistema.versoes_pipeline`;
- `sistema.configuracoes_usuario`.

A migration `0010` criou a versão técnica ativa `Pipeline 1.0`, necessária para que cada execução documental possa registrar exatamente qual pipeline a produziu.

`modelos_ia` continua vazio propositalmente: os documentos canônicos deixam a escolha exata de modelo por função deliberadamente aberta. Modelos serão cadastrados quando a camada de IA for ativada e avaliada.

---

## 11. Taxonomia Mestre

Estrutura implementada:

- `taxonomia.versoes`;
- `taxonomia.conceitos`;
- `taxonomia.termos`;
- `taxonomia.relacoes`;
- `taxonomia.classificacoes_elementos`.

Domínios iniciais: `intelectual`, `axiologico`, `reflexivo`, `narrativo`, `entidades`, `temporal`, `retorico`, `linguistico`, `estrutural`, `autoral`.

A migration `0010` criou a versão técnica ativa `Taxonomia 1.0`. Ela **não inventa conceitos**: apenas estabelece a versão referenciável. O vocabulário `taxonomia.conceitos.estado` continua deliberadamente sem CHECK até formalização no Dicionário. A FK de `classificacoes_elementos.elemento_id` será adicionada quando `processamento.elementos` existir.

---

## 12. Biblioteca e autoria

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

Regras já protegidas: `autoral_prioritaria` exige autoria autoral; `externa_influencia` exige autoria externa. A exigência de uma influência ativa no Cérebro será adicionada quando `cerebro_autoral.influencias_externas` existir.

A FK composta `(obra_id, usuario_id)` impede uma versão de um usuário de apontar para obra de outro usuário.

---

## 13. Storage privado

Bucket:

```text
originais-biblioteca
```

Confirmado no banco:

```text
public = false
file_size_limit = null
allowed_mime_types = null
```

Caminho efetivo:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

As policies SELECT/INSERT/UPDATE/DELETE exigem bucket correto e primeiro segmento da pasta igual a `auth.uid()`.

MIME e tamanho máximo permanecem deliberadamente abertos enquanto formatos finais e OCR não estão congelados no Dicionário Mestre.

---

## 14. API segura `aplicacao`

`aplicacao.listar_obras()` e `aplicacao.registrar_obra_arquivo(...)`:

- derivam identidade de `auth.uid()`;
- são `SECURITY DEFINER`;
- usam `search_path = ''`;
- não permitem execução por `anon`;
- permitem somente `authenticated` explicitamente;
- não expõem `biblioteca` diretamente pela Data API.

`registrar_obra_arquivo` valida título, idioma, MIME informado, tamanho, formato SHA-256, caminho exato e existência do objeto no Storage antes de inserir obra + primeira versão atomicamente.

O pipeline deverá recalcular/verificar o SHA-256 do objeto armazenado antes do processamento, para não confiar definitivamente no hash informado pelo navegador.

---

## 15. Supabase Auth SSR

Implementação:

```text
@supabase/ssr
createBrowserClient
createServerClient
cookies
proxy.ts
getClaims()
```

No servidor, autorização usa `supabase.auth.getClaims()`. `getSession()` não é usado como prova de identidade server-side; no navegador ele serve apenas para obter o access token enviado ao Storage, que valida a credencial remotamente.

Login/cadastro/logout estão implementados, assim como `/auth/confirm`.

### Pendente de confirmação manual

O conector atual não expõe as configurações de template/Site URL do Supabase Auth. Portanto ainda precisa ser confirmado no Dashboard que:

```text
Site URL = https://cerebro-autoral.vercel.app
```

e que o template de confirmação usa o fluxo SSR com `token_hash` para `/auth/confirm`.

---

## 16. Upload real — estado após auditoria

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
RPC valida objeto/caminho
  ↓
obra + versão
  ↓
estado recebido
```

Configuração segura atual:

- endpoint direto do Storage;
- retries progressivos durante a operação;
- chunks de 6 MB;
- `uploadDataDuringCreation = true`;
- sem `x-upsert`;
- SHA-256 em blocos;
- compensação tenta remover objeto se o registro da obra falhar.

### Correção de auditoria — retomada entre tentativas

O código anterior chamava `findPreviousUploads()` mesmo criando novos `obraId`/`versaoId` em cada submissão. Isso podia retomar um upload antigo em um caminho com UUIDs anteriores e depois tentar registrar um caminho novo.

A branch `feature/processamento` removeu essa retomada implícita. TUS continua resiliente com retries na operação atual. **Retomada entre reloads/tentativas só será reintroduzida quando os IDs da operação de upload forem persistidos explicitamente.**

---

## 17. Pipeline Documental — fundação implementada

Migrations `0008` e `0009` já estão aplicadas.

### `processamento.execucoes`

Registra execução completa sobre uma versão de obra, com usuário, versão de pipeline, versão de taxonomia, estado, etapa atual, progresso, timestamps e erro seguro.

Estados canônicos:

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

### `processamento.etapas_execucao`

Registra etapas idempotentes/reexecutáveis, com chave de idempotência única, ordem, tentativas, duração e metadados operacionais.

O advisor de performance detectou inicialmente que a FK composta `etapas_execucao → execucoes` não tinha índice cobrindo `(execucao_id, usuario_id)`. A correção foi aplicada em `0009`; o alerta desapareceu.

Próximo subbloco do Pipeline: `documentos_processados`, `secoes`, `fragmentos` e `sinteses`, preservando hierarquia editorial em vez de chunks planos.

---

## 18. OpenAI — estado e segurança

A camada de IA ainda não está ativada operacionalmente.

Será usada apenas via variável server-side:

```text
OPENAI_API_KEY
```

Uma chave foi enviada diretamente no chat durante desenvolvimento. Ela é tratada como **exposta** e não será usada no ambiente real. Antes da ativação da IA, a chave deve ser rotacionada no provedor e a nova chave deve ser cadastrada diretamente no secret do servidor/Vercel, sem voltar ao chat, GitHub ou README.

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

## 19. CI, dependências e reprodutibilidade

A auditoria encontrou divergência entre CI e Vercel: CI usava Node 22, enquanto Vercel executava Node 24 porque `package.json` dizia `>=22`.

Correção em `feature/processamento`:

```text
engines.node = 22.x
packageManager = npm@10.9.8
```

As Actions foram atualizadas para as versões oficiais atuais:

```text
actions/checkout@v7
actions/setup-node@v7
```

O ESLint foi fixado em `10.10.0` em vez de `latest`.

### Lockfile

A auditoria também encontrou ausência de `package-lock.json`. Enquanto isso existir, `npm install` pode resolver árvores diferentes em datas diferentes.

O CI desta branch foi temporariamente configurado para gerar e publicar `package-lock.json` como artifact. Depois de validado, o lockfile será commitado e o workflow passará a usar:

```text
npm ci
```

Essa etapa ainda está em andamento e só será marcada como concluída após CI verde com o lockfile commitado.

---

## 20. Frontend e direção visual

Rotas principais já existentes:

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

`/biblioteca` usa `dynamic = 'force-dynamic'` por conter dados autenticados dependentes da requisição.

`docs/DESIGN_VISUAL.md` foi revisado nesta auditoria e permanece coerente com o produto: acervo pessoal, profundidade editorial, azul-marinho/azul de ação, ausência de métricas fictícias e visibilidade de autoria/proveniência quando relevante.

---

## 21. Resultado da auditoria completa — 16/09/2026

### Confirmado correto

- projeto Supabase correto;
- projeto Vercel novo correto;
- Vercel ligado ao repositório canônico;
- produção `READY` e site respondendo;
- proteção de rotas sem sessão funcionando;
- nenhum cluster de erro de runtime encontrado;
- schemas internos fechados;
- Data API limitada a `aplicacao`;
- RLS e policies coerentes nas tabelas pessoais;
- RPCs seguras e grants mínimos;
- Storage privado e segregado por usuário;
- constraints existentes validadas;
- extensões necessárias instaladas;
- migrations `0001`–`0010` registradas no Supabase.

### Erros/inconsistências encontrados e corrigidos

- README dizia que Vercel não existia → corrigido;
- `docs/ESTADO_ATUAL.md` estava na Fase 0 → será sincronizado neste bloco;
- timestamps dos arquivos de migration não batiam com o histórico do Supabase → renomeados na branch;
- havia dois arquivos com o mesmo prefixo de timestamp → corrigido;
- Pipeline/Taxonomia não tinham versões ativas → `0010` aplicada;
- FK das etapas do pipeline sem índice → `0009` aplicada;
- retomada TUS podia associar upload antigo a UUIDs novos → correção aplicada;
- CI/Vercel usavam majors Node diferentes → Node `22.x` fixado;
- Actions antigas → atualização para v7;
- ESLint por `latest` → versão explícita;
- ausência de lockfile → processo de estabilização em andamento.

### Pendências que exigem ação/decisão fora do código

- repositório GitHub está público; recomendado torná-lo privado;
- ruleset/proteção obrigatória da `main` não pôde ser administrada pelo conector atual;
- confirmar Site URL/Redirect URLs/template de e-mail no Supabase Auth;
- rotacionar a chave OpenAI antes de ativar IA.

---

## 22. Ordem de construção daqui para frente

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Sistema | concluído |
| Taxonomia — estrutura/versionamento | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Vercel Production | concluído |
| Pipeline — execuções/idempotência | concluído |
| Pipeline — Documento Processado/hierarquia | **em seguida** |
| Pipeline — vetores/elementos/evidências/grafo | pendente |
| FK Taxonomia → Elementos | pendente até `processamento.elementos` |
| Recuperação híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações/segurança/otimização | contínuo |

---

## 23. Próximas ações imediatas

1. finalizar lockfile e CI reproduzível desta branch;
2. sincronizar `docs/ESTADO_ATUAL.md` e `docs/DECISOES.md`;
3. abrir PR `feature/processamento` e exigir CI verde;
4. implementar/testar `documentos_processados`, `secoes`, `fragmentos` e `sinteses` em migration nova;
5. rodar advisors após cada DDL;
6. depois criar `vetores`, `elementos`, `evidencias` e `relacoes_elementos`;
7. adicionar a FK adiada da Taxonomia quando `processamento.elementos` existir;
8. atualizar README a cada marco;
9. só ativar OpenAI após rotação segura da chave.

---

## 24. Histórico resumido de marcos

### 16/09/2026 — Fundação

Next.js/React/TypeScript, CI inicial, `0001_fundacao`, oito schemas e extensões.

### 16/09/2026 — Sistema e Taxonomia

`0002_sistema`, `0003_taxonomia`, RLS/privilegios, PRs #2 e #3.

### 16/09/2026 — Biblioteca e Storage

`0004_biblioteca`, `0005_indice_fk_biblioteca`, `0006_storage_biblioteca`, autoria separada de participação no Cérebro, originais privados; PRs #4 e #5.

### 16/09/2026 — Auth e upload real

`0007_api_aplicacao_biblioteca`, `@supabase/ssr`, login/cadastro/logout, TUS, SHA-256, Biblioteca real, correção de renderização dinâmica; PR #6 incorporado.

### 16/09/2026 — Vercel e auditoria estrutural

Projeto `cerebro-autoral` conectado ao repo canônico e publicado. Site/rotas verificadas. Auditoria completa GitHub/Supabase/Vercel iniciada e inconsistências corrigidas.

### 16/09/2026 — Fundação do Pipeline

`0008_processamento_execucoes`, `0009_indice_fk_etapas_execucao` e `0010_seeds_versoes_base` aplicadas. Histórico de migrations do GitHub alinhado ao banco.

---

## 25. Regra permanente deste README

Este arquivo deve sempre permitir que uma pessoa não técnica descubra:

- o que é o aplicativo;
- o que já foi construído;
- o que realmente está funcionando;
- o que está somente em branch;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais erros foram encontrados/corrigidos;
- quais decisões arquiteturais estão vigentes;
- como segurança, autoria e proveniência são protegidas;
- quais configurações externas continuam pendentes;
- qual é a próxima etapa;
- o que ainda falta para concluir o produto.
