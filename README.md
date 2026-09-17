# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os quatro documentos fornecidos pelo proprietário continuam sendo a fonte canônica do produto; este arquivo registra o estado técnico real, testes, riscos, decisões e próximos passos.

---

## 1. Visão do produto

O ativo principal é o **Cérebro Autoral**: uma representação estruturada, versionada e auditável da metodologia de pensamento, interpretação, associação, argumentação, escrita, revisão, arquitetura narrativa, recursos retóricos, identidade linguística, relação experiência–conceito, padrões de tensão/síntese, universo conceitual e evolução autoral.

A IA poderá interpretar, organizar, relacionar, recuperar contexto, planejar e redigir. Ela **não** define silenciosamente a identidade do usuário, não converte referência externa em autoria e não transforma saída livre de modelo em verdade canônica sem validação.

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

Regra permanente: **preservar incerteza é melhor do que inventar estrutura, autoria, relação ou fato sem evidência**.

---

## 2. Fontes de verdade

Documentos canônicos fornecidos pelo proprietário:

- Arquitetura Técnica de Implementação — Cérebro Autoral;
- Plano de Construção — Projeto Novo do Cérebro Autoral;
- Dicionário Mestre de Dados e Taxonomia v1.0;
- Carta de atuação do Engenheiro Principal / Produto.

Documentação operacional no repositório:

- `README.md`: painel mestre operacional;
- `docs/ESTADO_ATUAL.md`: fotografia técnica;
- `docs/DECISOES.md`: ADRs cumulativos;
- `docs/PIPELINE_DOCUMENTAL.md`: implementação do Pipeline;
- `docs/DESIGN_VISUAL.md`: direção visual;
- `supabase/migrations/`: histórico reproduzível do banco;
- `supabase/config.toml` e `supabase/seed.sql`: ambiente local reproduzível;
- `.github/workflows/ci.yml`: gates automáticos de aplicação e banco.

Uma migration já aplicada nunca é reescrita. Uma decisão arquitetural antiga nunca tem seu sentido alterado silenciosamente: refinamentos recebem novo ADR.

---

## 3. Infraestrutura oficial — somente esta

### GitHub

```text
Repositório: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
main auditada como base do handoff: 7ab215bcf100da829d7ee64c52b58b79e774b31e
PR de reconciliação atual: #14
Branch: review/handoff-claude-fase3
Head antes desta atualização documental: 2bbe954c363c0c2acb9ff88ac17b4aade2258eb7
```

O PR #14 foi criado para reconciliar com segurança o trabalho determinístico feito por outro agente com a `main`. Ele inclui `identificar_estrutura`, `criar_hierarquia`, `criar_fragmentos`, migrations `0022`–`0029`, testes e hardening de replay/fragmentação PDF.

O repositório permanece **público por decisão do proprietário**. Não alterar visibilidade sem autorização explícita.

`main` ainda não possui Ruleset obrigatório. Antes de corpus intelectual real, deve-se reavaliar proteção por PR/checks e bloqueio de force push, sem alterar a decisão de visibilidade sem autorização.

### Supabase

