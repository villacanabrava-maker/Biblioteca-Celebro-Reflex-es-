# Estado Atual do Projeto

Atualizado em **17/09/2026** após a implementação e sincronização estrutural de `criar_relacoes`, ainda com `PROCESSAMENTO_WORKFLOW_ATIVO=false` e sem chamada real paga à OpenAI.

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- base da PR #22: `bc9820d45f5c6fc160055556ede48964c6e23da9`
- PR #22: `feature/criar-relacoes`
- Supabase: `xzkzdaxxmizcgfkjgzoq` — `us-west-2`, PostgreSQL 17.6
- Vercel: `cerebro-autoral`
- produção: `https://cerebro-autoral.vercel.app`
- feature flag: `PROCESSAMENTO_WORKFLOW_ATIVO=false`

Outros projetos conectados não pertencem a este aplicativo.

## Marco atual do Pipeline

```text
validar_arquivo                  ✅
identificar_formato              ✅
extrair_conteudo                 ✅
normalizar_conteudo              ✅
identificar_estrutura            ✅
criar_hierarquia                 ✅
criar_fragmentos                 ✅
criar_sinteses                   ✅ implementada/auditada; sem chamada real
extrair_elementos                ✅ implementada/auditada; sem chamada real
normalizar_taxonomia             ✅ incorporada/auditada; sem chamada real
criar_relacoes                   ✅ implementada/auditada na PR #22; sem chamada real
gerar_embeddings                 ⬜ próxima etapa
criar_indices                    ⬜ não iniciada
realizar_analise_autoral_local   ⬜ não iniciada
validar_processamento            ⬜ não iniciada
publicar_documento_processado    ⬜ não iniciada
avaliar_participacao_cerebro     ⬜ não iniciada
atualizar_cerebro                ⬜ não iniciada
```

O Workflow integrado conclui `criar_relacoes` com:

```text
estado = vetorizando
etapa_atual = gerar_embeddings
```

Nenhum resultado parcial alimenta o Cérebro Autoral.

## Estado real dos dados

Auditoria do Supabase oficial após `0047–0048`:

```text
execuções de processamento: 0
Documentos Processados:     0
elementos:                  0
relações entre elementos:   0
execuções de IA:            0
```

A aplicação das migrations não criou corpus nem fez chamada externa.

## Fonte canônica do grafo intelectual

O Dicionário Mestre define `processamento.relacoes_elementos` com:

```text
id
usuario_id
elemento_origem_id
tipo_relacao
elemento_destino_id
confianca
justificativa
criado_em
```

Vocabulário v1:

```text
sustenta
contradiz
expande
deriva_de
exemplifica
questiona
responde_a
evolui_para
associa_se_a
reformula
```

A tabela já possuía FKs compostas por usuário, confiança entre 0 e 1, proibição de relação reflexiva e unicidade da combinação origem + tipo + destino.

## Estratégia de candidatos v1

Os documentos canônicos especificam a entidade/vocabulário, mas não a estratégia de geração de pares candidatos.

Para esta primeira implementação foi escolhida uma estratégia conservadora:

```text
fragmento
→ elementos com evidência nesse fragmento
→ relações locais entre esses elementos
```

Motivação:

- evita comparar globalmente todos os elementos entre si antes dos embeddings;
- reduz custo e ruído;
- mantém a primeira inferência apoiada em evidência local comum;
- preserva caminho futuro para relações distantes/interdocumentais usando recuperação híbrida.

Essa limitação é operacional da v1, não uma limitação conceitual do produto.

## Contrato da IA

Prompt: `relacoes_elementos_locais` v1.

Cada relação possui:

```text
elemento_origem_id
tipo_relacao
elemento_destino_id
confianca
justificativa
```

Guardrails:

- saída `{ relacoes: [] }` é válida;
- máximo 80 relações por fragmento;
- máximo 40 elementos candidatos por chamada;
- IDs precisam vir do conjunto fornecido;
- origem e destino não podem ser iguais;
- duplicação de origem + tipo + destino é rejeitada;
- justificativa deve ter 1–1.200 caracteres;
- conteúdo/evidência é dado não confiável, não instrução;
- Structured Outputs + Zod;
- `store:false`.

Fragmentos com menos de 2 elementos retornam 0 relações sem chamar IA.

## Auditoria e idempotência

Operação de IA:

```text
relacoes_elementos_locais
```

Por fragmento analisável, a auditoria congela:

- execução;
- Documento Processado;
- fragmento;
- modelo;
- versão de prompt;
- hash da entrada;
- lista exata de `elementos_ids`.

Chave idempotente:

```text
operacao
+ execucao
+ fragmento
+ modelo
+ prompt
+ hash_entrada
```

Política de cobrança/retry:

