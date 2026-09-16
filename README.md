# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências e proveniência e utilizar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre do projeto.** Toda mudança relevante de arquitetura, banco, interface, integração, teste, deploy ou segurança deve atualizar este arquivo no mesmo ciclo de desenvolvimento.

---

## 1. Objetivo do produto

O principal ativo do aplicativo é o **Cérebro Autoral**.

Ele deverá representar, de forma estruturada, versionada e auditável:

- metodologia de pensamento;
- metodologia de interpretação;
- metodologia de associação;
- metodologia argumentativa;
- metodologia de escrita;
- metodologia de revisão;
- arquitetura narrativa;
- arquitetura de parágrafo;
- formas de abertura, transição e conclusão;
- recursos retóricos;
- identidade linguística;
- relação entre experiência e conceito;
- padrões de tensão e síntese;
- universo conceitual;
- evolução autoral.

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

Aprovar uma reflexão não significa incorporá-la automaticamente ao Cérebro. Uma nova produção só poderá virar evidência autoral por uma ação explícita e deverá percorrer novamente Biblioteca → Processamento → Documento Processado → Cérebro.

---

## 3. Infraestrutura canônica

### GitHub

Repositório oficial:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Fluxo de desenvolvimento:

```text
main
  ↑
feature/<etapa>
  ↑
Pull Request + CI
```

### Supabase

Projeto oficial:

```text
xzkzdaxxmizcgfkjgzoq
```

Usado para:

- PostgreSQL;
- Supabase Auth;
- Storage privado;
- RLS;
- Data API controlada;
- Full Text Search;
- pgvector futuramente no retrieval.

### Vercel

**Status atual: configuração externa pendente.**

A inspeção da conta Vercel conectada mostrou projetos antigos, mas **nenhum projeto está ligado ao repositório canônico novo `Biblioteca-Celebro-Reflex-es-`**.

A arquitetura exige um projeto Vercel exclusivo para este aplicativo. O conector disponível nesta sessão permite inspecionar e fazer deploy de projetos existentes, mas não oferece criação de projeto nem gerenciamento de variáveis de ambiente. Portanto essa parte não será marcada como concluída antes de realmente existir.

Projeto recomendado a criar no Vercel:

```text
cerebro-autoral
```

Repositório a importar:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Variáveis públicas necessárias no Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

O Supabase oficial já possui URL e uma publishable key moderna ativa. O valor da chave não é gravado neste README.

---

## 4. Stack oficial

### Aplicação

- Next.js `16.3.5`
- React `19.3.0`
- TypeScript `6.0.3`
- App Router

### Supabase

- `@supabase/supabase-js` `2.116.0`
- `@supabase/ssr` `0.12.7`
- PostgreSQL
- Auth
- Storage
- RLS
- Full Text Search
- pgvector

### Upload e integridade

- `tus-js-client` `4.3.1`
- `hash-wasm` `4.12.0`
- upload resumível TUS;
- hash SHA-256 incremental.

### Inteligência artificial

- `openai` `7.15.0`
- Zod `4.6.5`
- modelos centralizados por configuração;
- Structured Outputs + validação antes da persistência.

---

## 5. Estado geral — 16/09/2026

| Bloco | Status |
|---|---|
| Fundação técnica | concluída / `main` |
| Sistema visual inicial | concluído / `main` |
| Schema `sistema` | concluído / `main` |
| Taxonomia Mestre | concluída / `main` |
| Biblioteca — banco | concluída / `main` |
| Storage privado | concluído / `main` |
| API segura `aplicacao` | aplicada no Supabase / PR #6 CI verde |
| Supabase Auth SSR | implementado / PR #6 CI verde |
| Upload real e resumível | implementado / PR #6 CI verde |
| Biblioteca lendo dados reais | implementada / PR #6 CI verde |
| Vercel canônico | **pendente de criação/conexão externa** |
| Confirmação de e-mail Auth | código pronto / template do Supabase pendente |
| Pipeline documental | próximo grande bloco após deploy/teste do upload |
| Cérebro Autoral | pendente |
| Motor de Reflexões | pendente |
| OpenAI operacional | pendente de rotação segura da chave |

Branch atual:

```text
feature/auth-upload-biblioteca
```

Pull Request atual:

```text
#6 — Fase 1: ativar Auth SSR e upload real da Biblioteca
```

---

## 6. Migrations aplicadas no Supabase oficial

