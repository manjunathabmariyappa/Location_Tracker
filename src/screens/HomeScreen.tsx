import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Linking, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase/client';
import { removeMember, resetFamilyPassword, setSharing, watchLocations, watchMembers } from '@/services/firebase/families';
import { startSharing, stopSharing } from '@/services/location/tracking';
import { currentVersion, checkForUpdate } from '@/services/updates/github';
import { downloadAndInstallApk } from '@/services/updates/installer';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ExpandableFamilyMap } from '@/features/map/ExpandableFamilyMap';
import type { FamilyMember, MemberLocation } from '@/types/domain';
import { sharedStyles as s } from './sharedStyles';

// Firestore returns Timestamp objects (with a toDate() method), not plain
// Dates, even though our domain type says Date — handle both defensively.
const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value) return (value as { toDate: () => Date }).toDate();
  return undefined;
};

const formatLastSeen = (location?: MemberLocation) => {
  const date = location && toDate(location.capturedAt);
  if (!date) return 'No location shared yet';
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Last seen just now';
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.round(hours / 24)}d ago`;
};

export function HomeScreen({ uid, familyId, onLeaveFamily }: { uid: string; familyId: string; onLeaveFamily: () => void }) {
  const online = useNetworkStatus();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [locations, setLocations] = useState<MemberLocation[]>([]);
  const [sharing, setSharingState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [updateProgress, setUpdateProgress] = useState<number>();

  useEffect(() => {
    const unwatchMembers = watchMembers(familyId, setMembers);
    const unwatchLocations = watchLocations(familyId, setLocations);
    return () => {
      unwatchMembers();
      unwatchLocations();
    };
  }, [familyId]);

  const me = useMemo(() => members.find(member => member.uid === uid), [members, uid]);
  const isAdmin = me?.role === 'admin';
  useEffect(() => setSharingState(!!me?.sharingEnabled), [me?.sharingEnabled]);

  // Admins are monitors, not tracked people — their own location (even if
  // somehow enabled) never shows up on the family map.
  const adminUids = useMemo(() => new Set(members.filter(member => member.role === 'admin').map(member => member.uid)), [members]);
  const visibleLocations = useMemo(() => locations.filter(location => !adminUids.has(location.uid)), [locations, adminUids]);
  const nonAdminMembers = useMemo(() => members.filter(member => member.role !== 'admin'), [members]);
  const locationByUid = useMemo(() => new Map(visibleLocations.map(location => [location.uid, location])), [visibleLocations]);

  const logOut = async () => {
    setBusy(true);
    try {
      await stopSharing();
      await signOut(auth);
      onLeaveFamily();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to log out.');
    } finally {
      setBusy(false);
    }
  };

  const toggleSharing = async (enabled: boolean) => {
    setBusy(true);
    try {
      if (enabled) await startSharing(familyId, uid);
      else await stopSharing();
      await setSharing(familyId, uid, enabled);
      setSharingState(enabled);
      setMessage(enabled ? 'Location sharing is enabled.' : 'Location sharing is disabled.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update location sharing.');
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    setBusy(true);
    setMessage('');
    try {
      // Generates a fresh password each time — already-joined members keep
      // their membership; only the new password works for future joins.
      const password = await resetFamilyPassword(familyId);
      setMessage(`New password: ${password} (also included in the share message below)`);
      await Share.share({ message: `Join our family on Family Safety Tracker!\n\nGroup ID: ${familyId}\nPassword: ${password}\n\nInstall the app, tap "I have an invite", and enter these to join.` });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create invitation.');
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveMember = (member: FamilyMember) => {
    Alert.alert('Remove member', `Remove ${member.displayName} from the family? They'll need a new invite to rejoin.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeMember(familyId, member.uid);
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Unable to remove member.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const checkUpdates = async () => {
    setBusy(true);
    setMessage('');
    try {
      const result = await checkForUpdate();
      if (!result.available) {
        setMessage(`You're up to date (v${result.currentVersion}).`);
        return;
      }
      Alert.alert('Update available', `Version ${result.latestVersion} is available (you have ${result.currentVersion}). Download and install now?`, [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Download & install',
          onPress: async () => {
            setUpdateProgress(0);
            try {
              await downloadAndInstallApk(result.downloadUrl, setUpdateProgress);
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Update download failed.');
            } finally {
              setUpdateProgress(undefined);
            }
          },
        },
      ]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to check for updates.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <View style={s.headerText}>
            <Text style={s.title}>Family Safety</Text>
            <Text style={s.subtitle}>{isAdmin ? 'Admin' : me?.displayName ?? 'Member'} · Group {familyId}</Text>
          </View>
          <Button title="Log Out" onPress={logOut} disabled={busy} />
        </View>
        <Text style={s.subtitle}>{online ? 'Online' : 'Offline — live updates paused until connected'}</Text>

        {isAdmin ? (
          <>
            <Text style={s.heading}>Invite members</Text>
            <Text style={s.code}>Group ID: {familyId}</Text>
            <Text style={s.help}>Sharing generates a new password each time (already-joined members are unaffected) — send it to everyone you want on your map at once.</Text>
            <Button title="Share invite (WhatsApp, SMS, etc.)" onPress={shareInvite} disabled={busy} />

            <Text style={s.heading}>Members ({nonAdminMembers.length})</Text>
            {nonAdminMembers.length === 0 ? (
              <Text style={s.help}>No one has joined yet. Share the invite above to add your first member.</Text>
            ) : (
              nonAdminMembers.map(member => (
                <View key={member.uid} style={[s.row, styles.memberRow]}>
                  <View style={styles.memberInfo}>
                    <Text style={s.label}>{member.displayName}</Text>
                    <Text style={s.help}>{member.sharingEnabled ? 'Sharing on' : 'Sharing off'} · {formatLastSeen(locationByUid.get(member.uid))}</Text>
                  </View>
                  <Button title="Remove" color="#B91C1C" onPress={() => confirmRemoveMember(member)} disabled={busy} />
                </View>
              ))
            )}
          </>
        ) : null}

        <Text style={s.heading}>Family map</Text>
        <ExpandableFamilyMap members={members} locations={visibleLocations} />
        <Text style={s.help}>{nonAdminMembers.length} member(s), {visibleLocations.length} latest location(s) shown.</Text>

        {!isAdmin ? (
          <>
            <Text style={s.heading}>Location sharing</Text>
            <View style={s.row}>
              <Text style={s.label}>{sharing ? 'Sharing enabled' : 'Sharing disabled'}</Text>
              <Switch value={sharing} onValueChange={toggleSharing} disabled={busy} />
            </View>
            <Text style={s.help}>Sharing is visible and consent-based. Turn it off at any time. Android may ask for separate background permission.</Text>
          </>
        ) : null}

        <Text style={s.heading}>Settings</Text>
        <Text>App version: {currentVersion}</Text>
        {updateProgress != null ? (
          <Text style={s.help}>Downloading update… {updateProgress}%</Text>
        ) : (
          <Button title="Check for Updates" onPress={checkUpdates} disabled={busy} />
        )}
        <Button title="Project documentation" onPress={() => Linking.openURL('https://github.com')} />
        {message ? <Text style={s.help}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  memberRow: { alignItems: 'center' },
  memberInfo: { flex: 1, gap: 2 },
});
