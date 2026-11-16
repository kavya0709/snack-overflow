import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      {/* On mobile: push content down below top bar (h-14 ~56px). On desktop: push right of sidebar (lg:pl-60) */}
      <main className="pt-14 lg:pt-0 lg:pl-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
