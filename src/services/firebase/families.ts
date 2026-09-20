import * as Crypto from 'expo-crypto';
import { collectionGroup, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './client';
import type { Family, FamilyMember, MemberLocation } from '@/types/domain';

// Short, human-friendly codes (e.g. "7K4QRP") instead of Firestore's long
// auto-generated document IDs / random hex — used for both the group ID and
// the shared group password, so admins can read them aloud or type them in.
// Excludes visually ambiguous characters (0/O, 1/I/L).
const ID_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generateCode = (length: number) => Array.from({ length }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');
const hashPassword = (password: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password.trim().toUpperCase());

// No Cloud Functions are used here — this project is on Firebase's free
// Spark plan, which doesn't support deploying them. Password verification
// instead happens inside firestore.rules using `get()`, which can read the
// family's stored passwordHash server-side even though members can't read it directly.

export const createFamily = async (uid: string, name: string): Promise<{ familyId: string; password: string }> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const familyId = generateCode(6);
    const ref = doc(db, 'families', familyId);
    if ((await getDoc(ref)).exists()) continue;
    const password = generateCode(6);
    await setDoc(ref, { name, createdBy: uid, createdAt: serverTimestamp(), passwordHash: await hashPassword(password) });
    await setDoc(doc(db, `families/${familyId}/members/${uid}`), { uid, displayName: 'Family Admin', role: 'admin', status: 'active', sharingEnabled: false, joinedAt: serverTimestamp() });
    return { familyId, password };
  }
  throw new Error('Could not generate a unique group ID. Please try again.');
};

// Admin-only: rotates the shared group password. Anyone who already joined
// keeps their membership; only the new password works for future joins.
export const resetFamilyPassword = async (familyId: string): Promise<string> => {
  const password = generateCode(6);
  await updateDoc(doc(db, `families/${familyId}`), { passwordHash: await hashPassword(password) });
  return password;
};

export const joinFamily = async (familyId: string, password: string, displayName: string, uid: string): Promise<void> => {
  await setDoc(doc(db, `families/${familyId}/members/${uid}`), {
    uid,
    displayName: displayName.trim(),
    role: 'member',
    status: 'active',
    sharingEnabled: false,
    joinedAt: serverTimestamp(),
    passwordHash: await hashPassword(password),
  });
};

// Finds every group this uid created or joined by querying across all
// families' `members` subcollections at once (a Firestore "collection group"
// query), rather than requiring the app to already know the family ID.
// This is what lets a group "persist" across logins/app restarts.
export const findMyFamilies = async (uid: string): Promise<{ familyId: string; member: FamilyMember }[]> => {
  const snapshot = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)));
  return snapshot.docs.map(item => ({ familyId: item.ref.parent.parent!.id, member: item.data() as FamilyMember }));
};

export const watchMembers = (familyId: string, callback: (members: FamilyMember[]) => void) =>
  onSnapshot(collection(db, `families/${familyId}/members`), snapshot => callback(snapshot.docs.map(item => item.data() as FamilyMember)));

export const watchLocations = (familyId: string, callback: (locations: MemberLocation[]) => void) =>
  onSnapshot(collection(db, `families/${familyId}/locations`), snapshot => callback(snapshot.docs.map(item => item.data() as MemberLocation)));

export const publishLocation = (familyId: string, uid: string, location: Omit<MemberLocation, 'uid'>) => setDoc(doc(db, `families/${familyId}/locations/${uid}`), { uid, ...location });
export const setSharing = (familyId: string, uid: string, enabled: boolean) => updateDoc(doc(db, `families/${familyId}/members/${uid}`), { sharingEnabled: enabled });
export const getFamily = async (familyId: string) => (await getDoc(doc(db, `families/${familyId}`))).data() as Family | undefined;

// Admin-only (enforced by firestore.rules): removes a member from the group.
export const removeMember = async (familyId: string, uid: string) => {
  await deleteDoc(doc(db, `families/${familyId}/locations/${uid}`)).catch(() => {});
  await deleteDoc(doc(db, `families/${familyId}/members/${uid}`));
};
