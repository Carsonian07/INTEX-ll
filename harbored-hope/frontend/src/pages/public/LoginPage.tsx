import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode]   = useState('');
  const [userId, setUserId]     = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const step = userId ? 'mfa' : 'credentials';

  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res.mfaRequired && res.userId) {
        setUserId(res.userId);
      } else if (res.token) {
        await login(res.token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.loginMfa(userId!, mfaCode);
      if (res.token) await login(res.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hh-navy-light dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Harbored Hope" className="h-14 w-14 mx-auto mb-4 object-contain" />
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">
            {step === 'mfa' ? 'Two-factor verification' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 'mfa' ? 'Enter the code from your authenticator app' : 'Sign in to your Harbored Hope account'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
          {error && (
            <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean focus:border-transparent"
                  placeholder="••••••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-hh-navy text-white font-medium py-2.5 rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Authentication code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean focus:border-transparent tracking-widest text-center text-lg"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full bg-hh-navy text-white font-medium py-2.5 rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button type="button" onClick={() => { setUserId(null); setMfaCode(''); }} className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                ← Back to sign in
              </button>
            </form>
          )}
        </div>

        {step === 'credentials' && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-hh-ocean hover:text-hh-navy dark:hover:text-white font-medium transition-colors">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
