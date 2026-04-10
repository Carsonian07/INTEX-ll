import { useEffect, useState } from 'react';
import { api, Reports, ReintegrationOutcome } from '../../lib/api';

const BAR_H = 120; // bar area height in px
const PHP_TO_USD = 56;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthLabel(month: number, year: number) {
  return `${MONTHS[month - 1]} '${String(year).slice(2)}`;
}

function fmtMoney(php: number, usd: boolean) {
  if (usd) return `$${Math.round(php / PHP_TO_USD).toLocaleString()}`;
  return `₱${Math.round(php).toLocaleString()}`;
}

function TrendBar({
  value, max, color, label, tooltip, showLabel = true,
}: {
  value: number; max: number; color: string; label: string; tooltip: string; showLabel?: boolean;
}) {
  const h = Math.max(2, Math.round((value / max) * BAR_H));
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center gap-1">
      <div
        className={`w-full ${color} rounded-t-sm cursor-default relative group`}
        style={{ height: `${h}px` }}
      >
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {tooltip}
        </span>
      </div>
      <span className="text-[10px] text-gray-400 whitespace-nowrap" style={{ visibility: showLabel ? 'visible' : 'hidden' }}>
        {label}
      </span>
    </div>
  );
}

function ChartShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
      <h2 className="font-medium text-hh-navy dark:text-white mb-1">{title}</h2>
      <p className="text-xs text-gray-400 mb-5">{sub}</p>
      {children}
    </div>
  );
}

function NoData() {
  return <p className="text-sm text-gray-400 py-8 text-center">No data for this period.</p>;
}

