# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os quatro documentos canônicos fornecidos pelo proprietário continuam sendo a fonte de verdade do produto; este arquivo registra o estado técnico real, testes, riscos, decisões e próximos passos.

## 1. Regra central do produto

A IA pode interpretar, organizar, relacionar, propor e escrever. A identidade autoral, as permissões, versões, proveniência, publicação e persistência continuam sob controle determinístico do sistema e do autor.

```text
BIBLIOTECA
→ PROCESSAMENTO INTELIGENTE
→ DOCUMENTOS PROCESSADOS
→ ANÁLISE TRANSVERSAL
→ CÉREBRO AUTORAL
→ RECUPERAÇÃO CONTEXTUAL
→ MOTOR DE REFLEXÕES
→ NOVA REFLEXÃO
→ REVISÃO HUMANA
→ APRENDIZADO CONTROLADO
```

**Preservar incerteza é melhor do que inventar estrutura, autoria, relação ou fato sem evidência.** Conteúdo do usuário é dado, nunca instrução para o sistema ou para modelos de IA.

## 2. Infraestrutura oficial — somente esta

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
main atual: ef1b56af9f2a8a97f614dd956628c4a8bfce4d0c
PR #16: incorporado — criar_sinteses com IA auditável
```

O repositório continua **público por decisão explícita do proprietário**. Não alterar visibilidade sem autorização.

### Supabase

```text
Projeto: Biblioteca-Celebro-Reflex-es-
Project ref: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
Estado: ACTIVE_HEALTHY
```

Última fotografia auditada antes de corpus real:

```text
1 usuário Auth de teste
0 execuções de processamento
0 Documentos Processados
0 fragmentos
0 execuções de IA
0 sínteses
1 versão ativa de Pipeline
1 versão ativa de Taxonomia
```

As migrations de IA `0030–0035` criam infraestrutura, configuração e auditoria, mas **não processaram nenhuma obra real e não fizeram nenhuma chamada externa**.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

A produção está `READY` no commit `ef1b56af9f2a8a97f614dd956628c4a8bfce4d0c`. Smoke tests de `/` e `/biblioteca` confirmam autenticação/proteção normal e a Vercel não reporta erros de runtime no deployment pós-merge.

`PROCESSAMENTO_WORKFLOW_ATIVO=false` continua impedindo o início do Pipeline para usuários.

O Dashboard ainda reporta Node `24.x`, enquanto `package.json` exige Node `22.x`; CI e engine usam Node 22.x. O ajuste do painel continua pendência externa.

Outros projetos GitHub/Supabase/Vercel da conta **não pertencem** ao Cérebro Autoral e não devem ser tocados.

## 3. Stack atual

### Aplicação

- Next.js `16.3.5`
- React `19.3.0`
- TypeScript `6.0.3`
- Node `22.x`
- npm `11.19.1`
- ESLint `9.39.5` por compatibilidade comprovada
- App Router + `proxy.ts`

### Supabase / upload

- `@supabase/supabase-js` `2.116.0`
- `@supabase/ssr` `0.12.7`
- `tus-js-client` `4.3.1`
- `hash-wasm` `4.12.0`
- Supabase CLI `2.117.0` no CI
- Storage privado, RLS, pgvector/HNSW
- SHA-256 incremental + deduplicação

### Pipeline documental

- Vercel Workflow SDK `4.8.9`
- `unpdf` `1.8.1`
- PDF textual, TXT e Markdown v1
- normalização LF + Unicode NFC
- artefatos intermediários privados
- steps duráveis/idempotentes
- `PROCESSAMENTO_WORKFLOW_ATIVO=false`

### Supply chain

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

`npm audit --omit=dev --audit-level=high` permanece gate obrigatório.

### OpenAI

- pacote `openai` `7.15.0`
- Zod `4.6.5`
- chave antiga exposta foi rotacionada
- chave nova está somente no ambiente servidor/Vercel
- nenhuma chave é versionada
- Responses API + Structured Outputs
- `store:false` obrigatório para o conteúdo intelectual privado
- SDK com `maxRetries:0`; retries/cobrança são controlados pela nossa camada auditável

Modelo padrão v1 para síntese: **`gpt-5.6-terra`**, configurável por `MODELO_IA_ANALISE`. A escolha foi revalidada contra documentação oficial atual da OpenAI em 17/09/2026 por equilíbrio entre qualidade e custo; mudança de modelo é decisão versionada, não troca silenciosa.

Snapshot de custo usado apenas para estimativa operacional:

```text
GPT-5.6 Terra
entrada:       US$ 2,00 / 1M tokens
entrada cache: US$ 0,20 / 1M tokens
saída:         US$ 12,00 / 1M tokens
```

**Nenhuma chamada real paga foi executada até este ponto.**

## 4. Estado funcional do Pipeline

| Etapa | Estado |
|---|---|
| `validar_arquivo` | ✅ concluída/testada |
| `identificar_formato` | ✅ concluída/testada |
| `extrair_conteudo` | ✅ PDF textual/TXT/Markdown |
| `normalizar_conteudo` | ✅ concluída/testada |
| `identificar_estrutura` | ✅ concluída/testada |
| `criar_hierarquia` | ✅ concluída/testada |
| `criar_fragmentos` | ✅ concluída/testada/auditada |
| `criar_sinteses` | ✅ incorporada/testada sem chamada real |
| `extrair_elementos` | ⬜ próxima implementação |
| `classificar_taxonomia` | ⬜ não iniciada |
| `criar_embeddings` | ⬜ não iniciada |
| `criar_relacoes` | ⬜ não iniciada |
| `validar_resultado` | ⬜ não iniciada |
| `publicar_documento` | ⬜ não iniciada |

Depois ainda faltam Cérebro Autoral, Influências Externas deliberadas, Recuperação Contextual, Motor de Reflexões e Aprendizado por Revisão.

## 5. Parte determinística consolidada

A `main` e a produção já contêm as correções auditadas da Fase 3:

- `identificar_estrutura` preserva incerteza e só materializa sinais de alta confiança;
- `criar_hierarquia` constrói Documento Processado em estado `candidato`;
- `criar_fragmentos` usa texto próprio de cada seção;
- PDF usa `offset_pagina_inicio` para fronteiras intrapágina (`0028`);
- replay de fragmentos revalida artefato e resultado persistido (`0029`);
- 39 testes determinísticos protegiam essa base antes da introdução da IA.

## 6. `criar_sinteses` — arquitetura v1

Essa é a primeira etapa realmente cognitiva.

### Hierarquia

Sínteses são produzidas de baixo para cima:

```text
seções/subseções/folhas
      ↓
