import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.profas.lms',
  appName: 'Profas LMS',
  webDir: 'public',
  server: {
    url: 'https://profas-leadership-lms.vercel.app',
    cleartext: true
  }
};

export default config;
