// `@firebase/auth`'s package.json lists a top-level "types" export before its
// "react-native" condition, so TypeScript always resolves the generic (non-RN)
// declaration file regardless of the "react-native" custom condition — even
// though Metro's bundler resolution correctly picks the React Native runtime
// build that implements this function. This augmentation restores the type
// for `getReactNativePersistence`, which is otherwise only available at
// runtime. See https://github.com/firebase/firebase-js-sdk/issues (auth
// package exports ordering) for background.
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
