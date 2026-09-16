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
main: 4931b492cc7828d121625151d97be1818fda50b3
```

- Fase 2 incorporada;
- PR #9 incorporado: orquestração durável e validação de original;
- PR #10 incorporado: identificação de formato, extração determinística e artefatos intermediários;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false` permanece;
- repositório atualmente **público**;
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

O domínio de produção continua `READY`, porém **ainda executa o commit anterior `3a3a25f...`**. O merge `4931b492...` recebeu status Vercel `failure` com motivo `build-rate-limit`, isto é, a Vercel recusou criar um novo build por limite de builds da conta; não foi erro de compilação do aplicativo. O mesmo código executável do PR #10 foi validado em Preview `READY` antes do merge.

A produção continuará funcional com a versão anterior até a Vercel aceitar um novo build de `main`. Como `PROCESSAMENTO_WORKFLOW_ATIVO=false`, nenhuma funcionalidade parcial foi exposta.

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
- DOCX permanece fora do escopo até validação segura OOXML.

### Supply chain

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

Esses overrides corrigem vulnerabilidades transitivas encontradas no Workflow SDK. `npm audit --omit=dev --audit-level=high` permanece gate obrigatório.

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
| Documento Processado/hierarquia | concluído |
| Vetores/elementos/evidências/grafo | concluídos |
| Orquestração server-only | concluída / flag OFF |
| `validar_arquivo` | implementado e testado |
| `identificar_formato` | implementado e testado |
| `extrair_conteudo` | implementado e testado para PDF textual/TXT/Markdown |
| Artefatos intermediários privados | migrations `0020`/`0021` aplicadas |
| Supabase local reproduzível | implementado e testado no CI |
| `normalizar_conteudo` | **próxima implementação** |
| OpenAI operacional no Pipeline | pendente por arquitetura, não por credencial |
| Cérebro Autoral | pendente |
| Recuperação híbrida | pendente |
| Motor de Reflexões | pendente |

O banco oficial possui atualmente `1` usuário Auth e `0` obras, `0` versões de obra, `0` execuções, `0` Documentos Processados, `0` fragmentos e `0` elementos. Há 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia.

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

O CI reconstrói um Supabase local do zero com migrations + seed e executa `db reset`, provando reprodutibilidade.

---

## 7. Segurança

Auditorias confirmam:

- RLS nas tabelas pessoais;
- Storage privado;
- browser sem acesso direto aos schemas internos;
- RPCs `backend_*` `SECURITY DEFINER` com `search_path = ''`;
- `anon` e `authenticated` não executam RPCs backend;
- artefatos intermediários possuem RLS + policy explícita de negação + grants revogados;
- nenhuma FK sem índice apontada pelo advisor;
- `unused_index` é informativo enquanto o banco não tem corpus real.

Pendências externas obrigatórias antes de usuários/corpus reais:

1. **Supabase Auth:** habilitar Leaked Password Protection, se disponível no plano, e confirmar Site URL/Redirects/template SSR.
2. **GitHub:** tornar o repositório privado e criar Ruleset para `main` exigindo PR/checks e bloqueando force push; considerar CodeQL.
3. **Vercel:** alinhar setting Node para 22.x e permitir/concluir o próximo build de produção após o rate limit.
4. **E2E:** usar uma obra controlada de teste antes de ativar `PROCESSAMENTO_WORKFLOW_ATIVO`.

Segredos:

- `.env*` ignorado, exceto `.env.example`;
- `SUPABASE_SECRET_KEY` somente no servidor;
- `OPENAI_API_KEY` somente no ambiente servidor/Vercel;
- nenhuma chave real em README, commits, logs ou frontend.

---

## 8. Biblioteca e original

`biblioteca.obras` representa a obra lógica; `biblioteca.versoes_obras` preserva cada versão física. O original nunca é modificado.

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

A suíte cobre detecção/spoofing, TXT/Markdown, binário disfarçado, DOCX fora do escopo, UTF-8/BOM/vazio e extração real de um PDF textual mínimo.

### Banco local

```text
supabase start
supabase db reset
supabase status
supabase stop --no-backup
```

O head final do PR #10 passou **ambos os jobs integralmente** antes do merge.

### Limite atual de E2E

Ainda não há obra real no banco oficial. O caminho positivo `upload → workflow → validar → identificar → extrair` não foi exercitado com corpus. A flag ficará desligada até esse E2E passar.

---

## 12. Próxima etapa: normalização

A próxima implementação é `normalizar_conteudo`, ainda sem IA.

Política definida para proteger identidade autoral:

- verificar hash/tamanho do artefato extraído antes de reutilizá-lo;
- validar o JSON do artefato e sua versão;
- normalização Unicode **NFC**, não NFKC;
- CRLF/CR → LF;
- remover apenas ruído técnico comprovado;
- preservar pontuação, caixa, aspas, travessões, escolhas lexicais e espaços internos autorais;
- preservar páginas/ordem/proveniência;
- produzir `conteudo_normalizado.json` com hash próprio e registro de transformações;
- avançar depois para `identificar_estrutura`.

NFKC/NFKD não serão usados como padrão porque normalizações de compatibilidade podem apagar distinções que podem ser relevantes à identidade linguística.

---

## 13. Ordem macro

| Etapa | Estado |
|---|---|
| Fundação | concluída |
| Dicionário/Taxonomia — estrutura | concluída |
| Biblioteca/Storage/Auth/API | concluídos |
| Pipeline — modelo de dados | concluído |
| Pipeline — workflow | **em construção; validação/formato/extração concluídos** |
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
