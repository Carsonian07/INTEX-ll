import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 14) { setError('Password must be at least 14 characters.'); return; }

    setLoading(true);
    try {
      const res = await api.auth.register(email, password, displayName);
      if (res.token) {
        await login(res.token);
        // RedirectIfAuthed wrapping this page handles the navigation based on role
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    let score = 0;
    if (password.length >= 14) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (new Set(password).size >= 6) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong', 'Very strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-500', 'bg-green-500'][strength];

  return (
    <div className="min-h-screen bg-hh-navy-light dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-white shadow mx-auto mb-4 flex items-center justify-center">
            <img src="/logo-icon.png" alt="Harbored Hope" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join our community of supporters</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
          {error && (
            <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
                placeholder="At least 14 characters"
              />
              <ul className="mt-2 space-y-1">
                {[
                  { label: 'At least 14 characters',       met: password.length >= 14 },
                  { label: 'One uppercase letter (A–Z)',    met: /[A-Z]/.test(password) },
                  { label: 'One lowercase letter (a–z)',    met: /[a-z]/.test(password) },
                  { label: 'One number (0–9)',              met: /\d/.test(password) },
                  { label: 'One special character (!@#…)',  met: /[^A-Za-z0-9]/.test(password) },
                  { label: 'At least 6 unique characters',  met: new Set(password).size >= 6 },
                ].map(({ label, met }) => (
                  <li key={label} className="flex items-center gap-1.5 text-xs">
                    <span className={met ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}>
                      {met ? '✓' : '○'}
                    </span>
                    <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strengthLabel}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean ${
                  confirm && confirm !== password
                    ? 'border-red-400 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="••••••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading || strength < 3}
              className="w-full bg-hh-navy text-white font-medium py-2.5 rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link to="/privacy" className="text-hh-ocean hover:underline">privacy policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-hh-ocean hover:text-hh-navy dark:hover:text-white font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
