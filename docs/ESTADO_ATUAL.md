# Estado Atual do Projeto

Atualizado em **16/09/2026** após o merge do PR #10 e nova verificação cruzada de GitHub, Supabase e Vercel.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- `main`: `4931b492cc7828d121625151d97be1818fda50b3`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, região `us-west-2`, PostgreSQL `17.6`
- Vercel: projeto `cerebro-autoral`
- Produção: `https://cerebro-autoral.vercel.app`
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`

## Marco atual

A segunda entrega da Fase 3 foi **incorporada à `main` pelo PR #10**. O código oficial agora contém:

```text
validar_arquivo          ✅
  ↓
identificar_formato      ✅
  ↓
extrair_conteudo         ✅ PDF textual/TXT/Markdown
  ↓
normalizar_conteudo      ← próxima etapa
```

Nenhum artefato parcial é Documento Processado ativo e nenhum resultado parcial alimenta o Cérebro Autoral.

## Validação do PR #10

Antes do merge, o mesmo head passou:

- `npm ci`;
- `npm audit --omit=dev --audit-level=high`;
- ESLint;
- TypeScript;
- testes unitários;
- build Next.js;
- `supabase start`;
- aplicação de migrations/seed;
- `supabase db reset`;
- `supabase status`;
- Preview Vercel do código executável em estado `READY`.

A suíte inclui um PDF textual mínimo real e valida detecção de formato, spoofing, TXT/Markdown, UTF-8, BOM, vazio, DOCX fora do escopo e extração preservando página.

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

O domínio de produção continua `READY`, mas neste momento ainda aponta para o commit anterior `3a3a25f...`. O commit novo de `main` (`4931b492...`) recebeu status Vercel `failure` com URL de `build-rate-limit`.

Isso significa **limite de builds da conta**, não falha do aplicativo. O código executável do PR #10 já teve Preview `READY` antes do merge. A produção permanecerá na versão anterior até a Vercel aceitar um novo build de `main`.

O Dashboard ainda informa Node 24.x, enquanto `package.json` exige Node 22.x; os builds têm usado Node 22 pela engine. O setting administrativo deve ser alinhado manualmente.

## Estado dos dados

O banco oficial ainda possui:

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
3. Vercel: alinhar Node para 22.x e permitir um novo build de produção após o rate limit.
4. E2E: usar uma obra controlada antes de ligar o Workflow no frontend.

## OpenAI

A chave antiga foi rotacionada e a nova está configurada diretamente na Vercel. Nenhum segredo foi versionado. A IA ainda não é usada porque as etapas atuais são determinísticas.

A futura camada cognitiva seguirá Responses API com `store:false`, Structured Outputs/JSON Schema, Zod, modelos centralizados em `MODELO_IA_*` e auditoria completa.

## Próximo passo

Abrir `feature/processamento-normalizacao` e implementar `normalizar_conteudo` com estas regras:

- verificar bytes/hash/tamanho reais do artefato extraído antes de reutilizar;
- validar estrutura/versionamento do JSON;
- Unicode NFC, não NFKC;
- CRLF/CR → LF;
- somente limpeza técnica comprovada;
- preservar pontuação, caixa, aspas, travessões, escolhas lexicais e espaços internos autorais;
- preservar páginas, ordem e proveniência;
- gerar `conteudo_normalizado.json` privado/idempotente;
- avançar depois para `identificar_estrutura`.

## Regra permanente

Nenhuma migration aplicada é reescrita para esconder correções. Nenhum segredo é commitido. Toda mudança estrutural é cumulativa, testável e documentada. O usuário permanece a autoridade final sobre autoria e incorporação ao Cérebro Autoral.