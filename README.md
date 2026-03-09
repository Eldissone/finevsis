# 📊 FINEVSIS — Sistema de Análise de Mercado

> Sistema completo de inteligência de mercado com IA para identificar tendências,
> avaliar oportunidades e sugerir projetos de negócio.

---

## 🏗️ Estrutura do Projeto

```
finevsis/
├── docker-compose.yml          ← Orquestra todos os serviços
├── .env.example                ← Variáveis de ambiente (copie para .env)
├── README.md
│
├── frontend/                   ← React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/              ← Dashboard, Trends, Opportunities, Projects, Analysis
│   │   ├── components/         ← Navbar e componentes reutilizáveis
│   │   └── services/api.js     ← Cliente HTTP (Axios)
│   └── Dockerfile
│
├── backend/                    ← Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/             ← users, trends, problems, opportunities, projects
│   │   ├── services/
│   │   │   ├── scoringService.js    ← Motor de pontuação
│   │   │   └── analysisService.js   ← Integração Claude AI
│   │   └── collectors/
│   │       ├── marketCollector.js   ← Puppeteer + Axios
│   │       └── scheduler.js         ← Cron jobs
│   ├── prisma/schema.prisma    ← Esquema do banco de dados
│   └── Dockerfile
│
├── ai/                         ← Python + FastAPI + Scikit-learn
│   ├── main.py                 ← API de IA (scoring, clustering, previsão)
│   ├── models/
│   │   ├── opportunity_scorer.py
│   │   ├── clustering.py
│   │   └── trend_prediction.py
│   └── Dockerfile
│
└── database/
    └── init.sql                ← Schema PostgreSQL + dados seed
```

---

## 🚀 Instalação Rápida (com Docker)

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado
- [Node.js 20+](https://nodejs.org/) (para desenvolvimento local)
- [Python 3.11+](https://python.org/) (para o serviço de IA)

### 1. Clone e configure

```bash
# Copie as variáveis de ambiente
cp .env.example .env
```

Edite o `.env` e preencha:
- `ANTHROPIC_API_KEY` — obtenha em https://console.anthropic.com
- `JWT_SECRET` — qualquer string segura (ex: gere com `openssl rand -hex 32`)
- APIs opcionais: `NEWSAPI_KEY`, `SERPAPI_KEY`

### 2. Suba tudo com Docker

```bash
docker-compose up --build
```

Aguarde todos os serviços iniciarem (≈2 minutos na primeira vez).

### 3. Acesse

| Serviço     | URL                        |
|-------------|---------------------------|
| Frontend    | http://localhost:3000      |
| Backend API | http://localhost:3001      |
| AI Service  | http://localhost:8000      |
| PostgreSQL  | localhost:5432             |

---

## 💻 Instalação Local (sem Docker)

### Backend (Node.js)

```bash
cd backend
npm install

# Configure o banco de dados
cp ../.env.example .env
# Edite .env com suas credenciais

# Aplique o esquema no PostgreSQL
npx prisma db push

# (Opcional) Popule com dados de exemplo
node prisma/seed.js

# Inicie em modo desenvolvimento
npm run dev
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

### Serviço de IA (Python)

```bash
cd ai
python -m venv venv
source venv/bin/activate      # Linux/Mac
# ou: venv\Scripts\activate   # Windows

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🗄️ Banco de Dados (PostgreSQL)

### Tabelas principais

| Tabela          | Descrição                                   |
|-----------------|---------------------------------------------|
| `users`         | Utilizadores do sistema                     |
| `trends`        | Tendências de mercado coletadas             |
| `problems`      | Problemas identificados no mercado          |
| `opportunities` | Oportunidades avaliadas com score automático|
| `projects`      | Projetos sugeridos pela IA                  |
| `market_data`   | Dados brutos coletados (scraping/APIs)      |

### Fórmula de score (calculada por trigger SQL)

```sql
score = (market_demand     * 0.35) +
        (low_competition   * 0.20) +
        (technical_viability * 0.20) +
        (impact_score      * 0.15) +
        (scalability       * 0.10)
```

### Comandos úteis

```bash
# Ver dados no browser
cd backend && npx prisma studio

# Recriar banco do zero
docker-compose down -v
docker-compose up --build

# Conectar ao PostgreSQL diretamente
docker exec -it finevsis_db psql -U finevsis -d finevsis_db
```

---

## 🔌 API Endpoints

### Tendências
```
GET    /api/trends              — lista tendências
GET    /api/trends/:id          — detalhe
POST   /api/trends              — criar
PUT    /api/trends/:id          — atualizar
DELETE /api/trends/:id          — remover
```

### Oportunidades
```
GET    /api/opportunities       — lista rankeada por score
POST   /api/opportunities       — criar (score calculado automaticamente)
POST   /api/opportunities/analyze-ai  — análise com Claude AI
DELETE /api/opportunities/:id
```

### Projetos
```
GET    /api/projects            — lista projetos
POST   /api/projects            — criar
POST   /api/projects/generate   — gerar com IA
PUT    /api/projects/:id        — atualizar status
```

### Dashboard
```
GET    /api/analysis/dashboard  — métricas resumidas
```

### Serviço de IA (Python :8000)
```
POST   /score                   — pontuar oportunidade
POST   /predict-trend           — prever tendência
POST   /cluster-problems        — agrupar problemas
GET    /insights                — insights de mercado
```

---

## ☁️ Deploy em Produção

### Frontend → Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
# Configure VITE_API_URL nas variáveis de ambiente do Vercel
```

### Backend → Render

1. Criar novo Web Service em https://render.com
2. Apontar para o repositório, pasta `backend/`
3. Build Command: `npm install && npx prisma generate`
4. Start Command: `npm start`
5. Adicionar variáveis de ambiente (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY)

### Banco de Dados → Render ou Railway

1. Criar PostgreSQL em https://railway.app ou https://render.com
2. Copiar a DATABASE_URL e adicionar ao backend

### Serviço de IA → Render (Docker)

1. Criar Web Service com Dockerfile
2. Apontar para pasta `ai/`

---

## 📦 Stack Resumida

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Frontend      | React 18, Vite, Tailwind CSS, Recharts |
| Backend       | Node.js 20, Express, Prisma ORM     |
| Banco de Dados| PostgreSQL 15                       |
| Cache         | Redis 7                             |
| IA / ML       | Python, FastAPI, Scikit-learn, Pandas |
| AI Generativa | Claude (Anthropic API)              |
| Coleta        | Puppeteer, Axios, node-cron         |
| Deploy        | Docker, Vercel, Render              |

---

## 📝 Licença

Projeto FINEVSIS — Uso interno. Todos os direitos reservados.
