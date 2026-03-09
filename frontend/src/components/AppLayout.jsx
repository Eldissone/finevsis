import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="grid-overlay" />
      </div>
      <Navbar />
      <main className="relative z-10 mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
