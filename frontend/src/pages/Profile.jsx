import { CalendarDays, Globe2, Mail, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import AvatarBadge from '../components/AvatarBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

function formatDate(value, locale) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US');
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="mini-stat">
      <div className="line-label">{label}</div>
      <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink-700">
        <Icon size={16} />
        <span>{value}</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { logout, updateProfile, user } = useAuth();
  const { locale, messages } = useI18n();
  const [form, setForm] = useState({
    name: '',
    bio: '',
    country: '',
    city: '',
    avatarUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      bio: user.bio || '',
      country: user.country || '',
      city: user.city || '',
      avatarUrl: user.avatarUrl || '',
    });
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(form);
      setMessage(messages.profilePage.updated);
    } catch (requestError) {
      setError(requestError.response?.data?.error || messages.profilePage.errorFallback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.74fr_1.26fr]">
      <aside className="surface space-y-6">
        <div className="line-label">{messages.profilePage.label}</div>
        <div className="flex items-center gap-4">
          <AvatarBadge user={{ ...user, avatarUrl: form.avatarUrl }} className="h-24 w-24" />
          <div>
            <div className="text-3xl font-semibold tracking-[-0.04em] text-ink-950">{user?.name}</div>
            <div className="mt-2 text-sm text-ink-600">{user?.email}</div>
          </div>
        </div>

        <p className="text-sm leading-6 text-ink-600">
          {messages.profilePage.intro}
        </p>

        <div className="grid gap-3">
          <InfoCard icon={Globe2} label={messages.profilePage.location} value={user?.city || user?.country || messages.common.noLocation} />
          <InfoCard icon={CalendarDays} label={messages.profilePage.memberSince} value={formatDate(user?.createdAt, locale)} />
          <InfoCard icon={Mail} label={messages.profilePage.email} value={user?.email || '--'} />
        </div>

        <button type="button" className="ghost-action" onClick={logout}>{messages.common.logout}</button>
      </aside>

      <section className="surface">
        <div className="font-serif text-4xl leading-none text-ink-700 sm:text-5xl">{messages.profilePage.kicker}</div>
        <h1 className="section-heading mt-2">{messages.profilePage.title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
          {messages.profilePage.copy}
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <input className="form-field sm:col-span-2" type="text" placeholder={messages.common.name} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
          <input className="form-field sm:col-span-2 bg-sand-soft text-ink-500" type="email" placeholder={messages.common.email} value={user?.email || ''} readOnly />
          <input className="form-field" type="text" placeholder={messages.common.country} value={form.country} onChange={event => setForm(current => ({ ...current, country: event.target.value }))} />
          <input className="form-field" type="text" placeholder={messages.common.city} value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} />
          <input className="form-field sm:col-span-2" type="url" placeholder={messages.common.avatarUrl} value={form.avatarUrl} onChange={event => setForm(current => ({ ...current, avatarUrl: event.target.value }))} />
          <textarea className="form-field min-h-[160px] resize-none sm:col-span-2" placeholder={messages.common.bio} value={form.bio} onChange={event => setForm(current => ({ ...current, bio: event.target.value }))} />

          {message && <div className="rounded-[1.35rem] border border-green-300/80 bg-green-50 px-4 py-3 text-sm text-green-700 sm:col-span-2">{message}</div>}
          {error && <div className="rounded-[1.35rem] border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</div>}

          <button type="submit" className="primary-action inline-flex items-center justify-center gap-2 sm:col-span-2" disabled={saving}>
            <Save size={16} />
            {saving ? messages.profilePage.saveLoading : messages.profilePage.saveIdle}
          </button>
        </form>
      </section>
    </div>
  );
}
