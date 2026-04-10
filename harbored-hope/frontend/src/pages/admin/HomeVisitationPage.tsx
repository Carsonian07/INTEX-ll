// HomeVisitationPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { api } from '../../lib/api';

export default function HomeVisitationPage() {
  const { id } = useParams<{ id: string }>();
  const residentId = Number(id);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState('');

  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    socialWorker: '',
    visitType: 'Routine Follow-Up',
    locationVisited: '',
    familyMembersPresent: '',
    purpose: '',
    observations: '',
    familyCooperationLevel: 'Cooperative',
    safetyConcernsNoted: false,
    followUpNeeded: false,
    followUpNotes: '',
    visitOutcome: 'Favorable',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.residents.homeVisitations.create(residentId, form);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/admin/residents" className="hover:text-hh-navy transition-colors">Caseload</Link>
        <span>/</span>
        <Link to={`/admin/residents/${residentId}`} className="hover:text-hh-navy transition-colors">Resident {residentId}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Home visitation</span>
      </div>
      <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white mb-6">Log home visitation</h1>

      {submitted ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-700 dark:text-green-400 font-medium mb-3">Visitation logged.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setSubmitted(false)} className="text-sm bg-hh-navy text-white px-4 py-2 rounded-lg">Log another</button>
            <Link to={`/admin/residents/${residentId}`} className="text-sm border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400">Back to resident</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Visit date</label><input type="date" required className={inp} value={form.visitDate} onChange={e => setForm({...form, visitDate: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Social worker</label>
              <select required className={inp} value={form.socialWorker} onChange={e => setForm({...form, socialWorker: e.target.value})}>
                <option value="">Select social worker…</option>
                {Array.from({ length: 20 }, (_, i) => `SW-${i + 1}`).map(sw => <option key={sw}>{sw}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Visit type</label>
              <select className={inp} value={form.visitType} onChange={e => setForm({...form, visitType: e.target.value})}>
                {['Initial Assessment','Routine Follow-Up','Reintegration Assessment','Post-Placement Monitoring','Emergency'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Visit outcome</label>
              <select className={inp} value={form.visitOutcome} onChange={e => setForm({...form, visitOutcome: e.target.value})}>
                {['Favorable','Needs Improvement','Unfavorable','Inconclusive'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location visited</label><input type="text" className={inp} value={form.locationVisited} onChange={e => setForm({...form, locationVisited: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Family cooperation</label>
              <select className={inp} value={form.familyCooperationLevel} onChange={e => setForm({...form, familyCooperationLevel: e.target.value})}>
                {['Highly Cooperative','Cooperative','Neutral','Uncooperative'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Family members present</label><input type="text" className={inp} value={form.familyMembersPresent} onChange={e => setForm({...form, familyMembersPresent: e.target.value})} placeholder="e.g. Mother and aunt" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observations</label><textarea rows={4} className={`${inp} resize-none`} value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} /></div>
          {form.safetyConcernsNoted && (
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Follow-up notes</label><textarea rows={2} className={`${inp} resize-none`} value={form.followUpNotes} onChange={e => setForm({...form, followUpNotes: e.target.value})} /></div>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.safetyConcernsNoted} onChange={e => setForm({...form, safetyConcernsNoted: e.target.checked})} className="w-4 h-4" /><span className="text-sm text-gray-700 dark:text-gray-300">Safety concerns noted</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.followUpNeeded} onChange={e => setForm({...form, followUpNeeded: e.target.checked})} className="w-4 h-4" /><span className="text-sm text-gray-700 dark:text-gray-300">Follow-up needed</span></label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-hh-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-hh-navy-dark disabled:opacity-60">{loading ? 'Saving…' : 'Log visit'}</button>
            <Link to={`/admin/residents/${residentId}`} className="text-sm border border-gray-200 dark:border-gray-700 px-6 py-2.5 rounded-lg text-gray-600 dark:text-gray-400">Cancel</Link>
          </div>
        </form>
      )}
    </div>
  );
}
