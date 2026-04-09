import { useEffect, useState, FormEvent } from 'react';
import { api, DonationListItem, SupporterProfile, SupporterImpactResponse } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import DonationModal from '../../components/DonationModal';
import ImpactGraphic, { ImpactData } from '../../components/ImpactGraphic';

const CAMPAIGNS = ['Year-End Hope', 'Back to School', 'Summer of Safety', 'GivingTuesday', 'General Fund'];

// Approximate USD → PHP conversion for storytelling API (which uses PHP internally)
const USD_TO_PHP = 56;


/* ─── Your impact panel ───────────────────────────────────── */

function YourImpactPanel({ supporterId }: { supporterId: number }) {
  const [data, setData] = useState<SupporterImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const json = await api.storytelling.supporterImpact(supporterId);
        setData(json);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, [supporterId]);

  return (
    <div
      className="rounded-xl p-5 mb-5"
      style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #122033 100%)' }}
    >
      <p className="text-xs text-[#C8962E] uppercase tracking-widest font-semibold mb-3">
        Your Impact
      </p>

      {loading && (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-lg h-14" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-white/40 text-sm">Impact data unavailable right now.</p>
      )}

      {data && !loading && (
        <div className="grid grid-cols-3 gap-3">
          <ImpactTile
            label="Safehouses Reached"
            value={data.safehouses_reached != null ? String(data.safehouses_reached) : '—'}
          />
          <ImpactTile
            label="Months Funded / Person"
            value={data.projected_months_per_person_funded != null
              ? Number(data.projected_months_per_person_funded).toFixed(1)
              : '—'}
            gold
            large
          />
          <ImpactTile
            label="Girls Helped"
            value={data.residents_served_est != null
              ? Math.round(data.residents_served_est).toString()
              : '—'}
            gold
            large
          />
        </div>
      )}
    </div>
  );
}

interface ImpactTileProps {
  label: string;
  value: string;
  gold?: boolean;
  large?: boolean;
}

