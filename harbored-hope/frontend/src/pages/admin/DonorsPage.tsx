import { useEffect, useState, useCallback } from 'react';
import { api, Supporter, DonorPrediction } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

type LtvFilter       = '' | 'high' | 'standard';
type RetentionFilter = '' | 'at-risk' | 'likely';
type PriorityFilter  = '' | 'priority';

export default function DonorsPage() {
  const { isAdmin } = useAuth();
  const [supporters, setSupporters]   = useState<Supporter[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [type, setType]               = useState('');
  const [status, setStatus]           = useState('');
  const [page, setPage]               = useState(1);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Record<number, DonorPrediction>>({});
  const [predLoading, setPredLoading] = useState(false);

  // ML filters — applied client-side after predictions arrive
  const [ltvFilter,       setLtvFilter]       = useState<LtvFilter>('');
  const [retentionFilter, setRetentionFilter] = useState<RetentionFilter>('');
  const [priorityFilter,  setPriorityFilter]  = useState<PriorityFilter>('');

  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setPredictions({});
    try {
      const res = await api.supporters.list({
        search: search || undefined,
        type:   type   || undefined,
        status: status || undefined,
        page,
      });
      setSupporters(res.data);
      setTotal(res.total);

      const ids = res.data.map(s => s.supporterId);
      if (ids.length > 0) {
        setPredLoading(true);
        api.ml.donorPredictions(ids)
          .then(preds => {
            const map: Record<number, DonorPrediction> = {};
            preds.forEach(p => { map[p.supporterId] = p; });
            setPredictions(map);
          })
          .catch(() => {})
          .finally(() => setPredLoading(false));
      }
    } finally {
      setLoading(false);
    }
  }, [search, type, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.supporters.delete(deleteId);
    setDeleteId(null);
    load();
  };

  const isPriority = (id: number) => {
    const p = predictions[id];
    return p && p.ltv.prediction === 1 && p.retention.prediction === 0;
  };

  // Client-side ML filter on the loaded page
  const visibleSupporters = supporters.filter(s => {
    const p = predictions[s.supporterId];

    if (priorityFilter === 'priority') {
      if (!p || !isPriority(s.supporterId)) return false;
    }

    if (ltvFilter === 'high'     && (!p || p.ltv.prediction !== 1)) return false;
    if (ltvFilter === 'standard' && (!p || p.ltv.prediction !== 0)) return false;

    if (retentionFilter === 'at-risk' && (!p || p.retention.prediction !== 0)) return false;
    if (retentionFilter === 'likely'  && (!p || p.retention.prediction !== 1)) return false;

    return true;
  });

  // ML filters are only meaningful once predictions have loaded
  const mlFiltersActive = ltvFilter !== '' || retentionFilter !== '' || priorityFilter !== '';
  const totalPages = Math.ceil(total / pageSize);
  const priorityCount = Object.keys(predictions).filter(id => isPriority(Number(id))).length;

  const resetMlFilters = () => {
    setLtvFilter('');
    setRetentionFilter('');
    setPriorityFilter('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Donors & supporters</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total supporters</p>
        </div>

        {/* Priority alert — shown once predictions load and there are flagged donors */}
        {!predLoading && priorityCount > 0 && (
          <button
            onClick={() => { setPriorityFilter(priorityFilter === 'priority' ? '' : 'priority'); setLtvFilter(''); setRetentionFilter(''); }}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              priorityFilter === 'priority'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
            }`}
          >
            <span>⚑</span>
            {priorityCount} high-priority donor{priorityCount !== 1 ? 's' : ''} need attention
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-5 space-y-3">
        {/* Row 1 — standard filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="md:col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
          />
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All types</option>
            {['MonetaryDonor','InKindDonor','Volunteer','SkillsContributor','SocialMediaAdvocate','PartnerOrganization'].map(t =>
              <option key={t} value={t}>{t}</option>
            )}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Row 2 — ML filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            ML filters{predLoading && <span className="ml-1 animate-pulse">…</span>}
          </span>

          <select
            value={ltvFilter}
            onChange={e => { setLtvFilter(e.target.value as LtvFilter); setPriorityFilter(''); }}
            disabled={predLoading}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean disabled:opacity-40"
          >
            <option value="">All LTV</option>
            <option value="high">High LTV only</option>
            <option value="standard">Standard LTV only</option>
          </select>

          <select
            value={retentionFilter}
            onChange={e => { setRetentionFilter(e.target.value as RetentionFilter); setPriorityFilter(''); }}
            disabled={predLoading}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean disabled:opacity-40"
          >
            <option value="">All retention</option>
            <option value="at-risk">At risk only</option>
            <option value="likely">Likely to return only</option>
          </select>

          <button
            onClick={() => { setPriorityFilter(priorityFilter === 'priority' ? '' : 'priority'); setLtvFilter(''); setRetentionFilter(''); }}
            disabled={predLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
              priorityFilter === 'priority'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20'
            }`}
          >
            ⚑ High LTV + At risk
          </button>

          {mlFiltersActive && (
            <button onClick={resetMlFilters} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline">
              Clear ML filters
            </button>
          )}

          {mlFiltersActive && !predLoading && (
            <span className="text-xs text-gray-400">
              {visibleSupporters.length} of {supporters.length} shown
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Country</th>
                  <th className="text-left px-4 py-3">Channel</th>
                  <th className="text-left px-4 py-3">First donation</th>
                  <th className="text-left px-4 py-3" title="Likelihood of donating again within 180 days">
                    Retention{predLoading && <span className="ml-1 animate-pulse">…</span>}
                  </th>
                  <th className="text-left px-4 py-3" title="Predicted high lifetime value donor">
                    LTV{predLoading && <span className="ml-1 animate-pulse">…</span>}
                  </th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {visibleSupporters.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="text-center py-12 text-sm text-gray-400">
                      {mlFiltersActive && !predLoading ? 'No donors match the selected ML filters.' : 'No donors found.'}
                    </td>
                  </tr>
                ) : visibleSupporters.map(s => {
                  const priority = isPriority(s.supporterId);
                  return (
                    <tr
                      key={s.supporterId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        priority ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {priority && (
                            <span
                              title="High LTV donor at risk of lapsing — prioritise outreach"
                              className="flex-shrink-0 text-amber-500 text-sm"
                            >
                              ⚑
                            </span>
                          )}
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">{s.displayName}</div>
                            {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-hh-navy-light text-hh-navy dark:bg-hh-ocean/20 dark:text-hh-ocean px-2 py-0.5 rounded-full">
                          {s.supporterType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.country ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.acquisitionChannel ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.firstDonationDate
                          ? new Date(s.firstDonationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <PredBadge pred={predictions[s.supporterId]?.retention} kind="retention" />
                      </td>
                      <td className="px-4 py-3">
                        <PredBadge pred={predictions[s.supporterId]?.ltv} kind="ltv" />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <button onClick={() => setDeleteId(s.supporterId)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
              {mlFiltersActive && !predLoading && ` (${visibleSupporters.length} after ML filter)`}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete supporter?"
        message="This will remove the supporter profile and all associated donations. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}

function PredBadge({
  pred, kind,
}: {
  pred: { probability: number; prediction: number } | undefined;
  kind: 'retention' | 'ltv';
}) {
  if (!pred) return <span className="text-xs text-gray-300 dark:text-gray-600">—</span>;

  if (kind === 'retention') {
    const pct = Math.round(pred.probability * 100);
    const isLow = pred.prediction === 0;
    return (
      <span
        title={`${pct}% probability of donating again within 180 days`}
        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          isLow
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}
      >
        {isLow ? 'At risk' : 'Likely'} {pct}%
      </span>
    );
  }

  const pct = Math.round(pred.probability * 100);
  const isHigh = pred.prediction === 1;
  return (
    <span
      title={`${pct}% probability of being a high lifetime value donor`}
      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
        isHigh
          ? 'bg-hh-gold/20 text-yellow-700 dark:text-yellow-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {isHigh ? 'High' : 'Standard'} {pct}%
    </span>
  );
}
