# Pipeline Documental — implementação operacional

Este documento descreve a implementação do Pipeline Documental. Ele **não substitui** a Arquitetura Técnica, o Plano de Construção nem o Dicionário Mestre; decisões de implementação não congeladas nessas fontes são registradas em `docs/DECISOES.md`.

## Princípios canônicos

O Pipeline transforma uma versão física preservada na Biblioteca em representação computacional integral, auditável e versionada.

Regras permanentes:

- o original nunca é alterado;
- resultado parcial não é Documento Processado ativo;
- resultado parcial nunca alimenta o Cérebro Autoral;
- cada etapa é idempotente, reexecutável, observável e recuperável;
- proveniência precisa ligar resultado a obra/versão, execução, pipeline, taxonomia e, quando houver IA, modelo/prompt;
- conteúdo do usuário é **dado**, nunca instrução;
- ausência de evidência preserva incerteza em vez de inventar estrutura.

## Máquina operacional v1

```text
validar_arquivo
  → identificar_formato
  → extrair_conteudo
  → normalizar_conteudo
  → identificar_estrutura
  → criar_hierarquia
  → criar_fragmentos
  → criar_sinteses
  → extrair_elementos
  → classificar_taxonomia
  → criar_embeddings
  → criar_relacoes
  → validar_resultado
  → publicar_documento
```

A feature flag permanece:

```text
PROCESSAMENTO_WORKFLOW_ATIVO=false
```

Ela só poderá ser ligada depois de E2E positivo com documento controlado.

## Fronteira de segurança

O navegador não acessa schemas internos. O backend usa RPCs `aplicacao.backend_*`:

- `SECURITY DEFINER`;
- `search_path = ''`;
- objetos sempre qualificados por schema;
- `anon`/`authenticated` sem `EXECUTE`;
- `service_role` recebe somente grants explícitos necessários.

O Storage de originais e o Storage de artefatos intermediários são privados.

## Artefatos intermediários

Processamento parcial sobrevive a retries/crash por meio de:

- `processamento.artefatos_execucao`;
- bucket privado `artefatos-processamento`;
- hash SHA-256;
- tamanho;
- MIME;
- metadados/proveniência;
- caminho determinístico por usuário/execução/tipo.

Tipos atuais:

```text
conteudo_extraido
conteudo_normalizado
estrutura_identificada
```

Artefato intermediário nunca é confundido com Documento Processado publicado.

---

## 1. `validar_arquivo`

Etapa determinística.

1. obtém contexto da execução;
2. cria URL assinada curta do original;
3. lê o arquivo em streaming;
4. recalcula SHA-256 e tamanho no servidor;
5. compara com `biblioteca.versoes_obras`;
6. divergência de integridade é falha determinística;
7. falha transitória de rede/Storage usa retry do Workflow.

O navegador fornece hash inicial, mas não é autoridade final de integridade.

---

## 2. `identificar_formato`

Allowlist v1:

- PDF com camada textual;
- TXT UTF-8;
- Markdown UTF-8.

A identificação não confia em um único sinal. Combina extensão, MIME e conteúdo.

PDF exige assinatura `%PDF-`. Texto rejeita NUL/controles binários incompatíveis e UTF-8 inválido.

DOCX permanece fora do escopo até validação segura OOXML. PDF sem camada textual não é enviado à IA; retorna caso explícito para futura estratégia de OCR.

---

## 3. `extrair_conteudo`

Etapa determinística.

TXT/Markdown:

- decodificação UTF-8 completa;
- BOM tratado;
- conteúdo vazio/UTF-8 inválido rejeitado.

PDF:

- `unpdf`/PDF.js serverless;
- processamento página a página, sequencial;
- número da página preservado;
- sem fan-out irrestrito.

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

Antes da extração, o original é revalidado por hash e tamanho novamente.

Resultado: `conteudo_extraido.json` privado.

---

## 4. `normalizar_conteudo`

Etapa determinística e conservadora, nunca editorial.

Transformações permitidas:

```text
CRLF / CR → LF
Unicode   → NFC
```

Não faz:

