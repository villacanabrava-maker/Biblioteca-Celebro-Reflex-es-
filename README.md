# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os quatro documentos fornecidos pelo proprietário continuam sendo a fonte canônica do produto; este arquivo registra o estado técnico real, testes, riscos, decisões e próximos passos.

---

## 1. Visão do produto

O ativo principal é o **Cérebro Autoral**: uma representação estruturada, versionada e auditável da metodologia de pensamento, interpretação, associação, argumentação, escrita, revisão, arquitetura narrativa, recursos retóricos, identidade linguística, relação experiência–conceito, padrões de tensão/síntese, universo conceitual e evolução autoral.

A IA poderá interpretar, organizar, relacionar, recuperar contexto, planejar e redigir. Ela **não** define silenciosamente a identidade do usuário, não converte referência externa em autoria e não transforma uma saída livre de modelo em verdade canônica sem validação.

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

Documentação operacional no repositório:

- `README.md`: painel mestre;
- `docs/DECISOES.md`: ADRs e refinamentos arquiteturais;
- `docs/ESTADO_ATUAL.md`: fotografia técnica da fase atual;
- `docs/DESIGN_VISUAL.md`: direção visual;
- `docs/PIPELINE_DOCUMENTAL.md`: implementação operacional do Pipeline;
- `supabase/migrations/`: história reproduzível do banco;
- `supabase/config.toml` e `supabase/seed.sql`: ambiente Supabase local reproduzível;
- `.github/workflows/ci.yml`: gates automáticos de aplicação, segurança, testes e banco.

Os documentos canônicos completos ainda serão transpostos para arquivos de documentação por domínio, sem substituir ou alterar silenciosamente o conteúdo original.

---

## 3. Infraestrutura oficial

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
main: 7ab215bcf100da829d7ee64c52b58b79e774b31e
Sem PRs abertos; desenvolvimento corrente em claude/confident-cannon-ovdoev
```

- Fase 2 incorporada;
- PR #9 incorporado: orquestração durável e validação de original;
- PR #10 incorporado: identificação de formato, extração determinística e artefatos intermediários;
- PR #11 incorporado: sincronização documental pós-PR #10;
- PR #13 incorporado: normalização determinística/conservadora;
- `identificar_estrutura`, `criar_hierarquia` e `criar_fragmentos` implementados (sinais determinísticos v1) na branch corrente;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false` permanece;
- repositório atualmente **público**, por decisão explícita do proprietário (ADR-029/051 seguem registrando o risco);
- `main` ainda não possui Ruleset/proteção obrigatória;
- nenhum segredo deve existir no código ou histórico.

Antes de corpus intelectual real: tornar o repositório privado e exigir PR + checks obrigatórios + bloqueio de force push em `main`.

### Supabase

