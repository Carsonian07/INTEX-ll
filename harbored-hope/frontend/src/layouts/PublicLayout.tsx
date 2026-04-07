import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import CookieConsent from '../components/CookieConsent';

export default function PublicLayout() {
  const { user, logout, isAdmin, isDonor, toggleTheme, theme } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className={`sticky top-0 z-50 bg-white dark:bg-gray-900 transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-gray-100 dark:border-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Harbored Hope" className="h-14 w-14 object-contain" />
              <div className="flex flex-col leading-tight">
                <span className="text-hh-navy dark:text-white font-serif text-base font-medium">Harbored</span>
                <span className="text-hh-gold text-[10px] font-semibold tracking-widest uppercase">Hope</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/impact" className="text-sm text-gray-600 dark:text-gray-300 hover:text-hh-navy dark:hover:text-white transition-colors">Our impact</Link>
              <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-300 hover:text-hh-navy dark:hover:text-white transition-colors">Privacy</Link>
              {isAdmin && <Link to="/admin" className="text-sm text-gray-600 dark:text-gray-300 hover:text-hh-navy transition-colors">Admin portal</Link>}
              {isDonor && !isAdmin && <Link to="/donor" className="text-sm text-gray-600 dark:text-gray-300 hover:text-hh-navy transition-colors">My donations</Link>}

              {/* Theme toggle */}
              <button onClick={toggleTheme} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme">
                {theme === 'dark'
                  ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                  : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                }
              </button>

              {user
                ? <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">Sign out</button>
                : <Link to="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-hh-navy transition-colors">Log in</Link>
              }
              <Link to={user ? (isDonor ? '/donor' : '/admin') : '/register'}
                className="bg-hh-gold text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">
                {user ? 'Dashboard' : 'Donate'}
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-md text-gray-500" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                }
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
              <Link to="/impact" onClick={() => setMenuOpen(false)} className="block px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">Our impact</Link>
              <Link to="/privacy" onClick={() => setMenuOpen(false)} className="block px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">Privacy</Link>
              {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">Admin portal</Link>}
              {user
                ? <button onClick={logout} className="block px-2 py-1.5 text-sm text-gray-500">Sign out</button>
                : <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">Log in</Link>
              }
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block mx-2 mt-2 bg-hh-gold text-white text-sm font-medium px-4 py-2 rounded-md text-center">Donate</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-hh-navy-dark text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/logo.png" alt="Harbored Hope" className="h-14 w-14 object-contain" />
                <span className="font-serif text-base">Harbored Hope</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Providing safe homes and rehabilitation for girls who have survived trafficking and abuse in the Philippines.</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">Organization</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/impact" className="hover:text-white transition-colors">Our impact</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Donate</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Log in</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Harbored Hope. All rights reserved.</p>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy policy</Link>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}
