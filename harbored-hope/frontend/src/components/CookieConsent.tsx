import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COOKIE_KEY = 'hh_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie.match(/hh_cookie_consent=([^;]+)/)?.[1];
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    document.cookie = `${COOKIE_KEY}=accepted; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
    setVisible(false);
  };

  const decline = () => {
    document.cookie = `${COOKIE_KEY}=declined; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-hh-navy-dark border-t border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-white font-medium mb-0.5">We use cookies</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              We use essential cookies to keep you signed in and remember your preferences. We do not use
              advertising or tracking cookies. See our{' '}
              <Link to="/privacy" className="text-hh-gold hover:underline">privacy policy</Link> for details.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={decline}
              className="text-xs text-gray-400 hover:text-white border border-white/20 px-4 py-2 rounded-md transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="text-xs font-medium bg-hh-gold text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