```text
Projeto: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Responsabilidades: PostgreSQL, Auth, Storage privado, RLS, Data API controlada, FTS, pgvector e persistência do Pipeline.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

O domínio de produção está `READY`, porém **ainda aponta para o commit `3a3a25f450fa1bdc2b56ec8f91120718de21adc2`**. O atraso de produção após os merges posteriores ocorreu por `build-rate-limit` da conta Vercel, não por erro de compilação confirmado no código. Os Previews mais recentes das branches de processamento estão `READY`.

Como `PROCESSAMENTO_WORKFLOW_ATIVO=false`, nenhuma etapa parcial do Pipeline está exposta aos usuários enquanto a produção não alcança a `main` atual.

O Dashboard da Vercel ainda reporta `nodeVersion = 24.x`, enquanto `package.json` exige Node `22.x`; os builds têm respeitado a engine do projeto. O setting externo deve ser alinhado manualmente para 22.x.

---

## 4. Stack validada em 16/09/2026

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- App Router;
- `proxy.ts`;
- Node `22.x`;
- npm `11.19.1`.

### Supabase e upload

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- Storage privado;
- RLS;
- pgvector/HNSW;
- Supabase CLI `2.117.0` no CI;
- SHA-256 incremental e deduplicação por usuário + hash.

### Pipeline documental

- Vercel Workflow SDK `4.8.9`;
- `unpdf` `1.8.1` para PDF textual em Node/serverless;
- TXT/Markdown por UTF-8 determinístico;
- PDF página a página, sem fan-out irrestrito;
- limites explícitos de tamanho, páginas, pixels, caracteres e tempo;
- PDF sem camada textual retorna `PDF_SEM_TEXTO_EXTRAIVEL` e aguarda estratégia própria de OCR;
- DOCX permanece fora do escopo até validação segura OOXML;
- normalização técnica por Unicode NFC + quebras LF, sem reescrita editorial.

### Supply chain

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

Esses overrides corrigem vulnerabilidades transitivas encontradas no Workflow SDK. `npm audit --omit=dev --audit-level=high` permanece gate obrigatório.

ESLint permanece em `9.39.5` enquanto a combinação atual do ecossistema Next.js/plugin React não suporta de forma segura o ESLint 10 testado anteriormente.

### IA

- `openai` `7.15.0`;
- Zod `4.6.5`;
- chave antiga exposta foi rotacionada;
- chave nova foi configurada diretamente na Vercel, sem entrar no GitHub;
- IA **ainda não é chamada pelo Pipeline**;
- política futura: Responses API, `store: false`, Structured Outputs/JSON Schema, Zod e modelos centralizados por `MODELO_IA_*`.

---

## 5. Estado funcional

| Bloco | Estado |
|---|---|
| Fundação técnica e visual | concluída / `main` |
| `sistema` | concluído |
| Taxonomia Mestre — estrutura/versionamento | concluída |
| Biblioteca/Auth/Storage/API | concluídos |
| Upload TUS + SHA-256 + deduplicação | concluídos |
| Obras reais no banco oficial | **0 — ainda sem corpus** |
| Pipeline — modelo de dados | concluído |
| Documento Processado/hierarquia — schema | concluído |
| Vetores/elementos/evidências/grafo — schema | concluído |
| Orquestração server-only | concluída / flag OFF |
| `validar_arquivo` | implementado e testado |
| `identificar_formato` | implementado e testado |
| `extrair_conteudo` | implementado e testado para PDF textual/TXT/Markdown |
| `normalizar_conteudo` | implementado e testado (PR #13, incorporado à `main`) |
| Artefatos intermediários privados | migrations `0020`/`0021`/`0023` aplicadas |
| Supabase local reproduzível | implementado e testado no CI |
| `identificar_estrutura` | implementado e testado; sinais determinísticos v1 |
| `criar_hierarquia` | implementado e testado; Documento Processado nasce em estado `candidato` |
| `criar_fragmentos` | **implementado e testado; um fragmento por seção, com breadcrumb de contexto** |
| `criar_sinteses` | próxima etapa (primeira cognitiva; exige camada de IA) |
| OpenAI operacional no Pipeline | pendente por arquitetura, não por credencial |
| Cérebro Autoral | pendente |
| Recuperação híbrida | pendente |
| Motor de Reflexões | pendente |

O banco oficial possui atualmente, na última auditoria, `1` usuário Auth e `0` obras, `0` versões de obra, `0` execuções, `0` Documentos Processados, `0` fragmentos e `0` elementos. Há 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia.

---

## 6. Histórico oficial de migrations

Migration aplicada não é reescrita. Toda correção posterior recebe nova migration.

| Versão | Migration | Finalidade |
|---|---|---|
| `20260916183543` | `0001_fundacao` | extensões e schemas canônicos |
| `20260916184023` | `0002_sistema` | modelos, prompts, pipeline e preferências |
| `20260916185118` | `0003_taxonomia` | Taxonomia Mestre |
| `20260916185526` | `0004_biblioteca` | obras e versões físicas |
| `20260916185621` | `0005_indice_fk_biblioteca` | índice FK Biblioteca |
| `20260916190006` | `0006_storage_biblioteca` | bucket privado/policies |
| `20260916190833` | `0007_api_aplicacao_biblioteca` | Data API controlada |
| `20260916192647` | `0008_processamento_execucoes` | execuções/etapas |
| `20260916192731` | `0009_indice_fk_etapas_execucao` | índice FK Pipeline |
| `20260916194638` | `0010_seeds_versoes_base` | Pipeline 1.0 e Taxonomia 1.0 |
| `20260916195547` | `0011_processamento_documentos_hierarquia` | documento/seções/fragmentos/sínteses |
| `20260916195710` | `0012_indices_fk_processamento_hierarquia` | índices FKs |
| `20260916200317` | `0013_processamento_elementos_vetores_grafo` | vetores/elementos/evidências/grafo |
| `20260916200419` | `0014_indice_fk_taxonomia_elementos` | índice FK Taxonomia → Elementos |
| `20260916200813` | `0015_integridade_proveniencia_publicacao` | proveniência/publicação |
| `20260916200935` | `0016_deduplicacao_hash_biblioteca` | deduplicação concorrente |
| `20260916202853` | `0017_api_backend_workflow_processamento` | RPCs server-only + etapas |
| `20260916212133` | `0018_recuperacao_orquestracao_workflow` | reserva/recuperação |
| `20260916221057` | `0019_idempotencia_transicoes_workflow` | locks/transições monotônicas |
| `20260916223016` | `0020_artefatos_intermediarios_processamento` | artefatos parciais privados |
| `20260916225622` | `0021_politica_negacao_artefatos_processamento` | negação explícita a clientes |
| `20260917000231` | `0022_rls_catalogos_sistema_taxonomia` | RLS + leitura autenticada nos catálogos globais |
| `20260917001607` | `0023_artefato_estrutura_identificada` | novo tipo de artefato para sinais de estrutura |
| `20260917002831` | `0024_api_backend_hierarquia_documento` | RPC que cria o Documento Processado e as seções |
| `20260917004841` | `0025_api_backend_fragmentos_documento` | posição em caracteres nas seções + RPCs de fragmentos |
| `20260917004954` | `0026_corrige_contagem_fragmentos` | corrige contagem que só via a última linha inserida |
| `20260917005052` | `0027_corrige_ambiguidade_contagem_fragmentos` | corrige ambiguidade de nome de coluna |

O CI reconstrói um Supabase local do zero com migrations + seed e executa `db reset`, provando reprodutibilidade. Uma falha transitória de container ocorrida no PR #13 foi repetida isoladamente e o mesmo job passou integralmente sem alteração de migration.

---

## 7. Segurança

Auditorias confirmam:

- RLS nas tabelas pessoais;
- Storage privado;
- browser sem acesso direto aos schemas internos;
- RPCs `backend_*` `SECURITY DEFINER` com `search_path = ''`;
- `anon` e `authenticated` não executam RPCs backend;
- artefatos intermediários possuem RLS + policy explícita de negação + grants revogados;
- catálogos globais (`sistema.*`, `taxonomia.*`) têm RLS + leitura restrita a `authenticated` desde `0022`, como segunda camada independente do REVOKE de schema (ADR-057);
- nenhuma FK sem índice apontada pelo advisor;
- `unused_index` é informativo enquanto o banco não tem corpus real;
- advisor de segurança do Supabase, reexecutado em 17/09/2026, não aponta mais nenhum item crítico — resta apenas o aviso externo de Leaked Password Protection.

Pendências externas obrigatórias antes de usuários/corpus reais:

1. **Supabase Auth:** habilitar Leaked Password Protection, se disponível no plano, e confirmar Site URL/Redirects/template SSR.
2. **GitHub:** tornar o repositório privado e criar Ruleset para `main` exigindo PR/checks e bloqueando force push; considerar CodeQL.
3. **Vercel:** alinhar setting Node para 22.x e concluir um novo build de produção da `main` após o limite de builds.
4. **E2E:** usar uma obra controlada de teste antes de ativar `PROCESSAMENTO_WORKFLOW_ATIVO`.

Segredos:

- `.env*` ignorado, exceto `.env.example`;
- `SUPABASE_SECRET_KEY` somente no servidor;
- `OPENAI_API_KEY` somente no ambiente servidor/Vercel;
- nenhuma chave real em README, commits, logs ou frontend.

---

## 8. Biblioteca e original

`biblioteca.obras` representa a obra lógica; `biblioteca.versoes_obras` preserva cada versão física. O original nunca é modificado.

Caminho privado:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

Fluxo:

```text
sessão validada
  ↓
