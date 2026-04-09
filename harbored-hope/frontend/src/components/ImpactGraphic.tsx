import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

// Images are served from /public.
// Drop these files into harbored-hope/frontend/public/:
//   Embrace_at_ocean_s_edge.png   ← logo / header image
//   BackwardsJump-e1741389606772.jpg  ← bottom photo strip

export interface ImpactData {
  area_funded?: string;
  safehouse_name?: string;
  months_funded?: number;
  lives_changed?: number;
  [key: string]: unknown;
}

interface ImpactGraphicProps {
  firstName: string;
  amountDisplay: string; // e.g. "$25"
  campaign: string;
  impactData: ImpactData | null;
  loading: boolean;
  onClose: () => void;
}

export default function ImpactGraphic({
  firstName,
  amountDisplay,
  campaign,
  impactData,
  loading,
  onClose,
}: ImpactGraphicProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);

  const pageUrl = window.location.href;
  const livesChanged = impactData?.lives_changed ?? 0;
  const areaFunded = impactData?.area_funded ?? campaign;
  const safehouseName = impactData?.safehouse_name ?? 'our safehouse';
  const monthsFunded = impactData?.months_funded ?? 0;

  const shareText = `I just donated to Harbored Hope and helped change ${livesChanged} lives! ${pageUrl}`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setSharing('download');
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#1B2A4A',
        scale: 2,
      });
      const a = document.createElement('a');
      a.download = 'harbored-hope-impact.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    } finally {
      setSharing(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard not available in all browsers */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto my-6 flex flex-col gap-4">
        {/* ── Shareable card (captured by html2canvas) ── */}
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#1B2A4A' }}
        >
          {/* Subtle wave background */}
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
            <svg
              className="absolute bottom-0 w-full"
              viewBox="0 0 1440 220"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0,100 C360,180 1080,20 1440,100 L1440,220 L0,220 Z" fill="rgba(255,255,255,0.04)" />
              <path d="M0,140 C480,60 960,200 1440,140 L1440,220 L0,220 Z" fill="rgba(255,255,255,0.03)" />
              <path d="M0,160 C300,200 1140,100 1440,160 L1440,220 L0,220 Z" fill="rgba(200,150,46,0.06)" />
            </svg>
          </div>

          {/* ── Top bar: logo + tagline ── */}
          <div className="relative flex items-start justify-between px-8 pt-7 pb-2">
            <div className="flex items-center gap-3">
              <img
                src="/Embrace_at_ocean_s_edge.png"
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-2 ring-[#C8962E]"
                onError={e => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
              />
              <div>
                <p className="text-white font-serif text-lg font-bold leading-tight">Harbored Hope</p>
                <p className="text-white/50 text-xs">harboredhope.org</p>
              </div>
            </div>
            <p
              className="text-[#C8962E] font-serif italic text-lg pt-1 text-right leading-snug max-w-[180px]"
              style={{ textShadow: '0 1px 8px rgba(200,150,46,0.25)' }}
            >
              Thanks for your donation
            </p>
          </div>

          {/* ── Impact metrics ── */}
          <div className="relative px-8 py-6">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-8 bg-white/10 rounded-lg w-4/5" />
                <div className="h-5 bg-white/10 rounded-lg w-3/5" />
                <div className="h-5 bg-white/10 rounded-lg w-2/5" />
                <div className="h-5 bg-white/10 rounded-lg w-1/2" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white font-serif text-2xl font-semibold leading-snug">
                  {firstName}, your{' '}
                  <span className="text-[#C8962E]">{amountDisplay}</span> helped fund{' '}
                  <span className="text-[#C8962E]">{areaFunded}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <StatCard label="Safehouses Funded"      value={safehouseName ? '1' : '—'} />
                  <StatCard label="Resident Months Funded" value={String(monthsFunded)} large />
                  <StatCard label="Girls Helped (Est.)"    value={String(livesChanged)} large highlight />
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom photo strip ── */}
          <div className="relative h-72 overflow-hidden">
            <img
              src="/BackwardsJump-e1741389606772.jpg"
              alt="Girls celebrating"
              className="w-full h-full object-cover object-center"
              onError={e => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
                const parent = el.parentElement;
                if (parent) parent.style.background = 'linear-gradient(to right, #2E86C1, #1B2A4A)';
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(27,42,74,0.85) 0%, rgba(27,42,74,0) 30%)' }}
            />
          </div>
        </div>

        {/* ── Share buttons (outside the captured card) ── */}
        <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-5">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-3 text-center">
            Share your impact
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <ShareButton
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank', 'width=600,height=400')}
              loading={false}
              color="#1877F2"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.884v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
              }
              label="Facebook"
            />

            <ShareButton
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400')}
              loading={false}
              color="#000000"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
              label="Post on X"
            />

            <ShareButton
              onClick={() => window.open('https://www.instagram.com/create/story', '_blank')}
              loading={false}
              color="#E1306C"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              }
              label="Instagram"
            />

            <ShareButton
              onClick={handleDownload}
              loading={sharing === 'download'}
              color="#374151"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/>
                </svg>
              }
              label="Download"
            />

            <ShareButton
              onClick={handleCopyLink}
              loading={false}
              color={copied ? '#16a34a' : '#4B5563'}
              icon={
                copied ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )
              }
              label={copied ? 'Copied!' : 'Copy Link'}
            />
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-sm transition-colors text-center py-1"
        >
          Close and return to dashboard
        </button>
      </div>
    </div>
  );
}

/* ── Helper sub-components ── */

interface StatCardProps {
  label: string;
  value: string;
  large?: boolean;
  highlight?: boolean;
}

function StatCard({ label, value, large, highlight }: StatCardProps) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <p className="text-white/50 text-xs mb-0.5">{label}</p>
      <p
        className={`font-semibold leading-tight truncate ${large ? 'text-2xl' : 'text-base'} ${
          highlight ? 'text-[#C8962E]' : 'text-white'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

interface ShareButtonProps {
  onClick: () => void;
  loading: boolean;
  color: string;
  icon: React.ReactNode;
  label: string;
}

function ShareButton({ onClick, loading, color, icon, label }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-85 active:opacity-70 disabled:opacity-60"
      style={{ background: color }}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      ) : icon}
      {label}
    </button>
  );
}
