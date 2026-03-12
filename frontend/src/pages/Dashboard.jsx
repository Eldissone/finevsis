import { ArrowRight, MapPinned, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LocationFilters from '../components/LocationFilters.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { analysisAPI, opportunitiesAPI, trendsAPI } from '../services/api.js';
import { AFRICAN_COUNTRIES, getAfricanCitiesForCountry } from '../data/africanMarkets.js';

const portraitImages = [
  // Consumer pulse — crowd/street market
  {
    image: 'https://images.unsplash.com/photo-1533621748259-7fe05128bea3?auto=format&fit=crop&w=800&q=80',
  },
  // Market interviews — people in conversation
  {
    image: 'https://images.unsplash.com/photo-1521790361509-74bba942ff6f?auto=format&fit=crop&w=800&q=80',
  },
  // Product demand — analytics/dashboard screen
  {
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  },
  // Operator insights — operations/factory
  {
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
  },
  // Field signals — agriculture/field work
  {
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  },
  // Regional context — city skyline
  {
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80',
  },
  // Distributed teams — remote work
  {
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  },
];

const showcaseImages = [
  {
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
  },
  {
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
  },
];

function buildParams(limit, country, city) {
  const params = { limit };
  if (country) params.country = country;
  if (city) params.city = city;
  return params;
}

function mergeFilters(...sources) {
  return {
    countries: [...new Set(sources.flatMap(source => source?.countries || []))].sort((left, right) => left.localeCompare(right)),
    cities: [...new Set(sources.flatMap(source => source?.cities || []))].sort((left, right) => left.localeCompare(right)),
  };
}

function PortraitCard({ card, index }) {
  const style = {
    backgroundImage: `url('${card.image}')`,
    transform: `perspective(1200px) rotateY(${index < 3 ? -8 + index * 2 : index > 3 ? (index - 3) * 2 : 0}deg)`,
  };

  return (
    <div className="portrait-card" style={style}>
      <div className="portrait-card__image" style={{ backgroundImage: `url('${card.image}')` }} />
      <div className="portrait-card__shade" />
      <div className="portrait-card__meta">
        <div className="text-sm font-semibold">{card.name}</div>
        <div className="text-xs uppercase tracking-[0.22em] text-white/80">{card.role}</div>
      </div>
    </div>
  );
}

function ResultCard({ label, value, copy }) {
  return (
    <div className="results-card">
      <div className="line-label">{label}</div>
      <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em] text-ink-950">{value}</div>
      <p className="mt-3 text-sm leading-6 text-ink-600">{copy}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { messages } = useI18n();
  const [dashboard, setDashboard] = useState(null);
  const [trends, setTrends] = useState({ data: [], filters: { countries: [], cities: [] } });
  const [opportunities, setOpportunities] = useState({ data: [], filters: { countries: [], cities: [] } });
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [populateError, setPopulateError] = useState('');
  const [populateMessage, setPopulateMessage] = useState('');
  const suggestedCities = getAfricanCitiesForCountry(country);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    analysisAPI.dashboard()
      .then(response => setDashboard(response.data))
      .catch(() => setDashboard(null));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      trendsAPI.getAll(buildParams(4, country, city)),
      opportunitiesAPI.getAll(buildParams(4, country, city)),
    ])
      .then(([trendsResponse, opportunitiesResponse]) => {
        setTrends(trendsResponse.data);
        setOpportunities(opportunitiesResponse.data);
      })
      .catch(() => {
        setTrends({ data: [], filters: { countries: [], cities: [] } });
        setOpportunities({ data: [], filters: { countries: [], cities: [] } });
      })
      .finally(() => setLoading(false));
  }, [country, city, tick]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const filters = mergeFilters(trends.filters, opportunities.filters);
  const stats = dashboard?.stats || {};
  const portraitCards = messages.dashboard.portraitCards.map((card, index) => ({ ...card, image: portraitImages[index]?.image }));

  async function populateCountry() {
    if (!country) return;
    setPopulating(true);
    setPopulateError('');
    setPopulateMessage('Job de ETL iniciado — a atualizar em segundos...');
    try {
      await analysisAPI.etl({ country, city, limit: 40 });
      let attempt = 0;
      const poll = async () => {
        attempt += 1;
        try {
          const [trendsResponse, opportunitiesResponse] = await Promise.all([
            trendsAPI.getAll(buildParams(4, country, city)),
            opportunitiesAPI.getAll(buildParams(4, country, city)),
          ]);
          setTrends(trendsResponse.data);
          setOpportunities(opportunitiesResponse.data);
          if ((trendsResponse.data?.data?.length || 0) > 0 || attempt >= 6) {
            setPopulateMessage(attempt >= 6 ? 'Job concluído (ou timeout) — vista atualizada.' : 'Job concluído — vista atualizada.');
            return;
          }
        } catch {
          /* ignore per attempt */
        }
        setTimeout(poll, 8000);
      };
      setTimeout(poll, 8000);
    } catch (err) {
      setPopulateError('Nao foi possivel popular este pais agora.');
    } finally {
      setPopulating(false);
    }
  }
  const featureBlurb = messages.dashboard.featureBlurb;
  const showcaseCards = messages.dashboard.showcaseCards;

  return (
    <div className="space-y-12">
      <section className="surface hero-shell">
        <div className="mx-auto max-w-4xl text-center">
          <div className="hero-kicker">{messages.dashboard.heroKicker}</div>
          <h1 className="section-heading mt-2">{messages.dashboard.heroTitle}</h1>
          <p className="section-copy mt-5">{messages.dashboard.heroCopy}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!user && (
              <>
                <Link to="/register" className="primary-action inline-flex items-center gap-2">
                  {messages.dashboard.ctaFree}
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="ghost-action">{messages.dashboard.ctaLogin}</Link>
              </>
            )}
            {user && (
              <>
                <Link to="/analysis" className="primary-action inline-flex items-center gap-2">
                  {messages.dashboard.ctaAnalysis}
                  <Sparkles size={16} />
                </Link>
                <Link to="/projects" className="ghost-action">{messages.dashboard.ctaProjects}</Link>
              </>
            )}
          </div>
        </div>

        <div className="portrait-row">
          {portraitCards.map((card, index) => <PortraitCard key={`${card.name}-${index}`} card={card} index={index} />)}
        </div>

        <div className="grid gap-6 border-t border-sand/70 pt-6 md:grid-cols-3">
          {featureBlurb.map(item => (
            <div key={item.title} className="text-center md:px-4">
              <h3 className="text-lg font-semibold text-ink-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 text-center">
        <div>
          <h2 className="section-heading">{messages.dashboard.needsTitle}</h2>
          <p className="section-copy mt-4">{messages.dashboard.needsCopy}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
          <article
            className="showcase-card showcase-card--image"
            style={{ backgroundImage: `url(${showcaseImages[0].image})` }}
          >
            <div className="showcase-card__overlay" />
            <div className="showcase-card__content flex h-full flex-col justify-end">
              <div className="line-label text-white/75">{messages.dashboard.labelTrendFeed}</div>
              <h3 className="mt-3 text-3xl font-semibold">{showcaseCards[0].title}</h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/85">{showcaseCards[0].copy}</p>
            </div>
          </article>

          <article className="showcase-card">
            <div className="showcase-card__plain">
              <div className="line-label">{messages.dashboard.labelAuthProjects}</div>
              <h3 className="mt-3 text-3xl font-semibold text-ink-950">{showcaseCards[1].title}</h3>
              <p className="mt-4 text-sm leading-6 text-ink-600">{showcaseCards[1].copy}</p>
              <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white">
                <ShieldCheck size={14} />
                {messages.dashboard.secureWorkspace}
              </div>
            </div>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.45fr]">
          <article className="showcase-card bg-caramel-soft">
            <div className="showcase-card__plain">
              <div className="line-label">{messages.dashboard.labelLocalFilters}</div>
              <h3 className="mt-3 text-3xl font-semibold text-ink-950">{showcaseCards[2].title}</h3>
              <p className="mt-4 text-sm leading-6 text-ink-700">{showcaseCards[2].copy}</p>
            </div>
          </article>

          <article
            className="showcase-card showcase-card--image"
            style={{ backgroundImage: `linear-gradient(90deg, rgba(111,120,88,0.82), rgba(111,120,88,0.55)), url(${showcaseImages[1].image})` }}
          >
            <div className="showcase-card__content flex h-full flex-col justify-end">
              <div className="line-label text-white/75">{messages.dashboard.labelOpportunityBoard}</div>
              <h3 className="mt-3 text-3xl font-semibold">{showcaseCards[3].title}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">{showcaseCards[3].copy}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <h2 className="section-heading">{messages.dashboard.resultsTitle}</h2>
          <p className="section-copy mt-4">{messages.dashboard.resultsCopy}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <LocationFilters
            filters={filters}
            country={country}
            city={city}
            onCountryChange={setCountry}
            onCityChange={setCity}
            extraCountries={AFRICAN_COUNTRIES}
            extraCities={suggestedCities}
            onlyExtra
          />
          <div className="space-y-3">
            <div className="results-grid">
              <ResultCard label={messages.dashboard.stats.trends.label} value={stats.trendsCount ?? '--'} copy={messages.dashboard.stats.trends.copy} />
              <ResultCard label={messages.dashboard.stats.opportunities.label} value={stats.opportunitiesCount ?? '--'} copy={messages.dashboard.stats.opportunities.copy} />
              <ResultCard label={messages.dashboard.stats.highPriority.label} value={stats.highPriority ?? '--'} copy={messages.dashboard.stats.highPriority.copy} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="ghost-action inline-flex items-center gap-2"
                onClick={populateCountry}
                disabled={!country || populating}
              >
                <Sparkles size={15} className={populating ? 'animate-spin' : ''} />
                {populating ? 'Populando...' : 'Popular país'}
              </button>
              {populateError && <span className="text-sm text-red-700">{populateError}</span>}
              {populateMessage && !populateError && <span className="text-sm text-ink-600">{populateMessage}</span>}
              <button
                type="button"
                className={`ghost-action inline-flex items-center gap-2 ${autoRefresh ? 'filter-chip-active' : ''}`}
                onClick={() => setAutoRefresh(v => !v)}
              >
                {autoRefresh ? 'Auto refresh: ON' : 'Auto refresh: OFF'}
              </button>
            </div>
          </div>

        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="surface">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="line-label">{messages.dashboard.topTrendsLabel}</div>
                <h3 className="mt-2 text-3xl font-semibold text-ink-950">{messages.dashboard.topTrendsTitle}</h3>
              </div>
              <Link to="/trends" className="ghost-action">{messages.dashboard.openTrends}</Link>
            </div>

            <div className="mt-6 space-y-4">
              {loading && <div className="surface-soft text-ink-600">{messages.dashboard.loadingTrends}</div>}
              {!loading && trends.data.length === 0 && <div className="surface-soft text-ink-600">{messages.dashboard.noTrends}</div>}
              {!loading && trends.data.map(trend => (
                <article key={trend.id} className="list-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-ink-950">{trend.title}</h4>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {trend.category && <span className="pill-inline">{trend.category}</span>}
                        {trend.country && <span className="pill-inline">{trend.country}</span>}
                        {trend.city && <span className="pill-inline">{trend.city}</span>}
                      </div>
                    </div>
                    <div className="score-orb">{Math.round(trend.growthRate)}</div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="surface">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="line-label">{messages.dashboard.topOpportunitiesLabel}</div>
                <h3 className="mt-2 text-3xl font-semibold text-ink-950">{messages.dashboard.topOpportunitiesTitle}</h3>
              </div>
              <Link to="/opportunities" className="ghost-action">{messages.dashboard.openOpportunities}</Link>
            </div>

            <div className="mt-6 space-y-4">
              {loading && <div className="surface-soft text-ink-600">{messages.dashboard.loadingOpportunities}</div>}
              {!loading && opportunities.data.length === 0 && <div className="surface-soft text-ink-600">{messages.dashboard.noOpportunities}</div>}
              {!loading && opportunities.data.map(opportunity => (
                <article key={opportunity.id} className="list-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-ink-950">{opportunity.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-ink-600">
                        {messages.dashboard.demand} {Math.round(opportunity.marketDemand)} / {messages.dashboard.viability} {Math.round(opportunity.technicalViability)} /
                        {' '}{messages.dashboard.scale} {Math.round(opportunity.scalability)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {opportunity.sector && <span className="pill-inline">{opportunity.sector}</span>}
                        {opportunity.country && <span className="pill-inline">{opportunity.country}</span>}
                        {opportunity.city && <span className="pill-inline">{opportunity.city}</span>}
                      </div>
                    </div>
                    <div className="score-orb">{Math.round(opportunity.finalScore)}</div>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
