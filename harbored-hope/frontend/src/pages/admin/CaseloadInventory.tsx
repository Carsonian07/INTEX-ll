import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ResidentListItem, Safehouse } from '../../lib/api';

const RISK_COLORS: Record<string, string> = {
  Low:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Medium:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  High:     'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  Active:      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Closed:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Transferred: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const defaultAddForm = {
  caseControlNo: '',
  internalCode: '',
  dateOfBirth: '',
  dateOfAdmission: new Date().toISOString().split('T')[0],
  sex: 'F',
  birthStatus: 'Legitimate',
  caseStatus: 'Active',
  caseCategory: '',
  currentRiskLevel: 'Low',
  initialRiskLevel: 'Low',
  safehouseId: '',
  referralSource: '',
  assignedSocialWorker: '',
};

export default function CaseloadInventory() {
  const { isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const [residents, setResidents] = useState<ResidentListItem[]>([]);
  const [safehouses, setSafehouses] = useState<Safehouse[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  // Add resident drawer
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ ...defaultAddForm });
  const [addError, setAddError]   = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Filters
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [safehouseId, setSafehouseId] = useState('');
  const [caseCategory, setCaseCategory] = useState('');
  const [riskLevel, setRiskLevel]   = useState('');

  const pageSize = 25;

  const loadResidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.residents.list({
        search: search || undefined,
        status: status || undefined,
        safehouseId: safehouseId ? Number(safehouseId) : undefined,
        caseCategory: caseCategory || undefined,
        riskLevel: riskLevel || undefined,
        page,
        pageSize,
      });
      setResidents(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [search, status, safehouseId, caseCategory, riskLevel, page]);

  useEffect(() => { loadResidents(); }, [loadResidents]);
  useEffect(() => {
    api.safehouses.list('Active').then(setSafehouses).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.residents.delete(deleteId);
    setDeleteId(null);
    loadResidents();
  };

  const handleAddResident = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      await api.residents.create({
        caseControlNo: addForm.caseControlNo,
        internalCode: addForm.internalCode,
        dateOfBirth: addForm.dateOfBirth,
        dateOfAdmission: addForm.dateOfAdmission,
        sex: addForm.sex,
        birthStatus: addForm.birthStatus,
        caseStatus: addForm.caseStatus,
        caseCategory: addForm.caseCategory,
        currentRiskLevel: addForm.currentRiskLevel,
        initialRiskLevel: addForm.initialRiskLevel,
        safehouseId: Number(addForm.safehouseId),
        referralSource: addForm.referralSource,
        assignedSocialWorker: addForm.assignedSocialWorker || undefined,
        subCatOrphaned: false, subCatTrafficked: false, subCatChildLabor: false,
        subCatPhysicalAbuse: false, subCatSexualAbuse: false, subCatOsaec: false,
        subCatCicl: false, subCatAtRisk: false, subCatStreetChild: false,
        subCatChildWithHiv: false, isPwd: false, hasSpecialNeeds: false,
        familyIs4Ps: false, familySoloParent: false, familyIndigenous: false,
        familyParentPwd: false, familyInformalSettler: false,
      });
      setShowAdd(false);
      setAddForm({ ...defaultAddForm });
      loadResidents();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add resident');
    } finally {
      setAddLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Caseload inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} residents total</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-hh-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-hh-navy-dark transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add resident
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search by case no., code, SW…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="col-span-2 md:col-span-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
          />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Transferred">Transferred</option>
          </select>
          <select value={safehouseId} onChange={e => { setSafehouseId(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All safehouses</option>
            {safehouses.map(s => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
          </select>
          <select value={riskLevel} onChange={e => { setRiskLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
            <option value="">All risk levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy" />
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No residents found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Case no.</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Safehouse</th>
                  <th className="text-left px-4 py-3">Risk</th>
                  <th className="text-left px-4 py-3">Reintegration</th>
                  <th className="text-left px-4 py-3">Social worker</th>
                  <th className="text-left px-4 py-3">Admitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {residents.map(r => (
                  <tr
                    key={r.residentId}
                    onClick={() => navigate(`/admin/residents/${r.residentId}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-hh-navy dark:text-white">
                      {r.caseControlNo}
                      <div className="text-xs text-gray-400">{r.internalCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.caseStatus]}`}>
                        {r.caseStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.caseCategory}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.safehouseName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[r.currentRiskLevel]}`}>
                        {r.currentRiskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.reintegrationStatus ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-32 truncate">{r.assignedSocialWorker ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.dateOfAdmission).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete resident record?"
        message="This will permanently remove the resident and all associated records. This action cannot be undone."
        confirmLabel="Delete permanently"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />

      {/* Add Resident Drawer */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={() => setShowAdd(false)} />
          {/* Panel */}
          <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-serif text-lg font-medium text-hh-navy dark:text-white">Add resident</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleAddResident} className="flex-1 px-6 py-5 space-y-4">
              {addError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Case control no. *</label>
                  <input required value={addForm.caseControlNo} onChange={e => setAddForm(f => ({ ...f, caseControlNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input required value={addForm.internalCode} onChange={e => setAddForm(f => ({ ...f, internalCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date of birth *</label>
                  <input type="date" required value={addForm.dateOfBirth} onChange={e => setAddForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date of admission *</label>
                  <input type="date" required value={addForm.dateOfAdmission} onChange={e => setAddForm(f => ({ ...f, dateOfAdmission: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sex *</label>
                  <select required value={addForm.sex} onChange={e => setAddForm(f => ({ ...f, sex: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Birth status *</label>
                  <select required value={addForm.birthStatus} onChange={e => setAddForm(f => ({ ...f, birthStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
                    <option value="Legitimate">Legitimate</option>
                    <option value="Illegitimate">Illegitimate</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Case status *</label>
                  <select required value={addForm.caseStatus} onChange={e => setAddForm(f => ({ ...f, caseStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Transferred">Transferred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Risk level *</label>
                  <select required value={addForm.currentRiskLevel} onChange={e => setAddForm(f => ({ ...f, currentRiskLevel: e.target.value, initialRiskLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Case category *</label>
                <input required value={addForm.caseCategory} onChange={e => setAddForm(f => ({ ...f, caseCategory: e.target.value }))}
                  placeholder="e.g. VAWC, Neglect, Abuse"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Safehouse *</label>
                <select required value={addForm.safehouseId} onChange={e => setAddForm(f => ({ ...f, safehouseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean">
                  <option value="">Select safehouse…</option>
                  {safehouses.map(s => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Referral source *</label>
                <input required value={addForm.referralSource} onChange={e => setAddForm(f => ({ ...f, referralSource: e.target.value }))}
                  placeholder="e.g. DSWD, Police, Hospital"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned social worker</label>
                <input value={addForm.assignedSocialWorker} onChange={e => setAddForm(f => ({ ...f, assignedSocialWorker: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean" />
              </div>

              <div className="flex gap-3 pt-2 pb-4">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 bg-hh-navy text-white font-medium py-2.5 rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                  {addLoading ? 'Saving…' : 'Add resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
