import { useEffect, useState } from 'react';
import { api, Reports } from '../../lib/api';

export default function ReportsPage() {
  const [reports, setReports]   = useState<Reports | null>(null);
  const [loading, setLoading]   = useState(true);
  const [months, setMonths]     = useState(12);

  useEffect(() => {
    setLoading(true);
    api.dashboard.reports(months)
      .then(setReports)
      .finally(() => setLoading(false));
  }, [months]);

  const totalDonations = reports?.donationTrends.reduce((s, d) => s + d.total, 0) ?? 0;
  const totalDonationCount = reports?.donationTrends.reduce((s, d) => s + d.count, 0) ?? 0;
  const maxDonation = Math.max(...(reports?.donationTrends.map(d => d.total) ?? [1]));
  const maxEducation = 100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Reports & analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Aggregated insights to support decision-making</p>
        </div>
        <select value={months} onChange={e => setMonths(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total donations', value: `$${Math.round(totalDonations / 56).toLocaleString()}`, sub: `${totalDonationCount} gifts` },
              { label: 'Avg. ed. progress', value: `${reports?.educationTrends.length ? Math.round(reports.educationTrends.at(-1)?.avgProgress ?? 0) : '—'}%`, sub: 'Latest month' },
              { label: 'Avg. health score', value: reports?.healthTrends.length ? (reports.healthTrends.at(-1)?.avgHealth ?? 0).toFixed(1) : '—', sub: 'Out of 5.0' },
              { label: 'Reintegrations', value: (reports?.reintegrationOutcomes as Array<{ reintegrationStatus: string; count: number }>)?.find(r => r.reintegrationStatus === 'Completed')?.count ?? 0, sub: 'Completed' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
                <p className="text-2xl font-semibold text-hh-navy dark:text-white">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Donation trend chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <h2 className="font-medium text-hh-navy dark:text-white mb-1">Donation trend</h2>
            <p className="text-xs text-gray-400 mb-5">Monthly monetary donations (USD equivalent)</p>
            <div className="flex items-end gap-2 h-40">
              {reports?.donationTrends.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-hh-navy rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.round((d.total / maxDonation) * 100)}%` }}
                    title={`$${Math.round(d.total / 56).toLocaleString()} USD`}
                  />
                  <span className="text-[10px] text-gray-400">{d.month}/{String(d.year).slice(2)}</span>
                </div>
              ))}
              {!reports?.donationTrends.length && <p className="text-sm text-gray-400 w-full text-center">No data for this period.</p>}
            </div>
          </div>

          {/* Education + health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
              <h2 className="font-medium text-hh-navy dark:text-white mb-1">Education progress</h2>
              <p className="text-xs text-gray-400 mb-5">Average % progress per month</p>
              <div className="flex items-end gap-2 h-32">
                {reports?.educationTrends.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-hh-ocean rounded-t-sm min-h-[2px]" style={{ height: `${(d.avgProgress / maxEducation) * 100}%` }} />
                    <span className="text-[10px] text-gray-400">{d.month}/{String(d.year).slice(2)}</span>
                  </div>
                ))}
                {!reports?.educationTrends.length && <p className="text-sm text-gray-400 w-full text-center">No data.</p>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
              <h2 className="font-medium text-hh-navy dark:text-white mb-1">Health scores</h2>
              <p className="text-xs text-gray-400 mb-5">Average general health score (1–5 scale)</p>
              <div className="flex items-end gap-2 h-32">
                {reports?.healthTrends.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-hh-gold rounded-t-sm min-h-[2px]" style={{ height: `${(d.avgHealth / 5) * 100}%` }} />
                    <span className="text-[10px] text-gray-400">{d.month}/{String(d.year).slice(2)}</span>
                  </div>
                ))}
                {!reports?.healthTrends.length && <p className="text-sm text-gray-400 w-full text-center">No data.</p>}
              </div>
            </div>
          </div>

          {/* Reintegration outcomes */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <h2 className="font-medium text-hh-navy dark:text-white mb-5">Reintegration outcomes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(reports?.reintegrationOutcomes as Array<{ reintegrationStatus: string; reintegrationType: string; count: number }>)?.map((r, i) => (
                <div key={i} className="bg-hh-navy-light dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-hh-navy dark:text-white">{r.count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.reintegrationStatus}</p>
                  {r.reintegrationType && <p className="text-[10px] text-gray-400 mt-0.5">{r.reintegrationType}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