- correção gramatical;
- reescrita;
- mudança de caixa;
- mudança de pontuação;
- colapso de espaços;
- NFKC/NFKD;
- alteração de vocabulário/estilo.

Preserva espaços significativos de Markdown e fronteiras de página PDF.

Antes de criar ou reutilizar o resultado, valida bytes, MIME, limite, SHA-256, tamanho, schema e proveniência:

```text
original
  ↓
conteudo_extraido
  ↓
conteudo_normalizado
```

Em replay, o arquivo é baixado novamente e revalidado; o registro do banco sozinho não é considerado prova de integridade.

---

## 5. `identificar_estrutura`

Etapa determinística. Consome somente `conteudo_normalizado` validado e produz `estrutura_identificada`.

Sinais de alta confiança:

- cabeçalho Markdown (`#` a `######`) quando formato = Markdown;
- `Parte`/`Capítulo` + número arábico ou romano maiúsculo;
- `Seção`/`Subseção` + numeração arábica;
- `Anexo` + número ou letra maiúscula;
- `Prefácio`/`Posfácio` isolados.

Sinal de baixa confiança:

- linha curta inteiramente maiúscula candidata a título, sem tipo imposto.

Marcadores só são avaliados em linhas curtas para reduzir falsos positivos de prosa.

Sem sinal de alta confiança:

```text
possui_indicios_estruturais = false
```

Nenhuma divisão é inventada.

Para PDF, cada unidade preserva:

- número da página;
- offset em caracteres **dentro daquela página**.

Esse offset passou a ser persistido em `processamento.secoes` pela migration `0028`, porque número de página sozinho não é suficiente para fragmentação precisa.

---

## 6. `criar_hierarquia`

Materializa:

- `processamento.documentos_processados` em estado `candidato`;
- `processamento.secoes`.

Usa somente sinais de alta confiança.

Hierarquia v1:

```text
Parte
  └─ Capítulo
       └─ Seção
            └─ Subseção

Anexo / Prefácio / Posfácio → nível raiz, nunca container
```

Cabeçalhos Markdown:

```text
#   → capítulo
##  → seção
###+ → subseção
```

Sem sinais confiáveis: cria exatamente uma seção sem título cobrindo o documento inteiro.

### Posições em texto/Markdown

`indice_inicio`/`indice_fim` representam limites no conteúdo global.

### Posições em PDF

- `pagina_inicial`/`pagina_final` representam extensão aproximada da subárvore;
- `offset_pagina_inicio` representa a posição exata do título dentro da página inicial.

A migration `0028_offsets_pdf_fragmentacao` adicionou esse offset sem alterar migrations anteriores.

A materialização continua idempotente por `aplicacao.backend_criar_hierarquia_documento`.

---

## 7. `criar_fragmentos`

V1 cria um fragmento por seção; ainda não subdivide uma seção muito longa em múltiplos blocos.

O fragmento representa o texto **próprio** da seção, não todo o conteúdo da subárvore.

### Texto/Markdown

Recorte:

```text
indice_inicio da seção atual
→ indice_inicio da próxima seção
```

Isso evita repetir o texto de uma subseção no fragmento do capítulo pai.

### PDF — correção de precisão intrapágina

A revisão de handoff identificou dois bugs possíveis no algoritmo por página:

1. dois títulos na mesma página poderiam causar duplicação daquela página em mais de um fragmento;
2. quando a próxima seção começava no meio da página seguinte, o texto que aparecia no início dessa página antes do novo título podia ser perdido.

A correção usa:

```text
pagina_inicial + offset_pagina_inicio
```

Para cada seção:

- na primeira página, começa exatamente no offset da seção;
- páginas intermediárias entram por inteiro;
- na página onde começa a próxima seção, inclui somente o prefixo anterior ao offset do próximo título;
- se duas seções começam na mesma página, a primeira termina exatamente no offset da segunda.

Assim o texto não é duplicado nem descartado nas fronteiras testadas.

### Título sem corpo

Se o trecho contém apenas o próprio título, não cria fragmento.

### Contexto

