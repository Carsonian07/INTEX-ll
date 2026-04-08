import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OptionCount { value: string; count: number; }
interface PlannerOptions {
  platforms: OptionCount[];
  daysOfWeek: OptionCount[];
  postTypes: OptionCount[];
  mediaTypes: OptionCount[];
  contentTopics: OptionCount[];
  sentimentTones: OptionCount[];
  callToActionTypes: OptionCount[];
  campaignNames: OptionCount[];
}

interface PlannerForm {
  platform: string;
  day_of_week: string;
  post_hour: number;
  post_type: string;
  media_type: string;
  num_hashtags: number;
  mentions_count: number;
  has_call_to_action: boolean;
  call_to_action_type: string;
  content_topic: string;
  sentiment_tone: string;
  caption_length: number;
  features_resident_story: boolean;
  campaign_name: string;
  is_boosted: boolean;
  boost_budget_php: number;
}

interface PredictionResults {
  effective: { probability: number; prediction: number; label_col: string } | null;
  engagementRate: { prediction: number; target_col: string } | null;
  donationValue: { prediction: number; target_col: string } | null;
}

const DEFAULTS: PlannerForm = {
  platform: '',
  day_of_week: '',
  post_hour: 18,
  post_type: '',
  media_type: '',
  num_hashtags: 5,
  mentions_count: 0,
  has_call_to_action: false,
  call_to_action_type: '',
  content_topic: '',
  sentiment_tone: '',
  caption_length: 150,
  features_resident_story: false,
  campaign_name: '',
  is_boosted: false,
  boost_budget_php: 0,
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
  return { value: i, label };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Select({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: OptionCount[]; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
      >
        <option value="">— select —</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.value} ({o.count})
          </option>
        ))}
      </select>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type="number" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
      />
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-hh-ocean' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SocialPostPlannerPage() {
  const [options, setOptions]       = useState<PlannerOptions | null>(null);
  const [optLoading, setOptLoading] = useState(true);
  const [form, setForm]             = useState<PlannerForm>(DEFAULTS);
  const [predicting, setPredicting] = useState(false);
  const [results, setResults]       = useState<PredictionResults | null>(null);
  const [predError, setPredError]   = useState<string | null>(null);

  useEffect(() => {
    api.socialPlanner.options()
      .then(setOptions)
      .catch(() => setOptions(null))
      .finally(() => setOptLoading(false));
  }, []);

  const set = <K extends keyof PlannerForm>(key: K, val: PlannerForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const buildPayload = () => ({
    platform:                form.platform || null,
    day_of_week:             form.day_of_week || null,
    post_hour:               form.post_hour,
    post_type:               form.post_type || null,
    media_type:              form.media_type || null,
    num_hashtags:            form.num_hashtags,
    mentions_count:          form.mentions_count,
    has_call_to_action:      form.has_call_to_action,
    call_to_action_type:     form.has_call_to_action ? (form.call_to_action_type || null) : null,
    content_topic:           form.content_topic || null,
    sentiment_tone:          form.sentiment_tone || null,
    caption_length:          form.caption_length,
    features_resident_story: form.features_resident_story,
    campaign_name:           form.campaign_name || null,
    is_boosted:              form.is_boosted,
    boost_budget_php:        form.is_boosted ? form.boost_budget_php : null,
  });

  const handlePredict = async () => {
    setPredicting(true);
    setPredError(null);
    setResults(null);
    const payload = buildPayload();
    try {
      const [effective, engagementRate, donationValue] = await Promise.all([
        api.socialPlanner.predictEffective(payload),
        api.socialPlanner.predictEngagementRate(payload),
        api.socialPlanner.predictDonationValue(payload),
      ]);
      setResults({ effective, engagementRate, donationValue });
    } catch (err: unknown) {
      setPredError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  if (optLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hh-navy" />
    </div>
  );

  const opts = options ?? {
    platforms: [], daysOfWeek: [], postTypes: [], mediaTypes: [],
    contentTopics: [], sentimentTones: [], callToActionTypes: [], campaignNames: [],
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">Social post planner</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Plan a post and get ML predictions for engagement rate, donation referral value, and effectiveness — before you publish.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Scheduling */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-hh-navy dark:text-white uppercase tracking-wide mb-4">Scheduling</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Select label="Platform" value={form.platform} onChange={v => set('platform', v)} options={opts.platforms} />
              <Select label="Day of week" value={form.day_of_week} onChange={v => set('day_of_week', v)} options={opts.daysOfWeek} />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Post hour</label>
                <select
                  value={form.post_hour}
                  onChange={e => set('post_hour', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
                >
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-hh-navy dark:text-white uppercase tracking-wide mb-4">Content</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Select label="Post type" value={form.post_type} onChange={v => set('post_type', v)} options={opts.postTypes} />
              <Select label="Media type" value={form.media_type} onChange={v => set('media_type', v)} options={opts.mediaTypes} />
              <Select label="Content topic" value={form.content_topic} onChange={v => set('content_topic', v)} options={opts.contentTopics} />
              <Select label="Sentiment tone" value={form.sentiment_tone} onChange={v => set('sentiment_tone', v)} options={opts.sentimentTones} />
              <Select label="Campaign" value={form.campaign_name} onChange={v => set('campaign_name', v)} options={opts.campaignNames} hint="Optional" />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Caption length</label>
                <select
                  value={form.caption_length}
                  onChange={e => set('caption_length', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-hh-ocean"
                >
                  <option value={60}>Short (~10 words, 60 chars)</option>
                  <option value={150}>Medium (~25 words, 150 chars)</option>
                  <option value={300}>Long (~50 words, 300 chars)</option>
                  <option value={600}>Extra long (~100 words, 600 chars)</option>
                </select>
              </div>
              <NumberInput label="# Hashtags" value={form.num_hashtags} onChange={v => set('num_hashtags', v)} min={0} max={30} />
              <NumberInput label="# Mentions" value={form.mentions_count} onChange={v => set('mentions_count', v)} min={0} max={20} />
              <Toggle label="Features resident story" value={form.features_resident_story} onChange={v => set('features_resident_story', v)} />
            </div>
          </div>

          {/* Call to action */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-hh-navy dark:text-white uppercase tracking-wide mb-4">Call to action</h2>
            <div className="grid grid-cols-2 gap-4">
              <Toggle label="Has call to action" value={form.has_call_to_action} onChange={v => set('has_call_to_action', v)} />
              {form.has_call_to_action && (
                <Select label="CTA type" value={form.call_to_action_type} onChange={v => set('call_to_action_type', v)} options={opts.callToActionTypes} />
              )}
            </div>
          </div>

          {/* Boost */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-hh-navy dark:text-white uppercase tracking-wide mb-4">Boosting</h2>
            <div className="grid grid-cols-2 gap-4">
              <Toggle label="Boosted post" value={form.is_boosted} onChange={v => set('is_boosted', v)} />
              {form.is_boosted && (
                <NumberInput label="Boost budget (PHP)" value={form.boost_budget_php} onChange={v => set('boost_budget_php', v)} min={0} />
              )}
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={predicting}
            className="w-full bg-hh-navy text-white text-sm font-medium py-3 rounded-xl hover:bg-hh-navy-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {predicting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Running predictions…</>
              : 'Run predictions'}
          </button>

          {predError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
              {predError}
            </div>
          )}
        </div>

        {/* ── Results sidebar ── */}
        <div className="space-y-4">

          {/* Prediction results */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-hh-navy dark:text-white uppercase tracking-wide mb-4">Predictions</h2>

            {!results && !predicting && (
              <p className="text-sm text-gray-400 text-center py-6">Fill in the form and run predictions to see results here.</p>
            )}

            {predicting && (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hh-navy" />
              </div>
            )}

            {results && (
              <div className="space-y-5">

                {/* Effective */}
                {results.effective && (() => {
                  const pct = results.effective.probability * 100;
                  const belowThreshold = pct < 75;
                  // Scale bar: 75% = 0%, 100% = 100%
                  const barPct = Math.max(0, Math.min((pct - 75) / 25 * 100, 100));
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Will drive donations</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          belowThreshold
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {belowThreshold ? 'Less likely' : 'Likely'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400">Probability</span>
                        <span className="text-sm font-semibold text-hh-navy dark:text-white">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${belowThreshold ? 'bg-orange-400' : 'bg-green-500'}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                      {belowThreshold && (
                        <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-1">
                          Below 75% — consider adjusting content or timing to improve effectiveness.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* Engagement rate */}
                {results.engagementRate && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Predicted engagement rate</span>
                    </div>
                    <p className="text-2xl font-semibold text-hh-navy dark:text-white mb-1.5">
                      {(results.engagementRate.prediction * 100).toFixed(2)}%
                    </p>
                    <ScoreBar value={results.engagementRate.prediction * 100} max={10} color="bg-hh-ocean" />
                    <p className="text-[10px] text-gray-400 mt-1">Typical range: 1–10%</p>
                  </div>
                )}

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* Donation value */}
                {results.donationValue && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Predicted donation value</span>
                    <p className="text-2xl font-semibold text-hh-navy dark:text-white mt-1">
                      ₱{results.donationValue.prediction.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Estimated PHP referral value from this post</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── What drives engagement — placeholder ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-hh-navy dark:text-white uppercase tracking-wide mb-1">What drives engagement</h2>
            <p className="text-xs text-gray-400 mb-4">Key findings from the explanatory model on your existing posts.</p>

            {/* Placeholder rows — replace with real findings */}
            <div className="space-y-3">
              {[
                { factor: 'Finding 1', detail: 'Add description here' },
                { factor: 'Finding 2', detail: 'Add description here' },
                { factor: 'Finding 3', detail: 'Add description here' },
              ].map((row, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-hh-ocean/10 text-hh-ocean flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.factor}</p>
                    <p className="text-xs text-gray-400">{row.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-3 italic">
              Replace placeholder rows above with findings from your explanatory model analysis.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
