import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, AdminStats } from '../../lib/api';

function StatCard({ label, value, sub, color = 'text-hh-navy dark:text-white' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const riskColor: Record<string, string> = {
  Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.admin()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hh-navy" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Admin dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Key metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active residents" value={stats?.activeResidents ?? '—'} sub="Currently in care" />
        <StatCard label="Critical risk" value={stats?.criticalRisk ?? '—'} color="text-red-600" sub="Needs immediate attention" />
        <StatCard label="High risk" value={stats?.highRisk ?? '—'} color="text-orange-500" sub="Close monitoring needed" />
        <StatCard
          label="Donations this month"
          value={stats ? `$${Math.round(stats.recentDonationValue).toLocaleString()}` : '—'}
          sub={`${stats?.recentDonationCount ?? '—'} donations received`}
          color="text-hh-gold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Safehouse overview */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-hh-navy dark:text-white">Safehouse capacity</h2>
            <Link to="/admin/residents" className="text-xs text-hh-ocean hover:underline">View all residents →</Link>
          </div>
          <div className="space-y-3">
            {stats?.safehouseOverview.map(sh => (
              <div key={sh.safehouseId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{sh.name}</span>
                  <span className="text-xs text-gray-500">{sh.currentOccupancy}/{sh.capacityGirls}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sh.occupancyPct > 90 ? 'bg-red-500' : sh.occupancyPct > 75 ? 'bg-orange-400' : 'bg-hh-ocean'}`}
                    style={{ width: `${sh.occupancyPct}%` }}
                  />
                </div>
              </div>
            ))}
            {!stats?.safehouseOverview.length && (
              <p className="text-sm text-gray-400">No safehouses found.</p>
            )}
          </div>
        </div>

        {/* Upcoming conferences */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-hh-navy dark:text-white">Upcoming case conferences</h2>
            <span className="text-xs text-gray-400">Next 14 days</span>
          </div>
          <div className="space-y-3">
            {(stats?.upcomingConferences as Array<{
              planId: number; caseConferenceDate: string; planCategory: string; residentCode: string;
            }>)?.map(c => (
              <div key={c.planId} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-hh-ocean/10 flex items-center justify-center text-hh-ocean text-xs font-semibold">
                  {new Date(c.caseConferenceDate).getDate()}
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.residentCode} · {c.planCategory}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {!stats?.upcomingConferences.length && (
              <p className="text-sm text-gray-400">No upcoming conferences.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent incidents */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-hh-navy dark:text-white">Open incidents (last 7 days)</h2>
        </div>
        {(stats?.recentIncidents as Array<{
          incidentId: number; incidentDate: string; incidentType: string; severity: string; safehouseName: string;
        }>)?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Severity</th>
                  <th className="text-left py-2">Safehouse</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentIncidents as Array<{ incidentId: number; incidentDate: string; incidentType: string; severity: string; safehouseName: string; }>)?.map(i => (
                  <tr key={i.incidentId} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">
                      {new Date(i.incidentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200">{i.incidentType}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor[i.severity]}`}>
                        {i.severity}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-400">{i.safehouseName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No open incidents.</p>
        )}
      </div>
    </div>
  );
}
