# Pipeline Documental — implementação operacional

Este documento descreve como o Pipeline Documental está sendo implementado no repositório. Ele **não substitui** a Arquitetura Técnica, o Plano de Construção nem o Dicionário Mestre fornecidos pelo proprietário; quando uma escolha não está congelada nesses documentos, ela é tratada como decisão arquitetural e registrada em `docs/DECISOES.md`.

## Princípios canônicos preservados

O Pipeline transforma uma versão física preservada na Biblioteca em uma representação computacional integral, auditável e versionada. Um resultado parcial **não** é Documento Processado e nunca alimenta o Cérebro Autoral.

Cada etapa deve ser idempotente, reexecutável, observável, versionada e recuperável. Proveniência deve permitir responder qual obra/versão, execução, pipeline, taxonomia, modelo/prompt quando houver IA, e evidência concreta produziram cada resultado.

O original da Biblioteca nunca é modificado pelo processamento.

## Máquina operacional v1

A execução persistida usa as etapas:

```text
validar_arquivo
  -> identificar_formato
  -> extrair_conteudo
  -> normalizar_conteudo
  -> identificar_estrutura
  -> criar_hierarquia
  -> criar_fragmentos
  -> criar_sinteses
  -> extrair_elementos
  -> classificar_taxonomia
  -> criar_embeddings
  -> criar_relacoes
  -> validar_resultado
  -> publicar_documento
```

Os documentos canônicos descrevem ainda atividades posteriores/mais amplas de análise autoral e atualização do Cérebro. Essas atividades não são antecipadas nesta máquina enquanto o Pipeline documental básico não estiver completo e validado.

## Fronteira de segurança

O navegador não recebe acesso direto aos schemas internos. Operações do Pipeline passam por RPCs server-only em `aplicacao`, executáveis somente pelo backend e implementadas como `SECURITY DEFINER` com `search_path = ''`.

`anon` e `authenticated` não executam as RPCs `backend_*`.

O Workflow permanece protegido por:

```text
PROCESSAMENTO_WORKFLOW_ATIVO=false
```

até existir E2E positivo com documento controlado.

## `validar_arquivo`

1. obtém o contexto da execução;
2. gera URL assinada curta do original privado;
3. lê o arquivo em streaming;
4. recalcula SHA-256 e tamanho;
5. compara com a versão física registrada na Biblioteca;
6. falha deterministicamente em caso de divergência;
7. usa retries do Workflow para falhas transitórias de rede/Storage.

## `identificar_formato`

A primeira allowlist processável contém:

- PDF com camada textual;
- TXT UTF-8;
- Markdown UTF-8.

A decisão não confia isoladamente em extensão ou MIME. O detector combina nome, MIME e amostra de conteúdo. PDF exige assinatura `%PDF-`; texto rejeita NUL/controles binários e amostra UTF-8 inválida.

DOCX permanece fora do escopo até validação segura do container OOXML. PDF escaneado sem camada textual não é enviado a IA; é classificado como caso que exigirá estratégia de OCR própria.

## `extrair_conteudo`

A extração continua determinística.

TXT/Markdown são decodificados integralmente como UTF-8 dentro de limite explícito. PDF usa `unpdf`/PDF.js serverless e percorre páginas sequencialmente, preservando número de página.

Antes da extração, o original é novamente conferido por hash e tamanho para detectar alteração entre etapas.

Guardrails operacionais v1:

```text
TXT/Markdown original: 20 MiB
PDF original:          50 MiB
PDF:                   até 1.000 páginas
Texto extraído:        até 12.000.000 caracteres
Artefato JSON:         até 30 MiB
Imagem interna PDF:    até 16.777.216 pixels
Parsing PDF:           até 90 s
```

Esses limites são decisões técnicas versionadas e poderão mudar com evidência operacional.

## `normalizar_conteudo`

A normalização é **técnica e conservadora**, não editorial. Sua função é produzir representação textual consistente sem corrigir estilo, gramática, argumentação ou escolhas linguísticas do autor.