```text
Projeto: Biblioteca-Celebro-Reflex-es-
Project ref: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Responsabilidades: PostgreSQL, Auth, Storage privado, RLS, Data API controlada, FTS, pgvector e persistência do Pipeline.

Última auditoria remota desta revisão:

```text
1 usuário Auth de teste
0 obras
0 versões de obra
0 execuções
0 Documentos Processados
0 fragmentos
0 elementos
1 versão ativa de Pipeline
1 versão ativa de Taxonomia
```

Portanto, as migrations novas ainda não transformaram corpus autoral real.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

A produção atual continua ligada à `main`; durante esta auditoria o deployment de produção observado ainda estava no commit `7ab215bcf100da829d7ee64c52b58b79e774b31e`, enquanto o PR #14 possui Preview próprio.

O Preview do commit de correção/testes `98a7828329b0db3303743e831ff3fb258c70708f` está `READY`. Commits intermediários incompletos tiveram Previews com erro durante a correção, mas foram superseded pelo head validado.

O Dashboard da Vercel ainda reporta Node `24.x`, enquanto `package.json` exige Node `22.x`. O CI e a engine do projeto usam Node 22.x; o setting administrativo continua pendência externa.

### Projetos que NÃO pertencem a este aplicativo

Outros projetos GitHub/Supabase/Vercel da conta não fazem parte desta infraestrutura e não devem ser lidos, modificados ou removidos durante o trabalho deste projeto.

---

## 4. Stack técnica atual

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- App Router;
- `proxy.ts`;
- Node `22.x`;
- npm `11.19.1`;
- ESLint `9.39.5` por compatibilidade comprovada com a cadeia atual do Next.js.

### Supabase e upload

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- Supabase CLI `2.117.0` no CI;
- Storage privado;
- RLS;
- pgvector/HNSW;
- SHA-256 incremental e deduplicação por usuário + hash.

### Pipeline documental

- Vercel Workflow SDK `4.8.9`;
- `unpdf` `1.8.1` para PDF textual em Node/serverless;
- TXT/Markdown por UTF-8 determinístico;
- PDF página a página, sem fan-out irrestrito;
- normalização Unicode NFC + LF, sem reescrita editorial;
- artefatos intermediários privados com hash/proveniência;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`.

Formatos processáveis v1:

```text
PDF com camada textual
TXT UTF-8
Markdown UTF-8
```

DOCX permanece fora do escopo até validação segura OOXML. PDF sem camada textual retorna caso específico para futura estratégia de OCR; não é enviado automaticamente à IA.

### Supply chain

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

`npm audit --omit=dev --audit-level=high` é gate obrigatório. Na rodada de CI da auditoria, foram encontradas **0 vulnerabilidades**.

### OpenAI

- pacote `openai` `7.15.0`;
- Zod `4.6.5`;
- chave antiga exposta foi rotacionada;
- chave nova está configurada diretamente na Vercel;
- nenhum segredo foi versionado;
- IA ainda não participa do Pipeline consolidado;
- política aprovada: server-only, Responses API, `store:false`, Structured Outputs/JSON Schema, validação Zod e modelos centralizados por `MODELO_IA_*`.

Qualquer chamada real à API que tenha custo exige confirmação do proprietário antes do primeiro teste pago.

---

## 5. Estado funcional

| Bloco | Estado |
|---|---|
| Fundação técnica e visual | concluída |
| `sistema` | concluído |
| Taxonomia Mestre — estrutura/versionamento | concluída |
| Biblioteca/Auth/Storage/API | concluídos |
| Upload TUS + SHA-256 + deduplicação | concluído |
| Obras reais no banco oficial | **0 — ainda sem corpus** |
| Pipeline — modelo de dados | concluído |
| Documento Processado/hierarquia — schema | concluído |
| Vetores/elementos/evidências/grafo — schema | concluído |
| Orquestração server-only | concluída / flag OFF |
| `validar_arquivo` | concluída/testada |
| `identificar_formato` | concluída/testada |
| `extrair_conteudo` | concluída/testada para PDF textual/TXT/Markdown |
| `normalizar_conteudo` | concluída/testada |
| `identificar_estrutura` | implementada/testada no PR #14 |
| `criar_hierarquia` | implementada/testada no PR #14 |
| `criar_fragmentos` | implementada, auditada e endurecida no PR #14 |
| Fragmentação PDF intrapágina | corrigida por `0028` + testes de regressão |
| Replay seguro de fragmentos | corrigido por `0029` + comparação determinística |
| `criar_sinteses` | **não consolidada; próxima etapa cognitiva** |
| Taxonomia inteligente | pendente |
| Embeddings | pendente |
| Relações | pendente |
| Publicação do Documento Processado | pendente |
| Cérebro Autoral | pendente |
| Recuperação híbrida | pendente |
| Motor de Reflexões | pendente |

---

## 6. Histórico oficial de migrations

