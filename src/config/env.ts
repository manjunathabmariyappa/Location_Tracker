const required = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env.local and configure it.`);
  return value;
};

export const env = {
  firebase: {
    apiKey: required(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, 'EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: required(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: required(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: required(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: required(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, 'EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  github: {
    owner: process.env.EXPO_PUBLIC_GITHUB_OWNER ?? '',
    repository: process.env.EXPO_PUBLIC_GITHUB_REPOSITORY ?? '',
  },
};