Política v1:

```text
CRLF / CR -> LF
Unicode   -> NFC
NFKC/NFKD -> não usados como normalização autoral
```

São preservados:

- caixa;
- pontuação;
- aspas e travessões;
- espaços internos;
- espaços significativos de Markdown;
- escolhas lexicais;
- ordem e fronteira das páginas de PDF.

O motivo para NFC é preservar equivalência canônica sem aplicar equivalência de compatibilidade, que pode apagar distinções úteis do texto. A normalização não faz `trim`, não colapsa espaços e não reescreve frases.

Antes de normalizar, `conteudo_extraido` é baixado do Storage privado e revalidado por MIME, limite, SHA-256, tamanho, schema e vínculo com o hash do original. O resultado vira `conteudo_normalizado.json`, também privado, ligado ao hash do artefato extraído e ao hash do original.

Se já existir `conteudo_normalizado`, o replay **não confia apenas no registro do banco**: baixa novamente os bytes, verifica hash/tamanho/schema/proveniência e só então reutiliza. Quando a máquina de estados já avançou, o replay não repete a transição `normalizar_conteudo -> identificar_estrutura`.

## `identificar_estrutura`

A etapa consome exclusivamente `conteudo_normalizado` validado (bytes revalidados por MIME, limite, SHA-256, tamanho, schema e proveniência, como nas etapas anteriores). Ela **não** materializa `processamento.secoes` — apenas produz um artefato de evidência (`estrutura_identificada`) que a futura `criar_hierarquia` usará para decidir a estrutura real.

Sinais determinísticos reconhecidos, por linha:

```text
alta confiança:
  cabeçalho Markdown (#, ##, ... ######) — apenas quando formato = markdown
  marcador numerado: Parte/Capítulo + algarismo arábico ou numeral romano MAIÚSCULO
  marcador numerado: Seção/Subseção + algarismo arábico (1, 1.2, ...)
  marcador numerado: Anexo + algarismo ou letra maiúscula
  marcador isolado: linha igual a "Prefácio" ou "Posfácio"

baixa confiança:
  linha inteiramente maiúscula, curta, candidata a título (sem tipo atribuído)
```

O numeral romano após Parte/Capítulo é comparado com distinção de maiúsculas/minúsculas (apenas `IVXLCDM` maiúsculo) — isso evita falsos positivos como "Parte civil..." ou "Parte dividida...", cujas palavras seguintes por acaso só contêm letras válidas em numeral romano minúsculo. Marcadores só são considerados em linhas de até 120 caracteres, para não confundir um parágrafo de prosa que apenas menciona a palavra-chave com um título real.

Quando nenhum sinal de alta confiança é encontrado, o artefato registra `possui_indicios_estruturais: false` e a lista de unidades pode ficar vazia ou conter apenas candidatos de baixa confiança — a etapa nunca inventa hierarquia para preencher a ausência de evidência.

Para PDF, cada página é analisada separadamente e cada unidade detectada preserva o número da página de origem, sem tratar a quebra de página, por si só, como evidência estrutural.

## `criar_hierarquia`

Consome `estrutura_identificada` (apenas os sinais de `confianca: alta`) e materializa `processamento.documentos_processados` (estado `candidato`) e `processamento.secoes`. É aqui, e não antes, que o sistema se compromete com um `tipo` de seção (`parte`, `capitulo`, `secao`, `subsecao`, `anexo`, `prefacio`, `posfacio`) e com a árvore de pai/filho.

Regras de materialização:

```text
Parte    → nível 0, pode conter Capítulo
Capítulo → nível 1 (ou 0, se não houver Parte), pode conter Seção
Seção    → nível seguinte, pode conter Subseção
Subseção → nível mais profundo

Anexo/Prefácio/Posfácio → sempre no nível raiz, nunca viram "pai"
                           de nada, mesmo aparecendo entre capítulos
```

