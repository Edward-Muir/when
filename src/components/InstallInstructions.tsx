import React from 'react';
import { InstallScenario } from '../hooks/usePWAInstall';

// Per-platform "Add to Home Screen" steps, shown in the Menu's install modal.
const InstallInstructions: React.FC<{ scenario: InstallScenario }> = ({ scenario }) => {
  const baseClass = 'space-y-3 text-sm text-text-muted font-body';
  const noteClass = 'text-sm mt-4 text-text-muted/70';

  switch (scenario) {
    case 'ios-safari':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>Share</strong> button (□↑) in Safari
            </li>
            <li>
              Tap <strong>"Add to Home Screen"</strong>
            </li>
            <li>
              Tap <strong>"Add"</strong>
            </li>
          </ol>
        </div>
      );
    case 'ios-chrome':
    case 'ios-firefox':
    case 'ios-other':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>Share</strong> button in your browser
            </li>
            <li>
              Tap <strong>"Add to Home Screen"</strong>
            </li>
            <li>
              Tap <strong>"Add"</strong>
            </li>
          </ol>
          <p className={noteClass}>Requires iOS 16.4 or later.</p>
        </div>
      );
    case 'android-chrome':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>menu button</strong> (⋮)
            </li>
            <li>
              Tap <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>
            </li>
            <li>
              Tap <strong>"Install"</strong>
            </li>
          </ol>
        </div>
      );
    case 'android-firefox':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>menu button</strong> (⋮)
            </li>
            <li>
              Tap <strong>"Install"</strong>
            </li>
          </ol>
        </div>
      );
    case 'android-samsung':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>menu button</strong> (☰)
            </li>
            <li>
              Tap <strong>"Add page to"</strong>
            </li>
            <li>
              Tap <strong>"Home screen"</strong>
            </li>
          </ol>
        </div>
      );
    case 'android-other':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap your browser's <strong>menu button</strong>
            </li>
            <li>
              Look for <strong>"Add to Home Screen"</strong> or <strong>"Install"</strong>
            </li>
          </ol>
        </div>
      );
    case 'desktop-chrome':
    case 'desktop-edge':
      return (
        <div className={baseClass}>
          <p>
            Look for the <strong>install icon</strong> (⊕) in the address bar, or:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Open the browser <strong>menu</strong>
            </li>
            <li>
              Click <strong>"Install app"</strong>
            </li>
          </ol>
        </div>
      );
    case 'desktop-safari':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Click <strong>File</strong> in the menu bar
            </li>
            <li>
              Click <strong>"Add to Dock"</strong>
            </li>
          </ol>
        </div>
      );
    case 'desktop-firefox':
      return (
        <div className={baseClass}>
          <p>Firefox doesn't support installing web apps.</p>
          <p className="text-sm mt-2 text-text-muted/70">
            Try Chrome, Edge, or Safari, or bookmark this page.
          </p>
        </div>
      );
    case 'desktop-other':
    default:
      return (
        <div className={baseClass}>
          <p>
            Check your browser's menu for an <strong>"Install"</strong> or{' '}
            <strong>"Add to Home Screen"</strong> option.
          </p>
          <p className="text-sm mt-2 text-text-muted/70">
            Chrome and Edge have the best support for web apps.
          </p>
        </div>
      );
  }
};

export default InstallInstructions;
