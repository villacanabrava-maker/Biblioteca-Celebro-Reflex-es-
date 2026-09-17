# Cérebro Autoral

Plataforma de **Inteligência Autoral Personalizada** para preservar a produção intelectual do usuário, transformá-la em conhecimento estruturado, inferir padrões de pensamento com evidências/proveniência e usar esse Cérebro Autoral para apoiar novas reflexões com revisão humana.

> **Este README é o painel mestre operacional do projeto.** Os documentos canônicos fornecidos pelo proprietário continuam sendo a fonte de verdade do produto.

## Regra central

A IA pode interpretar, organizar, relacionar, propor e escrever. Identidade autoral, permissões, estados, versões, proveniência, publicação e persistência permanecem sob controle determinístico do sistema e do autor.

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

Conteúdo do usuário é **dado não confiável**, nunca instrução para o sistema ou para os modelos de IA. Preservar incerteza é melhor do que inventar estrutura, autoria, relação ou fato sem evidência.

## Infraestrutura oficial — somente esta

### GitHub

```text
villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
branch principal: main
base desta PR: bc9820d45f5c6fc160055556ede48964c6e23da9
PR #20: incorporada — normalizar_taxonomia auditável
PR #21: incorporada — sincronização documental pós-PR20
PR #22: em desenvolvimento — criar_relacoes auditável
```

O repositório continua público por decisão explícita do proprietário. Não alterar visibilidade sem autorização.

### Supabase

```text
Projeto: Biblioteca-Celebro-Reflex-es-
Project ref: xzkzdaxxmizcgfkjgzoq
Região: us-west-2
PostgreSQL: 17.6
```

Estado auditado após as migrations `0047–0048`:

```text
0 execuções de processamento
0 Documentos Processados
0 elementos
0 relações entre elementos
0 execuções de IA
```

As migrations criam infraestrutura, configuração, auditoria e persistência, mas não processam obras nem executam chamadas externas.

### Vercel

```text
Projeto: cerebro-autoral
Produção: https://cerebro-autoral.vercel.app
Git: villacanabrava-maker/Biblioteca-Celebro-Reflex-es-
```

`PROCESSAMENTO_WORKFLOW_ATIVO=false` continua impedindo o início do Pipeline para usuários. Portanto o código de IA permanece implantável/testável sem autorizar chamadas pagas.

O Dashboard ainda pode reportar Node `24.x`, enquanto `package.json` exige Node `22.x`; CI e Vercel usam Node 22.x por causa de `engines`.

Outros projetos GitHub/Supabase/Vercel da conta não pertencem ao Cérebro Autoral e não devem ser tocados.

## Stack atual

- Next.js `16.3.5`
- React `19.3.0`
- TypeScript `6.0.3`
- Node `22.x`
- npm `11.19.1`
- ESLint `9.39.5`
- Supabase JS `2.116.0`
- Supabase SSR `0.12.7`
- Supabase CLI `2.117.0` no CI
- Vercel Workflow SDK `4.8.9`
- OpenAI SDK `7.15.0`
- Zod `4.6.5`
- `unpdf` `1.8.1`
- PostgreSQL + pgvector/HNSW + Full Text Search + pg_trgm
- Storage privado + RLS

Supply chain:

```json
"overrides": {
  "nanoid": "5.1.16",
  "undici": "7.29.0"
}
```

`npm audit --omit=dev --audit-level=high` é gate obrigatório.

## Pipeline documental

