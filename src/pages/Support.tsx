import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import InfoPageLayout from './InfoPageLayout';

const faqCardClass = 'bg-surface rounded-xl border border-border p-4 mb-3';
const questionClass = 'text-sm font-display font-semibold text-text mb-1';
const answerClass = 'text-sm font-body text-text-muted leading-relaxed';

const Support: React.FC = () => (
  <InfoPageLayout title="Support">
    {/* Contact card */}
    <div className="bg-surface rounded-xl border border-border p-4 mb-8">
      <h2 className="text-lg font-display font-semibold text-text mb-2">Contact Us</h2>
      <p className="text-sm font-body text-text-muted mb-4">
        Have a question, found a bug, or want to suggest a historical event?
      </p>
      <a
        href="mailto:playwhenfeedback@gmail.com?subject=When%20Support"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-body font-semibold text-sm transition-colors hover:bg-accent/90 active:scale-95"
      >
        <Mail className="w-4 h-4" />
        playwhenfeedback@gmail.com
      </a>
    </div>

    {/* FAQ */}
    <h2 className="text-lg font-display font-semibold text-text mb-4">
      Frequently Asked Questions
    </h2>

    <div className={faqCardClass}>
      <h3 className={questionClass}>How do I play?</h3>
      <p className={answerClass}>
        You&apos;re shown a historical event and must place it in the correct position on a
        timeline. Drag the card to where you think it belongs chronologically. The closer your
        placement, the better!
      </p>
    </div>

    <div className={faqCardClass}>
      <h3 className={questionClass}>What are the game modes?</h3>
      <p className={answerClass}>
        <strong className="text-text">Daily Challenge:</strong> A new puzzle every day, same for all
        players. Compete on the leaderboard for the longest timeline.
        <br />
        <strong className="text-text">Sudden Death:</strong> Keep placing events correctly to build
        your streak. One wrong placement and it&apos;s game over.
        <br />
        <strong className="text-text">Custom Game:</strong> Choose your own categories, eras, and
        difficulty for a personalised experience.
      </p>
    </div>

    <div className={faqCardClass}>
      <h3 className={questionClass}>How does scoring work?</h3>
      <p className={answerClass}>
        In Daily Challenge and Sudden Death, your score is the number of events you correctly place
        in a row. Place an event correctly and you draw another card. Place it wrong and the game
        ends. In Custom Game mode, you start with a hand of cards and try to place them all
        correctly.
      </p>
    </div>

    <div className={faqCardClass}>
      <h3 className={questionClass}>How do I reset my data?</h3>
      <p className={answerClass}>
        Your game data is stored locally in your browser. To reset it, clear the site data for this
        app in your browser or device settings. On iOS, go to Settings &gt; Safari &gt; Advanced
        &gt; Website Data and remove data for play-when.com.
      </p>
    </div>

    <div className={faqCardClass}>
      <h3 className={questionClass}>Can I play offline?</h3>
      <p className={answerClass}>
        Yes! Once loaded, the game works offline. However, the daily challenge leaderboard requires
        an internet connection to submit and view scores.
      </p>
    </div>

    {/* Links to legal pages */}
    <div className="mt-8 pt-4 border-t border-border flex gap-4">
      <Link to="/privacy" className="text-sm font-body text-accent-secondary underline">
        Privacy Policy
      </Link>
      <Link to="/terms" className="text-sm font-body text-accent-secondary underline">
        Terms of Service
      </Link>
    </div>
  </InfoPageLayout>
);

export default Support;
