import { useState, FormEvent } from 'react';

// Place Embrace_at_ocean_s_edge.png in /public to use the logo image below.
// Falls back to the existing logo.png if the file isn't present.

type PaymentMethod = 'card' | 'bank' | 'venmo' | 'paypal';

const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

interface DonationModalProps {
  amountDisplay: string;   // e.g. "$25" or "$25 / month"
  campaign: string;
  isRecurring: boolean;
  initialName: string;
  initialEmail?: string;
  initialPhone?: string;
  initialState?: string;
  initialCountry?: string;
  onConfirm: (details: { name: string; email: string; phone: string; state: string; country: string }) => void;
  onCancel: () => void;
}

export default function DonationModal({
  amountDisplay,
  campaign,
  isRecurring,
  initialName,
  initialEmail,
  initialPhone,
  initialState,
  initialCountry,
  onConfirm,
  onCancel,
}: DonationModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [state, setState] = useState(initialState ?? '');
  const [country, setCountry] = useState(initialCountry ?? '');
  const [error, setError] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');

  // Credit / debit card
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Bank transfer
  const [routing, setRouting] = useState('');
  const [account, setAccount] = useState('');

  // Venmo / PayPal
  const [venmoHandle, setVenmoHandle] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Personal message
  const [message, setMessage] = useState('');

  const inputCls =
    'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8962E] bg-white';
  const requiredStar = <span className="ml-1 text-red-500">*</span>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !state.trim() || !country.trim()) {
      setError('Name, email, phone number, state, and country are required.');
      return;
    }

    setError('');
    onConfirm({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      state: state.trim(),
      country: country.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-[#1B2A4A] rounded-t-2xl px-6 py-5 flex items-center gap-4 sticky top-0 z-10">
          <img
            src="/Embrace_at_ocean_s_edge.png"
            alt="Harbored Hope"
            className="h-11 w-11 rounded-full object-cover ring-2 ring-[#C8962E]"
            onError={e => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
          />
          <div>
            <h2 className="text-white font-serif text-xl font-semibold leading-tight">
              Confirm Your Donation
            </h2>
            <p className="text-white/55 text-xs mt-0.5">
              {campaign}
              {isRecurring ? ' · Monthly' : ''}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Your Name{requiredStar}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Email{requiredStar}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                Phone Number{requiredStar}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="555-123-4567"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                State{requiredStar}
              </label>
              <select
                required
                value={state}
                onChange={e => setState(e.target.value)}
                className={inputCls}
              >
                <option value="">Select a state</option>
                {US_STATES.map(stateOption => (
                  <option key={stateOption} value={stateOption}>
                    {stateOption}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                Country{requiredStar}
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="USA"
                className={inputCls}
              />
            </div>
          </div>

          {/* Confirm amount (read-only) */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Donation Amount
            </label>
            <div className="px-4 py-3 bg-[#1B2A4A]/6 border border-[#1B2A4A]/20 rounded-lg flex items-center justify-between">
              <span className="text-[#1B2A4A] font-bold text-xl">{amountDisplay}</span>
              {isRecurring && (
                <span className="text-xs bg-[#C8962E]/15 text-[#C8962E] font-medium px-2 py-0.5 rounded-full">
                  Monthly
                </span>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Payment Method
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as PaymentMethod)}
              className={inputCls}
            >
              <option value="card">Credit / Debit Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="venmo">Venmo</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* Conditional payment fields */}
          {method === 'card' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={e => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'bank' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Routing Number</label>
                <input
                  type="text"
                  value={routing}
                  onChange={e => setRouting(e.target.value)}
                  placeholder="9-digit routing number"
                  maxLength={9}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Account Number</label>
                <input
                  type="text"
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  placeholder="Account number"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {method === 'venmo' && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-xs text-gray-400 mb-1">Venmo Handle</label>
              <input
                type="text"
                value={venmoHandle}
                onChange={e => setVenmoHandle(e.target.value)}
                placeholder="@username"
                className={inputCls}
              />
            </div>
          )}

          {method === 'paypal' && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-xs text-gray-400 mb-1">PayPal Email</label>
              <input
                type="email"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
          )}

          {/* Personal message */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Personal Message{' '}
              <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Why are you donating today?"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8962E] bg-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <button
              type="submit"
              className="w-full bg-[#C8962E] hover:bg-[#b07e22] active:bg-[#9a6c1a] text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm"
            >
              Complete Donation
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-1 transition-colors"
            >
              Cancel
            </button>
            <p className="text-center text-[11px] text-gray-400">
              This is a demonstration. No real payment is processed.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
