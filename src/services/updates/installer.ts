import { Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export type ProgressListener = (percent: number) => void;

// Downloads the given .apk URL into app cache storage (with progress
// callbacks, like FTH's native downloader) and then hands it to Android's
// package installer via a content:// URI. No custom native module needed —
// expo-file-system already registers a FileProvider, and Linking.openURL
// triggers the OS installer UI for a package-archive URI.
export async function downloadAndInstallApk(url: string, onProgress?: ProgressListener): Promise<void> {
  const dir = FileSystem.cacheDirectory;
  if (!dir) throw new Error('No writable cache directory available on this device.');
  const fileUri = `${dir}update.apk`;

  const downloadable = FileSystem.createDownloadResumable(url, fileUri, {}, progress => {
    if (!progress.totalBytesExpectedToWrite) return;
    onProgress?.(Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100));
  });

  const result = await downloadable.downloadAsync();
  if (!result) throw new Error('Download did not complete.');

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  // Android shows its own "allow installs from this app" prompt automatically
  // the first time this runs, if REQUEST_INSTALL_PACKAGES hasn't been granted yet.
  await Linking.openURL(contentUri);
}