| Ordem | Migration | Estado | Finalidade |
|---|---|---|---|
| 0001 | `0001_fundacao` | aplicada | extensões e oito schemas canônicos |
| 0002 | `0002_sistema` | aplicada | modelos, prompts, pipeline e preferências |
| 0003 | `0003_taxonomia` | aplicada | Taxonomia Mestre versionada |
| 0004 | `0004_biblioteca` | aplicada | obras e versões físicas |
| 0005 | `0005_indice_fk_biblioteca` | aplicada | índice da FK composta da Biblioteca |
| 0006 | `0006_storage_biblioteca` | aplicada | bucket privado e policies de Storage |
| 0007 | `0007_api_aplicacao_biblioteca` | aplicada | API controlada para listar e registrar obras |

Nenhuma migration já aplicada é reescrita para esconder uma correção posterior. Mudanças novas geram migrations novas.

---

## 7. Schemas canônicos

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

Schemas nativos do Supabase, como `auth` e `storage`, continuam nativos.

### Extensões confirmadas

- `vector`
- `unaccent`
- `pg_trgm`

---

## 8. Schema `sistema`

Implementado:

- `sistema.modelos_ia`;
- `sistema.prompts`;
- `sistema.versoes_prompts`;
- `sistema.versoes_pipeline`;
- `sistema.configuracoes_usuario`.

As configurações pessoais têm RLS. Segredos são proibidos em `configuracoes_usuario`.

---

## 9. Taxonomia Mestre

Implementado:

- `taxonomia.versoes`;
- `taxonomia.conceitos`;
- `taxonomia.termos`;
- `taxonomia.relacoes`;
- `taxonomia.classificacoes_elementos`.

Domínios iniciais:

```text
intelectual
axiologico
reflexivo
narrativo
entidades
temporal
retorico
linguistico
estrutural
autoral
```

A IA deverá procurar, comparar e normalizar conceitos existentes antes de propor conceitos novos.

O Dicionário Mestre ainda não enumera o vocabulário de `taxonomia.conceitos.estado`; por isso a coluna existe sem um CHECK inventado. A FK de `classificacoes_elementos.elemento_id` será adicionada quando `processamento.elementos` existir.

---

## 10. Biblioteca — banco

### `biblioteca.obras`

Representa a obra intelectual lógica, independentemente do arquivo físico.

### Autoria

```text
autoral
externa
```

### Participação no Cérebro

```text
autoral_prioritaria
externa_referencia
externa_influencia
excluida_cerebro
```

Regras já protegidas no banco:

- `autoral_prioritaria` exige `autoria = autoral`;
- `externa_influencia` exige `autoria = externa`;
- a exigência de influência externa ativa será adicionada quando a tabela correspondente do Cérebro existir.

### Tipos de obra

```text
livro
capitulo
artigo
carta
reflexao
ensaio
relato
mensagem
anotacao
transcricao
documento_profissional
material_metodologico
referencia_externa
outro
```

### `biblioteca.versoes_obras`

Preserva cada arquivo físico e cada versão sem destruir versões anteriores.

Armazena nome original, caminho privado, MIME, extensão, tamanho, SHA-256, páginas, palavras, estado de processamento e número da versão.

A FK composta `(obra_id, usuario_id)` impede uma versão de um usuário de apontar para obra de outro usuário.

---

## 11. Storage privado

Bucket canônico:

```text
originais-biblioteca
```

Estado confirmado:

```text
public = false
```

Caminho efetivo:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

Existem quatro policies de `storage.objects`: SELECT, INSERT, UPDATE e DELETE.

Todas exigem simultaneamente:

```text
bucket_id = originais-biblioteca
primeiro segmento da pasta = auth.uid()
```

MIME e tamanho máximo ainda não foram congelados porque o conjunto final de formatos e a estratégia de OCR continuam deliberadamente abertos no Dicionário Mestre.

---

## 12. API segura em `aplicacao`

A migration `0007_api_aplicacao_biblioteca` controla a fronteira da Data API:

```text
public
graphql_public
aplicacao
```

`biblioteca` continua **fora** da Data API.

Verificação atual no banco:

- `authenticated` possui `USAGE` em `aplicacao`;
- `authenticated` **não** possui `USAGE` em `biblioteca`;
- `anon` não executa as RPCs;
- `authenticated` executa somente as funções liberadas.

### `aplicacao.listar_obras()`

