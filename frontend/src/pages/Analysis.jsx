import { BrainCircuit, Loader, MapPin, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { opportunitiesAPI } from '../services/api.js';

export default function Analysis() {
  const { user } = useAuth();
  const { messages } = useI18n();
  const [input, setInput] = useState('');
  const [sector, setSector] = useState(messages.analysisPage.sectors[0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!messages.analysisPage.sectors.includes(sector)) {
      setSector(messages.analysisPage.sectors[0]);
    }
  }, [messages.analysisPage.sectors, sector]);

  async function analyze() {
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await opportunitiesAPI.analyzeAI({
        description: input,
        sector,
        country: user?.country,
        city: user?.city,
      });
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || messages.analysisPage.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
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
          {user?.city || user?.country || messages.common.noLocation}
        </div>

        <div>
          <div className="line-label mb-3">{messages.analysisPage.sectorFocus}</div>
          <div className="flex flex-wrap gap-2">
            {messages.analysisPage.sectors.map(entry => (
              <button
                key={entry}
                type="button"
                className={`chip ${sector === entry ? 'chip-active' : ''}`}
                onClick={() => setSector(entry)}
              >
                {entry}
              </button>
            ))}
          </div>
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
