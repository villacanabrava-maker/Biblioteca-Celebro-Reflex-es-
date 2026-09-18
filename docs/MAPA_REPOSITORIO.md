# Mapa Estrutural do Repositório — Rflex01

**Escopo:** mapa técnico do que existe na `main` atual. Este documento explica a organização sem redefinir a arquitetura funcional.

## Visão simples

```text
Usuário
  ↓
Next.js App Router — src/app
  ↓
Componentes React — src/componentes
  ↓
Server Actions — src/acoes
  ↓
Regras de domínio — src/dominios
  ├─ IA — src/ia
  └─ Infraestrutura — src/infraestrutura
        ↓
Supabase Auth / PostgreSQL / Storage
        ↓
Dados, vetores, taxonomia, cérebro, reflexões e auditoria
```

O upload grande da Biblioteca e de fontes usa uma exceção importante ao fluxo acima:

```text
Browser → TUS → Supabase Storage privado
                    ↓
            Server Action / pipeline
                    ↓
             PostgreSQL + OpenAI
```

O arquivo grande não é enviado primeiro pelo servidor Next.js.

## Árvore resumida

```text
reflex-01/
├─ .agents/                 instruções auxiliares para agentes
├─ .github/workflows/       CI do GitHub Actions
├─ docs/                    documentação e ADRs
├─ README.md                mapa mestre técnico e operacional
├─ ESCOPO_DO_APLICATIVO.md  apresentação funcional do produto
├─ src/
│  ├─ app/                  páginas, layouts e rotas do App Router
│  ├─ acoes/                Server Actions; principal camada de back-end web
│  ├─ componentes/          componentes React por área funcional
│  ├─ dominios/             regras de negócio e processamento
│  ├─ ia/                   cliente e orquestrador OpenAI
│  ├─ infraestrutura/       Auth, Supabase e Storage/TUS
│  ├─ lib/                  limites e validações compartilhadas
│  ├─ tipos/                tipos TypeScript por domínio
│  └─ middleware.ts         proteção de rotas e sessão
├─ supabase/migrations/     evolução do banco, RLS, views, RPCs e Storage
├─ tests/                   testes Vitest por domínio
├─ package.json
├─ next.config.mjs
├─ tsconfig.json
├─ eslint.config.mjs
├─ vitest.config.ts
└─ tailwind.config.ts
```

## Páginas atuais

A aplicação usa Next.js App Router. Não existe `src/app/api/` na baseline auditada; o back-end web é implementado principalmente por Server Actions em `src/acoes/`.