- deriva o usuário de `auth.uid()`;
- retorna somente obras do usuário autenticado;
- ignora obras logicamente excluídas;
- inclui a versão física mais recente.

### `aplicacao.registrar_obra_arquivo(...)`

- não recebe `usuario_id` do navegador;
- deriva identidade de `auth.uid()`;
- valida título, idioma, MIME, tamanho e formato SHA-256;
- valida que o caminho pertence ao usuário, obra e versão informados;
- exige que o arquivo já exista no bucket privado;
- registra obra + primeira versão na mesma transação do PostgreSQL;
- normaliza título com `unaccent`;
- inicia a versão como `recebido`.

As funções são `SECURITY DEFINER` com `search_path = ''` e grants explícitos.

---

## 13. Supabase Auth SSR

Implementação atual usa o padrão SSR moderno do Supabase para Next.js:

```text
@supabase/ssr
createBrowserClient
createServerClient
cookies
proxy.ts
getClaims()
```

Arquivos:

```text
src/infraestrutura/supabase/client.ts
src/infraestrutura/supabase/server.ts
src/infraestrutura/supabase/proxy.ts
src/proxy.ts
```

### Regra de autorização

No servidor, identidade é validada com:

```text
supabase.auth.getClaims()
```

`getSession()` não é usado como fonte de autorização no servidor.

O fluxo TUS no navegador usa a sessão somente para obter o access token que será reenviado ao Storage, que valida o token no servidor.

### Login implementado

- entrar com e-mail e senha;
- criar conta;
- confirmação SSR por `/auth/confirm`;
- logout por `POST /auth/signout`;
- rotas protegidas via Proxy.

### Configuração externa ainda pendente no Supabase Auth

Para confirmação SSR por e-mail, o template do e-mail do Supabase precisa apontar para:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Também será necessário definir `Site URL` e Redirect URLs com o domínio definitivo do novo projeto Vercel.

O conector Supabase disponível nesta sessão não oferece edição dessa configuração de Auth; portanto esse item permanece explicitamente pendente.

---

## 14. Upload real da Biblioteca

O formulário em:

```text
/biblioteca/adicionar
```

agora implementa um fluxo real.

### Sequência

```text
usuário autenticado
   ↓
seleciona arquivo
   ↓
validação básica
   ↓
UUID da obra + UUID da versão
   ↓
SHA-256 incremental
   ↓
upload TUS resumível para Storage privado
   ↓
RPC segura confirma que o objeto existe
   ↓
obra + versão registradas
   ↓
estado = recebido
```

### Upload resumível

Configuração atual:

- endpoint direto do Storage;
- retries progressivos;
- retomada de upload interrompido;
- `uploadDataDuringCreation = true`;
- remoção do fingerprint após sucesso;
- chunks de exatamente 6 MB;
- nenhum `x-upsert`, portanto originais não são sobrescritos silenciosamente.

### SHA-256

O arquivo é processado em blocos para não carregar um livro grande inteiro na memória.

O hash será usado para integridade, deduplicação futura e rastreabilidade. O pipeline documental poderá recalcular o hash armazenado como defesa adicional.

### Compensação de falha

Se o upload terminar mas a RPC de registro falhar, o cliente tenta excluir o objeto recém-enviado para evitar arquivo órfão.

---

## 15. Biblioteca lendo dados reais

A rota:

```text
/biblioteca
```

consulta:

```text
aplicacao.listar_obras()
```

A tela apresenta dados reais quando existirem: título, código, tipo, autoria, participação no Cérebro, idioma, versão atual, arquivo original e estado de processamento.

A busca continua visualmente desabilitada porque retrieval e filtros reais ainda não foram implementados. O aplicativo não apresenta um controle falso como se já funcionasse.

### Regra de renderização

`/biblioteca` é explicitamente:

```text
dynamic = force-dynamic
```

porque o conteúdo é pessoal, autenticado e depende dos cookies da requisição. Ele não deve ser pré-renderizado estaticamente nem reutilizado entre usuários.

---

## 16. Variáveis de ambiente

Arquivo de referência:

```text
.env.example
```

### Públicas

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

### Somente servidor

```text
SUPABASE_SECRET_KEY
OPENAI_API_KEY
```

O fluxo normal do usuário não usa `SUPABASE_SECRET_KEY` no navegador. Nenhuma variável secreta pode possuir prefixo `NEXT_PUBLIC_`.

