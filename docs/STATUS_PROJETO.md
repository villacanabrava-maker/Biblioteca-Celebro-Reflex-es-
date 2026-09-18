# Estado Canônico do Projeto — Rflex01

**Atualizado em:** 18 de setembro de 2026  
**Produto:** Rflex01 — Memória Reflexiva / Cérebro Autoral  
**Objetivo deste documento:** ser a referência operacional única para agentes e mantenedores. Quando houver conflito entre documentação antiga e este arquivo, este arquivo e o código atual do `main` prevalecem.

## 1. Infraestrutura canônica

- **GitHub:** `villacanabrava-maker/reflex-01`
- **Branch de produção:** `main`
- **Vercel project:** `rflex01`
- **Produção:** `https://reflex-01.vercel.app`
- **Supabase display name:** `reflex-01`
- **Supabase project ref:** `cqavdefyelarhyjqmahi`
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind, Supabase, OpenAI, Vercel, GitHub Actions.

Projetos e repositórios anteriores são históricos e não devem ser usados como fonte operacional.

## 2. Arquitetura conceitual

O sistema é organizado na cadeia:

**Biblioteca → Processamento → Taxonomia → Cérebro Autoral → Reflexões → Auditoria**

Princípios imutáveis:

1. **Conteúdo, Método e Expressão são planos distintos.**
2. **Cérebro Ativo = Núcleo Autoral + Influências Externas Deliberadas.**
3. Conteúdo externo nunca entra automaticamente no Núcleo Autoral.
4. IA interpreta e redige; PostgreSQL governa identidade, integridade, RLS e proveniência.
5. Nenhum dado demonstrativo ou métrica simulada deve aparecer como dado real.
6. Todo material incorporado precisa manter sua origem rastreável.
7. Uploads grandes devem ir do browser ao Supabase Storage; não atravessar o body da Vercel.

## 3. Estado funcional consolidado no main

Baseline atual: `62b54aecc98b05ea622f7109d24da04d3242e132`.

### Fundação e UX
- identidade Rflex01 padronizada;
- app shell, navegação e tipografia revisados;
- métricas e conteúdos fictícios removidos;
- experiências de leitura ampliadas;
- CI com TypeScript, lint, testes e build.

### Biblioteca
- cadastro de obras;
- upload TUS direto para bucket privado `originais-biblioteca`;
- suporte textual/documental existente;
- classificação entre autoria própria e conteúdo externo;
- participação no Cérebro controlada por papel e escopo;
- visualização de obra, fragmentos e seções;
- fluxo “Refletir com esta obra” integrado às Reflexões.

### Processamento
- extração textual;
- estrutura, seções e fragmentação;
- unidades de conhecimento;
- embeddings padronizados;
- busca híbrida vetorial + textual;
- proveniência ligada às versões da obra.

### Cérebro Autoral
- dados reais expostos por views canônicas;
- dimensões, características, regras e anti-regras;
- evidências e confiança derivadas do banco;
- separação entre núcleo autoral e influência externa.

### Reflexões
- Wizard metodológico;
- seleção de memórias persistida em `dossie_contexto`;
- fontes canônicas em `reflexoes.fontes_entrada`;
- fonte por texto, documento, link, obra da Biblioteca e áudio;
- artigo/link extraído com Readability + proteção SSRF;
- documento enviado ao bucket privado `fontes-reflexoes`;
- gravação nativa via MediaRecorder;
- áudio original preservado e transcrição revisável via `gpt-transcribe`;
- comentário do autor também pode ser gravado e é preservado como fonte adicional.

### Auditoria
- motor independente do redator;
- auditoria faz parte da esteira de Reflexões e não deve compartilhar papel lógico com geração.

## 4. Frente única em andamento

### `feat/audio-biblioteca`

Objetivo: permitir gravação de áudio na Biblioteca **sem criar um pipeline paralelo**.

Arquitetura decidida:

1. áudio original é enviado ao bucket privado `originais-biblioteca`;
2. áudio é transcrito pelo serviço central de áudio;
3. usuário revisa a transcrição;
4. transcrição revisada é materializada como arquivo textual canônico da versão da obra;
5. pipeline textual existente processa essa versão;
6. áudio original fica ligado à mesma obra/versão em `biblioteca.fontes_obras`;
7. proveniência preserva arquivo original, hash, MIME, tamanho e texto confirmado.

Já existe na branch:
- migration `0023_fontes_obras_audio.sql`;
- serviço compartilhado `src/dominios/audio/transcritor.ts`;
- Reflexões refatoradas para usar o mesmo transcritor.

Ainda falta nesta frente:
- finalizar actions da Biblioteca para transcrição/registro de fonte;
- integrar modo “Gravar áudio” ao modal da Biblioteca;
- revisar transcrição antes de cadastro;
- garantir limpeza transacional em falhas;
- aplicar migration apenas quando a branch estiver validada;
- abrir PR;
- executar gate completo;
- preview Vercel READY;
- checar advisors Supabase;
- merge;
- confirmar produção.

## 5. Ordem das próximas etapas

Depois de `audio-biblioteca`, seguir nesta ordem, uma frente por vez:

1. **Integridade de publicação e proveniência**
   - revisar estados parciais, retries e compensações;
   - garantir que nenhuma obra/reflexão incompleta alimente o Cérebro.

2. **Processamento e sínteses**
   - revisar sínteses canônicas;
   - reforçar extração/normalização por tipo;
   - validar documentos longos e falhas recuperáveis.

3. **Taxonomia**
   - consolidar conceitos/teses/relações reais;
   - remover qualquer UI ou fallback não derivado do banco;
   - melhorar navegação entre conceito → evidência → obra.

4. **Cérebro Autoral**
   - aprofundar dimensões Conteúdo/Método/Expressão;
   - evidência e proveniência como primeira classe;
   - propostas de atualização explícitas e auditáveis.

5. **Reflexões**
   - fechar incorporação autoral;
   - revisão final e versionamento;
   - ligação entre reflexão incorporada, obra e atualização do Cérebro.

6. **Qualidade transversal**
   - E2E autenticado;
   - acessibilidade;
   - responsividade;
   - performance;
   - segurança;
   - observabilidade;
   - proteção formal da `main`.

## 6. Regras de execução

Para evitar regressão e perda de contexto:

- uma única frente funcional ativa por vez;
- branches curtas (`feat/*`, `fix/*`, `chore/*`);
- nenhuma feature nova antes de fechar o gate da atual;
- todo PR precisa passar por `npm ci`, TypeScript, lint, testes e build;
- preview Vercel precisa estar READY;
- migrations são aplicadas de forma controlada e verificadas por advisors;
- produção só é considerada concluída após deploy READY e checagem de runtime;
- não duplicar serviços de domínio quando já existe implementação compartilhável;
- documentação canônica deve ser atualizada quando uma decisão estrutural muda.

## 7. Pendências conhecidas que não devem ser confundidas com a frente atual

- proteção formal da branch `main` ainda não está habilitada no GitHub;
- Supabase Auth ainda sinaliza proteção contra senhas vazadas desabilitada;
- há tabelas internas de processamento com RLS ligado sem policies diretas — avaliar pelo modelo de acesso interno antes de alterar;
- há foreign keys sem índice e índices ainda não utilizados; tratar por métricas reais, não remover cegamente;
- branches antigas de features mergeadas continuam no repositório e podem ser limpas depois, sem efeito funcional.