Cabeçalhos Markdown (que não têm `tipo_sugerido`, apenas `nivel_markdown`) são convertidos aqui: nível 1 → capítulo, nível 2 → seção, nível 3 ou mais → subseção. Essa é uma escolha explícita (não uma medição): trata o nível 1 do Markdown como a divisão principal do texto, por ser mais comum em reflexões/ensaios curtos do que a construção "Parte" de um livro extenso. Está registrada como decisão ajustável (ADR-061).

Quando `possui_indicios_estruturais` é `false`, `criar_hierarquia` cria exatamente **uma** seção (tipo `secao`, nível 0, sem título) cobrindo o documento inteiro — nunca inventa divisão para preencher a ausência de evidência.

Em PDF, cada seção recebe `pagina_inicial`/`pagina_final` calculados a partir de onde a próxima seção (de mesmo nível ou mais externa) começa. Essa é uma aproximação de granularidade por página, documentada como limitação conhecida (não há como saber a linha exata dentro da página apenas com os sinais desta versão).

A etapa é executada por uma função de banco própria (`aplicacao.backend_criar_hierarquia_documento`, migration `0024`), no mesmo padrão de segurança das etapas anteriores (`SECURITY DEFINER`, `search_path` vazio, executável apenas pelo backend). Ela é idempotente: se o Documento Processado já existir para a execução, apenas retorna o identificador existente, sem duplicar seções.

## `criar_fragmentos`

Consome `conteudo_normalizado` e as `processamento.secoes` já materializadas por `criar_hierarquia`, e cria **um fragmento por seção** (v1 não subdivide seções grandes em fragmentos menores — fica para quando a camada de IA exigir blocos de tamanho controlado).

O texto de cada fragmento é o texto **próprio** da seção — do início dela até o início da **próxima seção na ordem de leitura do documento**, não até `pagina_final`/`indice_fim` guardados em `secoes` (que representam a extensão de toda a subárvore, incluindo subseções). Usar o span da subárvore duplicaria texto entre o fragmento de um capítulo e o de sua seção interna; usar "até a próxima seção, seja ela filha ou não" resolve isso corretamente e de forma simples, porque para uma seção-folha (sem filhas) os dois cálculos coincidem.

Duas situações não geram fragmento algum, para não persistir lixo nem inventar conteúdo:

```text
seção sem nenhum texto extraível (ex.: original vazio nesse trecho)
seção cujo texto extraído é exatamente igual ao próprio título
  (um título "solto", sem nenhum corpo depois dele, não agrega
  informação além do que já está em secoes.titulo)
```

Cada fragmento recebe também `conteudo_contextualizado`: uma trilha de ancestrais (ex.: `Parte I > Capítulo 1 > Seção 1.1`) seguida do texto próprio, para dar contexto hierárquico a buscas e, futuramente, a embeddings. `quantidade_tokens` é uma **estimativa determinística e provisória** (comprimento do texto ÷ 4) — não é a tokenização real de nenhum modelo; será recalculada quando `MODELO_IA_*` for definido.

A materialização usa uma RPC própria (`aplicacao.backend_criar_fragmentos_documento`), mesmo padrão de segurança e idempotência das etapas anteriores: se o documento já tiver algum fragmento, a chamada apenas informa quantos existem, sem duplicar.

### Dois erros encontrados e corrigidos antes de qualquer uso real

Como em todas as etapas anteriores, a função de banco foi validada manualmente contra o Supabase oficial dentro de uma transação com `ROLLBACK`. Esse teste pegou dois erros reais na primeira versão da função:

1. **Contagem errada de fragmentos criados.** `GET DIAGNOSTICS ... = row_count` logo após o laço de inserção só reflete a última linha inserida, não o total do lote — com 2 fragmentos inseridos, a função relatava e gravava `1`. Corrigido contando de verdade com `select count(*)` depois do laço (migration `0026`).
2. **Erro de ambiguidade de coluna.** A correção acima usava `documento_processado_id` sem qualificar a tabela; como esse também é o nome de uma coluna de saída da própria função, o Postgres recusava a consulta com `column reference "documento_processado_id" is ambiguous`. Corrigido qualificando a tabela (migration `0027`).