- reserva ainda não iniciada pode ser retomada;
- chamada externa é explicitamente marcada como iniciada;
- HTTP `408/409/425/429/5xx` pode permitir retry controlado;
- HTTP permanente não é repetido automaticamente;
- transporte ambíguo depois do início vira `incerta`;
- saída inválida é cancelada sem nova chamada automática;
- persistência pós-resposta pode ser repetida localmente sem refazer a chamada;
- replay reutiliza resultado concluído e valida que os IDs persistidos ainda existam.

## Persistência determinística no PostgreSQL

`backend_concluir_relacoes_elementos_ia` revalida antes do insert:

- formato do array;
- máximo 80 relações;
- campos permitidos;
- UUIDs;
- vocabulário dos 10 tipos;
- confiança 0–1;
- justificativa não vazia e limitada;
- não reflexividade;
- ambos os elementos presentes na lista congelada;
- ambos os elementos ainda possuem evidência no fragmento auditado;
- ausência de duplicação no payload.

A persistência usa a unique key já existente da tabela e reaproveita relação idêntica se ela já existir.

Saída vazia também conclui a auditoria com `relacoes_ids=[]` e `quantidade_relacoes=0`.

## Migrations oficiais

```text
20260917043826_0047_catalogo_contexto_relacoes_elementos.sql
20260917043906_0048_auditoria_persistencia_relacoes_elementos.sql
```

`0047`:

- catálogo do prompt/schema;
- uso do modelo de finalidade `analise`;
- RPC backend-only para configuração;
- RPC backend-only para contexto local elemento/evidência por fragmento.

`0048`:

- adiciona operação `relacoes_elementos_locais` à auditoria;
- reserva idempotente por fragmento;
- congela `elementos_ids`;
- conclusão transacional com revalidação no PostgreSQL;
- replay auditado.

As versões acima correspondem ao histórico real do Supabase e aos nomes no GitHub.

## Segurança auditada

As cinco RPCs novas foram verificadas no Supabase oficial:

```text
SECURITY DEFINER = true
search_path = ''
anon EXECUTE = false
authenticated EXECUTE = false
service_role EXECUTE = true
```

Advisor de segurança após `0048`: apenas `Leaked Password Protection Disabled` no Supabase Auth.

Advisor de performance após `0048`: apenas `unused_index`, esperado porque o banco permanece sem corpus.

## Validação automatizada

Cobertura nova sem API real:

- input/hash determinísticos;
- schema persistido exatamente compatível;
- menos de dois elementos → 0 chamadas e 0 custo;
- rejeição de ID fora do contexto;
- rejeição de relação reflexiva;
- rejeição de duplicação;
- Structured Output;
- `store:false`;
- saída vazia válida;
- preservação da direção semântica;
- tokens/custo estimado.

Os runs de implementação já comprovaram:

```text
lint / TypeScript                             ✅
testes unitários após correção do import      ✅
build Vercel Preview                          ✅
Supabase local + migrations 0047–0048         ✅
supabase db reset                             ✅
Supabase oficial 0047–0048                    ✅
RPCs backend-only                             ✅
0 dados / 0 execuções de IA                   ✅
```

O head documental final ainda deve repetir CI + Preview antes de merge.

## OpenAI

`criar_relacoes` usa a configuração central `MODELO_IA_ANALISE`; não foi criado um ID de modelo hardcoded dentro do Workflow.

Política permanente:

- chave apenas no servidor;
- `maxRetries:0` no SDK;
- `store:false`;
- Structured Outputs + JSON Schema + Zod;
- retries/cobrança controlados pela aplicação;
- nenhuma chamada real paga sem autorização explícita do proprietário.

Até este estado, **0 execuções de IA existem no banco oficial**.

## O que ainda NÃO ocorreu

- chamada real à OpenAI;
- cobrança de API gerada por esta etapa;
- ativação de `PROCESSAMENTO_WORKFLOW_ATIVO`;
- E2E positivo com documento real;
- enriquecimento de relações distantes/interdocumentais;
- geração de embeddings;
- publicação de Documento Processado ativo;
- alimentação do Cérebro Autoral por corpus real.

## Próximo marco

1. fechar CI/Preview do head final da PR #22;
2. incorporar `criar_relacoes` mantendo a feature flag OFF;
3. validar produção sem chamada de IA;
4. iniciar `gerar_embeddings`;
5. manter a primeira chamada real paga bloqueada até autorização explícita do proprietário.

## Regra permanente

Nenhum segredo é commitido. Nenhuma migration aplicada é alterada retrospectivamente. Saída de IA só pode ser persistida depois de validação estrutural e sempre carrega proveniência suficiente para auditoria/replay. O proprietário permanece autoridade final sobre autoria e incorporação ao Cérebro Autoral.
