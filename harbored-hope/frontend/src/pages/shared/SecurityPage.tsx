import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api, MfaSetupResponse } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type Phase = 'idle' | 'setup-qr' | 'setup-verify' | 'setup-done' | 'disable-confirm';

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const [phase, setPhase]           = useState<Phase>('idle');
  const [setupData, setSetupData]   = useState<MfaSetupResponse | null>(null);
  const [code, setCode]             = useState('');
  const [password, setPassword]     = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Keep local MFA status in sync
  const [mfaEnabled, setMfaEnabled] = useState(user?.twoFactorEnabled ?? false);
  useEffect(() => { setMfaEnabled(user?.twoFactorEnabled ?? false); }, [user]);

  const reset = () => {
    setPhase('idle');
    setSetupData(null);
    setCode('');
    setPassword('');
    setError('');
  };

  // ── Step 1: get QR code from backend ────────────────────────────────────────
  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.mfaSetup();
      setSetupData(data);
      setPhase('setup-qr');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start setup.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify code and enable ──────────────────────────────────────────
  const confirmSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.mfaEnable(code) as { recoveryCodes?: string[] };
      setRecoveryCodes(res.recoveryCodes ?? []);
      setMfaEnabled(true);
      await refreshUser();
      setPhase('setup-done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Disable ──────────────────────────────────────────────────────────────────
  const confirmDisable = async () => {
    setLoading(true);
    setError('');
    try {
      await api.auth.mfaDisable(password);
      setMfaEnabled(false);
      await refreshUser();
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white mb-1">Security settings</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Manage two-factor authentication for your account.</p>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">

        {/* ── Status banner ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Two-factor authentication</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {mfaEnabled
                ? 'Your account is protected with an authenticator app.'
                : 'Add an extra layer of security to your account.'}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── IDLE: show action button ── */}
        {phase === 'idle' && (
          mfaEnabled ? (
            <button
              onClick={() => setPhase('disable-confirm')}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
            >
              Disable two-factor authentication
            </button>
          ) : (
            <button
              onClick={startSetup}
              disabled={loading}
              className="px-4 py-2 bg-hh-navy text-white text-sm font-medium rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Loading…' : 'Set up two-factor authentication'}
            </button>
          )
        )}

        {/* ── SETUP: show QR code ── */}
        {phase === 'setup-qr' && setupData && (
          <div className="space-y-5">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code it shows.
            </p>
            <div className="flex justify-center py-4">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <QRCodeSVG value={setupData.qrCodeUri} size={180} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Can't scan? Enter this key manually:</p>
              <code className="block text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 tracking-widest break-all">
                {setupData.key}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPhase('setup-verify')}
                className="px-4 py-2 bg-hh-navy text-white text-sm font-medium rounded-lg hover:bg-hh-navy-dark transition-colors"
              >
                I've scanned it →
              </button>
              <button onClick={reset} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        )}

        {/* ── SETUP: verify code ── */}
        {phase === 'setup-verify' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean tracking-widest text-center text-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmSetup}
                disabled={loading || code.length !== 6}
                className="px-4 py-2 bg-hh-navy text-white text-sm font-medium rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Enable two-factor authentication'}
              </button>
              <button onClick={() => setPhase('setup-qr')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">← Back</button>
            </div>
          </div>
        )}

        {/* ── SETUP DONE: show recovery codes ── */}
        {phase === 'setup-done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <p className="text-sm font-medium">Two-factor authentication enabled!</p>
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Save these recovery codes somewhere safe. Each can only be used once if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {recoveryCodes.map(c => (
                  <code key={c} className="text-xs text-gray-700 dark:text-gray-300 font-mono">{c}</code>
                ))}
              </div>
            </div>
            <button onClick={reset} className="px-4 py-2 bg-hh-navy text-white text-sm font-medium rounded-lg hover:bg-hh-navy-dark transition-colors">
              Done
            </button>
          </div>
        )}

        {/* ── DISABLE: password confirmation ── */}
        {phase === 'disable-confirm' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Enter your password to disable two-factor authentication.
            </p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your current password"
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmDisable}
                disabled={loading || !password}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Disabling…' : 'Disable two-factor authentication'}
              </button>
              <button onClick={reset} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
