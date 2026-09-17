# Estado Atual do Projeto

Atualizado em **17/09/2026** durante a implementação auditável de `criar_sinteses`.

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

A parte determinística da Fase 3 está consolidada na `main` até `criar_fragmentos`. A primeira etapa cognitiva está sendo implementada no PR #16:

```text
validar_arquivo          ✅ main
identificar_formato      ✅ main
extrair_conteudo         ✅ main
normalizar_conteudo      ✅ main
identificar_estrutura    ✅ main
criar_hierarquia         ✅ main
criar_fragmentos         ✅ main
criar_sinteses           🟡 implementada/testada sem chamada real; PR #16
extrair_elementos        ⬜ não iniciada
classificar_taxonomia    ⬜ não iniciada
criar_embeddings         ⬜ não iniciada
criar_relacoes           ⬜ não iniciada
validar_resultado        ⬜ não iniciada
publicar_documento       ⬜ não iniciada
```

Nenhum resultado parcial alimenta o Cérebro Autoral.

## Estado dos dados

O banco oficial continua sem corpus real na última auditoria:

- 1 usuário Auth de teste;
- 0 obras;
- 0 versões de obra;
- 0 execuções;
- 0 Documentos Processados;
- 0 fragmentos;
- 0 elementos;
- 1 versão ativa de Pipeline;
- 1 versão ativa de Taxonomia.

Os testes das RPCs de IA usam registros sintéticos dentro de `BEGIN ... ROLLBACK`; nada permanece no banco.

## OpenAI

A chave antiga foi rotacionada e a chave nova está configurada somente na Vercel. Nenhum segredo foi versionado.

A documentação oficial atual da OpenAI foi revalidada antes desta implementação. O modelo padrão v1 escolhido para síntese é `gpt-5.6-terra`, configurável por `MODELO_IA_ANALISE`.

Política v1:

- Responses API;
- Structured Outputs + Zod;
- `store:false`;
- cliente server-only;
- `maxRetries:0` no SDK;
- retries/cobrança controlados pela nossa auditoria;
- conteúdo do usuário sempre tratado como dado não confiável;
- nenhuma chamada real paga sem confirmação explícita do proprietário.

Até este momento **nenhuma chamada real à OpenAI foi executada**.

## Nova fundação de IA — migrations `0030–0034`

### `0030_fundacao_ia_sinteses`

Versão real: `20260917020401`.

Criou:

- `auditoria.execucoes_ia`;
- catálogo ativo do modelo `gpt-5.6-terra` para finalidade `analise`;
- prompt `sintese_documental_hierarquica` v1 + hash + schema de saída;
- RPCs server-only para obter configuração, reservar chamada, marcar início, concluir, falhar e listar sínteses.

A auditoria registra modelo, prompt, Pipeline, Taxonomia, tokens, duração, custo estimado, referências, estado, tentativa e erro sem duplicar desnecessariamente o texto privado.

### `0031_recuperacao_reserva_ia`

Versão real: `20260917021001`.

Separa:

- reserva criada mas chamada ainda não iniciada — recuperável após lease curto;
- chamada externa já iniciada — se ficar ambígua, vira `incerta` e não é repetida automaticamente.

### `0032_listagem_sinteses_auditadas`

Versão real: `20260917021151`.

Permite validar replay por síntese + modelo + versão do prompt + hash exato da entrada que originou o resultado.

### `0033_hardening_auditoria_ia`

Versão real: `20260917021601`.

Adicionou policy RLS explícita de negação a clientes e índices das FKs apontadas pelo advisor.

### `0034_corrige_ambiguidade_tentativa_ia`

Versão real: `20260917022624`.

O teste funcional da `0031` encontrou um bug PostgreSQL real: `tentativa = tentativa + 1` era ambíguo porque a função também possui uma coluna de saída `tentativa`. A `0034` qualifica a coluna da tabela e preserva o histórico imutável de migrations.

## Testes de SQL no banco real

Antes de `apply_migration`, a DDL foi validada em transação revertida.

