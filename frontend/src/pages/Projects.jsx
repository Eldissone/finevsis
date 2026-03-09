import { Loader, MapPin, Rocket, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LocationFilters from '../components/LocationFilters.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { projectsAPI } from '../services/api.js';

function buildParams(country, city) {
  const params = {};
  if (country) params.country = country;
  if (city) params.city = city;
  return params;
}

function SummaryPill({ label, value }) {
  return (
    <div className="mini-stat">
      <div className="line-label">{label}</div>
      <div className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink-950">{value}</div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const { messages } = useI18n();
  const [payload, setPayload] = useState({ data: [], filters: { countries: [], cities: [] } });
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!country && user?.country) setCountry(user.country);
    if (!city && user?.city) setCity(user.city);
  }, [user, country, city]);

  function loadProjects(activeCountry = country, activeCity = city) {
    setLoading(true);
    projectsAPI.getAll(buildParams(activeCountry, activeCity))
      .then(response => setPayload(response.data))
      .catch(() => setPayload({ data: [], filters: { countries: [], cities: [] } }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();
  }, [country, city]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      await projectsAPI.generate();
      loadProjects();
    } catch (requestError) {
      setError(requestError.response?.data?.error || messages.projectsPage.errorFallback);
    } finally {
      setGenerating(false);
    }
  }

  const summary = useMemo(() => ({
    total: payload.data.length,
    active: payload.data.filter(project => ['approved', 'in_progress'].includes(project.status)).length,
    completed: payload.data.filter(project => project.status === 'completed').length,
  }), [payload.data]);

  return (
    <div className="space-y-6">
      <section className="surface">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <div className="font-serif text-4xl leading-none text-ink-700 sm:text-5xl">{messages.projectsPage.kicker}</div>
            <h1 className="section-heading mt-2">{messages.projectsPage.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
              {messages.projectsPage.copy}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="primary-action inline-flex items-center gap-2" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? messages.projectsPage.submitLoading : messages.projectsPage.submitIdle}
              </button>
              <div className="ghost-action inline-flex items-center gap-2">
                <MapPin size={15} />
                {user?.city || user?.country || messages.common.noProfileLocation}
              </div>
            </div>
          </div>

          <LocationFilters
            filters={payload.filters}
            country={country}
            city={city}
            onCountryChange={setCountry}
            onCityChange={setCity}
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <SummaryPill label={messages.projectsPage.totalProjects} value={summary.total} />
          <SummaryPill label={messages.projectsPage.activeTracks} value={summary.active} />
          <SummaryPill label={messages.projectsPage.completed} value={summary.completed} />
        </div>
      </section>

      {error && <div className="surface-soft border border-red-300/70 text-red-700">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-2">
        {loading && <div className="surface-soft text-ink-600">{messages.projectsPage.loading}</div>}

        {!loading && payload.data.length === 0 && (
          <div className="surface-soft text-ink-600">{messages.projectsPage.noEntries}</div>
        )}

        {!loading && payload.data.map(project => (
          <article key={project.id} className="surface">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="line-label mb-3">{messages.projectsPage.nodeLabel}</div>
                <h2 className="text-2xl font-semibold text-ink-950">{project.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {project.type && <span className="pill-inline">{project.type}</span>}
                  {project.country && (
                    <span className="pill-inline inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {project.country}
                    </span>
                  )}
                  {project.city && <span className="pill-inline">{project.city}</span>}
                  <span className="pill-inline">{messages.projectsPage.statuses[project.status] || project.status}</span>
                </div>
              </div>
              <div className="orbit-pill">
                <Rocket size={18} />
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-ink-600">
              {project.description || messages.projectsPage.fallback}
            </p>

            {project.techStack?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {project.techStack.map(tech => <span key={tech} className="stack-tag">{tech}</span>)}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="mini-stat">
                <div className="line-label">{messages.projectsPage.revenueModel}</div>
                <div className="mt-3 text-sm font-medium text-ink-700">{project.revenueModel || messages.projectsPage.revenueFallback}</div>
              </div>
              <div className="mini-stat">
                <div className="line-label">{messages.projectsPage.estimatedTime}</div>
                <div className="mt-3 text-sm font-medium text-ink-700">
                  {project.estimatedTime ? `${project.estimatedTime} ${messages.projectsPage.weeks}` : messages.projectsPage.estimatedFallback}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
