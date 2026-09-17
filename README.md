# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os quatro documentos fornecidos pelo proprietário continuam sendo a fonte canônica do produto; este arquivo registra o estado técnico real, testes, riscos, decisões e próximos passos.

---

## 1. Visão do produto

O ativo principal é o **Cérebro Autoral**: representação estruturada, versionada e auditável da metodologia de pensamento, interpretação, associação, argumentação, escrita, revisão, arquitetura narrativa, recursos retóricos, identidade linguística, relação experiência–conceito, padrões de tensão/síntese, universo conceitual e evolução autoral.

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

Regra permanente: **preservar incerteza é melhor do que inventar estrutura, autoria, relação ou fato sem evidência**.

---

## 2. Fontes de verdade

Documentos canônicos fornecidos pelo proprietário:

- Arquitetura Técnica de Implementação — Cérebro Autoral;
- Plano de Construção — Projeto Novo do Cérebro Autoral;
- Dicionário Mestre de Dados e Taxonomia v1.0;
- Carta de atuação do Engenheiro Principal / Produto.

Documentação operacional:

- `README.md`: painel mestre;
- `docs/ESTADO_ATUAL.md`: fotografia técnica;
- `docs/DECISOES.md`: ADRs cumulativos;
- `docs/PIPELINE_DOCUMENTAL.md`: Pipeline operacional;
- `docs/DESIGN_VISUAL.md`: direção visual;
- `supabase/migrations/`: histórico reproduzível do banco;
- `supabase/config.toml` + `supabase/seed.sql`: ambiente local reproduzível;
- `.github/workflows/ci.yml`: gates automáticos de aplicação e banco.

Migration aplicada não é reescrita. Decisão arquitetural antiga não muda de sentido silenciosamente: refinamentos recebem novo ADR.

---

## 3. Infraestrutura oficial — somente esta

### GitHub

```text
Repositório: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
main: 1b68ba494e62bc5875868bdf4884620c02264c83
Último marco incorporado: PR #14 — consolidação auditada da Fase 3 determinística
```

O PR #14 foi incorporado por squash merge após revisão manual, CI completo, reconstrução do Supabase local, Preview Vercel e advisors do Supabase.

Ele consolidou:

- RLS dos catálogos (`0022`);
- `identificar_estrutura` (`0023`);
- `criar_hierarquia` (`0024`);
- `criar_fragmentos` (`0025`–`0027`);
- correção de fronteiras PDF por offset intrapágina (`0028`);
- replay de fragmentos com leitura/comparação determinística (`0029`);
- 39 testes unitários.

O repositório permanece **público por decisão do proprietário**. Não alterar visibilidade sem autorização explícita.

### Supabase

```text
Projeto: Biblioteca-Celebro-Reflex-es-
Project ref: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Última fotografia auditada:

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

Portanto, as novas migrations não tocaram corpus autoral real.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
Deployment de produção: dpl_2xo3HF6gsHcKE2DVazD4kousiBQo
Commit: 1b68ba494e62bc5875868bdf4884620c02264c83
Estado: READY
```

Testes pós-merge:

- `/` responde e direciona visitante sem sessão para autenticação;
- `/biblioteca` permanece protegida e direciona visitante sem sessão para autenticação;
- não foram encontrados erros de runtime no deployment novo.

O Dashboard da Vercel ainda reporta Node `24.x`, enquanto `package.json` exige Node `22.x`. O CI e a engine do projeto usam Node 22.x; o setting administrativo continua pendência externa.

### Fora do projeto

Outros projetos GitHub/Supabase/Vercel da conta não pertencem ao Cérebro Autoral e não devem ser lidos, modificados ou removidos durante este trabalho.

---

## 4. Stack técnica atual

### Aplicação

- Next.js `16.3.5`;
- React `19.3.0`;
- TypeScript `6.0.3`;
- Node `22.x`;
- npm `11.19.1`;
- ESLint `9.39.5` por compatibilidade comprovada com a cadeia atual;
- App Router + `proxy.ts`.

### Supabase/upload

- `@supabase/supabase-js` `2.116.0`;
- `@supabase/ssr` `0.12.7`;
- `tus-js-client` `4.3.1`;
- `hash-wasm` `4.12.0`;
- Supabase CLI `2.117.0` no CI;
- Storage privado;
- RLS;
- pgvector/HNSW;
- SHA-256 incremental + deduplicação.

### Pipeline documental

