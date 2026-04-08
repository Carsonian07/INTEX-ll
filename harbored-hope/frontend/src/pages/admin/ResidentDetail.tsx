import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, mlApi, buildResidentRiskInput, Resident, ProcessRecording, HomeVisitation, ResidentRiskResult } from '../../lib/api';

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
  const [riskData, setRiskData]        = useState<ResidentRiskResult | null>(null);
  const [riskLoading, setRiskLoading]  = useState(false);
  const [riskError, setRiskError]      = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>('profile');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.residents.get(residentId)
      .then(r => {
        setResident(r);
        // Load sub-resources in parallel, but don't block the page if they fail
        Promise.all([
          api.residents.processRecordings.list(residentId).catch(() => [] as ProcessRecording[]),
          api.residents.homeVisitations.list(residentId).catch(() => [] as HomeVisitation[]),
        ]).then(([pr, hv]) => {
          setRecordings(pr);
          setVisitations(hv);
        });
      })
      .catch(err => setError(err?.message ?? 'Failed to load resident'))
      .finally(() => setLoading(false));
  }, [residentId]);

  useEffect(() => {
    if (tab === 'ml' && resident && !riskData && !riskLoading && !riskError) {
      setRiskLoading(true);
      // Use the chronologically first recording (list is sorted descending, so last in array)
      const firstRecording = recordings.length > 0 ? recordings[recordings.length - 1] : undefined;
      const input = buildResidentRiskInput(resident, firstRecording);
      mlApi.residentRisk(input)
        .then(setRiskData)
        .catch(err => setRiskError(err?.message ?? 'Prediction failed'))
        .finally(() => setRiskLoading(false));
    }
  }, [tab, resident, recordings, riskData, riskLoading, riskError]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy"/></div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!resident) return <div className="p-8 text-gray-400">Resident not found.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',    label: 'Case profile' },
    { key: 'counseling', label: `Counseling (${recordings.length})` },
    { key: 'visitations', label: `Home visits (${visitations.length})` },
    { key: 'ml',         label: 'Predictive risk levels' },
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

      {/* Predictive risk levels tab */}
      {tab === 'ml' && (
        <div className="space-y-4">

          {/* Context banner */}
          <div className="bg-hh-navy-light dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-hh-navy dark:text-gray-200 uppercase tracking-wider mb-1">About these scores</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These are <strong className="text-gray-800 dark:text-gray-200">data-driven predictions</strong> produced by an ML model — independent of the social worker's initial or current risk assessment. They measure actual recovery outcomes across five dimensions using intake data, case history, and counseling records.
            </p>
            {recordings.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No counseling sessions recorded yet — prediction is based on intake data only and may be less accurate.
              </p>
            )}
          </div>

          {riskLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hh-navy" />
            </div>
          )}

          {riskError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
              {riskError}
            </div>
          )}

          {riskData && (() => {
            const highRiskScore = riskData.risk_score > 0.5;
            const highStruggling = riskData.struggling_flag === 1;
            const agree = highRiskScore === highStruggling;
            const bothNegative = highRiskScore && highStruggling;
            const bothPositive = !highRiskScore && !highStruggling;

            return (
              <div className="space-y-4">

                {/* Risk score card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk score</p>
                      <p className="text-2xl font-semibold text-hh-navy dark:text-white mt-0.5">
                        {(riskData.risk_score * 100).toFixed(1)}
                        <span className="text-sm font-normal text-gray-400 ml-1">/ 100</span>
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      riskData.risk_score > 0.7 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      riskData.risk_score > 0.4 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {riskData.risk_score > 0.7 ? 'High risk' : riskData.risk_score > 0.4 ? 'Moderate risk' : 'Low risk'}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3 mb-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        riskData.risk_score > 0.7 ? 'bg-red-500' :
                        riskData.risk_score > 0.4 ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${riskData.risk_score * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Composite score across five recovery outcome dimensions measured from actual resident data — not a social worker estimate. Higher = worse outcomes observed.
                  </p>
                </div>

                {/* Struggling probability card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Struggling probability</p>
                      <p className="text-2xl font-semibold text-hh-navy dark:text-white mt-0.5">
                        {(riskData.struggling_probability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      highStruggling
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {highStruggling ? 'Above threshold' : 'Below threshold'}
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-visible mt-3 mb-1">
                    <div
                      className={`h-full rounded-full transition-all ${highStruggling ? 'bg-red-500' : 'bg-hh-ocean'}`}
                      style={{ width: `${Math.min(riskData.struggling_probability * 100, 100)}%` }}
                    />
                    <div
                      className="absolute top-[-2px] h-[18px] w-0.5 bg-gray-500 dark:bg-gray-300"
                      style={{ left: `${riskData.cls_threshold * 100}%` }}
                      title={`Threshold: ${(riskData.cls_threshold * 100).toFixed(0)}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 mb-2">
                    <span>0%</span>
                    <span>Threshold: {(riskData.cls_threshold * 100).toFixed(0)}%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Probability that this resident falls in the top 25% worst outcomes compared to all residents. The model flags anyone above {(riskData.cls_threshold * 100).toFixed(0)}% as struggling.
                  </p>
                </div>

                {/* Conclusion card */}
                <div className={`rounded-xl p-5 border ${
                  bothNegative  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                  bothPositive  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {bothNegative ? '🔴' : bothPositive ? '🟢' : '🟡'}
                    </span>
                    <div>
                      <p className={`font-semibold text-sm mb-1 ${
                        bothNegative ? 'text-red-700 dark:text-red-400' :
                        bothPositive ? 'text-green-700 dark:text-green-400' :
                                       'text-amber-700 dark:text-amber-400'
                      }`}>
                        {bothNegative ? 'Action needed' : bothPositive ? 'Outcome looks positive' : 'Inconclusive result'}
                      </p>
                      <p className={`text-xs leading-relaxed ${
                        bothNegative ? 'text-red-600 dark:text-red-300' :
                        bothPositive ? 'text-green-600 dark:text-green-300' :
                                       'text-amber-700 dark:text-amber-300'
                      }`}>
                        {bothNegative &&
                          'Both the risk score and struggling probability indicate this resident is experiencing poor outcomes. Consider reviewing their intervention plan and increasing support.'}
                        {bothPositive &&
                          'Both model signals agree this resident is tracking well. Outcomes across all five dimensions appear within a healthy range compared to peers.'}
                        {!agree &&
                          `The two model signals disagree — the risk score is ${highRiskScore ? 'elevated' : 'low'} but the struggling probability is ${highStruggling ? 'above' : 'below'} threshold. These measures capture different aspects of recovery; review both alongside the social worker's assessment before drawing conclusions.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => { setRiskData(null); setRiskError(null); }}
                    className="text-xs text-hh-ocean hover:underline"
                  >
                    Re-run prediction
                  </button>
                </div>

              </div>
            );
          })()}
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
