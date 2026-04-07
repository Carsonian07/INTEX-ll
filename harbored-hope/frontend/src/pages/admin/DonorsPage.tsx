import { useEffect, useState, useCallback } from 'react';
import { api, Supporter } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function DonorsPage() {
  const { isAdmin } = useAuth();
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [type, setType]             = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.supporters.list({ search: search || undefined, type: type || undefined, status: status || undefined, page });
      setSupporters(res.data);
      setTotal(res.total);
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Donors & supporters</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total supporters</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input placeholder="Search name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="md:col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All types</option>
            {['MonetaryDonor','InKindDonor','Volunteer','SkillsContributor','SocialMediaAdvocate','PartnerOrganization'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" /></div>
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
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {supporters.map(s => (
                  <tr key={s.supporterId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{s.displayName}</div>
                      {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-hh-navy-light text-hh-navy dark:bg-hh-ocean/20 dark:text-hh-ocean px-2 py-0.5 rounded-full">{s.supporterType}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.country ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.acquisitionChannel ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.firstDonationDate ? new Date(s.firstDonationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteId(s.supporterId)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={deleteId !== null} title="Delete supporter?" message="This will remove the supporter profile and all associated donations. This cannot be undone." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} danger />
    </div>
  );
}