UUID obra + versão
  ↓
SHA-256 incremental
  ↓
TUS / Storage privado
  ↓
RPC valida caminho/hash
  ↓
deduplicação transacional
  ↓
obra + versão física
```

Retomada TUS entre reloads permanece desativada até existir operação persistente com IDs estáveis.

---

## 9. Documento Processado e artefatos intermediários

Estrutura final:

```text
obra → parte → capítulo → seção → fragmento
```

Conteúdo parcial **não** é Documento Processado. `0020` criou `processamento.artefatos_execucao` e o bucket `artefatos-processamento` para `conteudo_extraido` e `conteudo_normalizado`, com hash, tamanho, MIME, metadados e proveniência.

Somente resultado final validado/publicado poderá se tornar Documento Processado ativo e alimentar o Cérebro Autoral.

---

## 10. Pipeline durável

Etapas operacionais v1:

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

### `validar_arquivo`

Recalcula SHA-256/tamanho no servidor a partir do Storage privado. Divergência é falha determinística; falha transitória usa retry do Workflow.

### `identificar_formato`

Allowlist v1:

```text
PDF textual
TXT UTF-8
Markdown UTF-8
```

Combina extensão, MIME e conteúdo. DOCX só entrará com validação OOXML adequada.

### `extrair_conteudo`

- TXT/Markdown: UTF-8 completo;
- PDF: `unpdf`/PDF.js, página a página;
- original é revalidado antes de extrair;
- limites: 20 MiB texto, 50 MiB PDF, 1.000 páginas, 12 milhões de caracteres, ~16 MP por imagem e 90 s para parsing PDF;
- PDF sem texto retorna `PDF_SEM_TEXTO_EXTRAIVEL`;
- resultado vira `conteudo_extraido.json` no Storage privado;
- sucesso avança para `normalizar_conteudo`.

### `normalizar_conteudo`

A etapa não “melhora” a escrita. Ela faz somente transformações técnicas determinísticas:

```text
CRLF/CR → LF
Unicode → NFC
```

NFKC/NFKD não são usados porque normalizações de compatibilidade podem apagar distinções relevantes. Espaços internos e espaços significativos de Markdown são preservados, assim como caixa, pontuação, aspas, travessões e escolhas lexicais.

Antes de criar ou reutilizar o resultado, o sistema verifica bytes, MIME, limites, SHA-256, tamanho, schema e proveniência. A cadeia obrigatória é:

```text
original
  ↓ hash registrado