function ImpactTile({ label, value, gold, large }: ImpactTileProps) {
  return (
    <div className="bg-white/8 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <p className="text-white/45 text-[11px] uppercase tracking-wide mb-0.5">{label}</p>
      <p
        className={`font-semibold truncate leading-tight ${large ? 'text-xl' : 'text-sm'} ${
          gold ? 'text-[#C8962E]' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Main donor dashboard ────────────────────────────────── */

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations]     = useState<DonationListItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');

  // Donation form state
  const [amount, setAmount]         = useState('25');
  const [customAmount, setCustom]   = useState('');
  const [campaign, setCampaign]     = useState('General Fund');
  const [isRecurring, setRecurring] = useState(false);

  // Modal / impact flow state
  const [showModal, setShowModal]         = useState(false);
  const [showImpact, setShowImpact]       = useState(false);
  const [impactData, setImpactData]       = useState<ImpactData | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [donorFirstName, setDonorFirstName] = useState('Friend');
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [supporterProfile, setSupporterProfile] = useState<SupporterProfile | null>(null);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const res = await api.donations.list({ type: 'Monetary' });
      setDonations(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDonations(); }, []);

  useEffect(() => {
    if (!user) return;

    api.auth.mySupporter()
      .then(setSupporterProfile)
      .catch(() => setSupporterProfile(null));
  }, [user]);

  const finalAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);

  const amountDisplay = (() => {
    const base = amount === 'custom'
      ? (customAmount ? `$${customAmount}` : '')
      : `$${amount}`;
    return isRecurring ? `${base} / month` : base;
  })();

  // Step 1: validate, then open the pre-donation modal
  const handleDonate = (e: FormEvent) => {
    e.preventDefault();
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setError('');
    setShowModal(true);
  };

  // Step 2: modal confirmed — submit donation + fetch impact
  const handleConfirm = async (details: { name: string; email: string; phone: string; state: string; country: string }) => {
    setShowModal(false);
    setDonorFirstName(details.name.split(' ')[0] || 'Friend');
    setDonatedAmount(finalAmount); // capture before form reset
    setSubmitting(true);
    setImpactLoading(true);
    setImpactData(null);
    setShowImpact(true); // show graphic immediately (in loading state)

    try {
      // Submit donation to our own API
      await api.donations.create({
        supporterId: user?.supporterId ?? 0,
        donationType: 'Monetary',
        amount: finalAmount,
        isRecurring,
        campaignName: campaign,
        channelSource: 'Direct',
        notes: 'Submitted via donor dashboard',
        donorName: details.name,
        email: details.email,
        phone: details.phone,
        region: details.state,
        country: details.country,
      });

      setSuccess(true);
      setAmount('25');
      setCustom('');
      loadDonations();
      setTimeout(() => setSuccess(false), 5000);

      // Fetch projected impact from storytelling API (API uses PHP internally)
      const impactJson = await api.storytelling.projectedImpact(finalAmount * USD_TO_PHP, campaign);
      const residentMonths = impactJson.projected_resident_months ?? 0;
      setImpactData({
        area_funded: campaign,
        safehouse_name: impactJson.likely_safehouse,
        months_funded: Math.round(residentMonths * 10) / 10,
        lives_changed: Math.max(1, Math.round(residentMonths / 3)),
      } as ImpactData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Donation failed.');
      setShowImpact(false);
    } finally {
      setSubmitting(false);
      setImpactLoading(false);
    }
  };

  const totalGiven = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  // Impact estimates derived from total donated (fetched once donations load)
  const [impactMonths, setImpactMonths] = useState<number | null>(null);
  const [impactGirls, setImpactGirls]   = useState<number | null>(null);

  useEffect(() => {
    if (loading || totalGiven <= 0) return;
    api.storytelling.projectedImpact(totalGiven * USD_TO_PHP, 'General Fund')
      .then(json => {
        const months = json.projected_resident_months ?? 0;
        setImpactMonths(Math.round(months * 10) / 10);
        setImpactGirls(Math.max(1, Math.round(months / 3)));
      })
      .catch(() => { /* non-critical */ });
  }, [loading, totalGiven]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-hh-navy dark:text-white">
          Welcome back, {user?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Thank you for supporting Harbored Hope.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-start">
        {/* ── Donate form ── */}
        <div className="lg:col-span-2">
          <div className="bg-hh-navy-dark rounded-xl p-6">
            <h2 className="font-serif text-lg font-medium text-white mb-1">Make a donation</h2>
            <p className="text-xs text-white/60 mb-5">
              Your contribution goes directly to supporting girls in our safehouses.
            </p>

            {success && (
              <div className="mb-4 bg-green-500/20 border border-green-500/40 text-green-300 text-sm px-4 py-3 rounded-lg">
                Thank you! Your donation has been recorded.
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleDonate} className="space-y-4">
              {/* Amount selector */}
              <div>
                <p className="text-xs text-white/60 mb-2 uppercase tracking-wide">Select amount</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['10', '25', '50', '100'].map(a => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        amount === a
                          ? 'bg-hh-gold/20 border-hh-gold text-hh-gold'
                          : 'border-white/20 text-white/80 hover:border-white/40'
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAmount('custom')}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    amount === 'custom'
                      ? 'bg-hh-gold/20 border-hh-gold text-hh-gold'
                      : 'border-white/20 text-white/80 hover:border-white/40'
                  }`}
                >
                  Custom amount
                </button>
                {amount === 'custom' && (
                  <div className="mt-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customAmount}
                      onChange={e => setCustom(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-hh-gold"
                    />
                  </div>
                )}
              </div>

              {/* Campaign */}
              <div>
                <label htmlFor="campaign" className="block text-xs text-white/60 mb-2 uppercase tracking-wide">Campaign</label>
                <select
                  id="campaign"
                  value={campaign}
                  onChange={e => setCampaign(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-hh-gold"
                >
                  {CAMPAIGNS.map(c => <option key={c} value={c} className="bg-hh-navy-dark">{c}</option>)}
                </select>
              </div>

              {/* Recurring toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-10 h-6 rounded-full border transition-colors relative ${
                    isRecurring ? 'bg-hh-gold border-hh-gold' : 'bg-white/10 border-white/20'
                  }`}
                  onClick={() => setRecurring(!isRecurring)}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      isRecurring ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm text-white/80">Make this a monthly donation</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-hh-gold text-white font-medium py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-60 text-sm"
              >
                {submitting
                  ? 'Processing…'
                  : `Donate ${amount !== 'custom' ? `$${amount}` : customAmount ? `$${customAmount}` : ''} ${isRecurring ? 'monthly' : ''}`}
              </button>

              <p className="text-[11px] text-white/40 text-center">
                This is a demonstration. No real payment is processed.
              </p>
            </form>
          </div>
        </div>

        {/* ── Donation history panel ── */}
        <div className="lg:col-span-3">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total given</p>
              <p className="text-2xl font-semibold text-hh-navy dark:text-white">
                ${totalGiven.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Donations made</p>
              <p className="text-2xl font-semibold text-hh-navy dark:text-white">{total}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Resident months funded</p>
              <p className="text-2xl font-semibold text-hh-gold">
                {impactMonths != null ? impactMonths : '—'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Girls helped (est.)</p>
              <p className="text-2xl font-semibold text-hh-gold">
                {impactGirls != null ? impactGirls : '—'}
              </p>
            </div>
          </div>

          {/* History table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-medium text-hh-navy dark:text-white">Donation history</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hh-navy" />
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No donations yet.</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800 overflow-y-auto max-h-48">
                {donations.map(d => (
                  <div key={d.donationId} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {d.campaignName ?? 'General donation'}
                        {d.isRecurring && (
                          <span className="ml-2 text-xs bg-hh-ocean/10 text-hh-ocean px-2 py-0.5 rounded-full">
                            Recurring
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(d.donationDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-hh-navy dark:text-white">
                      ${d.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Feature 2: Pre-donation modal ── */}
      {showModal && (
        <DonationModal
          amountDisplay={amountDisplay}
          campaign={campaign}
          isRecurring={isRecurring}
          initialName={supporterProfile?.displayName ?? user?.displayName ?? ''}
          initialEmail={supporterProfile?.email ?? user?.email ?? ''}
          initialPhone={supporterProfile?.phone ?? ''}
          initialState={supporterProfile?.region ?? ''}
          initialCountry={supporterProfile?.country ?? ''}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* ── Feature 3: Post-donation impact graphic ── */}
      {showImpact && (
        <ImpactGraphic
          firstName={donorFirstName}
          amountDisplay={`$${donatedAmount.toFixed(2)}`}
          campaign={campaign}
          impactData={impactData}
          loading={impactLoading}
          onClose={() => setShowImpact(false)}
        />
      )}
    </div>
  );
}
