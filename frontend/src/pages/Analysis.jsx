import { BrainCircuit, Loader, MapPin, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { opportunitiesAPI, analysisAPI } from '../services/api.js';
import { AFRICAN_COUNTRIES, getAfricanCitiesForCountry } from '../data/africanMarkets.js';

export default function Analysis() {
  const { user } = useAuth();
  const { messages } = useI18n();
  const [input, setInput] = useState('');
  const [sector, setSector] = useState(messages.analysisPage.sectors[0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');
  const [sectorAuto, setSectorAuto] = useState(messages.analysisPage.sectors[0]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState('');
  const [autoResult, setAutoResult] = useState(null);
  const availableCities = getAfricanCitiesForCountry(country);
  const [creatingName, setCreatingName] = useState('');
  const [createdNames, setCreatedNames] = useState(new Set());

  useEffect(() => {
    if (!messages.analysisPage.sectors.includes(sector)) {
      setSector(messages.analysisPage.sectors[0]);
    }
  }, [messages.analysisPage.sectors, sector]);

  useEffect(() => {
    if (country && availableCities.length > 0) {
      if (!availableCities.includes(city)) {
        setCity(availableCities[0] || '');
      }
    } else {
      setCity('');
    }
  }, [country]);

  async function analyze() {
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await opportunitiesAPI.analyzeAI({
        description: input,
        sector,
        country: typeof country === 'string' ? country : user?.country,
        city: typeof city === 'string' ? city : user?.city,
      });
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || messages.analysisPage.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  async function runMarketInsights() {
    setAutoLoading(true);
    setAutoError('');
    setAutoResult(null);
    try {
      const response = await analysisAPI.marketInsights({
        country: country || undefined,
        region: city || undefined,
        sector: sectorAuto || undefined,
      });
      setAutoResult(response.data);
    } catch (requestError) {
      setAutoError(requestError.response?.data?.error || messages.analysisPage.errorFallback);
    } finally {
      setAutoLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="surface space-y-6">
        <div className="line-label">{messages.common.marketWorkflow.toUpperCase()}</div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="line-label mb-2">{messages.common.country}</div>
            <select
              className="form-field w-full"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              <option value="">{messages.common.allCountries}</option>
              {AFRICAN_COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="line-label mb-2">{messages.common.city}</div>
            <select
              className="form-field w-full"
              value={city}
              onChange={e => setCity(e.target.value)}
              disabled={!country}
            >
              <option value="">{messages.common.allCities}</option>
              {availableCities.map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="line-label mb-2">{messages.analysisPage.sectorFocus}</div>
            <select
              className="form-field w-full"
              value={sectorAuto}
              onChange={e => setSectorAuto(e.target.value)}
            >
              {messages.analysisPage.sectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="primary-action inline-flex items-center justify-center gap-2"
            onClick={runMarketInsights}
            disabled={autoLoading}
          >
            {autoLoading ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {autoLoading ? messages.common.sync : 'Gerar insights'}
          </button>
          <div className="ghost-action inline-flex items-center gap-2">
            <MapPin size={15} />
            {city || country || messages.common.noLocation}
          </div>
        </div>
        {autoError && <div className="surface-soft border border-red-300/70 text-red-700">{autoError}</div>}
        {autoResult && (
          <div className="space-y-6">
            <div>
              <div className="line-label mb-2">Tendencias</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {autoResult.trends?.map(t => (
                  <div key={t.id} className="metric-card">
                    <div className="text-sm font-semibold text-ink-950">{t.title}</div>
                    <div className="mt-2 text-sm text-ink-600">Growth {t.growthRate}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="line-label mb-2">Problemas</div>
              <div className="space-y-2">
                {autoResult.problems?.map(p => (
                  <div key={p.id} className="surface-soft text-sm leading-6 text-ink-700">{p.description}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="line-label mb-2">Lacunas</div>
              <div className="space-y-2">
                {autoResult.gaps?.map((g, i) => (
                  <div key={`${g}-${i}`} className="surface-soft text-sm leading-6 text-ink-700">{g}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="line-label mb-4">Sugestoes</div>
              <div className="space-y-3">
                {autoResult.suggestions?.map(s => (
                  <div key={s.name} className="surface-soft p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-ink-950">{s.name}</div>
                        <div className="mt-1 text-sm text-ink-700">{s.problem}</div>
                        <div className="mt-2 text-xs text-ink-600">Publico: {s.publicoAlvo}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-ink-600">Viabilidade</div>
                        <div className="font-semibold text-ink-950">{s.viabilidade}</div>
                        <div className="mt-2 text-xs text-ink-600">Crescimento</div>
                        <div className="font-semibold text-ink-950">{s.potencialCrescimento}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-ink-700">Modelo: {s.modeloNegocio}</div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="primary-action inline-flex items-center justify-center gap-2"
                        disabled={creatingName === s.name || createdNames.has(s.name)}
                        onClick={async () => {
                          try {
                            setCreatingName(s.name);
                            const payload = {
                              name: s.name,
                              description: s.problem,
                              targetAudience: s.publicoAlvo,
                              revenueModel: s.modeloNegocio,
                              country: country || user?.country || null,
                              city: city || user?.city || null,
                            };
                            await projectsAPI.create(payload);
                            setCreatedNames(prev => new Set(prev).add(s.name));
                          } finally {
                            setCreatingName('');
                          }
                        }}
                      >
                        {createdNames.has(s.name)
                          ? 'Criado'
                          : creatingName === s.name
                          ? 'A criar...'
                          : 'Criar projeto'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
      <section className="surface space-y-6">
        <div>
          <div className="font-serif text-4xl leading-none text-ink-700 sm:text-5xl">{messages.analysisPage.kicker}</div>
          <h1 className="section-heading mt-2">{messages.analysisPage.title}</h1>
          <p className="mt-5 text-base leading-7 text-ink-600">
            {messages.analysisPage.copy}
          </p>
        </div>

        <div className="ghost-action inline-flex w-fit items-center gap-2">
          <MapPin size={15} />
          {city || country || messages.common.allCountries}
        </div>

        <div>
          <div className="line-label mb-2">{messages.analysisPage.sectorFocus}</div>
          <select
            className="form-field w-full"
            value={sector}
            onChange={e => setSector(e.target.value)}
          >
            {messages.analysisPage.sectors.map(entry => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>

        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder={messages.analysisPage.placeholder}
          rows={8}
          className="form-field min-h-[220px] resize-none"
        />

        <button
          type="button"
          className="primary-action inline-flex items-center justify-center gap-2"
          onClick={analyze}
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
          {loading ? messages.analysisPage.submitLoading : messages.analysisPage.submitIdle}
        </button>

        {error && <div className="surface-soft border border-red-300/70 text-red-700">{error}</div>}
      </section>

      <section className="surface">
        {!result && (
          <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center text-ink-600">
            <Sparkles size={30} className="mb-4 text-ink-500" />
            <div className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink-950">{messages.analysisPage.emptyTitle}</div>
            <p className="mt-3 max-w-md leading-7">{messages.analysisPage.emptyCopy}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="line-label">{messages.analysisPage.result}</div>
                <h2 className="mt-2 text-3xl font-semibold text-ink-950">{result.opportunity_title}</h2>
                <p className="mt-4 max-w-3xl leading-7 text-ink-600">{result.summary}</p>
              </div>
              <div className="score-orb">{Math.round(result.final_score)}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <div className="line-label">{messages.analysisPage.demand}</div>
                <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-ink-950">
                  {Math.round(result.market_demand)}
                </div>
              </div>
              <div className="metric-card">
                <div className="line-label">{messages.analysisPage.viability}</div>
                <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-ink-950">
                  {Math.round(result.technical_viability)}
                </div>
              </div>
              <div className="metric-card">
                <div className="line-label">{messages.analysisPage.scalability}</div>
                <div className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-ink-950">
                  {Math.round(result.scalability)}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="surface-soft">
                <div className="line-label mb-4">{messages.analysisPage.differentials}</div>
                <div className="space-y-3">
                  {result.differentials?.map(item => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-ink-700">
                      <span className="mt-2 h-2 w-2 rounded-full bg-ink-950" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-soft">
                <div className="line-label mb-4">{messages.analysisPage.nextSteps}</div>
                <div className="space-y-3">
                  {result.next_steps?.map((item, index) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-ink-700">
                      <span className="font-mono text-ink-950">{String(index + 1).padStart(2, '0')}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="surface-soft">
                <div className="line-label mb-4">{messages.analysisPage.positioning}</div>
                <div className="space-y-3 text-sm leading-6 text-ink-700">
                  <div><span className="font-semibold text-ink-950">{messages.analysisPage.targetAudience}</span> {result.target_audience}</div>
                  <div><span className="font-semibold text-ink-950">{messages.analysisPage.revenueModel}</span> {result.revenue_model}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.tech_stack?.map(item => <span key={item} className="stack-tag">{item}</span>)}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
