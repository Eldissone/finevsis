import { Activity, BarChart3, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LocationFilters from '../components/LocationFilters.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { AFRICAN_COUNTRIES, getAfricanCitiesForCountry } from '../data/africanMarkets.js';
import { opportunitiesAPI } from '../services/api.js';

function emptyPayload() {
  return { data: [], filters: { countries: [], cities: [] }, meta: null };
}

function buildParams(country, city, refreshToken) {
  const params = { limit: 24 };
  if (country) params.country = country;
  if (city) params.city = city;
  if (refreshToken) params.refresh = refreshToken;
  return params;
}

function formatMetaCopy(messages, meta) {
  switch (meta?.mode) {
    case 'ai_live':
      return messages.opportunitiesPage.liveMetaAi;
    case 'ai_stored':
      return messages.opportunitiesPage.liveMetaStored;
    case 'heuristic_live':
    case 'heuristic_stored':
      return messages.opportunitiesPage.liveMetaHeuristic;
    case 'database_fallback':
      return messages.opportunitiesPage.liveMetaFallback;
    default:
      return messages.opportunitiesPage.liveMetaFallback;
  }
}

function ScoreRail({ label, value, tone }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-ink-500">
        <span>{label}</span>
        <span className="text-ink-900">{Math.round(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-sand-soft">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, background: tone }} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, copy }) {
  return (
    <div className="mini-stat">
      <div className="line-label">{label}</div>
      <div className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink-950">{value}</div>
      <p className="mt-2 text-sm leading-6 text-ink-600">{copy}</p>
    </div>
  );
}

export default function Opportunities() {
  const { locale, messages } = useI18n();
  const [payload, setPayload] = useState(emptyPayload());
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setLoading(true);
    opportunitiesAPI.researchLive(buildParams(country, city, refreshToken))
      .then(response => setPayload(response.data))
      .catch(async () => {
        try {
          const response = await opportunitiesAPI.getAll(buildParams(country, city, refreshToken));
          setPayload({
            ...response.data,
            meta: {
              mode: 'database_fallback',
              signalsCount: 0,
              refreshedAt: new Date().toISOString(),
            },
          });
        } catch {
          setPayload(emptyPayload());
        }
      })
      .finally(() => setLoading(false));
  }, [country, city, refreshToken]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      setRefreshToken(current => current + 1);
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const suggestedCities = useMemo(() => getAfricanCitiesForCountry(country), [country]);

  const summary = useMemo(() => {
    if (payload.data.length === 0) {
      return {
        score: '--',
        demand: '--',
        topPriority: 0,
      };
    }

    return {
      score: Math.round(payload.data.reduce((total, item) => total + (item.finalScore || 0), 0) / payload.data.length),
      demand: Math.round(payload.data.reduce((total, item) => total + (item.marketDemand || 0), 0) / payload.data.length),
      topPriority: payload.data.filter(item => String(item.priority || '').toLowerCase().includes('high')).length,
    };
  }, [payload.data]);

  const refreshedAt = payload.meta?.refreshedAt
    ? new Date(payload.meta.refreshedAt).toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-US')
    : null;
  const scopeLabel = city || country
    ? messages.opportunitiesPage.scopeSelected.replace('{market}', [city, country].filter(Boolean).join(', '))
    : messages.opportunitiesPage.scopeAfrica;

  return (
    <div className="space-y-6">
      <section className="surface">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="font-serif text-4xl leading-none text-ink-700 sm:text-5xl">{messages.opportunitiesPage.kicker}</div>
            <h1 className="section-heading mt-2">{messages.opportunitiesPage.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
              {messages.opportunitiesPage.copy}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(21,18,14,0.08)] bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-700">
              <Sparkles size={12} />
              {messages.opportunitiesPage.liveBadge}
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-500">
              {scopeLabel}
            </p>
          </div>

          <LocationFilters
            filters={payload.filters}
            country={country}
            city={city}
            onCountryChange={setCountry}
            onCityChange={setCity}
            extraCountries={AFRICAN_COUNTRIES}
            extraCities={suggestedCities}
            onlyExtra
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <SummaryCard label={messages.opportunitiesPage.metrics.scoreLabel} value={summary.score} copy={messages.opportunitiesPage.metrics.scoreCopy} />
          <SummaryCard label={messages.opportunitiesPage.metrics.demandLabel} value={summary.demand} copy={messages.opportunitiesPage.metrics.demandCopy} />
          <SummaryCard label={messages.opportunitiesPage.metrics.highPriorityLabel} value={summary.topPriority} copy={messages.opportunitiesPage.metrics.highPriorityCopy} />
        </div>

        <div className="mt-4 filter-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="filter-label">{messages.opportunitiesPage.researchLabel}</div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-700">{formatMetaCopy(messages, payload.meta)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="ghost-action inline-flex items-center gap-2"
                onClick={() => setRefreshToken(current => current + 1)}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                {loading ? messages.opportunitiesPage.refreshLoading : messages.opportunitiesPage.refreshIdle}
              </button>
              <button
                type="button"
                className={`ghost-action inline-flex items-center gap-2 ${autoRefresh ? 'filter-chip-active' : ''}`}
                onClick={() => setAutoRefresh(v => !v)}
              >
                {autoRefresh ? 'Auto refresh: ON' : 'Auto refresh: OFF'}
              </button>
              {payload.meta?.mode && (
                <span className={`filter-chip ${payload.meta.mode.includes('heuristic') ? 'filter-chip-active' : (payload.meta.mode === 'database_fallback' ? '' : 'filter-chip-active')}`}>
                  {payload.meta.mode.includes('heuristic')
                    ? 'HEURISTIC'
                    : (payload.meta.mode === 'database_fallback'
                      ? messages.opportunitiesPage.liveFallbackBadge
                      : messages.opportunitiesPage.liveActiveBadge)}
                </span>
              )}
            </div>
          </div>
          {(payload.meta?.signalsCount || refreshedAt) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-500">
              {payload.meta?.signalsCount ? (
                <span>{messages.opportunitiesPage.signalsAnalyzed.replace('{count}', payload.meta.signalsCount)}</span>
              ) : null}
              {refreshedAt ? <span>{messages.opportunitiesPage.updatedAt.replace('{time}', refreshedAt)}</span> : null}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {loading && <div className="surface-soft text-ink-600">{messages.opportunitiesPage.loading}</div>}

        {!loading && payload.data.length === 0 && (
          <div className="surface-soft text-ink-600">{messages.opportunitiesPage.noEntries}</div>
        )}

        {!loading && payload.data.map((opportunity, index) => (
          <article key={opportunity.id} className="surface">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="line-label mb-3">{messages.opportunitiesPage.opportunity} #{String(index + 1).padStart(2, '0')}</div>
                <h2 className="text-2xl font-semibold text-ink-950">{opportunity.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {opportunity.sector && <span className="pill-inline">{opportunity.sector}</span>}
                  {opportunity.country && (
                    <span className="pill-inline inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {opportunity.country}
                    </span>
                  )}
                  {opportunity.city && <span className="pill-inline">{opportunity.city}</span>}
                  <span className="pill-inline inline-flex items-center gap-1">
                    <Sparkles size={12} />
                    {opportunity.priority}
                  </span>
                </div>
              </div>
              <div className="score-orb">{Math.round(opportunity.finalScore)}</div>
            </div>

            <p className="mt-5 text-sm leading-6 text-ink-600">
              {opportunity.description || messages.opportunitiesPage.fallback}
            </p>

            {opportunity.aiAnalysis?.whyNow && (
              <div className="mt-5 mini-stat">
                <div className="line-label">{messages.opportunitiesPage.whyNow}</div>
                <p className="mt-3 text-sm leading-6 text-ink-700">{opportunity.aiAnalysis.whyNow}</p>
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <ScoreRail label={messages.opportunitiesPage.marketDemand} value={opportunity.marketDemand} tone="#15120e" />
              <ScoreRail label={messages.opportunitiesPage.technicalViability} value={opportunity.technicalViability} tone="#6f7858" />
              <ScoreRail label={messages.opportunitiesPage.scalability} value={opportunity.scalability} tone="#c79f78" />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="mini-stat">
                <div className="line-label">{messages.opportunitiesPage.impactCompetition}</div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                  <Activity size={16} />
                  {messages.opportunitiesPage.impactText
                    .replace('{impact}', Math.round(opportunity.impactScore))
                    .replace('{competition}', Math.round(opportunity.competitionLevel))}
                </div>
              </div>
              <div className="mini-stat">
                <div className="line-label">{messages.opportunitiesPage.readout}</div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                  <BarChart3 size={16} />
                  {messages.opportunitiesPage.readoutText}
                </div>
              </div>
            </div>

            {opportunity.aiAnalysis?.sourceLinks?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {opportunity.aiAnalysis.sourceLinks.slice(0, 2).map((link, sourceIndex) => (
                  <a
                    key={`${link}-${sourceIndex}`}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="filter-chip"
                  >
                    {messages.opportunitiesPage.sourceLabel} {String(sourceIndex + 1).padStart(2, '0')}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
