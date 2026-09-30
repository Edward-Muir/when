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
