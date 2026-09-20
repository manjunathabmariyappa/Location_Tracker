import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './client';
import type { Family, FamilyMember, MemberLocation } from '@/types/domain';

export const createFamily = async (uid: string, name: string): Promise<string> => {
  const family = await addDoc(collection(db, 'families'), { name, createdBy: uid, createdAt: serverTimestamp() });
  await setDoc(doc(db, `families/${family.id}/members/${uid}`), { uid, displayName: 'Family Admin', role: 'admin', status: 'active', sharingEnabled: false, joinedAt: serverTimestamp() });
  return family.id;
};

export const watchMembers = (familyId: string, callback: (members: FamilyMember[]) => void) =>
  onSnapshot(collection(db, `families/${familyId}/members`), snapshot => callback(snapshot.docs.map(item => item.data() as FamilyMember)));

export const watchLocations = (familyId: string, callback: (locations: MemberLocation[]) => void) =>
  onSnapshot(collection(db, `families/${familyId}/locations`), snapshot => callback(snapshot.docs.map(item => item.data() as MemberLocation)));

export const publishLocation = (familyId: string, uid: string, location: Omit<MemberLocation, 'uid'>) => setDoc(doc(db, `families/${familyId}/locations/${uid}`), { uid, ...location });
export const setSharing = (familyId: string, uid: string, enabled: boolean) => updateDoc(doc(db, `families/${familyId}/members/${uid}`), { sharingEnabled: enabled });
export const getFamily = async (familyId: string) => (await getDoc(doc(db, `families/${familyId}`))).data() as Family | undefined;
