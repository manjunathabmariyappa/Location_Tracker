import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findMyFamilies } from '@/services/firebase/families';

const cacheKey = (uid: string) => `family-safety:last-family:${uid}`;

// Restores the group a signed-in user created or joined, so it "persists"
// across logout/app-restart instead of only living in memory. Shows a cached
// AsyncStorage value instantly (works offline), then confirms/corrects it
// against Firestore via a collection-group lookup by uid.
export function useMyFamily(uid: string | undefined) {
  const [familyId, setFamilyId] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) {
      setFamilyId('');
      return;
    }
    setLoading(true);
    try {
      const cached = await AsyncStorage.getItem(cacheKey(uid));
      if (cached) setFamilyId(cached);
      const families = await findMyFamilies(uid);
      const [first] = families;
      if (first) {
        // Prefer a family this uid administers if they somehow belong to more than one.
        const mine = families.find(item => item.member.role === 'admin') ?? first;
        setFamilyId(mine.familyId);
        await AsyncStorage.setItem(cacheKey(uid), mine.familyId);
      } else if (!cached) {
        setFamilyId('');
      }
    } catch {
      // Offline or transient error — keep whatever cached value (if any) is already set.
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rememberFamily = useCallback(
    async (id: string) => {
      setFamilyId(id);
      if (uid) await AsyncStorage.setItem(cacheKey(uid), id);
    },
    [uid],
  );

  const forgetFamily = useCallback(async () => {
    if (uid) await AsyncStorage.removeItem(cacheKey(uid));
    setFamilyId('');
  }, [uid]);

  return { familyId, loading, refresh, rememberFamily, forgetFamily };
}
