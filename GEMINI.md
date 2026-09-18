# Memória Reflexiva / Cérebro Autoral - Diretrizes do Projeto

Este repositório contém a plataforma de **Memória Reflexiva e Cérebro Autoral**, construída com Next.js 15, TypeScript, Tailwind CSS, Supabase e OpenAI.

## Repositório Oficial Único
- **GitHub**: https://github.com/villacanabrava-maker/reflex-01.git

## Deploys Canônicos de Produção (Vercel)
- **Produção Oficial**: https://reflex-01.vercel.app
- **Release Branch Main**: https://rflex01-git-main-naninne.vercel.app
- **Status operacional**: consultar `docs/STATUS_PROJETO.md`; URLs imutáveis de builds não são consideradas canônicas.

## Arquitetura e Stack
- **Framework Web**: Next.js 15 (App Router com `src/app/(auth)` e `src/app/(dashboard)`)
- **Linguagem**: TypeScript com modo estrito
- **Estilização**: Tailwind CSS com `tailwind-merge`, `clsx`, `tailwindcss-animate`
- **Ícones**: `lucide-react`
- **Banco de Dados & Autenticação**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`, `postgres`)
- **IA e Processamento**: OpenAI API (`openai`), parser de PDF (`pdf-parse`)
- **Validação de Dados**: Zod (`zod`)
- **Testes**: Vitest (`vitest`)
- **Deploy**: Vercel

## Diretrizes Gerais para todos os Agentes
1. **Respostas em Português do Brasil**: Toda interação, relatórios e comentários devem ser em português claro e didático.
2. **Preservação de Código**: Nunca apagar funcionalidades existentes sem validação explícita.
3. **Padrão de Camadas**:
   - `src/app`: Rotas, layouts e páginas.
   - `src/componentes`: Componentes visuais modulares e reutilizáveis.
   - `src/dominios`: Regras de negócio centrais.
   - `src/infraestrutura` & `src/lib`: Conexão com Supabase, clientes externos e utilitários.
   - `src/ia`: Lógica de prompts, memória reflexiva e processamento cognitivo.
   - `src/acoes`: Server Actions do Next.js.
4. **Segurança**: Nunca expor chaves de API do Supabase (Service Role) ou OpenAI no lado do cliente (`'use client'`).


## Fonte de verdade operacional
Antes de iniciar qualquer nova mudança, leia `docs/STATUS_PROJETO.md` e confirme o estado atual do `main`, PRs e deploys. Não retome nomes de repositórios/projetos históricos.