Cada fragmento recebe `conteudo_contextualizado` com breadcrumb, por exemplo:

```text
Parte I > Capítulo 1 > Seção 1.1

[texto próprio]
```

`quantidade_tokens` ainda é estimativa determinística por tamanho do texto, não tokenização oficial de modelo.

### Persistência

`aplicacao.backend_criar_fragmentos_documento` continua idempotente e mantém os vínculos anterior/seguinte.

### Replay seguro

A auditoria identificou que a primeira implementação retornava cedo demais quando a máquina de estados dizia que a etapa já havia sido executada.

Isso foi corrigido.

Agora, mesmo em replay:

1. contexto da execução é reobtido;
2. `conteudo_extraido` e `conteudo_normalizado` precisam existir;
3. `conteudo_normalizado` é baixado e revalidado por bytes/MIME/tamanho/hash/schema/proveniência;
4. seções são relidas;
5. fragmentos esperados são recalculados deterministicamente;
6. fragmentos persistidos são lidos por `aplicacao.backend_listar_fragmentos_documento` (`0029`);
7. resultado persistido é comparado com o esperado por seção, código, ordem, páginas, conteúdo, contexto e estimativa de tokens.

Se houver ausência ou divergência, o replay falha com código determinístico em vez de fingir sucesso.

A execução normal também compara os fragmentos depois da escrita, antes de concluir a etapa.

---

## 8. `criar_sinteses` — próxima etapa cognitiva

Ainda não está consolidada.

Existe um WIP antigo em `claude/confident-cannon-ovdoev` (`0b9d739...`) com um rascunho de OpenAI e um arquivo local chamado `0028_ia_sinteses_secao`. Esse arquivo nunca foi aplicado ao Supabase.

Como o número oficial `0028` agora pertence à correção de offsets PDF, o rascunho de sínteses deve ser **reavaliado, renumerado e testado do zero** antes de uso.

Requisitos para a implementação:

- pesquisar documentação oficial atual da OpenAI;
- cliente injetável para testes sem API real;
- Responses API;
- `store:false`;
- Structured Outputs/JSON Schema;
- validação Zod;
- modelo e prompt versionados;
- auditoria de execução IA;
- nenhuma saída livre persistida sem validação;
- SQL nova validada em `BEGIN ... ROLLBACK` contra o banco oficial antes de `apply_migration`;
- nenhuma chamada paga real sem confirmação do proprietário.

Sínteses serão hierárquicas e deverão manter vínculo/proveniência com os fragmentos/seções que as originaram.

---

## Documento Processado e publicação

A estrutura preservada é:

```text
obra → parte → capítulo → seção → fragmento
```

Documento Processado permanece `candidato` durante o Pipeline.

Somente depois de sínteses, elementos, taxonomia, embeddings, relações e `validar_resultado` poderá passar por `publicar_documento`.

Estado `ativo` exige publicação explícita; resultado parcial nunca alimenta o Cérebro.

---

## Testes obrigatórios

Aplicação, no mesmo commit:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

Banco local:

```text
supabase start
migrations + seed
supabase db reset
supabase status
supabase stop --no-backup
```

Na auditoria da fragmentação foram adicionados testes para:

- duas seções na mesma página PDF sem duplicação;
- preservação do texto anterior a um título que começa no meio da página seguinte;
- replay só aceito quando persistência corresponde ao cálculo determinístico.

A rodada que incluiu esses testes registrou **39/39 testes passando**, build verde, audit com 0 vulnerabilidades, Preview Vercel READY e reconstrução do Supabase local passando até `0029`.

Após qualquer commit posterior de documentação/limpeza, os gates devem ser repetidos no head final antes do merge.

---

## Pendências antes de ativar o Pipeline

- E2E positivo com obra controlada;
- Leaked Password Protection do Supabase Auth;
- ajuste administrativo Node 22.x no Vercel;
- decisão sobre Ruleset de `main`;
- conclusão das etapas cognitivas e de publicação.

`PROCESSAMENTO_WORKFLOW_ATIVO` permanece `false` até esses critérios relevantes serem satisfeitos.