Depois da `0030`, um teste funcional sintético em `BEGIN ... ROLLBACK` comprovou:

- reserva inicial;
- bloqueio de reserva duplicada;
- início da chamada;
- conclusão da síntese;
- conclusão repetida idempotente;
- replay concluído;
- listagem da síntese;
- ausência de SELECT direto do `service_role` na tabela de auditoria.

Um teste posterior de recuperação detectou a ambiguidade da `0031`, que foi corrigida pela `0034`. A versão corrigida passou em transação revertida incluindo:

- recuperação de reserva não iniciada após lease;
- chamada iniciada/abandonada virando `incerta` sem retry automático;
- conclusão auditada separada;
- comprovação de hash/modelo/prompt pela RPC `0032`.

Nenhum dado sintético permaneceu.

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
- estimativa de custo pelo uso retornado;
- prompt injection mitigada por prompt de sistema + encapsulamento explícito do conteúdo como dado;
- composição bottom-up: folhas → capítulos → partes → obra;
- uma síntese por step durável;
- replay só reutiliza resultado quando modelo, prompt e hash de entrada coincidem.

## Política de erro/cobrança

- erro HTTP explícito: auditoria `falhou`; Workflow pode repetir dentro do limite controlado;
- erro de transporte ambíguo depois de início: auditoria `incerta`; não repetir automaticamente;
- resposta do provedor recebida mas persistência falha: tentar persistir de novo de forma local/idempotente, sem refazer a chamada;
- reserva não iniciada: pode ser retomada sem risco de cobrança duplicada.

## Testes automatizados

A nova camada adicionou testes sem usar `OPENAI_API_KEY`:

- hash/input determinístico;
- `store:false`;
- Structured Output;
- tokens + custo estimado;
- prompt injection permanecendo como dado;
- limite de entrada antes da chamada;
- resposta sem `output_parsed` inválida;
- composição hierárquica;
- ausência de chamada em seção sem fonte;
- síntese de obra por sínteses de topo.

Na rodada anterior à `0034` e documentação, a suíte completa chegou a **50/50 testes** com lint, TypeScript e build verdes. O head final deve repetir todos os gates.

## Segurança

Após `0033`, os advisors voltaram ao estado esperado:

- segurança: apenas `Leaked Password Protection Disabled`;
- performance: apenas `unused_index` enquanto o banco permanece sem corpus.

Mantido:

- schemas internos fechados;
- RLS;
- Storage privado;
- `anon`/`authenticated` sem execução de RPCs backend;
- `service_role` acessando a auditoria somente por RPCs controladas;
- `search_path=''` nas funções `SECURITY DEFINER`;
- segredos somente no ambiente servidor.

## Gates obrigatórios do PR #16

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

Além disso:

- Preview Vercel precisa estar `READY`;
- advisors Supabase revisados;
- migrations locais devem bater com o histórico remoto;
- documentação do mesmo head.

## O que ainda NÃO ocorreu

- chamada real à OpenAI;
- cobrança de API produzida por esta etapa;
- E2E positivo com documento real;
- ativação de `PROCESSAMENTO_WORKFLOW_ATIVO`;
- merge do PR #16 enquanto estiver em validação;
- implementação de `extrair_elementos` e etapas seguintes.

## Próximo marco

1. fechar CI/local DB/Preview do head final do PR #16;
2. registrar ADRs da nova arquitetura de IA;
3. tirar o PR de draft somente se tudo estiver verde;
4. incorporar a infraestrutura/steps com feature flag ainda OFF;
5. solicitar confirmação explícita do proprietário para a primeira chamada real paga, com input controlado e custo mínimo;
6. preparar o primeiro E2E controlado do Pipeline.

## Regra permanente

Nenhuma migration aplicada é reescrita. Nenhum segredo é commitido. Uma saída de IA só pode ser persistida depois de validação estrutural e sempre carrega proveniência suficiente para auditoria/replay. O proprietário permanece autoridade final sobre autoria e incorporação ao Cérebro Autoral.