Migration aplicada não é reescrita. Toda correção recebe nova migration.

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
| `20260917000231` | `0022_rls_catalogos_sistema_taxonomia` | RLS em catálogos globais |
| `20260917001607` | `0023_artefato_estrutura_identificada` | artefato de sinais estruturais |
| `20260917002831` | `0024_api_backend_hierarquia_documento` | Documento Processado candidato + seções |
| `20260917004841` | `0025_api_backend_fragmentos_documento` | posições em texto + RPCs de fragmentos |
| `20260917004954` | `0026_corrige_contagem_fragmentos` | corrige contagem no lote |
| `20260917005052` | `0027_corrige_ambiguidade_contagem_fragmentos` | corrige ambiguidade SQL |
| `20260917012837` | `0028_offsets_pdf_fragmentacao` | offset intrapágina para fragmentação PDF precisa |
| `20260917014156` | `0029_listagem_fragmentos_replay` | leitura server-only para validar replay |

O antigo rascunho de IA criado por outro agente com o nome local `0028_ia_sinteses_secao` **nunca foi aplicado ao Supabase**. O número `0028` agora pertence oficialmente a `0028_offsets_pdf_fragmentacao`; o rascunho de IA deve ser reavaliado e renumerado antes de qualquer uso.

---

## 7. Segurança

Auditorias atuais confirmam:

- RLS nas tabelas pessoais;
- Storage privado;
- browser sem acesso direto aos schemas internos;
- RPCs `backend_*` com `SECURITY DEFINER` e `search_path = ''`;
- `anon`/`authenticated` sem execução das RPCs backend;
- grants explícitos apenas ao backend (`service_role`) nas operações internas;
- artefatos intermediários com negação explícita a clientes;
- catálogos globais com RLS como segunda camada;
- nenhuma nova FK sem índice apontada pelos advisors;
- `unused_index` permanece informativo enquanto o banco está vazio.

Após `0028/0029`, o advisor de segurança continua com **um único aviso externo**:

`Leaked Password Protection Disabled`.

Pendências externas antes de usuários/corpus reais:

1. Supabase Auth: habilitar Leaked Password Protection, se disponível no plano, e confirmar Site URL/Redirects/template SSR;
2. GitHub: avaliar Ruleset de `main` com PR/checks/sem force push; não alterar visibilidade sem autorização;
3. Vercel: alinhar Node do painel para 22.x;
4. E2E: processar uma obra controlada antes de ligar `PROCESSAMENTO_WORKFLOW_ATIVO`.

---

## 8. Biblioteca e original

`biblioteca.obras` representa a obra lógica; `biblioteca.versoes_obras` preserva cada versão física. O original nunca é modificado.

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

Caminho privado:

```text
{usuario_id}/{obra_id}/{versao_id}/original.ext
```

---

## 9. Pipeline documental durável

Máquina operacional v1:

```text
validar_arquivo
  → identificar_formato
  → extrair_conteudo
  → normalizar_conteudo
  → identificar_estrutura
  → criar_hierarquia
  → criar_fragmentos
  → criar_sinteses
  → extrair_elementos
  → classificar_taxonomia
  → criar_embeddings
  → criar_relacoes
  → validar_resultado
  → publicar_documento
```

### Etapas determinísticas consolidadas até fragmentação

`validar_arquivo` recalcula hash/tamanho no servidor.

`identificar_formato` usa allowlist e não confia isoladamente em extensão/MIME.

`extrair_conteudo` extrai TXT/Markdown como UTF-8 e PDF textual por página, com limites de tamanho/tempo.

`normalizar_conteudo` aplica apenas LF + Unicode NFC, preservando identidade linguística.

`identificar_estrutura` encontra sinais de alta/baixa confiança e não inventa divisão na ausência de evidência.

`criar_hierarquia` materializa Documento Processado `candidato` + seções a partir de sinais de alta confiança.

`criar_fragmentos` produz texto próprio por seção e breadcrumb de contexto.

### Correção auditada: fronteiras PDF intrapágina

A auditoria manual detectou que número de página sozinho não era suficiente para fragmentação:

- dois títulos na mesma página poderiam fazer dois fragmentos reutilizarem texto da mesma página;
- quando a próxima seção começava no meio da página seguinte, o trecho anterior àquele título poderia ser perdido.