| Etapa | Estado |
|---|---|
| `validar_arquivo` | ✅ concluída/testada |
| `identificar_formato` | ✅ PDF textual/TXT/Markdown |
| `extrair_conteudo` | ✅ concluída/testada |
| `normalizar_conteudo` | ✅ concluída/testada |
| `identificar_estrutura` | ✅ concluída/testada |
| `criar_hierarquia` | ✅ concluída/testada |
| `criar_fragmentos` | ✅ concluída/testada/auditada |
| `criar_sinteses` | ✅ implementada/auditada, sem chamada real |
| `extrair_elementos` | ✅ implementada/auditada, sem chamada real |
| `normalizar_taxonomia` | ✅ incorporada/auditada, sem chamada real |
| `criar_relacoes` | ✅ implementada/auditada na PR #22, sem chamada real |
| `gerar_embeddings` | ⬜ próxima etapa |
| `criar_indices` | ⬜ não iniciada |
| `realizar_analise_autoral_local` | ⬜ não iniciada |
| `validar_processamento` | ⬜ não iniciada |
| `publicar_documento_processado` | ⬜ não iniciada |
| `avaliar_participacao_cerebro` | ⬜ não iniciada |
| `atualizar_cerebro` | ⬜ não iniciada |

A ordem canônica permanece:

```text
...
extrair_elementos
→ normalizar_taxonomia
→ criar_relacoes
→ gerar_embeddings
→ criar_indices
→ realizar_analise_autoral_local
→ validar_processamento
→ publicar_documento_processado
→ avaliar_participacao_cerebro
→ atualizar_cerebro
```

Nenhum processamento parcial alimenta o Cérebro Autoral.

## `normalizar_taxonomia` — arquitetura v1

A Taxonomia Mestre existente vem antes de qualquer proposta nova. Match exato único é determinístico; similaridade textual apenas recupera candidatos; propostas novas permanecem em staging revisável. Casos com IA congelam a shortlist na auditoria e o PostgreSQL recusa IDs fora dela.

Migrations oficiais da etapa:

```text
20260917040851_0040_fundacao_normalizacao_taxonomia.sql
20260917040918_0041_catalogo_normalizacao_taxonomia.sql
20260917040937_0042_hardening_taxonomia_ativa.sql
20260917041025_0043_auditoria_normalizacao_taxonomia.sql
20260917041039_0044_replay_match_exato_taxonomia.sql
20260917041057_0045_alinha_etapas_pipeline_canonico.sql
20260917041526_0046_hardening_propostas_taxonomia.sql
```

## `criar_relacoes` — arquitetura v1

### Entidade canônica

A etapa persiste em `processamento.relacoes_elementos`:

```text
elemento_origem_id
→ tipo_relacao
→ elemento_destino_id
+ confianca
+ justificativa
```

Vocabulário v1 do Dicionário Mestre:

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

O banco já impõe que origem e destino sejam elementos do mesmo usuário, impede relação reflexiva e impede duplicação da mesma combinação origem + tipo + destino.

### Estratégia de candidatos v1

Os documentos canônicos definem a entidade e o vocabulário, mas não prescrevem como gerar pares candidatos antes dos embeddings.

**Decisão conservadora de implementação:** nesta primeira versão, a IA recebe somente elementos que compartilham o mesmo fragmento/evidência local. Isso evita um grafo O(n²) global e relações distantes pouco sustentadas antes de existir recuperação vetorial/híbrida.

Relações entre capítulos, partes, obras ou documentos não são proibidas pelo produto; apenas ficam adiadas para enriquecimento posterior, quando houver embeddings e recuperação adequada.

### Segurança semântica

- títulos, descrições e trechos são dados não confiáveis;
- nenhum conhecimento externo é permitido no prompt v1;
- a saída vazia é válida — o modelo nunca é obrigado a inventar vínculo;
- origem/destino precisam ser IDs fornecidos pelo sistema;
- origem e destino iguais são rejeitados;
- relações duplicadas são rejeitadas;
- máximo de 40 elementos candidatos e 80 relações por fragmento;
- cada justificativa tem máximo de 1.200 caracteres;
- Structured Outputs + JSON Schema + Zod;
- `store:false`.

### Custo e caminho determinístico

Fragmentos com menos de dois elementos não chamam IA e retornam zero relações deterministicamente.

