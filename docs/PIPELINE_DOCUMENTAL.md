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

## Artefatos intermediários

Extração e normalização precisam sobreviver a retry/crash sem transformar conteúdo parcial em Documento Processado. Por isso `0020` criou:

- `processamento.artefatos_execucao` para identidade/proveniência;
- bucket privado `artefatos-processamento` para o conteúdo maior;
- tipos iniciais `conteudo_extraido` e `conteudo_normalizado`;
- caminho determinístico `{usuario_id}/{execucao_id}/{tipo}.json`;
- SHA-256, tamanho, MIME e metadados do artefato;
- RPCs server-only de consulta/registro.

`0021` torna explícita a negação de acesso direto de clientes à tabela.

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

A suíte cobre detector de formato, spoofing básico, TXT/Markdown, extração de PDF textual mínimo, Unicode NFC, preservação de espaços significativos de Markdown, preservação de páginas PDF e validação da cadeia de proveniência da normalização.

## Próxima etapa

`identificar_estrutura` deverá consumir somente `conteudo_normalizado` validado. A primeira versão deve privilegiar sinais determinísticos e preservar incerteza em vez de inventar hierarquia. A etapa seguinte, `criar_hierarquia`, materializará a estrutura validada nas entidades canônicas de `processamento.secoes`.

IA só entra quando uma etapa realmente cognitiva exigir interpretação. Nessas etapas, a política prevista é OpenAI server-only, Responses API com `store: false`, Structured Outputs/JSON Schema, validação Zod e auditoria de modelo/prompt/execução.
