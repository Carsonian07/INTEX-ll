import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, mlApi, buildResidentRiskInput, Resident, ProcessRecording, HomeVisitation, InterventionPlan, ResidentRiskResult } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

type Tab = 'profile' | 'counseling' | 'visitations' | 'conferences' | 'ml';

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800',
};

const EMOTION_SCORE: Record<string, number> = {
  Happy: 5, Hopeful: 4, Calm: 3, Withdrawn: 2, Anxious: 2, Sad: 1, Angry: 1, Distressed: 0,
};

const today = new Date().toISOString().split('T')[0];

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const residentId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [resident, setResident]         = useState<Resident | null>(null);
  const [recordings, setRecordings]     = useState<ProcessRecording[]>([]);
  const [visitations, setVisitations]   = useState<HomeVisitation[]>([]);
  const [plans, setPlans]               = useState<InterventionPlan[]>([]);
  const [riskData, setRiskData]         = useState<ResidentRiskResult | null>(null);
  const [riskLoading, setRiskLoading]   = useState(false);
  const [riskError, setRiskError]       = useState<string | null>(null);
  const [tab, setTab]                   = useState<Tab>('profile');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.residents.get(residentId)
      .then(r => {
        setResident(r);
        Promise.all([
          api.residents.processRecordings.list(residentId).catch(() => [] as ProcessRecording[]),
          api.residents.homeVisitations.list(residentId).catch(() => [] as HomeVisitation[]),
          api.residents.interventionPlans.list(residentId).catch(() => [] as InterventionPlan[]),
        ]).then(([pr, hv, ip]) => {
          setRecordings(pr);
          setVisitations(hv);
          setPlans(ip as InterventionPlan[]);
        });
      })
      .catch(err => setError(err?.message ?? 'Failed to load resident'))
      .finally(() => setLoading(false));
  }, [residentId]);

  useEffect(() => {
    if (tab === 'ml' && resident && !riskData && !riskLoading && !riskError) {
      setRiskLoading(true);
      const firstRecording = recordings.length > 0 ? recordings[recordings.length - 1] : undefined;
      const input = buildResidentRiskInput(resident, firstRecording);
      mlApi.residentRisk(input)
        .then(setRiskData)
        .catch(err => setRiskError(err?.message ?? 'Prediction failed'))
        .finally(() => setRiskLoading(false));
    }
  }, [tab, resident, recordings, riskData, riskLoading, riskError]);

  const handleDelete = async () => {
    await api.residents.delete(residentId);
    navigate('/admin/residents');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-hh-navy"/></div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!resident) return <div className="p-8 text-gray-400">Resident not found.</div>;

  const conferences = plans.filter(p => p.caseConferenceDate);
  const upcomingConfs = conferences.filter(p => p.caseConferenceDate! >= today).sort((a, b) => a.caseConferenceDate!.localeCompare(b.caseConferenceDate!));
  const pastConfs    = conferences.filter(p => p.caseConferenceDate! < today).sort((a, b) => b.caseConferenceDate!.localeCompare(a.caseConferenceDate!));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',     label: 'Case profile' },
    { key: 'counseling',  label: `Counseling (${recordings.length})` },
    { key: 'visitations', label: `Home visits (${visitations.length})` },
    { key: 'conferences', label: `Conferences (${conferences.length})` },
    { key: 'ml',          label: 'Predictive risk' },
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {resident.internalCode} · {resident.safehouseName} · Admitted {new Date(resident.dateOfAdmission).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/residents/${residentId}/process-recordings`}
            className="text-sm bg-hh-ocean text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add session
          </Link>
          <Link to={`/admin/residents/${residentId}/home-visitations`}
            className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Log home visit
          </Link>
          {isAdmin && (
            <button onClick={() => setDeleteOpen(true)}
              className="text-sm border border-red-200 dark:border-red-800 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Delete
            </button>
          )}
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
          {recordings.length >= 2 && <EmotionChart recordings={recordings} />}
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
                  <p className="text-xs text-red-600 font-medium">Safety concerns noted</p>
                  {v.followUpNotes && <p className="text-xs text-red-600 mt-0.5">{v.followUpNotes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Conferences tab */}
      {tab === 'conferences' && (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcomingConfs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcomingConfs.map(p => <ConferenceCard key={p.planId} plan={p} upcoming />)}
              </div>
            </div>
          )}

          {/* Past */}
          {pastConfs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Past conferences</h3>
              <div className="space-y-3">
                {pastConfs.map(p => <ConferenceCard key={p.planId} plan={p} />)}
              </div>
            </div>
          )}

          {conferences.length === 0 && (
            <p className="text-sm text-gray-400">No case conferences recorded.</p>
          )}
        </div>
      )}

      {/* Predictive risk levels tab */}
      {tab === 'ml' && (
        <div className="space-y-4">
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
            // risk_score is 0–0.5 from the API; multiply by 100 to get the 0–50 display scale
            // mean = 25 (0.25), 75th percentile = 29 (0.29) — above 29 is elevated risk
            const displayScore   = riskData.risk_score * 100;
            const highRiskScore  = riskData.risk_score > 0.25;
            const highStruggling = riskData.struggling_flag === 1;
            const agree          = highRiskScore === highStruggling;
            const bothNegative   = highRiskScore && highStruggling;
            const bothPositive   = !highRiskScore && !highStruggling;

            const scoreColor = riskData.risk_score > 0.29
              ? 'bg-red-500'
              : riskData.risk_score > 0.25
              ? 'bg-orange-400'
              : 'bg-green-500';
            const scoreBadge = riskData.risk_score > 0.29
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : riskData.risk_score > 0.25
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            const scoreLabel = riskData.risk_score > 0.29 ? 'Above 75th percentile' : riskData.risk_score > 0.25 ? 'Above average' : 'Below average';

            return (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk score</p>
                      <p className="text-2xl font-semibold text-hh-navy dark:text-white mt-0.5">
                        {displayScore.toFixed(1)}
                        <span className="text-sm font-normal text-gray-400 ml-1">/ 50</span>
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${scoreBadge}`}>
                      {scoreLabel}
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-visible mt-3 mb-1">
                    <div
                      className={`h-full rounded-full transition-all ${scoreColor}`}
                      style={{ width: `${riskData.risk_score * 200}%` }}
                    />
                    {/* Mean marker at 25 (0.5) */}
                    <div
                      className="absolute top-[-2px] h-[18px] w-0.5 bg-gray-400 dark:bg-gray-500"
                      style={{ left: '50%' }}
                      title="Mean: 25"
                    />
                    {/* 75th percentile marker at 29 (0.58) */}
                    <div
                      className="absolute top-[-2px] h-[18px] w-0.5 bg-orange-400"
                      style={{ left: '58%' }}
                      title="75th percentile: 29"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 mb-2">
                    <span>0</span>
                    <span className="text-gray-400">Mean: 25</span>
                    <span className="text-orange-400">75th pct: 29</span>
                    <span>50</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Composite score (0–50) across five recovery outcome dimensions. Mean score is 25; scores above 29 indicate the resident is in the top 25% for poor outcomes.
                  </p>
                </div>

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
                          'Both the risk score (above 25 — 75th percentile) and struggling probability indicate this resident is experiencing poor outcomes. Consider reviewing their intervention plan and increasing support.'}
                        {bothPositive &&
                          'Both model signals agree this resident is tracking well. Risk score is below the population mean and outcomes across all five dimensions appear within a healthy range compared to peers.'}
                        {!agree &&
                          `The two model signals disagree — the risk score is ${highRiskScore ? 'above the 75th percentile (25)' : 'within normal range'} but the struggling probability is ${highStruggling ? 'above' : 'below'} threshold. These measures capture different aspects of recovery; review both alongside the social worker's assessment before drawing conclusions.`}
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

      <ConfirmDialog
        open={deleteOpen}
        title="Delete resident record?"
        message="This will permanently remove the resident and all associated records. This action cannot be undone."
        confirmLabel="Delete permanently"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        danger
      />
    </div>
  );
}

