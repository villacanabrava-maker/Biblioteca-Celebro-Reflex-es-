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
main atual: 46fad3e8b65b59c18c2f77cec727ae8ec917b9d8
PR de desenvolvimento: #16 — feature/criar-sinteses-ia (draft durante validação)
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
0 obras
0 versões de obra
0 execuções
0 Documentos Processados
0 fragmentos
0 elementos
1 versão ativa de Pipeline
1 versão ativa de Taxonomia
```

As migrations de IA `0030–0034` criam infraestrutura/configuração/auditoria, mas **não processaram nenhuma obra real e não fizeram nenhuma chamada externa**.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

A produção da `main` está `READY`. Os Previews da branch de IA são usados como gate adicional. `PROCESSAMENTO_WORKFLOW_ATIVO=false` continua impedindo execução do Pipeline parcial para usuários.

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
- chave nova está somente na Vercel
- nenhuma chave é versionada
- Responses API + Structured Outputs
- `store:false` obrigatório para o conteúdo intelectual privado
- cliente SDK configurado com `maxRetries: 0` para que retries/cobrança sejam controlados pela nossa camada auditável

Modelo padrão v1 para síntese: **`gpt-5.6-terra`**, configurável por `MODELO_IA_ANALISE`. A escolha foi revalidada contra documentação oficial atual da OpenAI em 17/09/2026 por equilíbrio entre qualidade/custo; mudança de modelo é decisão versionada, não troca silenciosa.

Snapshot de custo usado apenas para estimativa operacional:

```text
GPT-5.6 Terra
entrada:       US$ 2,00 / 1M tokens
entrada cache: US$ 0,20 / 1M tokens
saída:         US$ 12,00 / 1M tokens
```

Nenhuma chamada real paga foi executada até este ponto.

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
| `criar_sinteses` | 🟡 implementada em branch; validação final sem chamada real |
| `extrair_elementos` | ⬜ não iniciada |
| `classificar_taxonomia` | ⬜ não iniciada |
| `criar_embeddings` | ⬜ não iniciada |
| `criar_relacoes` | ⬜ não iniciada |
| `validar_resultado` | ⬜ não iniciada |
| `publicar_documento` | ⬜ não iniciada |

Depois ainda faltam Cérebro Autoral, Influências Externas deliberadas, Recuperação Contextual, Motor de Reflexões e Aprendizado por Revisão.

## 5. Parte determinística já consolidada

A `main` já contém e a produção já publicou as correções auditadas da Fase 3:

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

Cada pai recebe apenas:

- seu texto próprio (se houver);
- sínteses auditadas dos filhos diretos.

Isso evita reenviar toda a obra a cada nível e mantém proveniência/hierarquia explícitas.

### Uma chamada de IA por step durável

Cada alvo é sintetizado dentro de seu próprio `'use step'`. Se o workflow cair depois de várias sínteses, as já concluídas são reutilizadas por hash/modelo/prompt em vez de serem cobradas novamente.

### Prompt injection

O prompt v1 (`prompts/processamento/sintese-documental-hierarquica-v1.md`) declara explicitamente que o conteúdo-fonte é **DADO NÃO CONFIÁVEL** e que comandos/papéis/pedidos encontrados dentro do documento não devem ser executados.

### Structured Output

Saída aceita v1:

```json
{
  "sintese": "texto não vazio, até 12000 caracteres"
}
```

A resposta precisa passar por Structured Output + Zod antes de persistência.

### Limite v1

Uma entrada individual de síntese tem limite conservador de **400.000 caracteres**. Se uma seção ultrapassar esse limite, a etapa falha de forma explícita; chunking cognitivo adicional será uma evolução própria em vez de enviar entrada arbitrariamente grande.

### Retries e cobrança

- SDK OpenAI: `maxRetries: 0`.
- HTTP error explícito pode ser marcado como `falhou` e repetido sob nossa auditoria, até o limite controlado.
- falha ambígua de rede depois de uma chamada iniciada vira `incerta` e **não é repetida automaticamente**, evitando possível cobrança duplicada;
- reserva criada mas ainda não iniciada pode ser recuperada sem risco;
- depois de uma resposta paga válida, persistência no banco é repetida localmente/idempotentemente sem refazer a chamada externa.

## 7. Auditoria de IA

A migration `0030` criou `auditoria.execucoes_ia` com:

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

RPCs de IA seguem a mesma fronteira do resto do Pipeline: `SECURITY DEFINER`, `search_path=''`, `anon/authenticated` sem execução e grants apenas ao backend.

`0033` adicionou policy explícita de negação para clientes e índices das FKs apontadas pelo advisor.

## 8. Histórico de migrations — continuação

A sequência oficial anterior vai de `0001` a `0029`. Nesta branch, as novas migrations já foram aplicadas ao Supabase oficial depois de teste em `BEGIN ... ROLLBACK`:

| Versão | Migration | Finalidade |
|---|---|---|
| `20260917020401` | `0030_fundacao_ia_sinteses` | auditoria IA, modelo/prompt e RPCs server-only |
| `20260917021001` | `0031_recuperacao_reserva_ia` | separa reserva local de chamada externa iniciada |
| `20260917021151` | `0032_listagem_sinteses_auditadas` | replay por modelo/prompt/hash de entrada |
| `20260917021601` | `0033_hardening_auditoria_ia` | RLS deny explícito + índices de FKs |
| `20260917022624` | `0034_corrige_ambiguidade_tentativa_ia` | corrige ambiguidade SQL encontrada no teste funcional |

O antigo WIP de outro agente chamado `0028_ia_sinteses_secao` **nunca foi aplicado** e não deve ser usado; a numeração oficial `0028–0029` pertence às correções determinísticas já consolidadas.

## 9. Testes da nova camada de IA

Sem usar a chave real:

- input JSON determinístico + SHA-256;
- `store:false` verificado no cliente falso;
- Structured Output/Zod;
- uso de tokens/custo estimado;
- prompt injection permanece apenas como dado;
- entrada excessiva falha antes da chamada;
- ausência de `output_parsed` não vira síntese válida;
- custo desconhecido retorna `null` em vez de inventar preço;
- ordem bottom-up das seções;
- pais combinam texto próprio + sínteses dos filhos;
- seção sem fonte não cria chamada;
- síntese da obra usa apenas sínteses de topo.

Antes da integração completa, a suíte chegou a **50/50 testes** com lint, TypeScript e build verdes. O head final deve repetir todos os gates após `0034` e documentação.

## 10. Testes no Supabase real

Todas as migrations novas foram primeiro verificadas em transação revertida.

Além da compilação de DDL, foram exercitados com dados sintéticos e `ROLLBACK`:

- reserva idempotente de chamada IA;
- bloqueio de reserva duplicada;
- início da chamada;
- conclusão de síntese;
- conclusão repetida idempotente;
- replay concluído;
- listagem auditada com hash/modelo/prompt;
- `service_role` sem SELECT direto em `auditoria.execucoes_ia`;
- recuperação de reserva não iniciada;
- bloqueio de retry automático de chamada já iniciada e ambígua.

O teste funcional encontrou um bug real na `0031` (`tentativa = tentativa + 1` ambíguo por existir coluna de saída homônima). A correção foi feita corretamente em nova migration `0034`, sem reescrever a aplicada.

## 11. Segurança atual

Confirmado até `0034`:

- RLS nas superfícies pessoais/sensíveis;
- Storage privado;
- schemas internos fechados;
- RPCs backend-only;
- conteúdo do usuário tratado como dado;
- OpenAI server-only;
- `store:false`;
- audit trail de modelo/prompt/hash/tokens/custo;
- nenhuma nova FK sem índice após `0033`.

Advisor Supabase: permanece apenas a pendência externa **Leaked Password Protection Disabled**. Performance apresenta apenas `unused_index` enquanto o banco está sem corpus.

## 12. Gates obrigatórios

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

- Preview Vercel precisa ficar `READY`;
- advisors Supabase devem ser revisados após DDL;
- migrations precisam coincidir com o histórico remoto;
- documentação precisa refletir o mesmo head.

## 13. O que ainda NÃO foi feito

- nenhuma chamada real à OpenAI;
- nenhum gasto de API gerado por esta implementação;
- nenhum documento real processado ponta a ponta;
- `PROCESSAMENTO_WORKFLOW_ATIVO` não foi ativado;
- `criar_sinteses` ainda não foi incorporada à `main` enquanto o PR #16 estiver em validação;
- `extrair_elementos` e etapas posteriores ainda não foram iniciadas.

## 14. Próximo marco

1. fechar CI + banco local + Preview do PR #16;
2. atualizar Estado/Pipeline/ADRs;
3. tirar PR de draft apenas se todos os gates estiverem verdes;
4. incorporar a infraestrutura/step com feature flag ainda OFF;
5. **somente então pedir autorização explícita para a primeira chamada real paga**, usando um input controlado e custo mínimo;
6. depois disso preparar o primeiro E2E controlado de documento.

## 15. Regra permanente

O README deve dizer claramente o que existe, o que foi testado, o que está ativo, quanto pode custar, quais migrations estão aplicadas, quais alertas permanecem e qual é o próximo passo — sem tratar intenção futura como funcionalidade pronta.
