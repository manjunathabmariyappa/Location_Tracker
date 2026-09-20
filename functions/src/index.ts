import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createHash, randomBytes } from 'node:crypto';

initializeApp();
const db = getFirestore();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const code = () => randomBytes(5).toString('hex').toUpperCase();

// Group "password": unlike a one-time invite, this code stays valid for a
// long time (1 year) and can be redeemed by many members, so the admin can
// share it once (WhatsApp, SMS, etc.) and everyone in the family can join
// with the same Group ID + password whenever they install the app.
const PASSWORD_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const PASSWORD_MAX_USES = 500;

export const createInvitation = onCall(async request => {
  const uid = request.auth?.uid;
  const familyId = (request.data?.familyId as string | undefined)?.trim().toUpperCase();
  if (!uid || !familyId) throw new HttpsError('invalid-argument', 'Authentication and familyId are required.');
  const member = await db.doc(`families/${familyId}/members/${uid}`).get();
  if (!member.exists || member.data()?.role !== 'admin' || member.data()?.status !== 'active') throw new HttpsError('permission-denied', 'Only an active family admin can invite members.');

  // Reuse the family's existing active password if one was already
  // generated, so re-opening the "invite" screen doesn't invalidate a code
  // that's already been shared with someone.
  const existing = await db.collection(`families/${familyId}/invitations`).where('status', '==', 'active').where('createdBy', '==', uid).limit(1).get();
  const existingPlainCode = existing.docs[0]?.data()?.plainCode as string | undefined;
  if (existingPlainCode) return { code: existingPlainCode, expiresInHours: PASSWORD_TTL_MS / (60 * 60 * 1000) };

  const plainCode = code();
  await db.doc(`families/${familyId}/invitations/${hash(plainCode)}`).set({ tokenHash: hash(plainCode), plainCode, createdBy: uid, expiresAt: new Date(Date.now() + PASSWORD_TTL_MS), status: 'active', usedCount: 0, maxUses: PASSWORD_MAX_USES });
  return { code: plainCode, expiresInHours: PASSWORD_TTL_MS / (60 * 60 * 1000) };
});

export const redeemInvitation = onCall(async request => {
  const uid = request.auth?.uid;
  const familyId = (request.data?.familyId as string | undefined)?.trim().toUpperCase();
  const plainCode = request.data?.code as string | undefined;
  const displayName = request.data?.displayName as string | undefined;
  if (!uid || !familyId || !plainCode || !displayName) throw new HttpsError('invalid-argument', 'familyId, code, and displayName are required.');
  const inviteRef = db.doc(`families/${familyId}/invitations/${hash(plainCode.trim().toUpperCase())}`);
  const invite = await inviteRef.get();
  const data = invite.data();
  if (!invite.exists || !data || data.status !== 'active' || data.usedCount >= data.maxUses || data.expiresAt.toDate() < new Date()) throw new HttpsError('failed-precondition', 'That Group ID / password combination is invalid or expired.');
  await db.runTransaction(async tx => {
    tx.set(db.doc(`families/${familyId}/members/${uid}`), { uid, displayName: displayName.trim(), role: 'member', status: 'active', sharingEnabled: false, joinedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.update(inviteRef, { usedCount: FieldValue.increment(1) });
  });
  return { familyId };
});
