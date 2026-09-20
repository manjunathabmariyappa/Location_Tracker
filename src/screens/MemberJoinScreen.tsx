import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { auth } from '@/services/firebase/client';
import { continueAsMember } from '@/services/firebase/auth';
import { joinFamily } from '@/services/firebase/families';
import { sharedStyles as s } from './sharedStyles';

// Members never need an account: they enter the Group ID + password the
// admin shared with them (e.g. over WhatsApp), grant a display name, and get
// signed in anonymously behind the scenes.
export function MemberJoinScreen({ onBack, onJoined }: { onBack: () => void; onJoined: (familyId: string) => void }) {
  const [groupId, setGroupId] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const join = async () => {
    const id = groupId.trim().toUpperCase();
    const code = groupPassword.trim();
    const name = displayName.trim();
    if (!id || !code || !name) {
      setMessage('Group ID, password, and your name are all required.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const currentUid = auth.currentUser?.uid ?? (await continueAsMember()).user.uid;
      await joinFamily(id, code, name, currentUid);
      onJoined(id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That Group ID / password combination is invalid.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="auto" />
      <View style={s.center}>
        <Text style={s.title}>Join a family</Text>
        <Text style={s.help}>Enter the Group ID and password the admin shared with you, then grant location permission when asked.</Text>
        <TextInput value={groupId} onChangeText={setGroupId} placeholder="Group ID" autoCapitalize="characters" style={s.input} />
        <TextInput value={groupPassword} onChangeText={setGroupPassword} placeholder="Password" autoCapitalize="characters" secureTextEntry style={s.input} />
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" style={s.input} />
        <Button title="Join family" onPress={join} disabled={busy} />
        <Button title="Back" onPress={onBack} disabled={busy} />
        {message ? <Text style={s.error}>{message}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
