import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createHash, randomBytes } from 'node:crypto';

initializeApp();
const db = getFirestore();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const code = () => randomBytes(5).toString('hex').toUpperCase();

export const createInvitation = onCall(async request => {
  const uid = request.auth?.uid;
  const familyId = request.data?.familyId as string | undefined;
  if (!uid || !familyId) throw new HttpsError('invalid-argument', 'Authentication and familyId are required.');
  const member = await db.doc(`families/${familyId}/members/${uid}`).get();
  if (!member.exists || member.data()?.role !== 'admin' || member.data()?.status !== 'active') throw new HttpsError('permission-denied', 'Only an active family admin can invite members.');
  const plainCode = code();
  await db.doc(`families/${familyId}/invitations/${hash(plainCode)}`).set({ tokenHash: hash(plainCode), createdBy: uid, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), status: 'active', usedCount: 0, maxUses: 1 });
  return { code: plainCode, expiresInHours: 24 };
});

export const redeemInvitation = onCall(async request => {
  const uid = request.auth?.uid;
  const familyId = request.data?.familyId as string | undefined;
  const plainCode = request.data?.code as string | undefined;
  const displayName = request.data?.displayName as string | undefined;
  if (!uid || !familyId || !plainCode || !displayName) throw new HttpsError('invalid-argument', 'familyId, code, and displayName are required.');
  const inviteRef = db.doc(`families/${familyId}/invitations/${hash(plainCode.trim().toUpperCase())}`);
  const invite = await inviteRef.get();
  const data = invite.data();
  if (!invite.exists || !data || data.status !== 'active' || data.usedCount >= data.maxUses || data.expiresAt.toDate() < new Date()) throw new HttpsError('failed-precondition', 'This invitation is invalid or expired.');
  await db.runTransaction(async tx => {
    tx.set(db.doc(`families/${familyId}/members/${uid}`), { uid, displayName: displayName.trim(), role: 'member', status: 'active', sharingEnabled: false, joinedAt: FieldValue.serverTimestamp() });
    tx.update(inviteRef, { status: 'used', usedCount: FieldValue.increment(1) });
  });
  return { familyId };
});
