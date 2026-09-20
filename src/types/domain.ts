export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'pending' | 'revoked';

export interface Family { id: string; name: string; createdBy: string; createdAt?: Date; }
export interface FamilyMember { uid: string; displayName: string; role: MemberRole; status: MemberStatus; sharingEnabled: boolean; joinedAt?: Date; lastSeenAt?: Date; }
export interface MemberLocation { uid: string; latitude: number; longitude: number; accuracy: number; capturedAt: Date; provider: string; }
export interface FamilyInvitation { id: string; familyId: string; code: string; expiresAt: Date; status: 'active' | 'used' | 'expired'; }
