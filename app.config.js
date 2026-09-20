// Using app.config.js (instead of static app.json) keeps room to inject environment-driven
// values later without hard-coding them into the repo. Expo CLI automatically loads
// .env / .env.local before evaluating this file.
module.exports = {
  expo: {
    name: 'Family Safety Tracker',
    slug: 'family-safety-tracker',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'familysafety',
    icon: './assets/icon.png',
    android: {
      package: 'com.example.familysafetytracker',
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2563EB',
      },
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Family Safety Tracker uses your location only after you enable sharing with your family.',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#2563EB',
        },
      ],
      'expo-build-properties',
    ],
    extra: {
      eas: {
        projectId: '',
      },
    },
    ios: {
      bundleIdentifier: 'com.example.familysafetytracker',
    },
  },
};
