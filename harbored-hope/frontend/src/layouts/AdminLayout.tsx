import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const IconDashboard = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const IconHeart = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const IconChart = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const IconSocial = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

const IconSun = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const IconMoon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const navItems = [
  { to: '/admin',                  label: 'Dashboard',     Icon: IconDashboard, exact: true },
  { to: '/admin/residents',        label: 'Residents',     Icon: IconUsers },
  { to: '/admin/donors',           label: 'Donors',        Icon: IconHeart },
  { to: '/admin/social-planner',   label: 'Post planner',  Icon: IconSocial },
  { to: '/admin/reports',          label: 'Reports',       Icon: IconChart },
];

export default function AdminLayout() {
  const { user, logout, isAdmin, toggleTheme, theme } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-hh-navy-dark flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <img src="/logo-icon.png" alt="Harbored Hope" className="w-10 h-10 object-contain" />
          </div>
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
              <item.Icon />
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
            <button onClick={toggleTheme} className="flex-1 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors">
              {theme === 'dark' ? <><IconSun /> Light mode</> : <><IconMoon /> Dark mode</>}
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
