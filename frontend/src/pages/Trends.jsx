import { BarChart3, Globe2, MapPin, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import LocationFilters from '../components/LocationFilters.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { trendsAPI } from '../services/api.js';
import { AFRICAN_COUNTRIES, getAfricanCitiesForCountry } from '../data/africanMarkets.js';

const COLORS = ['#15120e', '#6f7858', '#c79f78', '#60574d', '#cbbca9', '#3d362f'];

function buildParams(country, city) {
  const params = { limit: 20 };
  if (country) params.country = country;
  if (city) params.city = city;
  return params;
}

function Metric({ label, value, copy }) {
  return (
    <div className="mini-stat">
      <div className="line-label">{label}</div>
      <div className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink-950">{value}</div>
      <p className="mt-2 text-sm leading-6 text-ink-600">{copy}</p>
    </div>
  );
}

export default function Trends() {
  const { messages } = useI18n();
  const [payload, setPayload] = useState({ data: [], filters: { countries: [], cities: [] } });
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const suggestedCities = getAfricanCitiesForCountry(country);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    trendsAPI.getAll(buildParams(country, city))
      .then(response => setPayload(response.data))
      .catch(() => setPayload({ data: [], filters: { countries: [], cities: [] } }))
      .finally(() => setLoading(false));
  }, [country, city, tick]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const chartData = payload.data.map(trend => ({
    name: trend.title.split(' ').slice(0, 3).join(' '),
    growth: trend.growthRate,
  }));

  const metrics = useMemo(() => {
    if (payload.data.length === 0) {
      return {
        averageGrowth: '--',
        localized: 0,
        sectors: 0,
      };
    }

    const averageGrowth = Math.round(
      payload.data.reduce((total, trend) => total + (trend.growthRate || 0), 0) / payload.data.length,
    );

    return {
      averageGrowth,
      localized: payload.data.filter(trend => trend.country || trend.city).length,
      sectors: new Set(payload.data.map(trend => trend.sector).filter(Boolean)).size,
    };
  }, [payload.data]);

  return (
    <div className="space-y-6">
      <section className="surface">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="font-serif text-4xl leading-none text-ink-700 sm:text-5xl">{messages.trendsPage.kicker}</div>
            <h1 className="section-heading mt-2">{messages.trendsPage.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
              {messages.trendsPage.copy}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="pill-inline inline-flex items-center gap-2">
                <Globe2 size={15} />
                {city || country || messages.trendsPage.allMarkets}
              </div>
              <div className="pill-inline inline-flex items-center gap-2">
                <TrendingUp size={15} />
                {payload.data.length} {messages.trendsPage.activeSignals}
              </div>
            </div>
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
          <Metric label={messages.trendsPage.metrics.growthLabel} value={metrics.averageGrowth} copy={messages.trendsPage.metrics.growthCopy} />
          <Metric label={messages.trendsPage.metrics.localizedLabel} value={metrics.localized} copy={messages.trendsPage.metrics.localizedCopy} />
          <Metric label={messages.trendsPage.metrics.sectorsLabel} value={metrics.sectors} copy={messages.trendsPage.metrics.sectorsCopy} />
        </div>
        <div className="mt-3">
          <button
            type="button"
            className={`ghost-action inline-flex items-center gap-2 ${autoRefresh ? 'filter-chip-active' : ''}`}
            onClick={() => setAutoRefresh(v => !v)}
          >
            {autoRefresh ? 'Auto refresh: ON' : 'Auto refresh: OFF'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="surface">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="line-label">{messages.trendsPage.growthCurve}</div>
              <h2 className="mt-2 text-3xl font-semibold text-ink-950">{messages.trendsPage.growthTitle}</h2>
            </div>
            <div className="orbit-pill">
              <BarChart3 size={18} />
            </div>
          </div>

          <div className="mt-6 h-[320px] rounded-[2rem] border border-sand/60 bg-[#f9f4ed] p-4">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-ink-600">
                {messages.trendsPage.chartEmpty}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: '#60574d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a29586', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(203, 188, 169, 0.22)' }}
                    contentStyle={{
                      background: '#fffaf3',
                      border: '1px solid #cbbca9',
                      borderRadius: 18,
                      color: '#15120e',
                    }}
                  />
                  <Bar dataKey="growth" radius={[14, 14, 0, 0]}>
                    {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="surface">
          <div className="line-label">{messages.trendsPage.notesLabel}</div>
          <h2 className="mt-2 text-3xl font-semibold text-ink-950">{messages.trendsPage.notesTitle}</h2>
          <div className="mt-6 space-y-4">
            {loading && <div className="surface-soft text-ink-600">{messages.trendsPage.loadingSummary}</div>}

            {!loading && payload.data.length === 0 && (
              <div className="surface-soft text-ink-600">{messages.trendsPage.noEntries}</div>
            )}

            {!loading && payload.data.slice(0, 3).map((trend, index) => (
              <article key={trend.id} className="list-card">
                <div className="line-label">{messages.trendsPage.trend} {String(index + 1).padStart(2, '0')}</div>
                <h3 className="mt-3 text-lg font-semibold text-ink-950">{trend.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  {trend.description || `${trend.category || messages.trendsPage.market} ${messages.trendsPage.notesFallback}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {trend.category && <span className="pill-inline">{trend.category}</span>}
                  {trend.country && <span className="pill-inline">{trend.country}</span>}
                  {trend.city && <span className="pill-inline">{trend.city}</span>}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {loading && <div className="surface-soft text-ink-600">{messages.trendsPage.loadingFeed}</div>}

        {!loading && payload.data.length === 0 && (
          <div className="surface-soft text-ink-600">{messages.trendsPage.noEntries}</div>
        )}

        {!loading && payload.data.map((trend, index) => (
          <article key={trend.id} className="surface">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="line-label mb-3">{messages.trendsPage.trend} #{String(index + 1).padStart(2, '0')}</div>
                <h3 className="text-2xl font-semibold text-ink-950">{trend.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">
                  {trend.description || `${trend.category || messages.trendsPage.market} ${messages.trendsPage.feedFallback.replace('{relevance}', Math.round(trend.relevance))}`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="pill-inline">{trend.category || messages.trendsPage.general}</span>
                  <span className="pill-inline">{trend.sector || messages.trendsPage.market}</span>
                  {trend.country && (
                    <span className="pill-inline inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {trend.country}
                    </span>
                  )}
                  {trend.city && <span className="pill-inline">{trend.city}</span>}
                  {trend.source && <span className="pill-inline">{trend.source}</span>}
                </div>
              </div>
              <div className="score-orb">{Math.round(trend.growthRate)}</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
