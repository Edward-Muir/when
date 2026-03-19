import React from 'react';
import InfoPageLayout from './InfoPageLayout';

const sectionTitle = 'text-lg font-display font-semibold text-text mt-6 mb-2';
const paragraph = 'text-sm font-body text-text-muted leading-relaxed mb-3';
const listItem = 'text-sm font-body text-text-muted leading-relaxed ml-4';

const PrivacyPolicy: React.FC = () => (
  <InfoPageLayout title="Privacy Policy">
    <p className="text-xs font-body text-text-muted mb-6">Last updated: March 2026</p>

    <p className={paragraph}>
      When? (&quot;the App&quot;) is developed by Edward Muir. This Privacy Policy explains what
      information we collect, how we use it, and your rights regarding your data.
    </p>

    <h2 className={sectionTitle}>Information We Collect</h2>
    <p className={paragraph}>The App collects minimal data to provide its core functionality:</p>
    <ul className="list-disc space-y-2 mb-4">
      <li className={listItem}>
        <strong className="text-text">Device Identifier:</strong> A hashed fingerprint generated
        using the Web Crypto API from device characteristics (screen size, timezone, language)
        combined with a random component. This identifier is not personally identifiable and is used
        solely to associate your leaderboard entries with your device.
      </li>
      <li className={listItem}>
        <strong className="text-text">Player Name:</strong> A display name you choose, stored only
        in your browser&apos;s local storage. It is included with leaderboard submissions so other
        players can see your name on the leaderboard.
      </li>
      <li className={listItem}>
        <strong className="text-text">Game Scores:</strong> Your game results (scores and streaks)
        are stored locally and submitted to the leaderboard for daily challenge rankings.
      </li>
    </ul>

    <h2 className={sectionTitle}>How We Use Your Information</h2>
    <ul className="list-disc space-y-2 mb-4">
      <li className={listItem}>Display your scores on the daily challenge leaderboard</li>
      <li className={listItem}>Prevent duplicate leaderboard submissions from the same device</li>
    </ul>
    <p className={paragraph}>
      We do not use your information for analytics, advertising, tracking, profiling, or any purpose
      other than the leaderboard functionality described above.
    </p>

    <h2 className={sectionTitle}>Data Storage</h2>
    <p className={paragraph}>
      Game preferences and scores are stored locally on your device using your browser&apos;s local
      storage. Leaderboard data (device identifier, player name, and scores) is stored on our server
      using Upstash Redis, a cloud database service. Leaderboard entries are retained indefinitely
      to maintain historical rankings.
    </p>

    <h2 className={sectionTitle}>Third-Party Sharing</h2>
    <p className={paragraph}>
      We do not sell, trade, or share your data with any third parties. The App contains no
      advertising, no analytics services, and no third-party SDKs that collect user data.
    </p>

    <h2 className={sectionTitle}>Your Rights</h2>
    <p className={paragraph}>You can manage your data at any time:</p>
    <ul className="list-disc space-y-2 mb-4">
      <li className={listItem}>
        Clear your local data by clearing your browser&apos;s local storage or site data for this
        app
      </li>
      <li className={listItem}>
        Request deletion of your leaderboard data by contacting us at the email below
      </li>
    </ul>

    <h2 className={sectionTitle}>Children&apos;s Privacy</h2>
    <p className={paragraph}>
      The App is suitable for all ages. We do not knowingly collect personally identifiable
      information from anyone. The only data collected is non-identifiable device fingerprints and
      user-chosen display names as described above.
    </p>

    <h2 className={sectionTitle}>Changes to This Policy</h2>
    <p className={paragraph}>
      We may update this Privacy Policy from time to time. Changes will be reflected on this page
      with an updated date. Continued use of the App after changes constitutes acceptance of the
      revised policy.
    </p>

    <h2 className={sectionTitle}>Contact Us</h2>
    <p className={paragraph}>
      If you have questions about this Privacy Policy or wish to request data deletion, contact us
      at{' '}
      <a href="mailto:playwhenfeedback@gmail.com" className="text-accent-secondary underline">
        playwhenfeedback@gmail.com
      </a>
    </p>
  </InfoPageLayout>
);

export default PrivacyPolicy;
