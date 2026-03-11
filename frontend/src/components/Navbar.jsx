import { LogIn, LogOut, Menu, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import AvatarBadge from './AvatarBadge.jsx';

function NavTextLink({ to, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
      {label}
    </NavLink>
  );
}

function LanguageSwitcher({ locale, setLocale, label }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(203,188,169,0.8)] bg-white/75 p-1" aria-label={label}>
      {['pt', 'en'].map(option => (
        <button
          key={option}
          type="button"
          className={`chip !px-3 !py-1 ${locale === option ? 'chip-active' : ''}`}
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, ready } = useAuth();
  const { locale, setLocale, messages } = useI18n();


  const rightLinks = [
    { to: '/trends', label: messages.nav.trends },
    { to: '/opportunities', label: messages.nav.opportunities },
    { to: '/analysis', label: messages.nav.analysis },
    { to: '/projects', label: messages.nav.projects },
  ];

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="surface mx-auto max-w-[1320px] !px-6 !py-4">

        {/* DESKTOP */}
        <div className="hidden items-center justify-between lg:flex">

          {/* Logo */}
          <Link to="/" className="text-left">
            <div className="font-display text-lg font-extrabold tracking-[-0.05em] text-ink-950">
              FINEVSIS
            </div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-ink-500">
              {messages.common.marketWorkflow}
            </div>
          </Link>

          {/* Navegação */}
          <nav className="flex items-center gap-6">
            {rightLinks.map(link => (
              <NavTextLink key={link.to} {...link} />
            ))}
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-2">

            {!ready && (
              <span className="chip">
                {messages.common.sync}
              </span>
            )}

            {ready && !user && (
              <>
                <Link to="/login" className="ghost-action inline-flex items-center gap-2">
                  <LogIn size={15} />
                  {messages.common.login}
                </Link>

                <Link to="/register" className="primary-action inline-flex items-center gap-2">
                  <UserRound size={15} />
                  {messages.common.getStarted}
                </Link>
              </>
            )}

            {ready && user && (
              <>
                <Link to="/profile" className="profile-trigger flex items-center gap-2">
                  <AvatarBadge user={user} className="h-8 w-8" />
                  <span className="profile-trigger__meta">
                    <span className="profile-trigger__name">
                      {user.name}
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  className="primary-action inline-flex items-center gap-2"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut size={15} />
                  {messages.common.logout}
                </button>
              </>
            )}

            <LanguageSwitcher
              locale={locale}
              setLocale={setLocale}
              label={messages.common.language}
            />

          </div>
        </div>


        {/* MOBILE */}
        <div className="flex items-center justify-between gap-4 lg:hidden">

          <Link to="/" className="text-left">
            <div className="font-display text-lg font-extrabold tracking-[-0.05em] text-ink-950">
              FINEVSIS
            </div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-ink-500">
              {messages.common.marketWorkflow}
            </div>
          </Link>

          <div className="flex items-center gap-2">

            <LanguageSwitcher
              locale={locale}
              setLocale={setLocale}
              label={messages.common.language}
            />

            {ready && !user && (
              <Link to="/login" className="ghost-action">
                {messages.common.login}
              </Link>
            )}

            {ready && user && (
              <Link to="/profile" className="ghost-action">
                {messages.common.profile}
              </Link>
            )}

            <div className="brand-cube">
              <Menu size={16} />
            </div>

          </div>
        </div>


        {/* MOBILE NAV */}
        <div className="mt-4 flex flex-wrap gap-2 lg:hidden">

          {[...rightLinks].map(link => (
            <NavTextLink key={link.to} {...link} />
          ))}

          {!user && ready && (
            <Link to="/register" className="primary-action">
              {messages.common.getStarted}
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}