| Rota | Arquivo | Papel |
|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` | Login e cadastro. |
| `/` | `src/app/(dashboard)/page.tsx` | Home autenticada. |
| `/biblioteca` | `src/app/(dashboard)/biblioteca/page.tsx` | Acervo e entrada de novos conteúdos. |
| `/biblioteca/[id]` | `src/app/(dashboard)/biblioteca/[id]/page.tsx` | Detalhe da obra. |
| `/documentos-processados` | `src/app/(dashboard)/documentos-processados/page.tsx` | Lista de processamentos. |
| `/documentos-processados/[id]` | `src/app/(dashboard)/documentos-processados/[id]/page.tsx` | Extração e materiais do documento. |
| `/cerebro` | `src/app/(dashboard)/cerebro/page.tsx` | Cérebro Autoral. |
| `/taxonomia` | `src/app/(dashboard)/taxonomia/page.tsx` | Conceitos e grafo taxonômico. |
| `/reflexoes` | `src/app/(dashboard)/reflexoes/page.tsx` | Histórico de Reflexões. |
| `/reflexoes/criar` | `src/app/(dashboard)/reflexoes/criar/page.tsx` | Wizard de criação. |
| `/reflexoes/[id]` | `src/app/(dashboard)/reflexoes/[id]/page.tsx` | Estúdio da Reflexão. |
| `/configuracoes` | `src/app/(dashboard)/configuracoes/page.tsx` | Conta e diagnóstico. |

## Back-end

### `src/acoes/`

Server Actions que fazem a ponte entre interface, autenticação, domínio e banco:

- `auth.ts`
- `biblioteca.ts`
- `processamento.ts`
- `taxonomia.ts`
- `cerebro.ts`
- `reflexoes.ts`
- `auditoria.ts`

### `src/dominios/`

Código de negócio que não deve ser confundido com componentes de UI:

- `auth/`: validação de cadastro;
- `audio/`: transcrição;
- `processamento/`: extração, chunking, embeddings, sínteses e pipeline;
- `taxonomia/`: extração, aplicação e relações;
- `cerebro/`: análise de dimensões e aprendizado por edição;
- `reflexoes/`: conflito, diff, planejamento, redação e incorporação;
- `auditoria/`: Auditor Crítico.

## Infraestrutura e integrações

### Supabase

- `src/infraestrutura/supabase/cliente-browser.ts`: cliente público do navegador;
- `src/infraestrutura/supabase/cliente-servidor.ts`: cliente SSR associado à sessão;
- `src/infraestrutura/supabase/cliente-admin.ts`: cliente administrativo, somente servidor;
- `src/infraestrutura/auth/usuario-atual.ts`: identidade da sessão;
- `src/infraestrutura/storage/cliente-tus.ts`: upload resumível direto ao Storage.

### OpenAI

- `src/ia/cliente.ts`: instancia o SDK;
- `src/ia/orquestrador.ts`: papéis lógicos, Structured Outputs, proteção de entrada e retries;
- chamadas específicas também existem nos domínios de áudio, processamento, Taxonomia, Cérebro, Reflexões e Auditoria.

## Supabase: estrutura de versionamento

O histórico do banco está dividido em duas trilhas já existentes e deve ser preservado:

- migrations `0001` a `0015`: registradas em `public._migrations`;
- migrations posteriores: também aparecem no histórico oficial de migrations do projeto Supabase.

A pasta `supabase/migrations/` contém `0001` até `0029`. Não renomear, reordenar ou mover migrations aplicadas.

O projeto real possui, entre outros, os schemas de domínio:

- `sistema`
- `biblioteca`
- `processamento`
- `taxonomia`
- `cerebro_autoral`
- `reflexoes`
- `auditoria`
- `aplicacao`

O schema `aplicacao` contém a camada de views/RPCs de integração; o schema `public` também expõe wrappers/views usados pelo código atual.

## Storage

Buckets verificados:

- `originais-biblioteca`: privado, 50 MB;
- `fontes-reflexoes`: privado, 50 MB.

## Arquivos preservados apesar de possível legado

Nenhum destes arquivos foi removido na Etapa 2. A classificação significa apenas “revisar antes de reutilizar ou excluir”.

### Cérebro

A rota atual `/cerebro` usa:

- `painel-cerebro-moderno.tsx`.

Existe uma cadeia anterior preservada:

- `painel-cerebro.tsx`;
- `resumo-cerebro.tsx`;
- `painel-regras.tsx`.

### Reflexões

A rota atual `/reflexoes` usa:

- `lista-reflexoes-moderna.tsx`.

Existe uma cadeia anterior preservada:

- `lista-reflexoes.tsx`;
- `card-reflexao.tsx`;
- `modal-nova-reflexao.tsx`.

Também foi preservado `card-reflexao-skeleton.tsx`, que não participa dos imports observados na superfície atual revisada.

### Biblioteca

`estatisticas-biblioteca.tsx` foi preservado; a página atual obtém estatísticas diretamente e a lista principal revisada não importa esse componente.

### Domínio de Reflexões

`src/dominios/reflexoes/incorporador-memoria.ts` contém uma implementação de incorporação via RPC. A Server Action atual `src/acoes/reflexoes.ts` possui sua própria implementação `incorporarReflexaoComoObra` e não importa esse módulo. O arquivo foi preservado por segurança histórica.

## Configurações principais

| Arquivo | Papel |
|---|---|
| `package.json` | scripts e dependências |
| `.env.example` | nomes esperados de variáveis, sem valores reais |
| `next.config.mjs` | configuração Next.js e pacotes externos do runtime |
| `tsconfig.json` | TypeScript estrito e alias `@/*` |
| `eslint.config.mjs` | lint |
| `vitest.config.ts` | testes |
| `tailwind.config.ts` | Tailwind |
| `.github/workflows/ci.yml` | TypeScript, lint, testes e build no GitHub |

## Divergências organizacionais conhecidas e preservadas

1. `package.json` registra `db:migrate` e `db:test`, mas o diretório `scripts/` não está versionado na `main`.
2. Vercel executa Node.js 24.x; o GitHub Actions usa Node.js 22.
3. A interface de Configurações ainda descreve “Voz e áudio” como “Em breve”, embora áudio já exista em Biblioteca e Reflexões. Isso é comportamento/conteúdo de produto e não foi corrigido nesta etapa.
4. O gerador de embeddings possui fallback determinístico quando OpenAI não está disponível. É comportamento funcional e não foi alterado.
5. O schema `sistema` possui tabelas com RLS desabilitado; é uma frente de segurança e não foi alterada nesta etapa.
6. Não há Edge Functions no projeto Supabase atual.

## Regra de manutenção

Antes de mover, renomear ou excluir qualquer arquivo:

1. identificar a rota/ação que o utiliza;
2. conferir imports diretos;
3. conferir chamadas indiretas e RPCs;
4. consultar o histórico Git quando necessário;
5. rodar TypeScript, lint, testes e build;
6. validar Preview Vercel.

Quando a evidência for insuficiente, preservar.
