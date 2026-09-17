# Estado Atual do Projeto

Atualizado em **17/09/2026** após auditoria completa de handoff, correção de RLS (`0022`) e implementação de `identificar_estrutura` (`0023`) e `criar_hierarquia` (`0024`).

## Auditoria de handoff — 17/09/2026

O PR #13 já estava incorporado à `main` (não há PRs abertos). Uma nova sessão assumiu o projeto e executou, no mesmo commit (`7ab215b`):

- `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run lint`, `npm run typecheck`, `npm test` (12/12) e `npm run build`: todos passaram sem alteração de código;
- leitura completa do código de segurança (`proxy.ts`, cliente backend, RPCs `aplicacao.backend_*`, workflow `processar-obra.ts`) confirmando que corresponde exatamente ao descrito nos ADRs;
- auditoria do Supabase oficial (`xzkzdaxxmizcgfkjgzoq`) via advisors de segurança/performance, `list_tables` e `list_migrations`;
- auditoria do Vercel oficial (`cerebro-autoral`): produção `READY` na `main` atual, Node do dashboard ainda em 24.x (ADR-027 pendente de ajuste manual).

**Achado corrigido:** o advisor de segurança apontava como crítico o RLS desabilitado em 8 tabelas de catálogo (`sistema.*`, `taxonomia.*`). A `0022_rls_catalogos_sistema_taxonomia` habilitou RLS + policy de leitura para `authenticated` nessas tabelas, sem novo GRANT (ver ADR-057). Reexecutado o advisor após a migration: o achado crítico desapareceu; resta apenas o aviso externo pré-existente `Leaked Password Protection Disabled`.

**Recursos de infraestrutura fora deste projeto:** a conta possui outros projetos Supabase/Vercel/GitHub (ex.: `Celebro-Biblioteca-Cloude`, `MEMORIA-REFLEXIMA-`, `memoria-reflexiva-oficial`, `app-geovane-cloud`) que **não pertencem** a este aplicativo e não foram tocados nesta auditoria, por decisão explícita do proprietário.

## Nova etapa — `identificar_estrutura` (0023)

Implementada em `src/dominios/processamento/identificar-estrutura.ts` (lógica pura, testada) e `src/workflows/identificar-estrutura-step.ts` (etapa durável, integrada a `processar-obra.ts`). Consome `conteudo_normalizado` validado e produz o artefato `estrutura_identificada` com sinais determinísticos (cabeçalhos Markdown, marcadores "Parte/Capítulo/Seção/Subseção/Anexo" numerados, "Prefácio"/"Posfácio" isolados, candidatos de baixa confiança em maiúsculas) — ver ADR-058/059/060 e `docs/PIPELINE_DOCUMENTAL.md`. Não materializa `processamento.secoes`; isso ficou para `criar_hierarquia`.

## Nova etapa — `criar_hierarquia` (0024)

Implementada em `src/dominios/processamento/criar-hierarquia.ts` (algoritmo de árvore por pilha de níveis, puro e testado) e `src/workflows/criar-hierarquia-step.ts` (etapa durável). Consome apenas os sinais de `confianca: alta` de `estrutura_identificada` e materializa, pela primeira vez, dados reais em `processamento.documentos_processados` (estado `candidato`) e `processamento.secoes` — via a função de banco `aplicacao.backend_criar_hierarquia_documento` (migration `0024`), no mesmo padrão de segurança das etapas anteriores (SECURITY DEFINER, sem GRANT direto). Ver ADR-061/062/063.

Sem nenhum sinal de alta confiança, cria uma única seção cobrindo o documento inteiro, em vez de inventar divisão. A função de banco foi validada manualmente contra o Supabase oficial dentro de uma transação com `ROLLBACK`: confirmou criação do documento + 3 seções de teste com vínculo pai/filho correto e idempotência em uma segunda chamada — nenhum dado permanente foi criado no banco oficial.

`npm test` agora cobre 27 casos (12 do handoff original + 8 de `identificar_estrutura` + 7 de `criar_hierarquia`). O advisor de segurança do Supabase permanece sem achados críticos após as migrations `0023` e `0024`.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- `main`: `15250537998d36c5c4df5375990c1f6c4cc66ed3`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, região `us-west-2`, PostgreSQL `17.6`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`

## Marco atual

A Fase 3 avançou até `identificar_estrutura`, implementada na branch corrente:

```text
validar_arquivo          ✅ main
  ↓
identificar_formato      ✅ main
  ↓
extrair_conteudo         ✅ main — PDF textual/TXT/Markdown
  ↓
