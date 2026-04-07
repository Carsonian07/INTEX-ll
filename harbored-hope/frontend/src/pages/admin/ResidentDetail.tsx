import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, Resident, ProcessRecording, HomeVisitation } from '../../lib/api';

type Tab = 'profile' | 'counseling' | 'visitations' | 'ml';

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800',
};

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const residentId = Number(id);

  const [resident, setResident]       = useState<Resident | null>(null);
  const [recordings, setRecordings]   = useState<ProcessRecording[]>([]);
  const [visitations, setVisitations] = useState<HomeVisitation[]>([]);
  const [mlData, setMlData]           = useState<{ readinessScore: number; label: string; topFeatures: { feature: string; importance: number }[] } | null>(null);
  const [tab, setTab]                 = useState<Tab>('profile');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      api.residents.get(residentId),
      api.residents.processRecordings.list(residentId),
      api.residents.homeVisitations.list(residentId),
    ]).then(([r, pr, hv]) => {
      setResident(r);
      setRecordings(pr);
      setVisitations(hv);
    }).finally(() => setLoading(false));
  }, [residentId]);

  useEffect(() => {
    if (tab === 'ml') {
      api.ml.reintegrationReadiness(residentId)
        .then((d) => setMlData(d as typeof mlData))
        .catch(() => {});
    }
  }, [tab, residentId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy"/></div>;
  if (!resident) return <div className="p-8 text-gray-400">Resident not found.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',    label: 'Case profile' },
    { key: 'counseling', label: `Counseling (${recordings.length})` },
    { key: 'visitations',label: `Home visits (${visitations.length})` },
    { key: 'ml',         label: 'ML insights' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/admin/residents" className="hover:text-hh-navy dark:hover:text-white transition-colors">Caseload</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">{resident.caseControlNo}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">{resident.caseControlNo}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[resident.currentRiskLevel]}`}>
              {resident.currentRiskLevel} risk
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{resident.internalCode} · {resident.safehouseName} · Admitted {new Date(resident.dateOfAdmission).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/residents/${residentId}/process-recordings`}
            className="text-sm bg-hh-ocean text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add session
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex gap-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-hh-navy text-hh-navy dark:text-white dark:border-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InfoSection title="Case information">
            <InfoRow label="Case status" value={resident.caseStatus} />
            <InfoRow label="Case category" value={resident.caseCategory} />
            <InfoRow label="Referral source" value={resident.referralSource} />
            <InfoRow label="Referring agency" value={resident.referringAgencyPerson} />
            <InfoRow label="Social worker" value={resident.assignedSocialWorker} />
            <InfoRow label="Initial assessment" value={resident.initialCaseAssessment} />
          </InfoSection>

          <InfoSection title="Reintegration">
            <InfoRow label="Type" value={resident.reintegrationType} />
            <InfoRow label="Status" value={resident.reintegrationStatus} />
            <InfoRow label="Initial risk" value={resident.initialRiskLevel} />
            <InfoRow label="Current risk" value={resident.currentRiskLevel} />
          </InfoSection>

          <InfoSection title="Sub-categories">
            {[
              ['Trafficked', resident.subCatTrafficked], ['Sexual abuse', resident.subCatSexualAbuse],
              ['Physical abuse', resident.subCatPhysicalAbuse], ['OSAEC', resident.subCatOsaec],
              ['Child labor', resident.subCatChildLabor], ['Orphaned', resident.subCatOrphaned],
              ['At risk', resident.subCatAtRisk], ['Street child', resident.subCatStreetChild],
              ['CICL', resident.subCatCicl], ['Child with HIV', resident.subCatChildWithHiv],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{String(label)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${val ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                  {val ? 'Yes' : 'No'}
                </span>
              </div>
            ))}
          </InfoSection>

          <InfoSection title="Family profile">
            <InfoRow label="4Ps beneficiary" value={resident.familyIs4Ps ? 'Yes' : 'No'} />
            <InfoRow label="Solo parent" value={resident.familySoloParent ? 'Yes' : 'No'} />
            <InfoRow label="Indigenous group" value={resident.familyIndigenous ? 'Yes' : 'No'} />
            <InfoRow label="Parent with disability" value={resident.familyParentPwd ? 'Yes' : 'No'} />
            <InfoRow label="Informal settler" value={resident.familyInformalSettler ? 'Yes' : 'No'} />
          </InfoSection>
        </div>
      )}

      {/* Counseling tab */}
      {tab === 'counseling' && (
        <div className="space-y-4">
          {recordings.length === 0 && <p className="text-sm text-gray-400">No process recordings yet.</p>}
          {recordings.map(r => (
            <div key={r.recordingId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-sm text-hh-navy dark:text-white">
                    {new Date(r.sessionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-400 ml-3">{r.sessionType} · {r.sessionDurationMinutes} min · {r.socialWorker}</span>
                </div>
                <div className="flex gap-2">
                  {r.progressNoted && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Progress</span>}
                  {r.concernsFlagged && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Concern</span>}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                <span>Start: <strong className="text-gray-700 dark:text-gray-300">{r.emotionalStateObserved}</strong></span>
                <span>End: <strong className="text-gray-700 dark:text-gray-300">{r.emotionalStateEnd}</strong></span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.sessionNarrative}</p>
              {r.followUpActions && (
                <div className="mt-3 bg-hh-navy-light dark:bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 mb-0.5">Follow-up</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{r.followUpActions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Visitations tab */}
      {tab === 'visitations' && (
        <div className="space-y-4">
          {visitations.length === 0 && <p className="text-sm text-gray-400">No home visitations recorded.</p>}
          {visitations.map(v => (
            <div key={v.visitationId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-hh-navy dark:text-white">
                  {new Date(v.visitDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex gap-2">
                  <span className="text-xs bg-hh-navy-light text-hh-navy px-2 py-0.5 rounded-full">{v.visitType}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.visitOutcome === 'Favorable' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {v.visitOutcome}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{v.socialWorker} · {v.locationVisited}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.observations}</p>
              {v.safetyConcernsNoted && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-600 font-medium">⚠ Safety concerns noted</p>
                  {v.followUpNotes && <p className="text-xs text-red-600 mt-0.5">{v.followUpNotes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ML Insights tab */}
      {tab === 'ml' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
            <h3 className="font-medium text-hh-navy dark:text-white mb-1">Reintegration readiness</h3>
            <p className="text-xs text-gray-400 mb-5">ML model prediction based on counseling, health, and education data</p>
            {mlData ? (
              <>
                <div className="flex items-center gap-5 mb-5">
                  <div className="w-24 h-24 rounded-full border-4 border-hh-ocean flex items-center justify-center">
                    <span className="text-2xl font-semibold text-hh-navy dark:text-white">{Math.round(mlData.readinessScore * 100)}%</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{mlData.label}</p>
                    <p className="text-xs text-gray-400 mt-1">Model stub — wire up Python pipeline for live predictions</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Top contributing factors</p>
                  <div className="space-y-2">
                    {mlData.topFeatures.map(f => (
                      <div key={f.feature} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-48">{f.feature}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-hh-ocean rounded-full" style={{ width: `${f.importance * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{Math.round(f.importance * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hh-navy" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <h3 className="font-medium text-hh-navy dark:text-white text-sm mb-4 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200 text-right max-w-48">{value ?? '—'}</span>
    </div>
  );
}