// ─── Emotion chart ────────────────────────────────────────────────────────────
function EmotionChart({ recordings }: { recordings: ProcessRecording[] }) {
  const sorted = [...recordings]
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  const W = 560, H = 110, PL = 28, PR = 12, PT = 10, PB = 22;
  const n = sorted.length;
  const xScale = (i: number) => PL + (i / (n - 1)) * (W - PL - PR);
  const yScale = (v: number) => PT + ((5 - v) / 5) * (H - PT - PB);

  const scores = sorted.map(r => ({
    date: r.sessionDate,
    end: EMOTION_SCORE[r.emotionalStateEnd] ?? 3,
  }));

  const linePath = scores.map((s, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(s.end).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${xScale(n - 1).toFixed(1)},${(H - PB).toFixed(1)} L${xScale(0).toFixed(1)},${(H - PB).toFixed(1)} Z`;

  const dotColor = (v: number) => v >= 4 ? '#22c55e' : v >= 3 ? '#0ea5e9' : v >= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Emotional state — end of session
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Y-axis grid + labels */}
        {([5, 3, 0] as const).map(v => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={yScale(v)} y2={yScale(v)}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={PL - 5} y={yScale(v) + 3.5} textAnchor="end" fontSize="9"
              fill="currentColor" opacity="0.45">
              {v === 5 ? '+' : v === 3 ? '~' : '−'}
            </text>
          </g>
        ))}

        {/* Threshold line at 3 (neutral) */}
        <line x1={PL} x2={W - PR} y1={yScale(3)} y2={yScale(3)}
          stroke="#0ea5e9" strokeOpacity="0.25" strokeDasharray="4 3" strokeWidth="1" />

        {/* Area fill */}
        <path d={areaPath} fill="#0ea5e9" fillOpacity="0.07" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {scores.map((s, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(s.end)} r="3.5"
            fill={dotColor(s.end)} stroke="white" strokeWidth="1.5" />
        ))}

        {/* X-axis date labels (first and last only) */}
        <text x={xScale(0)} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.45">
          {new Date(scores[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
        {n > 1 && (
          <text x={xScale(n - 1)} y={H - 4} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.45">
            {new Date(scores[n - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        )}
      </svg>
      <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Positive (4–5)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-hh-ocean inline-block" />Neutral (3)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Low (2)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Distressed (0–1)</span>
      </div>
    </div>
  );
}

// ─── Conference card ──────────────────────────────────────────────────────────
function ConferenceCard({ plan, upcoming = false }: { plan: InterventionPlan; upcoming?: boolean }) {
  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-xl p-4 ${
      upcoming
        ? 'border-hh-ocean/30 dark:border-hh-ocean/20 ring-1 ring-hh-ocean/10'
        : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-hh-navy dark:text-white">
              {new Date(plan.caseConferenceDate!).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {upcoming && (
              <span className="text-[10px] bg-hh-ocean/10 text-hh-ocean dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                Upcoming
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{plan.planCategory}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          plan.status === 'Completed' ? 'bg-green-100 text-green-700' :
          plan.status === 'Cancelled' ? 'bg-gray-100 text-gray-500' :
          'bg-blue-100 text-blue-700'
        }`}>
          {plan.status}
        </span>
      </div>
      {plan.planDescription && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{plan.planDescription}</p>
      )}
      {plan.servicesProvided && (
        <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
          <p className="text-xs text-gray-500 mb-0.5">Services / interventions</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{plan.servicesProvided}</p>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

