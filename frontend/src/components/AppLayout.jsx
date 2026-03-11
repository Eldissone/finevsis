import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { useI18n } from '../context/I18nContext.jsx';

export default function AppLayout() {
  const { messages } = useI18n();
  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="grid-overlay" />
      </div>
      <Navbar />
      <main className="relative z-10 mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="surface-soft mb-6 border border-ink-200/50 p-3 text-sm leading-6 text-ink-700">
          {messages.common.valueProp}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
