import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { env } from '@/config/env';

export interface ReleaseInfo { version: string; url: string; notes?: string; }
export const checkLatestRelease = async (): Promise<ReleaseInfo | null> => {
  if (!env.github.owner || !env.github.repository) return null;
  const response = await fetch(`https://api.github.com/repos/${env.github.owner}/${env.github.repository}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub release check failed (${response.status}).`);
  const release = await response.json() as { tag_name?: string; html_url?: string; body?: string };
  return release.tag_name && release.html_url ? { version: release.tag_name, url: release.html_url, notes: release.body } : null;
};
export const openRelease = (url: string) => Linking.openURL(url);
export const currentVersion = Constants.expoConfig?.version ?? '0.1.0';
