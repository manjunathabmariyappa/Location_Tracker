import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { getApps } from 'firebase/app';
import { auth } from './client';

type InvitationResult = { code: string; expiresInHours: number };
const functions = getFunctions(getApps()[0]);
export const createInvitation = async (familyId: string) => (await httpsCallable<{ familyId: string }, InvitationResult>(functions, 'createInvitation')({ familyId })).data;
export const redeemInvitation = async (familyId: string, code: string, displayName: string) => (await httpsCallable<{ familyId: string; code: string; displayName: string }, { familyId: string }>(functions, 'redeemInvitation')({ familyId, code, displayName })).data;
export const currentUserId = () => auth.currentUser?.uid;
