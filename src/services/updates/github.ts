import Constants from 'expo-constants';
import { env } from '@/config/env';

export const currentVersion = Constants.expoConfig?.version ?? '0.1.0';

export type UpdateCheckResult =
  | { available: true; currentVersion: string; latestVersion: string; downloadUrl: string; notes: string }
  | { available: false; currentVersion: string; latestVersion: string };

// Compares two dotted version strings, e.g. "1.2.0" vs "1.10.0".
// Returns > 0 if `a` is newer than `b`, < 0 if older, 0 if equal.
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(n => parseInt(n, 10) || 0);
  const partsB = b.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Checks the GitHub Releases API for the latest release of this app,
// compares it against the currently installed version, and finds the .apk
// asset's direct download URL (not just the release's webpage).
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!env.github.owner || !env.github.repository) throw new Error('Update checking is not configured (missing GitHub owner/repository).');
  const response = await fetch(`https://api.github.com/repos/${env.github.owner}/${env.github.repository}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(response.status === 404 ? 'No releases found yet.' : `GitHub API error (${response.status}).`);
  const data = (await response.json()) as { tag_name?: string; body?: string; assets?: { name?: string; browser_download_url?: string }[] };
  const latestVersion = (data.tag_name ?? '').replace(/^v/i, '') || '0.0';
  const asset = (data.assets ?? []).find(a => a.name?.endsWith('.apk'));

  if (compareVersions(latestVersion, currentVersion) > 0 && asset?.browser_download_url) {
    return { available: true, currentVersion, latestVersion, downloadUrl: asset.browser_download_url, notes: data.body ?? '' };
  }
  return { available: false, currentVersion, latestVersion };
}
