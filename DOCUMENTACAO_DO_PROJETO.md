# 📊 FINEVSIS — Sistema de Análise de Inteligência de Mercado

## 🌍 O que é o FINEVSIS?

**FINEVSIS** é um sistema completo de inteligência de mercado projetado para coletar, analisar e interpretar dados de mercado de maneira automatizada. O seu objetivo principal é identificar tendências emergentes, diagnosticar problemas de mercado, avaliar oportunidades de negócio e, através de Inteligência Artificial, sugerir projetos com alta probabilidade de sucesso.

Este sistema atua como um "analista de mercado automatizado", vasculhando a internet por meio de scrapers e APIs, processando esses dados estruturados e desestruturados, e apresentando insights e propostas de negócio acionáveis num painel visual (Dashboard).

---

## 🛠️ O que o sistema faz na prática?

1. **Coleta de Dados (Data Collection):**
   Utiliza ferramentas como `Puppeteer` e requisições HTTP (Axios) agendadas rotineiramente (via cron jobs) para extrair dados brutos da web, notícias, e APIs diversas.

2. **Identificação de Tendências e Problemas:**
   A partir dos dados brutos processados, o sistema mapeia **Tendências** (aquilo que está em crescimento ou declínio) e mapeia os **Problemas** reais (segmentados por setor, frequência e impacto reportado no mercado).

3. **Avaliação Automática de Oportunidades:**
   O sistema possui um motor de pontuação (Scoring Engine) implementado na base de dados e no backend que pontua as oportunidades geradas a partir da fórmula empírica baseada nos seguintes pesos:
   - *Demanda de Mercado:* 35%
   - *Baixa Concorrência:* 20%
   - *Viabilidade Técnica:* 20%
   - *Impacto da Solução:* 15%
   - *Escalabilidade:* 10%

4. **Sugestão de Projetos baseada em IA (Claude AI):**
   Para as oportunidades validadas, a Inteligência Artificial (Anthropic/Claude) atua diretamente sugerindo **Projetos de Negócio** completos. A IA detalha o tipo de solução, stack tecnológico recomendado, modelo de receita, custo e tempo estimado, além do público-alvo e os próximos passos (roadmap).

---

## 🏗️ Arquitetura e Engenharia de Software

O aplicativo segue uma arquitetura baseada em microsserviços e separação clara de responsabilidades, orquestrada via Docker.

### 1. Frontend (Interface do Utilizador)
- **Tecnologias:** React 18, Vite, Tailwind CSS para estilização e Recharts para visualização pormenorizada de gráficos.
- **Função:** Fornece um Dashboard limpo, estético e intuitivo para o analista visualizar as tendências, avaliar o ranking de oportunidades e aprovar ou investigar projetos sugeridos.

### 2. Backend (Serviço Core)
- **Tecnologias:** Node.js 20, Express, framework Prisma ORM, filas com BullMQ.
- **Função:** Atua como o maestro do sistema. Hospeda a API REST que alimenta o frontend, expõe webhooks, comunica-se com a base de dados central, e gerencia tarefas de extração (scraping) em horários pré-definidos.

### 3. Serviço de Inteligência Artificial (Micro-serviço)
- **Tecnologias:** Python 3.11+, FastAPI, Scikit-learn, Pandas. *(Interage fortemente com o modelo da Anthropic Anthropic API / Claude)*.
- **Função:** Expõe um servidor rápido especializado em tarefas de predição (Trend Prediction), Agrupamento algorítmico (Clustering) de problemas e pontuações complexas não englobadas pelas regras matemáticas simples do PostgreSQL.

### 4. Bancos de Dados
- **PostgreSQL (15):** Banco de dados relacional que armazena todas as entidades fortes do sistema através do Prisma ORM.
- **Redis (7):** Armazena cache transitório em memória e gerencia o enfileiramento das jobs massivas em background geradas pelos *collectors*.

---

## 🗄️ Estrutura de Modelos de Dados (PostgreSQL)

O sistema de dados baseia-se nestas entidades principais identificáveis:

- **Users:** Profissionais, administradores ou analistas com acessos autenticados.
- **Trends (Tendências):** Apontam o direcionamento do mercado. Têm status como `emerging` (emergente), `active` (ativo), `declining` ou `stable`.
- **Problems (Problemas):** Queixas, gargalos e necessidades identificadas num setor. Possuem campos de frequência e grau de impacto.
- **Opportunities (Oportunidades):** Ligam um *Problema* a uma possibilidade teórica. São rankeadas por pontuação (*score*) numéricos gerida matematicamente.
- **Projects (Projetos):** O resultado final acionável. Projetos tangíveis gerados a partir de oportunidades, aguardando execução ou em progresso, completos com estimativa de custo de investimento e retorno.
- **MarketData:** Local de *staging* para dados que ainda precisam ser tratados de fato pela IA ou heurísticas.

---

## 🚀 Resumo do Fluxo do Produto

1. O **Cron Job** (Node.js) roda rotinas programadas usando `Puppeteer`.
2. O Scraping gera **Market Data** que vai para a fila do **Redis**.
3. O **Python/FastAPI / Node.js Analysis Service** consome esses dados, identificando os **Problemas** e **Tendências**.
4. Uma **Oportunidade** é instanciada e o **PostgreSQL trigger / backend** calcula o "Score".
5. Se o Score é atrativo, um analista pode delegar para a **Claude AI** que criará e estruturará no painel um draft de um novo **Projeto** detalhado pronto para visualização na interface frontend.

Caso necessite aprofundar aspectos mais técnicos de deploys ou do source-code local, todos os comandos estão registados no repousitório e no README base da aplicação.
