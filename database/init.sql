-- ============================================================
-- FINEVSIS - Inicializacao do Banco de Dados PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trend_status') THEN
    CREATE TYPE trend_status AS ENUM ('active', 'declining', 'emerging', 'stable');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_priority') THEN
    CREATE TYPE opportunity_priority AS ENUM ('high', 'medium', 'low');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('suggested', 'in_review', 'approved', 'in_progress', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(50) DEFAULT 'analyst',
  bio         TEXT,
  avatar_url  TEXT,
  country     VARCHAR(100),
  city        VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trends (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  sector        VARCHAR(100),
  country       VARCHAR(100),
  city          VARCHAR(100),
  growth_rate   NUMERIC(5,2) DEFAULT 0,
  relevance     NUMERIC(5,2) DEFAULT 0,
  source        VARCHAR(255),
  source_url    TEXT,
  status        trend_status DEFAULT 'emerging',
  raw_data      JSONB,
  collected_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trends_category ON trends(category);
CREATE INDEX IF NOT EXISTS idx_trends_sector ON trends(sector);
CREATE INDEX IF NOT EXISTS idx_trends_country ON trends(country);
CREATE INDEX IF NOT EXISTS idx_trends_city ON trends(city);
CREATE INDEX IF NOT EXISTS idx_trends_growth ON trends(growth_rate DESC);

CREATE TABLE IF NOT EXISTS problems (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description  TEXT NOT NULL,
  sector       VARCHAR(100),
  frequency    NUMERIC(4,2) DEFAULT 0,
  impact       NUMERIC(4,2) DEFAULT 0,
  tags         TEXT[],
  source       VARCHAR(255),
  validated    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_sector ON problems(sector);
CREATE INDEX IF NOT EXISTS idx_problems_impact ON problems(impact DESC);

CREATE TABLE IF NOT EXISTS opportunities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id          UUID REFERENCES problems(id) ON DELETE SET NULL,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  solution            TEXT,
  sector              VARCHAR(100),
  country             VARCHAR(100),
  city                VARCHAR(100),
  market_demand       NUMERIC(5,2) DEFAULT 0,
  competition_level   NUMERIC(5,2) DEFAULT 0,
  technical_viability NUMERIC(5,2) DEFAULT 0,
  impact_score        NUMERIC(5,2) DEFAULT 0,
  scalability         NUMERIC(5,2) DEFAULT 0,
  final_score         NUMERIC(5,2) DEFAULT 0,
  priority            opportunity_priority DEFAULT 'medium',
  tags                TEXT[],
  ai_analysis         JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_opportunities_country ON opportunities(country);
CREATE INDEX IF NOT EXISTS idx_opportunities_city ON opportunities(city);

CREATE OR REPLACE FUNCTION calculate_opportunity_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.final_score := (
    (NEW.market_demand * 0.35) +
    ((100 - NEW.competition_level) * 0.20) +
    (NEW.technical_viability * 0.20) +
    (NEW.impact_score * 0.15) +
    (NEW.scalability * 0.10)
  );

  IF NEW.final_score >= 70 THEN
    NEW.priority := 'high';
  ELSIF NEW.final_score >= 45 THEN
    NEW.priority := 'medium';
  ELSE
    NEW.priority := 'low';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_opportunity_score ON opportunities;
CREATE TRIGGER trg_opportunity_score
  BEFORE INSERT OR UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION calculate_opportunity_score();

CREATE TABLE IF NOT EXISTS projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id   UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  type             VARCHAR(100),
  country          VARCHAR(100),
  city             VARCHAR(100),
  tech_stack       TEXT[],
  target_audience  TEXT,
  revenue_model    TEXT,
  estimated_cost   NUMERIC(12,2),
  estimated_time   INTEGER,
  status           project_status DEFAULT 'suggested',
  next_steps       JSONB,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country);
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);

CREATE TABLE IF NOT EXISTS market_data (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source       VARCHAR(100) NOT NULL,
  data_type    VARCHAR(100),
  keyword      VARCHAR(255),
  region       VARCHAR(100) DEFAULT 'AO',
  raw_payload  JSONB NOT NULL,
  processed    BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data(source);
CREATE INDEX IF NOT EXISTS idx_market_data_processed ON market_data(processed);
CREATE INDEX IF NOT EXISTS idx_market_data_keyword ON market_data(keyword);

INSERT INTO trends (title, category, sector, country, city, growth_rate, relevance, source, status)
SELECT * FROM (
  VALUES
    ('Agritech & Agricultura Digital', 'Tecnologia', 'Agricultura', 'Angola', 'Huambo', 87.0, 91.0, 'Google Trends', 'emerging'::trend_status),
    ('Microcredito Digital', 'Fintech', 'Financas', 'Angola', 'Luanda', 74.0, 84.0, 'Relatorios Bancarios', 'active'::trend_status),
    ('Servicos de Logistica Local', 'Logistica', 'Transporte', 'Mozambique', 'Maputo', 68.0, 76.0, 'Redes Sociais', 'active'::trend_status),
    ('Educacao Profissional Online', 'Edtech', 'Educacao', 'Portugal', 'Lisboa', 91.0, 93.0, 'Startups Emergentes', 'emerging'::trend_status),
    ('Saude Preventiva e Telemedicina', 'Healthtech', 'Saude', 'Angola', 'Benguela', 82.0, 88.0, 'Dados de Mercado', 'emerging'::trend_status),
    ('Marketplace de Servicos Tecnicos', 'Plataformas', 'Servicos', 'Namibia', 'Windhoek', 65.0, 72.0, 'Feedback Utilizadores', 'active'::trend_status)
) AS seed(title, category, sector, country, city, growth_rate, relevance, source, status)
WHERE NOT EXISTS (SELECT 1 FROM trends);

INSERT INTO problems (description, sector, frequency, impact, tags)
SELECT * FROM (
  VALUES
    ('Agricultores sem acesso a previsoes climaticas precisas', 'Agricultura', 9.0, 8.5, ARRAY['clima', 'agricultor', 'dados']),
    ('Pequenas empresas sem presenca digital eficaz', 'Comercio', 8.5, 7.0, ARRAY['PME', 'digital', 'marketing']),
    ('Mototaxis sem sistema de gestao e pagamento digital', 'Transporte', 7.5, 8.0, ARRAY['transporte', 'pagamento', 'app']),
    ('Desenvolvedores iniciantes sem projetos reais no portfolio', 'Tecnologia', 9.0, 6.0, ARRAY['dev', 'portfolio', 'emprego']),
    ('Falta de plataformas de mentoria profissional acessiveis', 'Educacao', 8.0, 9.0, ARRAY['mentoria', 'carreira', 'educacao'])
) AS seed(description, sector, frequency, impact, tags)
WHERE NOT EXISTS (SELECT 1 FROM problems);

INSERT INTO opportunities (title, sector, country, city, market_demand, competition_level, technical_viability, impact_score, scalability)
SELECT * FROM (
  VALUES
    ('Plataforma de Credito Agricola Digital', 'Agricultura', 'Angola', 'Huambo', 92.0, 25.0, 80.0, 90.0, 85.0),
    ('App de Gestao para Mototaxis', 'Transporte', 'Angola', 'Luanda', 84.0, 30.0, 82.0, 85.0, 70.0),
    ('Plataforma de Mentoria Profissional', 'Educacao', 'Portugal', 'Lisboa', 88.0, 35.0, 85.0, 90.0, 92.0),
    ('Marketplace de Servicos Tecnicos', 'Servicos', 'Namibia', 'Windhoek', 79.0, 45.0, 75.0, 78.0, 80.0),
    ('SaaS de Presenca Digital para PMEs', 'Comercio', 'Mozambique', 'Maputo', 75.0, 50.0, 88.0, 80.0, 90.0),
    ('Sistema de Previsao Agricola com IA', 'Agricultura', 'Angola', 'Benguela', 90.0, 20.0, 70.0, 92.0, 88.0)
) AS seed(title, sector, country, city, market_demand, competition_level, technical_viability, impact_score, scalability)
WHERE NOT EXISTS (SELECT 1 FROM opportunities);
