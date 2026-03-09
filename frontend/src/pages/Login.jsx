import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

function getRedirectTarget(location) {
  const from = location.state?.from;
  return from?.pathname ? `${from.pathname}${from.search || ''}` : '/';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, ready, user } = useAuth();
  const { messages } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && user) {
    return <Navigate to={getRedirectTarget(location)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate(getRedirectTarget(location), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || messages.loginPage.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="surface w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <div className="line-label">{messages.loginPage.label}</div>
            <div className="font-serif text-5xl leading-none text-ink-700 sm:text-6xl">{messages.loginPage.kicker}</div>
            <h1 className="section-heading">{messages.loginPage.title}</h1>
            <p className="max-w-xl text-base leading-7 text-ink-600">
              {messages.loginPage.copy}
            </p>

            <div className="grid gap-3">
              {messages.loginPage.notes.map(note => (
                <div key={note} className="mini-stat text-sm leading-6 text-ink-700">
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-soft">
            <div className="line-label">{messages.loginPage.accessLabel}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink-950">{messages.loginPage.accessTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              {messages.loginPage.accessCopy}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <input className="form-field" type="email" placeholder={messages.common.email} value={email} onChange={event => setEmail(event.target.value)} />
              <input className="form-field" type="password" placeholder={messages.common.password} value={password} onChange={event => setPassword(event.target.value)} />

              {error && <div className="rounded-[1.35rem] border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <button type="submit" className="primary-action inline-flex w-full items-center justify-center gap-2" disabled={loading}>
                <LockKeyhole size={16} />
                {loading ? messages.loginPage.submitLoading : messages.loginPage.submitIdle}
              </button>
            </form>

            <div className="mt-6 text-sm text-ink-600">
              {messages.loginPage.noAccount}{' '}
              <Link to="/register" className="font-semibold text-ink-950">
                {messages.loginPage.createProfile} <ArrowRight className="inline" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
