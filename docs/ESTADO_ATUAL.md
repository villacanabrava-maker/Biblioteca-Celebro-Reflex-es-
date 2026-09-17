# Estado Atual do Projeto

Atualizado em **17/09/2026** após a auditoria final da primeira implementação de `criar_sinteses`, ainda sem chamada real à OpenAI.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- `main`: `46fad3e8b65b59c18c2f77cec727ae8ec917b9d8`
- desenvolvimento atual: PR #16 — `feature/criar-sinteses-ia`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `ACTIVE_HEALTHY`, `us-west-2`, PostgreSQL 17.6
- Vercel: `cerebro-autoral`
- produção: `https://cerebro-autoral.vercel.app`
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`

Outros projetos conectados não pertencem a este aplicativo.

## Marco atual

A parte determinística da Fase 3 está consolidada na `main` até `criar_fragmentos`. A primeira etapa cognitiva está implementada e validada no PR #16:

```text
validar_arquivo          ✅ main
identificar_formato      ✅ main
extrair_conteudo         ✅ main
normalizar_conteudo      ✅ main
identificar_estrutura    ✅ main
criar_hierarquia         ✅ main
criar_fragmentos         ✅ main
criar_sinteses           ✅ implementada/testada sem chamada real; PR #16
extrair_elementos        ⬜ não iniciada
classificar_taxonomia    ⬜ não iniciada
criar_embeddings         ⬜ não iniciada
criar_relacoes           ⬜ não iniciada
validar_resultado        ⬜ não iniciada
publicar_documento       ⬜ não iniciada
```

Nenhum resultado parcial alimenta o Cérebro Autoral.

## Estado dos dados

A auditoria final do Supabase oficial confirmou:

```text
execuções de IA:          0
sínteses:                 0
fragmentos:               0
Documentos Processados:   0
execuções de processamento: 0
```

Existe 1 usuário Auth de teste, 1 versão ativa de Pipeline e 1 versão ativa de Taxonomia. Os testes funcionais das RPCs de IA usaram registros sintéticos dentro de transações com `ROLLBACK`; nada permaneceu no banco.

## OpenAI

A chave antiga foi rotacionada e a chave nova está configurada somente no ambiente servidor/Vercel. Nenhum segredo foi versionado.

A documentação oficial atual da OpenAI foi revalidada antes desta implementação. O modelo padrão v1 escolhido para síntese é `gpt-5.6-terra`, configurável por `MODELO_IA_ANALISE`.

Política v1:

- Responses API;
- Structured Outputs + Zod;
- `store:false`;
- cliente server-only;
- `maxRetries:0` no SDK;
- retries e idempotência controlados pela nossa camada auditável;
- conteúdo do usuário sempre tratado como dado não confiável, nunca como instrução;
- nenhuma chamada real paga sem confirmação explícita do proprietário.

Até este momento **nenhuma chamada real à OpenAI foi executada**.

## Fundação de IA — migrations `0030–0035`

### `0030_fundacao_ia_sinteses`

Versão real: `20260917020401`.

Criou `auditoria.execucoes_ia`, catálogo do `gpt-5.6-terra`, prompt `sintese_documental_hierarquica` v1, schema estruturado e RPCs server-only para configuração, reserva, início, conclusão, falha e listagem.

A auditoria registra modelo, prompt, Pipeline, Taxonomia, tokens, duração, custo estimado, referências, estado, tentativa e erro sem duplicar desnecessariamente o texto privado.

### `0031_recuperacao_reserva_ia`

Versão real: `20260917021001`.

Separa reserva local ainda não iniciada de chamada externa já iniciada. Reserva abandonada pode ser recuperada; chamada já iniciada e abandonada vira `incerta` em vez de ser repetida automaticamente.

### `0032_listagem_sinteses_auditadas`

Versão real: `20260917021151`.

Permite validar replay por síntese + modelo + versão do prompt + hash exato da entrada que originou o resultado.

### `0033_hardening_auditoria_ia`

Versão real: `20260917021601`.

Adicionou policy RLS explícita de negação a clientes e índices das FKs da auditoria.

### `0034_corrige_ambiguidade_tentativa_ia`

Versão real: `20260917022624`.

Corrige a referência ambígua a `tentativa` dentro de `backend_preparar_sintese_ia`, preservando o histórico imutável das migrations.

### `0035_contrato_schema_sintese`

Versão real: `20260917023206`.

Endurece `backend_obter_config_sintese`: a configuração só é entregue ao backend quando o JSON Schema ativo no catálogo corresponde exatamente ao contrato v1 esperado (`{ sintese: string }`, mínimo 1 e máximo 12.000 caracteres, sem propriedades extras).

A `0035` já existia no histórico do Supabase e foi recuperada desse histórico para o GitHub durante a auditoria final. O CI do head final reconstruiu o banco local do zero incluindo `0030–0035`, eliminando novamente o drift GitHub ↔ Supabase.

## Testes de SQL no banco real

Antes das migrations estruturais, a DDL foi validada em transações revertidas. Os testes funcionais sintéticos comprovaram, sem deixar dados permanentes:

- reserva inicial e proteção contra reserva duplicada;
- recuperação de reserva não iniciada;
- marcação explícita de início da chamada externa;
- chamada iniciada/abandonada classificada como `incerta` sem retry automático;
- conclusão de síntese e conclusão repetida idempotente;
- replay auditado por hash/modelo/prompt;
- ausência de SELECT direto do `service_role` na tabela interna de auditoria.

A auditoria final confirmou que as seis RPCs de IA são `SECURITY DEFINER`, usam `search_path=''`, negam execução a `anon`/`authenticated` e permitem somente o backend `service_role`.

## Motor de síntese

Arquivos principais:

```text
src/infraestrutura/openai/cliente.ts
src/infraestrutura/openai/modelos.ts
src/ia/motor-documental/gerar-sintese-documental.ts
src/dominios/processamento/criar-sinteses.ts
src/workflows/criar-sinteses-step.ts
prompts/processamento/sintese-documental-hierarquica-v1.md
```

Características:

- cliente OpenAI compartilhado apenas no servidor;
- `maxRetries:0` para evitar retries de cobrança escondidos pelo SDK;
- input determinístico + SHA-256;
- limite de 400.000 caracteres por chamada v1;
- Structured Output estrito `{ sintese: string }`;
- estimativa de custo a partir do uso retornado;
- defesa contra prompt injection por instrução de sistema + encapsulamento explícito do conteúdo como dado;
- composição bottom-up: folhas → capítulos → partes → obra;
- uma síntese por step durável;
- replay só reutiliza resultado quando modelo, prompt e hash de entrada coincidem.

## Política de erro e cobrança

- HTTP transitório (`408`, `409`, `425`, `429` e `5xx`): registra a tentativa como `falhou` e permite que o Workflow aplique retry controlado;
- HTTP não transitório (`400`, `401`, `403`, `404`, `422` etc.): registra `falhou` e **não** repete automaticamente;
- erro de transporte sem status depois de marcar a chamada como iniciada: registra `incerta` e não repete automaticamente, porque não é possível provar que o provedor não processou a requisição;
- resposta conhecida sem saída estruturada válida: a síntese é rejeitada; a implementação atual mantém tratamento conservador sem persistir saída livre nem refazer a chamada automaticamente;
- resposta válida recebida mas persistência local falha: tenta persistir novamente de forma local/idempotente, sem refazer a chamada ao provedor;
- reserva ainda não iniciada pode ser retomada sem risco de cobrança duplicada.

## Testes automatizados e gates finais

A camada de IA usa cliente falso nos testes; `OPENAI_API_KEY` não é usada e não existe cobrança.

Cobertura nova inclui:

- hash/input determinístico;
- `store:false`;
- Structured Output;
- tokens + custo estimado;
- prompt injection permanecendo como dado;
- limite de entrada antes da chamada;
- resposta sem `output_parsed` inválida;
- compatibilidade exata do schema persistido;
- classificação de status HTTP retryable vs. não retryable;
- composição hierárquica;
- ausência de chamada em seção sem fonte;
- síntese de obra por sínteses de topo.

No head final auditado do PR #16, o GitHub Actions passou integralmente:

```text
npm ci                                      ✅
npm audit --omit=dev --audit-level=high     ✅
npm run lint                                ✅
npm run typecheck                           ✅
npm test                                    ✅
npm run build                               ✅
Supabase local + migrations 0001–0035       ✅
supabase db reset                           ✅
supabase status / stop                      ✅
```

O Preview Vercel do mesmo head também está `READY`.

## Segurança

Após `0035`, os advisors permanecem no estado esperado:

- segurança: apenas `Leaked Password Protection Disabled`;
- performance: somente `unused_index` enquanto o banco não possui corpus.

Mantido:

- schemas internos fechados;
- RLS;
- Storage privado;
- `anon`/`authenticated` sem execução de RPCs backend;
- `service_role` acessando a auditoria somente por RPCs controladas;
- `search_path=''` nas funções `SECURITY DEFINER`;
- segredos somente no ambiente servidor;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false` bloqueando o início do Pipeline em produção.

## O que ainda NÃO ocorreu

- chamada real à OpenAI;
- cobrança de API produzida por esta etapa;
- E2E positivo com documento real;
- ativação de `PROCESSAMENTO_WORKFLOW_ATIVO`;
- implementação de `extrair_elementos` e etapas seguintes.

## Próximo marco

1. incorporar o PR #16 com a feature flag ainda OFF;
2. confirmar deployment de produção e ausência de erros de runtime;
3. manter a primeira chamada real paga bloqueada até confirmação explícita do proprietário;
4. preparar E2E controlado com documento pequeno e custo mínimo quando houver essa confirmação;
5. seguir para `extrair_elementos` sem permitir que uma saída parcial alimente o Cérebro Autoral.

## Regra permanente

Nenhuma migration aplicada é reescrita. Nenhum segredo é commitido. Uma saída de IA só pode ser persistida depois de validação estrutural e sempre carrega proveniência suficiente para auditoria/replay. O proprietário permanece autoridade final sobre autoria e incorporação ao Cérebro Autoral.