export default function ReportsPage() {
  const [reports, setReports]       = useState<Reports | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [months, setMonths]         = useState(12);
  const [usd, setUsd]               = useState(false);
  const [donationView, setDonationView] = useState<'month' | 'campaign'>('month');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.dashboard.reports(months)
      .then(r => {
        setReports(r);
        const types = [...new Set(r.reintegrationOutcomes
          .map(o => o.reintegrationType?.trim() || 'Unspecified')
          .filter(t => !/^\d+$/.test(t))
        )].sort();
        if (types.length) setSelectedType(prev => types.includes(prev) ? prev : types[0]);
      })
      .catch((e: unknown) => {
        setReports(null);
        setError(e instanceof Error ? e.message : 'Failed to load reports.');
      })
      .finally(() => setLoading(false));
  }, [months]);

  const totalDonations     = reports?.donationTrends.reduce((s, d) => s + d.total, 0) ?? 0;
  const totalDonationCount = reports?.donationTrends.reduce((s, d) => s + d.count, 0) ?? 0;
  const maxDonation        = Math.max(1, ...(reports?.donationTrends.map(d => d.total) ?? []));
  const maxCampaign        = Math.max(1, ...(reports?.donationByCampaign.map(d => d.total) ?? []));
  const maxHealth          = 5;

  const reintegrationTypes = reports
    ? [...new Set(reports.reintegrationOutcomes
        .map(o => o.reintegrationType?.trim() || 'Unspecified')
        .filter(t => !/^\d+$/.test(t))
      )].sort()
    : [];

  const selectedOutcomes: ReintegrationOutcome[] = reports
    ? reports.reintegrationOutcomes.filter(o => {
        const t = o.reintegrationType?.trim() || 'Unspecified';
        return !/^\d+$/.test(t) && t === selectedType;
      })
    : [];

  const STATUS_COLORS: Record<string, string> = {
    Completed:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Unsuccessful:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'On Hold':     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const maxSafehouseEd = Math.max(1, ...(reports?.safehousePerformance.map(s => s.avgEducation) ?? []));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Reports & analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Aggregated insights to support decision-making</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency toggle */}
          <button
            onClick={() => setUsd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Toggle currency"
          >
            <span className={`font-medium ${!usd ? 'text-hh-navy dark:text-white' : 'text-gray-400'}`}>₱</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className={`font-medium ${usd ? 'text-hh-navy dark:text-white' : 'text-gray-400'}`}>$</span>
          </button>
          <select value={months} onChange={e => setMonths(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total donations', value: fmtMoney(totalDonations, usd), sub: `${totalDonationCount} gifts` },
              { label: 'Avg. ed. progress', value: `${reports?.educationTrends.length ? Math.round(reports.educationTrends.at(-1)?.avgProgress ?? 0) : '—'}%`, sub: 'Latest month' },
              { label: 'Avg. health score', value: reports?.healthTrends.length ? (reports.healthTrends.at(-1)?.avgHealth ?? 0).toFixed(1) : '—', sub: 'Out of 5.0' },
              { label: 'Reintegrations', value: reports?.reintegrationOutcomes.filter(r => r.reintegrationStatus === 'Completed').reduce((s, r) => s + r.count, 0) ?? 0, sub: 'Completed' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
                <p className="text-2xl font-semibold text-hh-navy dark:text-white">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Donation trend */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-medium text-hh-navy dark:text-white">Donation trend</h2>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                <button
                  onClick={() => setDonationView('month')}
                  className={`px-3 py-1.5 transition-colors ${donationView === 'month' ? 'bg-hh-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  By month
                </button>
                <button
                  onClick={() => setDonationView('campaign')}
                  className={`px-3 py-1.5 transition-colors ${donationView === 'campaign' ? 'bg-hh-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  By campaign
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              {donationView === 'month'
                ? `Monthly monetary donations (${usd ? 'USD' : 'PHP'})`
                : `Total per campaign over selected period (${usd ? 'USD' : 'PHP'})`}
            </p>
            {donationView === 'month' ? (
              reports?.donationTrends.length ? (
                <div className={`flex items-end px-2 ${reports.donationTrends.length > 15 ? 'gap-0.5' : 'gap-1.5'}`} style={{ height: `${BAR_H + 20}px` }}>
                  {reports.donationTrends.map((d, i) => (
                    <TrendBar
                      key={i}
                      value={d.total}
                      max={maxDonation}
                      color="bg-hh-navy"
                      label={monthLabel(d.month, d.year)}
                      tooltip={`${fmtMoney(d.total, usd)} · ${d.count} gifts`}
                      showLabel={reports.donationTrends.length <= 15 || i % 3 === 0}
                    />
                  ))}
                </div>
              ) : <NoData />
            ) : (
              reports?.donationByCampaign.length ? (
                <div className="space-y-3">
                  {reports.donationByCampaign.map((c, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-56">{c.campaign}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-4">
                          <strong className="text-gray-700 dark:text-gray-200">{fmtMoney(c.total, usd)}</strong>
                          <span className="ml-1.5 text-gray-400">· {c.count} gifts</span>
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-hh-navy rounded-full transition-all"
                          style={{ width: `${Math.round((c.total / maxCampaign) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <NoData />
            )}
          </div>

          {/* Education + health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartShell title="Education progress" sub="Average % progress per month">
              {reports?.educationTrends.length ? (
                <div className={`flex items-end px-2 ${reports.educationTrends.length > 15 ? 'gap-0.5' : 'gap-1.5'}`} style={{ height: `${BAR_H + 20}px` }}>
                  {reports.educationTrends.map((d, i) => (
                    <TrendBar
                      key={i}
                      value={d.avgProgress}
                      max={100}
                      color="bg-hh-ocean"
                      label={monthLabel(d.month, d.year)}
                      tooltip={`Avg progress: ${d.avgProgress}%`}
                      showLabel={reports.educationTrends.length <= 15 || i % 3 === 0}
                    />
                  ))}
                </div>
              ) : <NoData />}
            </ChartShell>

            <ChartShell title="Health scores" sub="Average general health score (1–5 scale)">
              {reports?.healthTrends.length ? (
                <div className={`flex items-end px-2 ${reports.healthTrends.length > 15 ? 'gap-0.5' : 'gap-1.5'}`} style={{ height: `${BAR_H + 20}px` }}>
                  {reports.healthTrends.map((d, i) => (
                    <TrendBar
                      key={i}
                      value={d.avgHealth}
                      max={maxHealth}
                      color="bg-hh-gold"
                      label={monthLabel(d.month, d.year)}
                      tooltip={`Health: ${d.avgHealth} · Nutrition: ${d.avgNutrition}`}
                      showLabel={reports.healthTrends.length <= 15 || i % 3 === 0}
                    />
                  ))}
                </div>
              ) : <NoData />}
            </ChartShell>
          </div>

          {/* Safehouse performance */}
          <ChartShell title="Safehouse performance" sub="Average education progress by safehouse over selected period">
            {reports?.safehousePerformance.length ? (
              <div className="space-y-4">
                {[...reports.safehousePerformance]
                  .sort((a, b) => b.avgEducation - a.avgEducation)
                  .map(s => (
                    <div key={s.safehouseId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-48">
                          {s.safehouseName || `Safehouse #${s.safehouseId}`}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-4">
                          <span>Health: <strong className="text-gray-700 dark:text-gray-200">{s.avgHealth.toFixed(1)}/5</strong></span>
                          <span>Residents: <strong className="text-gray-700 dark:text-gray-200">{Math.round(s.avgActiveResidents)}</strong></span>
                          <span>Incidents: <strong className={s.totalIncidents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}>{s.totalIncidents}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-hh-ocean rounded-full transition-all"
                            style={{ width: `${Math.round((s.avgEducation / maxSafehouseEd) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-24 text-right">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{s.avgEducation}%</span>
                          <span className="ml-1">avg ed. progress</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : <NoData />}
          </ChartShell>

          {/* Reintegration outcomes */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-medium text-hh-navy dark:text-white">Reintegration outcomes</h2>
                <p className="text-xs text-gray-400 mt-0.5">Status breakdown by reintegration type</p>
              </div>
              {reintegrationTypes.length > 0 && (
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean max-w-64"
                >
                  {reintegrationTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedOutcomes.length > 0 ? (
              <div className="flex gap-4 flex-wrap">
                {[...selectedOutcomes]
                  .sort((a, b) => b.count - a.count)
                  .map(o => (
                    <div key={o.reintegrationStatus}
                      className={`flex-1 min-w-32 rounded-xl p-5 text-center ${STATUS_COLORS[o.reintegrationStatus] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      <p className="text-3xl font-bold mb-1">{o.count}</p>
                      <p className="text-xs font-medium">{o.reintegrationStatus}</p>
                    </div>
                  ))}
              </div>
            ) : <NoData />}
          </div>

        </div>
      )}
    </div>
  );
}