conteudo_extraido
  ↓ hash do artefato
conteudo_normalizado
```

Em replay, um artefato existente também é baixado e revalidado; se o workflow já avançou, ele é reutilizado sem repetir a transição de estado.

### `identificar_estrutura`

Consome somente `conteudo_normalizado` validado e produz o artefato `estrutura_identificada`, sem materializar `processamento.secoes`. Sinais de alta confiança: cabeçalhos Markdown; marcadores "Parte"/"Capítulo" + algarismo arábico ou numeral romano **maiúsculo**; "Seção"/"Subseção" + algarismo arábico; "Anexo" + algarismo ou letra; "Prefácio"/"Posfácio" isolados. Uma linha inteiramente maiúscula é candidata de baixa confiança, sem tipo atribuído. Marcadores só valem em linhas de até 120 caracteres, para não confundir prosa que apenas menciona a palavra-chave (ex.: "Parte civil...") com um título real. Sem sinal de alta confiança, `possui_indicios_estruturais` fica `false` e nenhuma hierarquia é inventada. Em PDF, cada página é analisada separadamente e cada unidade preserva seu número de página.

### `criar_hierarquia`

Consome somente os sinais de `confianca: alta` de `estrutura_identificada` e materializa `processamento.documentos_processados` (estado `candidato`) + `processamento.secoes`. Constrói a árvore de pai/filho por uma pilha de níveis: Parte contém Capítulo, Capítulo contém Seção, Seção contém Subseção; uma nova Parte fecha a anterior. Anexo, Prefácio e Posfácio nunca viram "pai" de nada — ficam sempre no nível raiz, mesmo aparecendo entre dois capítulos. Cabeçalho Markdown sem tipo definido é convertido por nível (1→capítulo, 2→seção, 3+→subseção). Sem nenhum sinal de alta confiança, cria exatamente uma seção representando o documento inteiro, em vez de inventar divisão. Em PDF, a página final de cada seção é estimada pelo início da próxima seção que a encerra (limitação conhecida: granularidade de página, não de linha). A função de banco (`aplicacao.backend_criar_hierarquia_documento`) é idempotente: uma segunda chamada para a mesma execução retorna o documento já criado, sem duplicar seções.

### `criar_fragmentos`

Cria um fragmento por seção (v1 não subdivide seções grandes em fragmentos menores). O texto de cada fragmento vai do início da própria seção até o início da **próxima seção na ordem de leitura** — não até o `pagina_final`/`indice_fim` de `secoes` (que cobre também as subseções) — para não duplicar o texto de uma subseção tanto no fragmento do capítulo quanto no da própria subseção. Uma seção sem texto extraível, ou cujo texto é exatamente igual ao próprio título (título "solto", sem corpo), não gera fragmento algum. Cada fragmento ganha `conteudo_contextualizado` (trilha de ancestrais + texto próprio) e `quantidade_tokens` (estimativa determinística e provisória por tamanho do texto, a ser recalculada quando `MODELO_IA_*` existir). A função de banco (`aplicacao.backend_criar_fragmentos_documento`) é idempotente e também liga `fragmento_anterior_id`/`fragmento_seguinte_id` em sequência.

A feature flag permanece:

```text
PROCESSAMENTO_WORKFLOW_ATIVO=false
```

---

## 11. CI e testes

### Aplicação

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

A suíte (36 testes) cobre detecção/spoofing, TXT/Markdown, binário disfarçado, DOCX fora do escopo, UTF-8/BOM/vazio, extração real de PDF textual, Unicode NFC, preservação de espaços Markdown, preservação de páginas, validação de proveniência da normalização, `identificar_estrutura` (cabeçalhos Markdown, marcadores numerados versus prosa ambígua, Prefácio/Posfácio isolados versus mencionados em frase, página de PDF preservada, ausência de invenção de estrutura sem evidência, proveniência do artefato), `criar_hierarquia` (seção única sem evidência, capítulos irmãos, cadeia Parte→Capítulo→Seção→Subseção, nova Parte fechando a anterior, Anexo/Prefácio/Posfácio nunca como pai, mapeamento de nível Markdown, página/índice final calculados) e `criar_fragmentos` (fallback sem breadcrumb, seção pai não duplica texto da filha, título sem corpo não gera fragmento, concatenação de páginas em PDF, breadcrumb de ancestrais).

As funções de banco de `criar_hierarquia` e `criar_fragmentos` também foram validadas manualmente contra o Supabase oficial dentro de transações com `ROLLBACK` — nenhum dado permanente foi criado. Esse processo encontrou e corrigiu dois erros reais em `backend_criar_fragmentos_documento` antes de qualquer uso: contagem de fragmentos que só considerava a última linha inserida no laço (`0026`) e uma ambiguidade de nome de coluna que impedia a função de sequer executar (`0027`).

### Banco local

```text
supabase start
supabase db reset
supabase status
supabase stop --no-backup
```

No PR #13, a primeira tentativa de `db reset` falhou por erro genérico do container depois que o ambiente já havia aplicado todas as migrations. O rerun isolado do mesmo job passou integralmente, sem alteração de SQL, confirmando evento transitório do runner.

### Limite atual de E2E

Ainda não há obra real no banco oficial. O caminho positivo `upload → workflow → validar → identificar → extrair → normalizar → identificar estrutura → criar hierarquia` não foi exercitado com corpus. A flag ficará desligada até esse E2E passar.

---

## 12. Próxima etapa: criar sínteses

Com `identificar_estrutura`, `criar_hierarquia` e `criar_fragmentos` implementados, a próxima implementação é `criar_sinteses` — a primeira etapa verdadeiramente cognitiva do Pipeline.

Princípio inicial:

- gerar sínteses hierárquicas (fragmento → seção → capítulo → parte → obra) a partir dos fragmentos já materializados;
- exigirá a camada de IA (OpenAI Responses API, `store: false`, Structured Outputs/JSON Schema, validação Zod), ainda não ativada nesta versão;
- registrar modelo/prompt/versão em cada síntese, para auditoria completa;
- nenhuma síntese parcial alimenta o Cérebro antes de `validar_resultado`/`publicar_documento`.

---

## 13. Ordem macro

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Dicionário/Taxonomia — estrutura | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Pipeline — modelo de dados | concluído |
| Pipeline — workflow | **em construção; até `criar_fragmentos`** |
| Documentos Processados — execução real | pendente do workflow completo |
| Taxonomia inteligente | pendente |
| Recuperação híbrida | pendente |
| Cérebro Autoral | pendente |
| Influências externas deliberadas | pendente |
| Motor de Reflexões | pendente |
| Aprendizado por revisão | pendente |
| Avaliações/segurança/otimização | contínuo |

---

## 14. Regra permanente

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