- Vercel Workflow SDK `4.8.9`;
- `unpdf` `1.8.1` para PDF textual;
- TXT/Markdown por UTF-8 determinístico;
- normalização NFC/LF;
- artefatos intermediários privados;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`.

Formatos processáveis v1:

```text
PDF com camada textual
TXT UTF-8
Markdown UTF-8
```

DOCX permanece fora do escopo até validação segura OOXML. PDF sem texto exige estratégia própria de OCR.

### Supply chain

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

`npm audit --omit=dev --audit-level=high` continua gate obrigatório. A auditoria do PR #14 registrou 0 vulnerabilidades.

### OpenAI

- pacote `openai` `7.15.0`;
- Zod `4.6.5`;
- chave antiga foi rotacionada;
- chave nova está configurada diretamente na Vercel;
- nenhum segredo está no GitHub;
- IA ainda não participa da parte consolidada do Pipeline.

Pesquisa oficial atual já confirmou:

- Responses API como API adequada para a camada cognitiva;
- Structured Outputs por JSON Schema;
- `store` deve ser definido explicitamente como `false` para a política privada do projeto;
- o placeholder `gpt-5.5` do WIP antigo não será congelado automaticamente; a escolha do modelo será refeita com modelos atuais e avaliação qualidade/custo.

Nenhuma chamada paga real será feita sem confirmação do proprietário.

---

## 5. Estado funcional

| Bloco | Estado |
|---|---|
| Fundação técnica/visual | concluída |
| `sistema` | concluído |
| Taxonomia Mestre — estrutura/versionamento | concluída |
| Biblioteca/Auth/Storage/API | concluídos |
| Upload TUS + SHA-256 + deduplicação | concluído |
| Pipeline — modelo de dados | concluído |
| Orquestração server-only | concluída / flag OFF |
| `validar_arquivo` | concluída/testada |
| `identificar_formato` | concluída/testada |
| `extrair_conteudo` | concluída/testada para PDF textual/TXT/Markdown |
| `normalizar_conteudo` | concluída/testada |
| `identificar_estrutura` | concluída/testada |
| `criar_hierarquia` | concluída/testada |
| `criar_fragmentos` | concluída/testada/auditada |
| Fragmentação PDF intrapágina | corrigida e testada |
| Replay seguro de fragmentos | corrigido e testado |
| `criar_sinteses` | próxima etapa cognitiva — ainda não consolidada |
| Extração de elementos | pendente |
| Taxonomia inteligente | pendente |
| Embeddings | pendente |
| Relações | pendente |
| Validação/publicação | pendente |
| Cérebro Autoral | pendente |
| Recuperação híbrida | pendente |
| Motor de Reflexões | pendente |

O banco oficial continua sem corpus real. `PROCESSAMENTO_WORKFLOW_ATIVO=false` permanece obrigatório.

---

## 6. Histórico oficial de migrations

| Versão | Migration | Finalidade |
|---|---|---|
| `20260916183543` | `0001_fundacao` | extensões/schemas |
| `20260916184023` | `0002_sistema` | catálogo operacional |
| `20260916185118` | `0003_taxonomia` | Taxonomia Mestre |
| `20260916185526` | `0004_biblioteca` | obras/versões |
| `20260916185621` | `0005_indice_fk_biblioteca` | índice FK |
| `20260916190006` | `0006_storage_biblioteca` | bucket/policies |
| `20260916190833` | `0007_api_aplicacao_biblioteca` | API controlada |
| `20260916192647` | `0008_processamento_execucoes` | execuções/etapas |
| `20260916192731` | `0009_indice_fk_etapas_execucao` | índice FK |
| `20260916194638` | `0010_seeds_versoes_base` | Pipeline/Taxonomia 1.0 |
| `20260916195547` | `0011_processamento_documentos_hierarquia` | Documento/seções/fragmentos/sínteses |
| `20260916195710` | `0012_indices_fk_processamento_hierarquia` | índices |
| `20260916200317` | `0013_processamento_elementos_vetores_grafo` | elementos/vetores/grafo |
| `20260916200419` | `0014_indice_fk_taxonomia_elementos` | índice FK |
| `20260916200813` | `0015_integridade_proveniencia_publicacao` | proveniência/publicação |
| `20260916200935` | `0016_deduplicacao_hash_biblioteca` | dedupe concorrente |
| `20260916202853` | `0017_api_backend_workflow_processamento` | RPCs workflow |
| `20260916212133` | `0018_recuperacao_orquestracao_workflow` | reserva/recuperação |
| `20260916221057` | `0019_idempotencia_transicoes_workflow` | transições monotônicas |
| `20260916223016` | `0020_artefatos_intermediarios_processamento` | artefatos privados |
| `20260916225622` | `0021_politica_negacao_artefatos_processamento` | deny explícito |
| `20260917000231` | `0022_rls_catalogos_sistema_taxonomia` | RLS catálogos |
| `20260917001607` | `0023_artefato_estrutura_identificada` | sinais estruturais |
| `20260917002831` | `0024_api_backend_hierarquia_documento` | hierarquia materializada |
| `20260917004841` | `0025_api_backend_fragmentos_documento` | RPCs fragmentação |
| `20260917004954` | `0026_corrige_contagem_fragmentos` | correção de contagem |
| `20260917005052` | `0027_corrige_ambiguidade_contagem_fragmentos` | correção SQL |
| `20260917012837` | `0028_offsets_pdf_fragmentacao` | offset intrapágina PDF |
| `20260917014156` | `0029_listagem_fragmentos_replay` | replay determinístico |

O antigo arquivo WIP `0028_ia_sinteses_secao` nunca foi aplicado ao Supabase. O número oficial `0028` pertence à correção de PDF. O WIP será revisado/renumerado em uma nova branch de IA.

---

## 7. Correções importantes da auditoria de handoff

### PDF intrapágina

Problema encontrado: número de página sozinho não separava seções que começavam na mesma página e podia descartar texto anterior a um título que começasse no meio da página seguinte.

Correção:

```text
pagina_inicial + offset_pagina_inicio
```

Migration `0028` persiste o offset; testes cobrem duplicação e perda de prefixo.

### Replay de `criar_fragmentos`

Problema encontrado: a etapa podia aceitar um replay como sucesso apenas porque a máquina de estados dizia que já havia avançado.

Correção:

1. revalidar o artefato normalizado;
2. reler seções;
3. recalcular fragmentos;
4. ler persistidos via RPC `0029`;
5. comparar seção/código/ordem/páginas/conteúdo/contexto/tokens;
6. falhar se houver divergência.

A execução normal também verifica o persistido antes de concluir.

---

## 8. Segurança

Confirmado após `0028/0029`:

- RLS nas superfícies pessoais/sensíveis;
- Storage privado;
- browser sem acesso direto a schemas internos;
- RPCs `backend_*` com `SECURITY DEFINER` + `search_path=''`;
- `anon`/`authenticated` sem execução das RPCs backend;
- operações internas concedidas explicitamente ao backend;
- nenhuma nova FK sem índice apontada.

Advisor de segurança: único aviso remanescente é **Leaked Password Protection Disabled**.

Advisor de performance: somente `unused_index` enquanto o banco permanece vazio.

Pendências externas:

1. ativar Leaked Password Protection se o plano permitir;
2. alinhar Node do painel Vercel para 22.x;
3. avaliar Ruleset de `main` antes de corpus real;
4. executar E2E controlado antes de ligar o Workflow.

---

## 9. Gates de qualidade

Aplicação:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

Banco:

```text
supabase start
migrations + seed
supabase db reset
supabase status
supabase stop --no-backup
```

PR #14 final:

- aplicação: verde;
- audit: 0 vulnerabilidades;
- lint: verde;
- TypeScript: verde;
- **39/39 testes**;
- build: verde;
- banco local reconstruído do zero até `0029`: verde;
- Preview Vercel: READY;
- Supabase advisors: sem novo alerta estrutural.

Produção pós-merge:

- deployment READY no commit `1b68ba4…`;
- `/` responde autenticação;
- `/biblioteca` continua protegida;
- runtime errors: nenhum encontrado na verificação pós-deploy.

---

## 10. Próxima etapa — `criar_sinteses`

É a primeira etapa cognitiva do Pipeline.

Existe um WIP antigo (`0b9d739...`) com ideias úteis, mas ele não será mesclado diretamente porque:

- usava o número de migration `0028`, que agora já pertence oficialmente à correção de PDF;
- redefine uma RPC (`backend_listar_fragmentos_documento`) com assinatura incompatível com a RPC oficial `0029`;
- usa `gpt-5.5` como placeholder não revalidado contra a documentação oficial atual;
- não possui step do Workflow;
- não possui suíte de testes suficiente;
- sua SQL nunca foi validada em `BEGIN ... ROLLBACK`;
- nenhuma chamada real OpenAI foi executada.

Próximo fluxo de engenharia:

1. criar branch nova a partir da `main` consolidada;
2. pesquisar/registrar modelo atual adequado por qualidade/custo;
3. redesenhar migration de IA com numeração após `0029`;
4. preservar/fortalecer `auditoria.execucoes_ia`;
5. testar o motor com cliente OpenAI falso;
6. validar SQL real por rollback;
7. integrar `criar-sinteses-step.ts`;
8. manter `store:false` e Structured Outputs;
9. só depois pedir confirmação para primeira chamada real paga.

---

## 11. Regra permanente

Este README deve permitir que uma pessoa não técnica descubra:

- qual infraestrutura é oficial;
- o que existe e o que ainda não existe;
- o que está ativo em produção;
- quais migrations foram aplicadas;
- quais testes passaram;
- quais erros foram encontrados/corrigidos;
- quais alertas permanecem;
- como segurança, autoria e proveniência são preservadas;
- qual é a próxima etapa.
