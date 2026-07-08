import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playwhen.app',
  appName: 'When?',
  webDir: 'build',
  server: {
    url: 'https://play-when.com',
    cleartext: false,
    allowNavigation: ['play-when.com', '*.play-when.com'],
  },
  plugins: {
    LocalNotifications: {
      // No foreground banner: if the app is open at 8am the user is already playing.
      presentationOptions: [],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#FAF8F5',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
  },
};

export default config;