Para fragmentos analisáveis:

1. o sistema monta o contexto local de elementos + evidências;
2. calcula hash SHA-256 determinístico;
3. congela exatamente os `elementos_ids` na auditoria;
4. marca o início da chamada externa;
5. valida a saída na aplicação;
6. o PostgreSQL revalida IDs, fragmento, tipos, confiança, justificativa e duplicações;
7. persiste atomicamente as relações;
8. registra IDs, tokens, duração, custo estimado e `response_id` na auditoria.

### Idempotência e cobrança

- replay exige execução + fragmento + modelo + prompt + hash exatos;
- lista de elementos divergente da reserva é rejeitada;
- HTTP transitório conhecido (`408`, `409`, `425`, `429`, `5xx`) pode ser repetido de forma controlada;
- HTTP permanente não é repetido automaticamente;
- transporte ambíguo depois do início vira `incerta`;
- resposta estruturada inválida é terminal e não dispara nova cobrança automática;
- persistência pós-resposta pode ser repetida localmente sem refazer a chamada externa;
- saída válida vazia também é auditada e replayável.

### Migrations oficiais

```text
20260917043826_0047_catalogo_contexto_relacoes_elementos.sql
20260917043906_0048_auditoria_persistencia_relacoes_elementos.sql
```

Os nomes no GitHub correspondem às versões reais registradas no Supabase.

## OpenAI

Configuração de modelos é centralizada:

```text
MODELO_IA_ANALISE
MODELO_IA_EXTRACAO
MODELO_IA_TAXONOMIA
```

`criar_relacoes` reutiliza a finalidade interna `analise` em vez de criar um novo identificador de modelo espalhado pelo sistema.

Política permanente:

- chave apenas em ambiente servidor;
- `maxRetries:0` no SDK;
- `store:false` para conteúdo intelectual privado;
- Structured Outputs + JSON Schema + Zod;
- retry, idempotência e cobrança controlados pela camada auditável;
- nenhuma chamada real paga sem autorização explícita do proprietário.

**Nenhuma chamada real paga foi executada até este ponto.**

## Segurança

Mantido e auditado após `0048`:

- schemas internos fechados;
- RLS;
- Storage privado;
- RPCs de relações `SECURITY DEFINER` com `search_path=''`;
- `anon`/`authenticated` sem `EXECUTE` nas novas RPCs;
- `service_role` permitido somente pelo backend;
- feature flag de processamento desligada.

Advisor de segurança: resta apenas `Leaked Password Protection Disabled`, configuração externa do Supabase Auth.

Advisor de performance: somente `unused_index`, esperado enquanto o banco permanece sem corpus. Não remover índices especulativamente antes de existir carga real.

## Gates da PR #22

Já comprovados durante a implementação:

```text
lint / TypeScript / testes do motor          ✅
build Vercel Preview                         ✅
Supabase local + migrations 0047–0048        ✅
supabase db reset                            ✅
Supabase oficial 0047–0048                   ✅
RPCs fechadas ao browser                     ✅
0 dados / 0 execuções de IA após migrations  ✅
```

O head final ainda deve repetir CI + Preview depois desta consolidação documental antes de qualquer merge.

## Próximo marco

1. concluir CI/Preview do head final da PR #22;
2. incorporar `criar_relacoes` mantendo `PROCESSAMENTO_WORKFLOW_ATIVO=false`;
3. validar produção sem executar IA;
4. iniciar `gerar_embeddings`;
5. manter a primeira chamada real paga bloqueada até autorização explícita;
6. preparar E2E controlado somente quando houver autorização para custo real.

## Regra permanente

Nenhuma migration aplicada é reescrita. Nenhum segredo é commitido. Saída de IA só alimenta o banco depois de validação estrutural e com proveniência suficiente para auditoria/replay. O proprietário permanece autoridade final sobre autoria e incorporação ao Cérebro Autoral.
