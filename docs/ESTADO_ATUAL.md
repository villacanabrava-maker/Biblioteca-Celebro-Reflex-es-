# Estado Atual do Projeto

## Infraestrutura oficial

- GitHub: `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`
- Branch principal: `main`
- Branch de trabalho atual: `feature/fundacao`
- Supabase: projeto oficial `Biblioteca-Celebro-Reflex-es-`, ref `xzkzdaxxmizcgfkjgzoq`
- Supabase: conector administrativo confirmado e projeto `ACTIVE_HEALTHY`
- Supabase: banco de aplicação ainda limpo, sem migrations próprias e sem branches de desenvolvimento
- Vercel: conector autenticado no time `Naninne`
- Vercel: ainda não existe projeto ligado ao repositório `villacanabrava-maker/Biblioteca-Celebro-Reflex-es-`

## Fase atual

FASE 0 — Fundação técnica.

## Concluído

- repositório oficial confirmado;
- acesso administrativo pelo conector GitHub confirmado;
- conector Supabase confirmado e projeto oficial inventariado;
- estado inicial do banco, extensions, migrations e advisors do Supabase inventariados;
- conector Vercel confirmado e time oficial inventariado;
- fundação Next.js + React + TypeScript iniciada;
- ESLint configurado em flat config;
- variáveis de ambiente documentadas sem segredos;
- CI inicial com lint, TypeScript e build;
- página inicial mínima criada.

## Observações de infraestrutura

- O Supabase oficial está saudável e ainda não possui tabelas de aplicação no schema `public`.
- Não existem migrations de aplicação registradas no Supabase oficial.
- Não existem branches de desenvolvimento do Supabase neste momento.
- A extensão `vector` está disponível no servidor, mas ainda não foi instalada; a ativação será feita por migration versionada quando a arquitetura de dados chegar à etapa correspondente.
- Os advisors de segurança e performance do Supabase não reportaram alertas no estado atual.
- Os projetos Vercel já existentes pertencem a projetos/repositórios anteriores e não devem ser reutilizados automaticamente neste novo sistema.

## Próximos passos

1. validar o Pull Request da fundação;
2. preparar a estrutura `supabase/` e migrations versionadas no GitHub;
3. criar/importar o novo projeto Vercel a partir do repositório oficial;
4. configurar variáveis de ambiente do novo projeto Vercel sem expor segredos no repositório;
5. revisar e formalizar o Dicionário Mestre v1.0;
6. escrever e testar a migration `0001_fundacao` somente após essas validações.

## Regra de segurança

Nenhuma chave administrativa, segredo de produção ou credencial privada deve ser commitida no GitHub. O repositório contém apenas nomes e exemplos de variáveis. Credenciais devem permanecer nos mecanismos seguros do Supabase, Vercel e ambientes do servidor.