---

## 17. OpenAI — estado atual

A camada de IA ainda não está ativada operacionalmente.

A aplicação usará:

```text
OPENAI_API_KEY
```

somente no servidor.

Uma chave de projeto foi fornecida diretamente na conversa de desenvolvimento em 16/09/2026. Por segurança:

- o valor não foi gravado no GitHub;
- o valor não foi gravado no README;
- o valor não foi inserido no frontend;
- o valor não foi configurado no deploy;
- essa chave deve ser **rotacionada antes do uso real**.

Depois da rotação, a nova chave deverá ser cadastrada diretamente como secret do ambiente servidor, nunca enviada novamente pelo chat.

Modelos permanecerão centralizados por configuração:

```text
MODELO_IA_EXTRACAO
MODELO_IA_ANALISE
MODELO_IA_CEREBRO
MODELO_IA_REDACAO
MODELO_IA_AUDITORIA
MODELO_IA_EMBEDDING
```

---

## 18. Segurança aplicada

Princípios já implementados ou formalizados:

- schemas internos fechados;
- Data API controlada por `aplicacao`;
- RLS em dados pessoais;
- isolamento por `usuario_id`;
- Storage privado;
- caminho do Storage vinculado ao usuário;
- `service_role` nunca no browser;
- secrets nunca no Git;
- Auth SSR por cookies;
- autorização server-side por `getClaims()`;
- RPCs sem `usuario_id` fornecido pelo cliente;
- `SECURITY DEFINER` com `search_path` vazio;
- grants explícitos;
- original nunca sobrescrito silenciosamente;
- documentos externos tratados como **DADO**, não como instrução;
- defesa contra prompt injection prevista no pipeline;
- usuário A não pode acessar dados ou objetos do usuário B.

O advisor de segurança do Supabase permanece sem alertas após a migration `0007`.

---

## 19. Advisors de performance

Um problema real já foi encontrado e corrigido:

- a FK composta da Biblioteca inicialmente não possuía índice específico;
- `0005_indice_fk_biblioteca` foi criada e aplicada;
- o alerta desapareceu.

Os avisos atuais são somente `unused_index` em estruturas recém-criadas e ainda sem carga real.

Esses índices não serão removidos prematuramente. A decisão será baseada em uso real e avaliações de retrieval.

---

## 20. Frontend implementado

Rotas principais:

```text
/
/biblioteca
/biblioteca/adicionar
/cerebro-autoral
/criar-reflexao
/reflexoes
/configuracoes
/login
/auth/confirm
/auth/signout
```

Design atual:

- azul-marinho profundo;
- azul luminoso para ações;
- fundos claros;
- cartões brancos;
- hierarquia editorial;
- títulos serifados;
- corpo moderno;
- sidebar no desktop;
- navegação inferior no mobile.

Documento visual:

```text
docs/DESIGN_VISUAL.md
```

---

## 21. CI e testes

GitHub Actions executa:

- instalação de dependências;
- ESLint;
- TypeScript;
- build Next.js.

### Validação do PR #6

Primeira execução:

```text
Instalação  ✅
Lint        ✅
TypeScript  ✅
Build       ❌
```

O CI detectou que `/biblioteca` estava sendo pré-renderizada sem variáveis de ambiente e sem contexto autenticado. Isso revelou um problema arquitetural: uma página pessoal não deve ser estática.

Correção aplicada:

```text
export const dynamic = 'force-dynamic'
```

Segunda execução:

```text
Instalação  ✅
Lint        ✅
TypeScript  ✅
Build       ✅
```

Esse resultado valida o código de Auth SSR, TUS, hashing, RPCs e a compilação de produção no estado do commit de correção. Após esta atualização final do README, o CI será executado novamente antes do merge.

Cobertura futura planejada:

- testes unitários;
- integração;
- SQL;
- migrations;
- RLS;
- Storage;
- Auth;
- taxonomia;
- outputs de IA;
- retrieval;
- testes de contaminação autoral;
- E2E.

---

## 22. Configurações externas necessárias para colocar este bloco online

### 22.1. Criar projeto Vercel novo

No Vercel, importar:

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

Nome recomendado:

```text
cerebro-autoral
```

### 22.2. Configurar no Vercel

Adicionar em Production, Preview e Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Os valores devem ser obtidos diretamente do projeto Supabase oficial.

A chave publicável pode aparecer no navegador por definição; a segurança continua sendo feita por Auth + RLS + grants + policies.

