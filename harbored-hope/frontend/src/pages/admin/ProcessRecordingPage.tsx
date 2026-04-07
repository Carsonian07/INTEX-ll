// ProcessRecordingPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { api } from '../../lib/api';

const EMOTIONAL_STATES = ['Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn', 'Happy', 'Distressed'];

export default function ProcessRecordingPage() {
  const { id } = useParams<{ id: string }>();
  const residentId = Number(id);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState('');

  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    socialWorker: '',
    sessionType: 'Individual',
    sessionDurationMinutes: 60,
    emotionalStateObserved: 'Calm',
    emotionalStateEnd: 'Calm',
    sessionNarrative: '',
    interventionsApplied: '',
    followUpActions: '',
    progressNoted: false,
    concernsFlagged: false,
    referralMade: false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.residents.processRecordings.create(residentId, form);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/admin/residents" className="hover:text-hh-navy transition-colors">Caseload</Link>
        <span>/</span>
        <Link to={`/admin/residents/${residentId}`} className="hover:text-hh-navy transition-colors">Resident {residentId}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Process recording</span>
      </div>
      <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white mb-6">Add process recording</h1>

      {submitted ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <p className="text-green-700 dark:text-green-400 font-medium mb-3">Session recorded successfully.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setSubmitted(false)} className="text-sm bg-hh-navy text-white px-4 py-2 rounded-lg">Add another</button>
            <Link to={`/admin/residents/${residentId}`} className="text-sm border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400">Back to resident</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 space-y-5">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Session date"><input type="date" required value={form.sessionDate} onChange={e => setForm({...form, sessionDate: e.target.value})} className="input" /></Field>
            <Field label="Social worker"><input type="text" required value={form.socialWorker} onChange={e => setForm({...form, socialWorker: e.target.value})} className="input" placeholder="Full name" /></Field>
            <Field label="Session type">
              <select value={form.sessionType} onChange={e => setForm({...form, sessionType: e.target.value})} className="input">
                <option>Individual</option><option>Group</option>
              </select>
            </Field>
            <Field label="Duration (minutes)"><input type="number" min="15" max="240" value={form.sessionDurationMinutes} onChange={e => setForm({...form, sessionDurationMinutes: Number(e.target.value)})} className="input" /></Field>
            <Field label="Emotional state — start">
              <select value={form.emotionalStateObserved} onChange={e => setForm({...form, emotionalStateObserved: e.target.value})} className="input">
                {EMOTIONAL_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Emotional state — end">
              <select value={form.emotionalStateEnd} onChange={e => setForm({...form, emotionalStateEnd: e.target.value})} className="input">
                {EMOTIONAL_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Session narrative">
            <textarea required rows={5} value={form.sessionNarrative} onChange={e => setForm({...form, sessionNarrative: e.target.value})} className="input resize-none" placeholder="Describe what was discussed and observed…" />
          </Field>
          <Field label="Interventions applied">
            <textarea rows={3} value={form.interventionsApplied} onChange={e => setForm({...form, interventionsApplied: e.target.value})} className="input resize-none" placeholder="Techniques and approaches used…" />
          </Field>
          <Field label="Follow-up actions">
            <textarea rows={3} value={form.followUpActions} onChange={e => setForm({...form, followUpActions: e.target.value})} className="input resize-none" placeholder="Planned next steps…" />
          </Field>

          <div className="flex gap-6">
            {([['progressNoted', 'Progress noted'], ['concernsFlagged', 'Concerns flagged'], ['referralMade', 'Referral made']] as [keyof typeof form, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm({...form, [key]: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-hh-navy" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-hh-navy text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-hh-navy-dark transition-colors disabled:opacity-60">
              {loading ? 'Saving…' : 'Save recording'}
            </button>
            <Link to={`/admin/residents/${residentId}`} className="text-sm border border-gray-200 dark:border-gray-700 px-6 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
