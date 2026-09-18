# Rflex01

**Memória Reflexiva — Cérebro Autoral**

> *"Seu acervo. Sua inteligência. Novas reflexões."*

**Rflex01** é uma plataforma pessoal de inteligência autoral que aprende, a partir das obras do autor, sua metodologia de pensamento, interpretação, associação, argumentação, escrita e revisão, permitindo gerar novas reflexões personalizadas com integridade, proveniência e separação rigorosa entre autoria e referências externas.

---

## 🌐 Projeto canônico Rflex01

- **GitHub:** `villacanabrava-maker/reflex-01`
- **Vercel project:** `rflex01`
- **Supabase project:** `reflex-01`
- **Supabase project ref:** `cqavdefyelarhyjqmahi`
- **Branch de produção:** `main`

> O nome de produto é **Rflex01**. Os slugs técnicos dos provedores podem variar em caixa, hífen e normalização sem representar projetos diferentes.

---

## 📦 Repositório GitHub atual

- **GitHub Oficial:** [https://github.com/villacanabrava-maker/reflex-01.git](https://github.com/villacanabrava-maker/reflex-01.git)
- O endereço antigo `Biblioteca-Celebro-Reflex-es-` deve ser tratado apenas como redirecionamento histórico.

---

## 🏛️ Princípios Arquiteturais

1. **Separação em 3 Planos**: Conteúdo (*sobre o que pensa*), Método (*como raciocina*) e Expressão (*como aparece na linguagem*).
2. **Fórmula do Cérebro Ativo**:
   $$\text{Cérebro Ativo} = \text{Núcleo Autoral} + \text{Influências Externas Deliberadas}$$
3. **Upload Direto TUS**: Envio de manuscritos e livros diretamente do browser ao Supabase Storage privado.
4. **Governança Determinística**: A IA interpreta e redige via Structured Outputs; o PostgreSQL governa permissões (RLS), integridade e proveniência.
5. **Auditor Independente**: O motor de redação e o motor de auditoria de reflexões são desacoplados.

---

## 🚀 Tecnologias

- **Frontend & Backend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Banco de Dados & Storage**: Supabase PostgreSQL 17, pgvector, Full Text Search, Supabase Storage privado, RLS.
- **Inteligência Artificial**: OpenAI API (`gpt-4o`, `gpt-4o-mini`, `text-embedding-3-small`) com validação via Zod.
- **Hospedagem**: Vercel com Node.js Runtime.
- **Controle de Versão & CI**: Git, GitHub e GitHub Actions.

---

## 🛠️ Como Executar Localmente

### 1. Clonar o repositório e instalar dependências:
```bash
npm install
```

### 2. Configurar variáveis de ambiente:
Crie o arquivo `.env.local` baseado no `.env.example`:
```bash
cp .env.example .env.local
```

### 3. Banco de dados e migrations

As migrations canônicas estão versionadas em `supabase/migrations/`.

> **Atenção:** a `main` atual não contém o diretório `scripts/`, embora `package.json` ainda registre os comandos `db:migrate` e `db:test` apontando para arquivos nesse diretório. Portanto, esses dois comandos não devem ser tratados como instruções operacionais válidas até que essa divergência seja resolvida em uma etapa funcional própria.

### 4. Executar os testes automatizados:
```bash
npm test
```

### 5. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

---

## 📚 Documentação técnica

O índice da documentação e o mapa estrutural do repositório ficam em:

- `docs/INDICE_DOCUMENTACAO.md`
- `docs/MAPA_REPOSITORIO.md`

A fonte de verdade operacional continua sendo o estado real de `main`, Supabase e Vercel; documentos históricos não prevalecem sobre as integrações atuais.

---

## 🏷️ Padronização de nome

O nome técnico oficial do projeto é **Rflex01**.

Mapeamento operacional confirmado:
- **Produto:** `Rflex01`
- **GitHub repository:** `villacanabrava-maker/reflex-01`
- **Vercel project:** `rflex01`
- **Supabase project display name:** `reflex-01`
- **Supabase project ref:** `cqavdefyelarhyjqmahi`
- **npm/package name:** `rflex01`

A identidade descritiva do produto continua sendo **Memória Reflexiva — Cérebro Autoral**.