Nenhuma das duas falhas chegou a rodar contra dado real — foram encontradas e corrigidas antes de a etapa ser usada, exatamente porque o teste é feito dentro de uma transação revertida contra o schema real, e não apenas com simulações em memória.

## Artefatos intermediários

Extração, normalização e identificação de estrutura precisam sobreviver a retry/crash sem transformar conteúdo parcial em Documento Processado. Por isso `0020` criou:

- `processamento.artefatos_execucao` para identidade/proveniência;
- bucket privado `artefatos-processamento` para o conteúdo maior;
- tipos iniciais `conteudo_extraido` e `conteudo_normalizado`;
- caminho determinístico `{usuario_id}/{execucao_id}/{tipo}.json`;
- SHA-256, tamanho, MIME e metadados do artefato;
- RPCs server-only de consulta/registro.

`0021` torna explícita a negação de acesso direto de clientes à tabela. `0023` estende o tipo permitido para incluir `estrutura_identificada`, mantendo o mesmo modelo de proveniência e sem novo GRANT para `anon`/`authenticated`.

## Documento Processado

Somente depois de normalização, estrutura, hierarquia, fragmentação, sínteses, análise/classificação/relações/embeddings e validação final o sistema pode publicar uma representação candidata/ativa em `processamento.documentos_processados`.

A estrutura final preserva:

```text
obra -> parte -> capítulo -> seção -> fragmento
```

Fragmentos carregam contexto e proveniência; evidências apontam para trechos concretos; um Documento Processado `ativo` exige publicação explícita.

## Testes obrigatórios

O CI deve passar, no mesmo commit:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
```

Além disso, um segundo job sobe Supabase local e executa migrations + seed + `db reset`, provando que o banco é reconstruível a partir do GitHub.

A suíte (36 testes) cobre detector de formato, spoofing básico, TXT/Markdown, extração de PDF textual mínimo, Unicode NFC, preservação de espaços significativos de Markdown, preservação de páginas PDF, validação da cadeia de proveniência da normalização, `identificar_estrutura` (cabeçalhos Markdown com nível, marcadores numerados válidos versus prosa que apenas menciona a palavra-chave, Prefácio/Posfácio isolados versus mencionados em frase, preservação do número de página em PDF, ausência de invenção de estrutura sem evidência, proveniência do artefato), `criar_hierarquia` (fallback de seção única, capítulos irmãos sem Parte, cadeia Parte→Capítulo→Seção→Subseção, nova Parte fechando a anterior, Anexo/Prefácio/Posfácio nunca viram pai, mapeamento de nível Markdown, cálculo de página/índice final) e `criar_fragmentos` (fallback sem breadcrumb, seção pai não duplica texto da seção filha, título sem corpo não gera fragmento, concatenação de páginas em PDF, breadcrumb de ancestrais).

As funções de banco de `criar_hierarquia` e `criar_fragmentos` também foram validadas manualmente contra o schema real do Supabase oficial, dentro de transações com `ROLLBACK` (nenhum dado permanente foi criado). Esse processo encontrou e corrigiu, antes de qualquer uso real, dois erros na primeira versão de `backend_criar_fragmentos_documento`: contagem de fragmentos que só via a última linha inserida (migration `0026`) e uma ambiguidade de nome de coluna que impedia a função de executar (migration `0027`).

## Próxima etapa

`criar_sinteses` deverá gerar, a partir dos fragmentos já materializados, sínteses hierárquicas (fragmento → seção → capítulo → parte → obra). Essa é a primeira etapa verdadeiramente cognitiva do Pipeline: exigirá a camada de IA (OpenAI Responses API, `store: false`, Structured Outputs/JSON Schema, validação Zod e auditoria de modelo/prompt), ainda não ativada.

IA só entra quando uma etapa realmente cognitiva exigir interpretação. Nessas etapas, a política prevista é OpenAI server-only, Responses API com `store: false`, Structured Outputs/JSON Schema, validação Zod e auditoria de modelo/prompt/execução.
