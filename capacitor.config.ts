import type { CapacitorConfig } from '@capacitor/cli';

// The shells load the live site. To point a test build at a branch's Vercel preview instead,
// set CAP_SERVER_URL to the preview's Shareable Link when running `npx cap sync` (recipe in
// docs/mobile-ios/index.md). Unset, every build loads production as before.
const serverUrl = process.env.CAP_SERVER_URL || 'https://play-when.com';
const serverHost = new URL(serverUrl).host;

const config: CapacitorConfig = {
  appId: 'com.playwhen.app',
  appName: 'When?',
  webDir: 'build',
  server: {
    url: serverUrl,
    cleartext: false,
    allowNavigation: [
      'play-when.com',
      '*.play-when.com',
      ...(serverHost.endsWith('play-when.com') ? [] : [serverHost]),
    ],
  },
  plugins: {
    LocalNotifications: {
      // No foreground banner: if the app is open at 8am the user is already playing.
      presentationOptions: [],
    },
    SplashScreen: {
      launchAutoHide: true,
      // The launch storyboard's colour (the icon painting's corner), so launch -> splash has no seam.
      backgroundColor: '#030c1d',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
  },
};

export default config;
