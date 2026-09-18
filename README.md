# Memória Reflexiva — Cérebro Autoral

> *"Seu acervo. Sua inteligência. Novas reflexões."*

Plataforma pessoal de inteligência autoral que aprende, a partir das obras do autor, sua metodologia de pensamento, interpretação, associação, argumentação, escrita e revisão, permitindo gerar novas reflexões personalizadas com integridade, proveniência e separação rigorosa entre autoria e referências externas.

---

## 🌐 Deploys Oficiais de Produção (Vercel)

Estes são os únicos domínios de deploy de produção oficiais e ativos da plataforma:

- **Domínio Principal**: [https://reflex-01.vercel.app](https://reflex-01.vercel.app)
- **Domínio de Release (Branch Main)**: [https://reflex-01-git-main-naninne.vercel.app](https://reflex-01-git-main-naninne.vercel.app)
- **Domínio Canônico de Build**: [https://reflex-01-u3df2906o-naninne.vercel.app](https://reflex-01-u3df2906o-naninne.vercel.app)

---

## 📦 Repositório Oficial

- **GitHub**: [https://github.com/villacanabrava-maker/cerebroa-autoral-app-anty.git](https://github.com/villacanabrava-maker/cerebroa-autoral-app-anty.git)

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
- **Banco de Dados & Storage**: Supabase PostgreSQL 17, pgvector, Full Text Search, Supabase Storage privado, RLS estrito.
- **Inteligência Artificial**: OpenAI API (`gpt-4o`, `gpt-4o-mini`, `text-embedding-3-small`) com validação via Zod.
- **Hospedagem & Workflows**: Vercel (Node.js Runtime e Vercel Workflows).
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

### 3. Aplicar as migrations no Supabase:
```bash
npm run db:migrate
npm run db:test
```

### 4. Executar os testes automatizados:
```bash
npm test
```

### 5. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).
