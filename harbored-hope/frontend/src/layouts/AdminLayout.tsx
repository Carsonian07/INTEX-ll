import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin',                    label: 'Dashboard',       icon: '⬛', exact: true },
  { to: '/admin/residents',          label: 'Caseload',        icon: '👥' },
  { to: '/admin/donors',             label: 'Donors',          icon: '💛' },
  { to: '/admin/reports',            label: 'Reports',         icon: '📊' },
];

export default function AdminLayout() {
  const { user, logout, isAdmin, toggleTheme, theme } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-hh-navy-dark flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
          <img src="/logo.png" alt="Harbored Hope" className="h-14 w-14 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-white font-serif text-sm font-medium">Harbored Hope</span>
            <span className="text-hh-gold text-[9px] font-semibold tracking-widest uppercase">Staff Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-hh-ocean/20 text-white font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-white/10">
              <p className="px-3 text-[10px] uppercase tracking-wider text-gray-500 mb-2">Admin only</p>
              <NavLink
                to="/admin/residents/new"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="text-base leading-none">➕</span>
                Add resident
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-hh-ocean/20 text-white font-medium'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="text-base leading-none">🔑</span>
                User accounts
              </NavLink>
              <NavLink
                to="/admin/security"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-hh-ocean/20 text-white font-medium'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="text-base leading-none">🛡️</span>
                My security
              </NavLink>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-hh-ocean flex items-center justify-center text-white text-xs font-semibold">
              {user?.displayName?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="flex-1 text-xs text-gray-400 hover:text-white py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors text-left">
              {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-400 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