normalizar_conteudo      ✅ main (PR #13)
  ↓
identificar_estrutura    ✅ implementado e testado (0023)
  ↓
criar_hierarquia         ✅ implementado e testado (0024)
  ↓
criar_fragmentos         próxima etapa
```

Nenhum artefato parcial é Documento Processado ativo e nenhum resultado parcial alimenta o Cérebro Autoral.

## Normalização — política v1

A etapa `normalizar_conteudo` é determinística e conservadora. Ela não corrige estilo, gramática, argumentos ou escolhas linguísticas.

Regras:

- Unicode NFC;
- CRLF/CR → LF;
- não usar NFKC/NFKD como normalização autoral;
- preservar caixa, pontuação, aspas, travessões e escolhas lexicais;
- preservar espaços internos e espaços significativos de Markdown;
- preservar número, ordem e fronteira de páginas PDF;
- validar schema e cadeia de proveniência `original → conteudo_extraido → conteudo_normalizado`;
- persistir `conteudo_normalizado.json` no bucket privado de artefatos;
- revalidar bytes/hash/tamanho/schema/proveniência também quando um replay reutilizar artefato existente;
- não repetir a transição de estado se o workflow já tiver avançado.

A escolha de NFC foi revisada contra a especificação Unicode atual: NFC preserva equivalência canônica; formas de compatibilidade podem remover distinções e não são adotadas para o texto autoral.

## Validação do PR #13

No head anterior ao hardening final, o job de aplicação passou:

- `npm ci`;
- `npm audit --omit=dev --audit-level=high`;
- ESLint;
- TypeScript;
- testes unitários;
- build Next.js.

O primeiro job `banco-local` conseguiu subir o Supabase e aplicar migrations, mas falhou uma vez em `supabase db reset` com erro genérico do container. A repetição isolada do mesmo job passou integralmente:

- `supabase start`;
- aplicação de todas as migrations/seed;
- `supabase db reset`;
- `supabase status`;
- shutdown limpo.

Portanto, a primeira falha foi classificada como transitória do runner/container, não como migration inválida. O commit final do PR ainda deverá repetir todos os gates depois das atualizações de código/documentação antes do merge.

Os Previews Vercel recentes da branch `feature/processamento-normalizacao` estão `READY`.

## Supabase — migrations recentes

- `0017` (`20260916202853`): RPCs server-only e máquina de etapas;
- `0018` (`20260916212133`): reserva/recuperação do Workflow;
- `0019` (`20260916221057`): locks e transições monotônicas/idempotentes;
- `0020` (`20260916223016`): artefatos intermediários + bucket privado;
- `0021` (`20260916225622`): policy explícita de negação para clientes.

O advisor de segurança após `0021` mostra apenas a pendência externa **Leaked Password Protection Disabled**. O advisor de performance não aponta FK sem índice; `unused_index` permanece informativo enquanto não há corpus real.

## Identificação e extração

Formatos processáveis v1:

- PDF com camada textual;
- TXT UTF-8;
- Markdown UTF-8.

DOCX permanece fora do escopo até validação segura OOXML. PDF sem camada textual retorna caso específico para futura estratégia de OCR; não é enviado à IA.

A extração usa `unpdf 1.8.1`/PDF.js serverless para PDF e decodificação UTF-8 determinística para texto. O original é revalidado por SHA-256/tamanho imediatamente antes da extração. O resultado vira `conteudo_extraido.json` no bucket privado `artefatos-processamento`, com hash, tamanho, MIME e metadados registrados em `processamento.artefatos_execucao`.

Guardrails v1:

```text
TXT/Markdown original: 20 MiB
PDF original:          50 MiB
PDF:                   até 1.000 páginas
Texto extraído:        até 12.000.000 caracteres
Artefato JSON:         até 30 MiB
Imagem interna PDF:    até 16.777.216 pixels
Parsing PDF:           até 90 s
```

## Produção Vercel

O domínio de produção está `READY`, mas ainda aponta para o commit `3a3a25f450fa1bdc2b56ec8f91120718de21adc2`, anterior às entregas de identificação/extração/normalização.

Os Previews das branches posteriores estão `READY`. O atraso de `main` decorreu de `build-rate-limit` da conta Vercel, não de erro de compilação confirmado no código. Como `PROCESSAMENTO_WORKFLOW_ATIVO=false`, funcionalidades parciais não estão expostas aos usuários.

O Dashboard ainda informa Node 24.x, enquanto `package.json` exige Node 22.x; os builds têm respeitado a engine do projeto. O setting administrativo deve ser alinhado manualmente.

## Estado dos dados

O banco oficial ainda possui, na última auditoria:

- 1 usuário Auth;
- 0 obras;
- 0 versões de obra;
- 0 execuções;
- 0 Documentos Processados;
- 0 fragmentos;
- 0 elementos;
- 1 versão ativa de Pipeline;
- 1 versão ativa de Taxonomia.

Por isso ainda não existe um E2E positivo com corpus real. A feature flag continuará desligada até um documento controlado percorrer o Pipeline com sucesso.

## Segurança externa pendente antes de corpus real

1. Supabase Auth: habilitar Leaked Password Protection, se o plano permitir, e confirmar URLs/templates SSR.
2. GitHub: tornar o repositório privado e proteger `main` com Ruleset/PR/checks/sem force push; considerar CodeQL.
3. Vercel: alinhar Node para 22.x e liberar/concluir um novo build de produção de `main`.
4. E2E: usar uma obra controlada antes de ligar o Workflow no frontend.

## OpenAI

A chave antiga foi rotacionada e a nova está configurada diretamente na Vercel. Nenhum segredo foi versionado. A IA ainda não participa das etapas implementadas porque validação, identificação, extração e normalização são deliberadamente determinísticas.

A futura camada cognitiva seguirá Responses API com `store:false`, Structured Outputs/JSON Schema, Zod, modelos centralizados em `MODELO_IA_*` e auditoria completa.

## Próximo passo

Implementar `criar_fragmentos`: consumir `conteudo_normalizado` e as `processamento.secoes` já materializadas, dividindo o texto de cada seção em fragmentos com contexto, proveniência (seção, página) e contagem de tokens. Nenhum Documento Processado parcial deve ser publicado antes de `validar_resultado`/`publicar_documento`.

## Regra permanente

Nenhuma migration aplicada é reescrita para esconder correções. Nenhum segredo é commitido. Toda mudança estrutural é cumulativa, testável e documentada. O usuário permanece a autoridade final sobre autoria e incorporação ao Cérebro Autoral.
