import { useEffect, useState } from 'react';
import { api, PublicStats } from '../../lib/api';

function MetricCard({ label, value, desc }: { label: string; value: string; desc?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 text-center">
      <div className="text-3xl font-semibold text-hh-navy dark:text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      {desc && <div className="text-xs text-gray-400 mt-1">{desc}</div>}
    </div>
  );
}

export default function ImpactPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.public()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-hh-navy py-16 px-4 text-center">
        <p className="text-xs font-semibold text-hh-gold uppercase tracking-widest mb-4">Transparent impact</p>
        <h1 className="font-serif text-4xl font-medium text-white leading-tight max-w-2xl mx-auto mb-4">
          See where every dollar goes
        </h1>
        <p className="text-white/70 text-sm max-w-lg mx-auto leading-relaxed">
          We publish aggregated, anonymized data about our operations so you can see exactly how your generosity is changing lives.
        </p>
      </section>

      {/* Key metrics */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="font-serif text-2xl font-medium text-hh-navy dark:text-white mb-2">Impact at a glance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Updated from live data</p>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <MetricCard label="Girls served" value={stats?.totalGirlsServed.toLocaleString() ?? '—'} desc="Since founding" />
            <MetricCard label="Active safehouses" value={stats?.activeSafehouses.toString() ?? '—'} desc="Operating today" />
            <MetricCard label="Reintegration rate" value={stats ? `${stats.reintegrationRate}%` : '—'} desc="Returned safely" />
            <MetricCard label="Raised this year" value={stats ? `$${Math.round(stats.totalRaisedUsd / 1000)}K` : '—'} desc="USD equivalent" />
          </div>
        )}

        {/* Progress indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <h3 className="font-medium text-hh-navy dark:text-white mb-5">Resident outcomes</h3>
            <div className="space-y-4">
              {[
                { label: 'Average education progress', value: stats?.avgEducationProgress ?? 0, color: 'bg-hh-navy' },
                { label: 'Average health score', value: stats ? Math.round(stats.avgHealthScore / 5 * 100) : 0, color: 'bg-hh-ocean' },
                { label: 'Reintegration rate', value: stats?.reintegrationRate ?? 0, color: 'bg-hh-gold' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="font-medium text-hh-navy dark:text-white">{Math.round(item.value)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <h3 className="font-medium text-hh-navy dark:text-white mb-5">Services we provide</h3>
            <div className="space-y-4">
              {[
                { emoji: '🏠', label: 'Caring', desc: 'Safe housing, meals, and 24/7 staff support' },
                { emoji: '💬', label: 'Healing', desc: 'Trauma counseling, therapy, and process recordings' },
                { emoji: '📚', label: 'Teaching', desc: 'Education programs, vocational training, and life skills' },
                { emoji: '⚖️', label: 'Legal services', desc: 'Case management, referrals, and reintegration support' },
              ].map(s => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-hh-navy-light dark:bg-gray-800 flex items-center justify-center text-base flex-shrink-0">
                    {s.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fund allocation */}
        <div className="bg-hh-navy-light dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="font-medium text-hh-navy dark:text-white mb-2">How funds are allocated</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Across all safehouses and program areas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Operations', value: 38, color: 'bg-hh-navy' },
              { label: 'Wellbeing', value: 28, color: 'bg-hh-ocean' },
              { label: 'Education', value: 22, color: 'bg-hh-gold' },
              { label: 'Outreach', value: 12, color: 'bg-gray-400' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                      className={item.color.replace('bg-', 'stroke-')}
                      strokeDasharray={`${item.value} ${100 - item.value}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-hh-navy dark:text-white">{item.value}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hh-navy-dark py-14 px-4 text-center">
        <h2 className="font-serif text-2xl font-medium text-white mb-3">Join our community of supporters</h2>
        <p className="text-sm text-white/70 max-w-md mx-auto mb-7 leading-relaxed">
          Every dollar you give is tracked, allocated, and reported back to you. No black boxes.
        </p>
        <a href="/register" className="inline-block bg-hh-gold text-white font-medium px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors">
          Start giving transparently
        </a>
      </section>
    </div>
  );
}
