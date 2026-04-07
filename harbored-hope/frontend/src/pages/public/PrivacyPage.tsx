export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-serif text-3xl font-medium text-hh-navy dark:text-white mb-2">Privacy policy</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 space-y-8">
        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Who we are</h2>
          <p className="leading-relaxed">
            Harbored Hope is a nonprofit organization operating safe homes and rehabilitation services for girls who are
            survivors of sexual abuse or sex trafficking. Our website is located at harboredhope.org. We are the data
            controller for the personal information described in this policy.
          </p>
          <p className="leading-relaxed mt-3">
            Contact: <a href="mailto:privacy@harboredhope.org" className="text-hh-ocean hover:underline">privacy@harboredhope.org</a>
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">What data we collect</h2>
          <p className="leading-relaxed mb-3">We collect personal data only when it is necessary to provide our services. The data we collect includes:</p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
            <li><strong>Account information:</strong> your name and email address when you register as a donor.</li>
            <li><strong>Donation records:</strong> the amount, date, and campaign associated with your donations. We do not store payment card information — no real payment processing occurs on this site.</li>
            <li><strong>Usage data:</strong> basic session information (pages visited, time on site) to help us improve the site. This data is not linked to your identity.</li>
            <li><strong>Cookie preferences:</strong> we store your cookie consent choice and display preferences (e.g., light or dark mode) in a browser cookie.</li>
          </ul>
          <p className="leading-relaxed mt-3">
            <strong>We never collect or display personally identifiable information about the girls in our care.</strong> All
            case management data accessed by authenticated staff is protected, encrypted in transit and at rest, and is
            not used for any donor-facing feature.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Legal basis for processing</h2>
          <p className="leading-relaxed">Under GDPR, we process your personal data on the following bases:</p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed mt-3">
            <li><strong>Contract:</strong> to provide you with a donor account and donation history.</li>
            <li><strong>Legitimate interest:</strong> to communicate the impact of your donations and improve our services.</li>
            <li><strong>Consent:</strong> for optional cookies beyond those strictly necessary to operate the site.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">How we use your data</h2>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
            <li>To manage your donor account and provide you access to your donation history.</li>
            <li>To record and display your donation activity on your personal dashboard.</li>
            <li>To communicate impact updates related to your contributions.</li>
            <li>To improve the functionality and accessibility of our website.</li>
          </ul>
          <p className="leading-relaxed mt-3">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Cookies</h2>
          <p className="leading-relaxed mb-3">We use the following cookies:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Cookie</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Purpose</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">hh_cookie_consent</td>
                  <td className="px-4 py-2">Stores your cookie consent choice</td>
                  <td className="px-4 py-2">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">hh_theme</td>
                  <td className="px-4 py-2">Remembers your light/dark mode preference</td>
                  <td className="px-4 py-2">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">hh_token</td>
                  <td className="px-4 py-2">Keeps you signed in to your account (stored in localStorage, not a cookie)</td>
                  <td className="px-4 py-2">8 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">We do not use advertising, analytics, or third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Data retention</h2>
          <p className="leading-relaxed">
            We retain your account information for as long as your account is active. Donation records are retained
            for 7 years for financial compliance purposes. You may request deletion of your account at any time by
            contacting us at <a href="mailto:privacy@harboredhope.org" className="text-hh-ocean hover:underline">privacy@harboredhope.org</a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Your rights</h2>
          <p className="leading-relaxed mb-3">Under GDPR, you have the right to:</p>
          <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Rectify</strong> inaccurate personal data.</li>
            <li><strong>Erase</strong> your personal data ("right to be forgotten").</li>
            <li><strong>Restrict</strong> the processing of your data.</li>
            <li><strong>Data portability</strong> — receive your data in a machine-readable format.</li>
            <li><strong>Object</strong> to the processing of your data on the basis of legitimate interest.</li>
            <li><strong>Withdraw consent</strong> at any time where processing is based on consent.</li>
          </ul>
          <p className="leading-relaxed mt-3">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@harboredhope.org" className="text-hh-ocean hover:underline">privacy@harboredhope.org</a>.
            We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Security</h2>
          <p className="leading-relaxed">
            All data is transmitted over HTTPS/TLS. We use industry-standard password hashing, JWT authentication
            with short expiration windows, role-based access controls, and separate databases for identity and
            operational data. Our Content Security Policy header restricts external resource loading. We review
            and update our security practices regularly.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-medium text-hh-navy dark:text-white mb-3">Changes to this policy</h2>
          <p className="leading-relaxed">
            We may update this privacy policy from time to time. We will notify registered users of significant
            changes by email. Continued use of our site after changes constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
