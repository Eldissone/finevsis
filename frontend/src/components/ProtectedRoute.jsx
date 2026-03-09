import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

export default function ProtectedRoute() {
  const location = useLocation();
  const { ready, user } = useAuth();
  const { messages } = useI18n();

  if (!ready) {
    return (
      <div className="surface px-8 py-14 text-center">
        <div className="line-label mb-4">{messages.authGate.label}</div>
        <div className="font-display text-3xl text-ink-950">{messages.authGate.syncing}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