`0028` adiciona `offset_pagina_inicio` a cada seção PDF. O recorte usa página + offset, preservando exatamente o prefixo/sufixo correto sem duplicação entre seções.

### Correção auditada: replay de fragmentos

A primeira versão retornava sucesso imediatamente quando a máquina de estados informava que `criar_fragmentos` já havia concluído. Isso confiava cedo demais no estado persistido.

Agora o replay:

1. revalida `conteudo_normalizado` por bytes, MIME, tamanho, SHA-256, schema e proveniência;
2. relê as seções;
3. recalcula deterministicamente os fragmentos esperados;
4. lê os fragmentos persistidos por RPC backend-only (`0029`);
5. compara conteúdo, contexto, ordem, seção, páginas e estimativa de tokens;
6. falha deterministicamente se houver ausência/divergência.

A execução normal também confere o resultado persistido antes de concluir a etapa.

---

## 10. CI e testes

Gate da aplicação:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

Gate do banco:

```text
supabase start
aplicar migrations + seed
supabase db reset
supabase status
supabase stop --no-backup
```

Na rodada de auditoria anterior ao ajuste cosmético final:

- aplicação: verde;
- audit: 0 vulnerabilidades;
- TypeScript: verde;
- build: verde;
- **39/39 testes passaram**;
- banco local com migrations até `0029`: reconstrução completa verde;
- Preview Vercel do código/testes: READY.

Os três testes novos cobrem:

1. duas seções na mesma página PDF sem duplicação;
2. continuação textual no início da página em que a próxima seção começa no meio;
3. replay aceito somente quando fragmentos persistidos correspondem exatamente ao cálculo determinístico.

Uma rodada final é obrigatória depois desta atualização documental e da remoção do único warning de lint do teste.

---

## 11. Próxima etapa — `criar_sinteses`

`criar_sinteses` será a primeira etapa verdadeiramente cognitiva do Pipeline.

Existe um **rascunho não validado** deixado por outro agente na branch `claude/confident-cannon-ovdoev` (commit `0b9d739...`). Ele não será incorporado ou aplicado diretamente.

Antes de continuar com IA:

1. consolidar o PR #14 e eliminar o drift GitHub ↔ Supabase;
2. pesquisar novamente a documentação oficial atual da OpenAI;
3. revisar/reescrever a migration do rascunho e renumerá-la após `0029`;
4. escrever testes com cliente OpenAI falso/injetado;
5. validar toda SQL nova contra Supabase real em `BEGIN ... ROLLBACK`;
6. criar `criar-sinteses-step.ts` e integrar ao workflow;
7. manter `store:false`, Structured Outputs e Zod;
8. somente depois solicitar confirmação para a primeira chamada real paga à OpenAI.

Nenhuma síntese parcial poderá alimentar o Cérebro antes de `validar_resultado` e `publicar_documento`.

---

## 12. Alertas técnicos conhecidos

Não são falhas funcionais atuais, mas permanecem visíveis para manutenção:

- ESLint 9.39.5 emite aviso de ciclo de suporte; atualização para ESLint 10 já foi testada anteriormente e quebrou a cadeia atual do Next/plugin React, portanto não será forçada sem compatibilidade comprovada;
- npm 11 sinaliza scripts de instalação em algumas dependências transitivas; devem ser revisados em hardening de supply chain, sem liberar/recusar cegamente;
- o test runner do Node avisa que `package.json` não declara `type: module`; não adicionar essa opção sem PR próprio porque ela pode alterar o comportamento de tooling/Next;
- Vercel Dashboard ainda informa Node 24.x, apesar de `engines.node = 22.x`;
- Leaked Password Protection do Supabase Auth continua desativada;
- ainda não existe E2E positivo com uma obra controlada.

---

## 13. Regra permanente

Este README deve permitir que uma pessoa não técnica descubra, sem inferência:

- o que é o aplicativo;
- qual infraestrutura é oficial;
- o que já existe;
- o que está ou não ativo em produção;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais bugs foram encontrados e corrigidos;
- quais alertas externos permanecem;
- quais decisões arquiteturais estão vigentes;
- como autoria, segurança e proveniência são preservadas;
- qual é a próxima etapa.
