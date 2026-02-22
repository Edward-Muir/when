import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playwhen.app',
  appName: 'When?',
  webDir: 'build',
  server: {
    url: 'https://play-when.com',
    cleartext: false,
  },
  plugins: {
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
