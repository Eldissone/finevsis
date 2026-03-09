import { ArrowRight, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { ready, register, user } = useAuth();
  const { messages } = useI18n();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || messages.registerPage.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="surface w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="space-y-6">
            <div className="line-label">{messages.registerPage.label}</div>
            <div className="font-serif text-5xl leading-none text-ink-700 sm:text-6xl">{messages.registerPage.kicker}</div>
            <h1 className="section-heading">{messages.registerPage.title}</h1>
            <p className="max-w-xl text-base leading-7 text-ink-600">
              {messages.registerPage.copy}
            </p>

            <div className="grid gap-3">
              {messages.registerPage.steps.map(step => (
                <div key={step} className="mini-stat text-sm leading-6 text-ink-700">
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-soft">
            <div className="line-label">{messages.registerPage.panelLabel}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink-950">{messages.registerPage.panelTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              {messages.registerPage.panelCopy}
            </p>

            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <input className="form-field sm:col-span-2" type="text" placeholder={messages.common.name} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
              <input className="form-field sm:col-span-2" type="email" placeholder={messages.common.email} value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} />
              <input className="form-field sm:col-span-2" type="password" placeholder={messages.common.password} value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} />
              <input className="form-field" type="text" placeholder={messages.common.country} value={form.country} onChange={event => setForm(current => ({ ...current, country: event.target.value }))} />
              <input className="form-field" type="text" placeholder={messages.common.city} value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} />

              {error && <div className="rounded-[1.35rem] border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</div>}

              <button type="submit" className="primary-action inline-flex w-full items-center justify-center gap-2 sm:col-span-2" disabled={loading}>
                <UserPlus size={16} />
                {loading ? messages.registerPage.submitLoading : messages.registerPage.submitIdle}
              </button>
            </form>

            <div className="mt-6 text-sm text-ink-600">
              {messages.registerPage.alreadyRegistered}{' '}
              <Link to="/login" className="font-semibold text-ink-950">
                {messages.common.login} <ArrowRight className="inline" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