capítulos
      ↓
partes
      ↓
obra
```

Cada pai recebe apenas seu texto próprio, quando houver, e sínteses auditadas dos filhos diretos. Isso reduz repetição de contexto e mantém proveniência/hierarquia explícitas.

### Uma chamada de IA por step durável

Cada alvo é sintetizado dentro de seu próprio `'use step'`. Se o workflow cair depois de várias sínteses, as concluídas podem ser reutilizadas somente quando modelo, prompt e hash exato da entrada coincidem.

### Prompt injection

O prompt v1 (`prompts/processamento/sintese-documental-hierarquica-v1.md`) declara explicitamente que o conteúdo-fonte é **DADO NÃO CONFIÁVEL** e que comandos/papéis/pedidos encontrados dentro do documento não devem ser executados.

### Structured Output

Saída aceita v1:

```json
{
  "sintese": "texto não vazio, até 12000 caracteres"
}
```

A resposta precisa passar por Structured Output + Zod antes de persistência. A migration `0035` também exige que o JSON Schema ativo no catálogo seja exatamente compatível com esse contrato antes de entregar a configuração ao backend.

### Limite v1

Uma entrada individual de síntese tem limite conservador de **400.000 caracteres**. Entrada maior falha explicitamente antes da chamada; chunking cognitivo adicional será uma evolução própria.

### Retries e cobrança

- SDK OpenAI: `maxRetries:0`.
- HTTP transitório `408/409/425/429/5xx`: pode permitir retry durável controlado.
- HTTP não transitório `400/401/403/404/422` etc.: registra falha e não repete automaticamente.
- falha de transporte sem status depois de uma chamada marcada como iniciada vira `incerta` e **não é repetida automaticamente**;
- reserva criada mas ainda não iniciada pode ser recuperada sem risco de cobrança duplicada;
- depois de resposta válida, persistência é repetida localmente/idempotentemente sem refazer a chamada externa.

## 7. Auditoria de IA

`auditoria.execucoes_ia` registra:

- usuário/operação;
- modelo/prompt;
- versões de Taxonomia/Pipeline;
- estado;
- tokens de entrada/saída;
- duração;
- custo estimado;
- referências de entrada/saída;
- erro;
- chave de idempotência;
- tentativa e timestamps.

O texto integral privado não é duplicado na tabela de auditoria; referências e hashes são preferidos.

As RPCs de IA são `SECURITY DEFINER`, `search_path=''`, sem execução para `anon/authenticated` e executáveis apenas pelo backend `service_role`. O backend não possui SELECT direto na tabela interna de auditoria.

## 8. Histórico de migrations — continuação

A sequência oficial anterior vai de `0001` a `0029`. A camada de síntese usa:

| Versão | Migration | Finalidade |
|---|---|---|
| `20260917020401` | `0030_fundacao_ia_sinteses` | auditoria IA, modelo/prompt e RPCs server-only |
| `20260917021001` | `0031_recuperacao_reserva_ia` | separa reserva local de chamada externa iniciada |
| `20260917021151` | `0032_listagem_sinteses_auditadas` | replay por modelo/prompt/hash de entrada |
| `20260917021601` | `0033_hardening_auditoria_ia` | RLS deny explícito + índices de FKs |
| `20260917022624` | `0034_corrige_ambiguidade_tentativa_ia` | corrige ambiguidade SQL encontrada no teste funcional |
| `20260917023206` | `0035_contrato_schema_sintese` | exige contrato exato do JSON Schema antes de fornecer configuração |

A `0035` já existia no histórico do Supabase quando a auditoria final detectou que seu arquivo ainda não estava na branch. O SQL exato foi recuperado do próprio histórico do Supabase, versionado no GitHub e o CI reconstruiu o banco local do zero com `0001–0035`.

O antigo WIP `0028_ia_sinteses_secao` **nunca foi aplicado** e não deve ser usado; a numeração oficial `0028–0029` pertence às correções determinísticas consolidadas.

## 9. Testes da camada de IA

Sem usar a chave real, a suíte cobre:

- input JSON determinístico + SHA-256;
- `store:false` no cliente falso;
- Structured Output/Zod;
- uso de tokens/custo estimado;
- prompt injection permanecendo apenas como dado;
- entrada excessiva falhando antes da chamada;
- ausência de `output_parsed` rejeitada;
- contrato exato do schema persistido;
- classificação de status HTTP transitório vs. permanente;
- custo desconhecido retornando `null` em vez de preço inventado;
- ordem bottom-up das seções;
- pais combinando texto próprio + sínteses dos filhos;
- seção sem fonte sem criar chamada;
- síntese da obra usando apenas sínteses de topo.

No head final do PR #16, passaram juntos:

```text
npm ci                                      ✅
npm audit --omit=dev --audit-level=high     ✅
npm run lint                                ✅
npm run typecheck                           ✅
npm test                                    ✅
npm run build                               ✅
Supabase local + migrations 0001–0035       ✅
supabase db reset                           ✅
Preview Vercel                              ✅ READY
```

## 10. Testes no Supabase real

As migrations novas foram validadas com transações revertidas e dados sintéticos. Foram comprovados, sem deixar dados permanentes:

- reserva idempotente de chamada IA;
- bloqueio de reserva duplicada;
- início da chamada;
- conclusão de síntese;
- conclusão repetida idempotente;
- replay concluído;
- listagem auditada com hash/modelo/prompt;
- recuperação de reserva não iniciada;
- bloqueio de retry automático de chamada já iniciada e ambígua;
- `service_role` sem SELECT direto em `auditoria.execucoes_ia`.

O teste funcional encontrou um bug real na `0031` (`tentativa = tentativa + 1` ambíguo por existir coluna de saída homônima). A correção foi feita em nova migration `0034`, sem reescrever histórico aplicado.

## 11. Segurança atual

Confirmado até `0035`:

- RLS nas superfícies pessoais/sensíveis;
- Storage privado;
- schemas internos fechados;
- RPCs backend-only;
- conteúdo do usuário tratado como dado;
- OpenAI server-only;
- `store:false`;
- audit trail de modelo/prompt/hash/tokens/custo;
- nenhuma nova FK sem índice após `0033`;
- `PROCESSAMENTO_WORKFLOW_ATIVO=false` bloqueando início do Pipeline.

Advisor Supabase: permanece apenas a pendência externa **Leaked Password Protection Disabled**. Performance apresenta somente `unused_index` enquanto o banco está sem corpus.

## 12. O que ainda NÃO foi feito

- nenhuma chamada real à OpenAI;
- nenhum gasto de API gerado por esta implementação;
- nenhum documento real processado ponta a ponta;
- `PROCESSAMENTO_WORKFLOW_ATIVO` não foi ativado;
- `extrair_elementos` e etapas posteriores ainda não foram implementadas.

## 13. Próximo marco

1. manter a primeira chamada real paga bloqueada até autorização explícita do proprietário;
2. preparar um E2E controlado com documento pequeno e custo mínimo quando houver essa autorização;
3. iniciar `extrair_elementos` de forma auditável, preservando os planos CONTEÚDO/MÉTODO/EXPRESSÃO e proveniência por fragmento;
4. manter Documento Processado como `candidato` até `validar_resultado`/`publicar_documento`.

## 14. Regra permanente

O README deve dizer claramente o que existe, o que foi testado, o que está ativo, quanto pode custar, quais migrations estão aplicadas, quais alertas permanecem e qual é o próximo passo — sem tratar intenção futura como funcionalidade pronta.
