import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cookie,
  ClipboardList,
  LogOut,
  ChefHat,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'sidebar-link-active' : 'sidebar-link';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">Snack Overflow</h1>
            <p className="text-xs text-neutral-400">Office Pantry</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>
        <NavLink to="/snacks" className={navLinkClass} onClick={() => setMobileOpen(false)}>
          <Cookie size={16} />
          Pantry
        </NavLink>
        {isAdmin && (
          <NavLink to="/activities" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <ClipboardList size={16} />
            Activity Log
          </NavLink>
        )}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-neutral-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-50 mb-2">
          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-green-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-900 truncate">{user?.name}</p>
            <p className="text-xs text-neutral-400 truncate">
              {user?.role === 'ADMIN' ? '🛡️ Admin' : '👤 Member'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          id="logout-button"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-neutral-200 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-neutral-900">Snack Overflow</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
          aria-label="Open menu"
          id="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-neutral-200 flex-col z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
