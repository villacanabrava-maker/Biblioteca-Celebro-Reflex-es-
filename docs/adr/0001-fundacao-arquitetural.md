# ADR 0001: Fundação Arquitetural — Memória Reflexiva / Cérebro Autoral

**Data:** 17 de setembro de 2026  
**Status:** Aprovado e Implementado  
**Contexto:** Construção do zero de uma plataforma pessoal de inteligência autoral com a marca *Memória Reflexiva*.

## Decisões Tomadas

1. **Regra Zero**: A infraestrutura criada do zero evoluiu para o nome canônico **Rflex01**. O repositório operacional é `villacanabrava-maker/reflex-01`, o Supabase permanece `cqavdefyelarhyjqmahi` e o projeto Vercel é `rflex01`. Nomes anteriores são históricos.
2. **Separação Sagrada dos 3 Planos**: O sistema computacionalmente diferencia:
   - **Conteúdo**: O que o autor pensa (temas, memórias, teses).
   - **Método**: Como o autor pensa (tensões, transições, perguntas, associações).
   - **Expressão**: Identidade linguística (ritmo, cadência, formas de abertura).
3. **Fórmula do Cérebro Ativo**:
   $$\text{Cérebro Ativo} = \text{Núcleo Autoral} + \text{Influências Externas Deliberadas}$$
   Obras externas nunca alimentam o Núcleo Autoral automaticamente. Influências exigem autorização explícita e escopo delimitado por dimensão.
4. **Upload Direto via TUS**: Para evitar o limite de 4,5 MB de payload da Vercel, o upload é realizado pelo browser diretamente ao bucket privado `originais-biblioteca` do Supabase Storage usando `tus-js-client`.
5. **Runtime do Backend**: Node.js Runtime na Vercel (descartado o Edge Runtime para garantir suporte pleno a parsers pesados de PDF/DOCX e bibliotecas de criptografia).
6. **Porta de Entrada Segura**: Apenas o schema `aplicacao` expõe views e RPCs com RLS para a Data API do Supabase. Todos os schemas de domínio (`biblioteca`, `processamento`, `taxonomia`, `cerebro_autoral`, `reflexoes`, `auditoria`, `sistema`) permanecem internos.
7. **Integridade Polimórfica com `unidades_conhecimento`**: Criada a tabela canônica para associar fragmentos, seções e sínteses a Foreign Keys reais no PostgreSQL.
8. **Embeddings Padronizados em 1536 Dimensões**: Utilizando o modelo `text-embedding-3-small` indexado com HNSW e distância cosseno.
9. **Branching**: Padrão operacional atual `feat/*`, `fix/*` e `chore/*`, com mudanças integradas por Pull Request e CI. A proteção formal da `main` ainda deve ser habilitada no GitHub.