### 22.3. Configurar Supabase Auth

Depois do primeiro domínio Vercel existir:

- definir Site URL para o domínio oficial;
- adicionar Redirect URLs necessárias;
- ajustar template de confirmação de e-mail para o endpoint `/auth/confirm`.

### 22.4. OpenAI

Não configurar a chave fornecida no chat. Primeiro rotacionar; depois cadastrar a nova `OPENAI_API_KEY` apenas no ambiente servidor.

---

## 23. Ordem de construção atual

| Etapa | Status |
|---|---|
| Fundação técnica | concluída |
| Sistema visual | concluído |
| Schema `sistema` | concluído |
| Taxonomia Mestre | concluída |
| Biblioteca — banco | concluída |
| Storage privado | concluído |
| API segura da Biblioteca | aplicada / PR #6 CI verde |
| Supabase Auth SSR | implementado / PR #6 CI verde |
| Upload real + SHA-256 + TUS | implementado / PR #6 CI verde |
| Biblioteca com dados reais | implementada / PR #6 CI verde |
| Vercel canônico | pendente externo |
| Auth e-mail no ambiente | pendente externo |
| Teste E2E no deploy | pendente do Vercel |
| Pipeline documental | próximo grande bloco |
| Documento Processado | pendente |
| Busca híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas | pendente |
| Recuperação contextual | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações e otimização | pendente |

---

## 24. Próximas ações imediatas

1. executar o CI final após esta atualização do README;
2. incorporar o PR #6 somente se o CI final permanecer verde;
3. criar o novo projeto Vercel ligado ao repositório canônico;
4. configurar as duas variáveis públicas do Supabase;
5. configurar Site URL, Redirect URLs e template de confirmação no Supabase Auth;
6. executar teste real de cadastro, login, logout e upload no deploy;
7. registrar os resultados neste README;
8. iniciar o Pipeline Documental;
9. manter OpenAI desativada até rotação da chave.

---

## 25. Histórico de marcos

### 16/09/2026 — Fundação

- Next.js/React/TypeScript;
- sistema visual inicial;
- CI;
- `0001_fundacao`;
- oito schemas canônicos;
- extensões de busca e vetor.

### 16/09/2026 — Sistema

- `0002_sistema`;
- modelos/prompts/pipeline/configurações;
- RLS;
- PR #2 integrado;
- README transformado em painel mestre.

### 16/09/2026 — Taxonomia

- `0003_taxonomia`;
- cinco tabelas taxonômicas;
- vocabulários controlados;
- RLS;
- PR #3 integrado.

### 16/09/2026 — Biblioteca

- `0004_biblioteca`;
- obras e versões;
- autoria separada de participação no Cérebro;
- FK composta multiusuário;
- FTS inicial;
- RLS;
- `0005_indice_fk_biblioteca`;
- PR #4 integrado.

### 16/09/2026 — Storage

- `0006_storage_biblioteca`;
- bucket privado;
- policies de objeto por usuário;
- PR #5 integrado.

### 16/09/2026 — Auth + upload real

- `0007_api_aplicacao_biblioteca` aplicada;
- Data API limitada a `aplicacao` para o domínio da Biblioteca;
- RPCs seguras para listar e registrar obras;
- `@supabase/ssr` integrado;
- Proxy de autenticação;
- login/cadastro/logout implementados;
- confirmação SSR implementada;
- upload resumível TUS implementado;
- SHA-256 incremental implementado;
- Biblioteca conectada a dados reais;
- CI detectou prerender indevido da Biblioteca;
- `/biblioteca` corrigida para renderização dinâmica autenticada;
- segunda execução do CI passou instalação, lint, TypeScript e build;
- Vercel canônico identificado como ainda inexistente;
- README atualizado antes do merge.

---

## 26. Documentação mantida

```text
README.md
.env.example
docs/DESIGN_VISUAL.md
docs/DECISOES.md
supabase/migrations/
```

---

## 27. Regra permanente deste README

O README deve sempre permitir que uma pessoa não técnica descubra:

- o que é o aplicativo;
- o que já foi construído;
- o que está realmente funcionando;
- o que ainda está apenas em branch;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais decisões foram tomadas;
- como segurança e autoria estão protegidas;
- quais configurações externas continuam pendentes;
- qual é a próxima etapa;
- o que ainda falta para concluir o produto.
