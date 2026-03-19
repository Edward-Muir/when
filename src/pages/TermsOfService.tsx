import React from 'react';
import InfoPageLayout from './InfoPageLayout';

const sectionTitle = 'text-lg font-display font-semibold text-text mt-6 mb-2';
const paragraph = 'text-sm font-body text-text-muted leading-relaxed mb-3';

const TermsOfService: React.FC = () => (
  <InfoPageLayout title="Terms of Service">
    <p className="text-xs font-body text-text-muted mb-6">Last updated: March 2026</p>

    <h2 className={sectionTitle}>Acceptance of Terms</h2>
    <p className={paragraph}>
      By accessing or using When? (&quot;the App&quot;), you agree to be bound by these Terms of
      Service. If you do not agree to these terms, please do not use the App.
    </p>

    <h2 className={sectionTitle}>Description of Service</h2>
    <p className={paragraph}>
      When? is a free timeline game where players place historical events in chronological order.
      The App is available as a web application and iOS app. No account or registration is required
      to play.
    </p>

    <h2 className={sectionTitle}>Acceptable Use</h2>
    <p className={paragraph}>You agree not to:</p>
    <ul className="list-disc space-y-2 mb-4">
      <li className="text-sm font-body text-text-muted leading-relaxed ml-4">
        Manipulate or abuse the leaderboard system, including submitting false scores or using
        automated tools
      </li>
      <li className="text-sm font-body text-text-muted leading-relaxed ml-4">
        Use offensive or inappropriate player names
      </li>
      <li className="text-sm font-body text-text-muted leading-relaxed ml-4">
        Attempt to interfere with the App&apos;s functionality or infrastructure
      </li>
      <li className="text-sm font-body text-text-muted leading-relaxed ml-4">
        Reverse engineer, decompile, or disassemble the App
      </li>
    </ul>

    <h2 className={sectionTitle}>Intellectual Property</h2>
    <p className={paragraph}>
      The App&apos;s design, code, and branding are the property of Edward Muir. Historical event
      data presented in the game is sourced from publicly available information and is in the public
      domain.
    </p>

    <h2 className={sectionTitle}>Disclaimers</h2>
    <p className={paragraph}>
      The App is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
      kind, either express or implied. We do not guarantee that the App will be uninterrupted,
      error-free, or free of harmful components. Historical dates and event descriptions are
      presented for entertainment purposes and may not reflect the most current scholarly consensus.
    </p>

    <h2 className={sectionTitle}>Limitation of Liability</h2>
    <p className={paragraph}>
      To the fullest extent permitted by law, Edward Muir shall not be liable for any indirect,
      incidental, special, consequential, or punitive damages arising from your use of or inability
      to use the App. The App is a free game and is provided without any financial obligation on
      your part.
    </p>

    <h2 className={sectionTitle}>Changes to These Terms</h2>
    <p className={paragraph}>
      We may update these Terms of Service from time to time. Changes will be reflected on this page
      with an updated date. Continued use of the App after changes constitutes acceptance of the
      revised terms.
    </p>

    <h2 className={sectionTitle}>Contact Us</h2>
    <p className={paragraph}>
      If you have questions about these Terms of Service, contact us at{' '}
      <a href="mailto:playwhenfeedback@gmail.com" className="text-accent-secondary underline">
        playwhenfeedback@gmail.com
      </a>
    </p>
  </InfoPageLayout>
);

export default TermsOfService;
