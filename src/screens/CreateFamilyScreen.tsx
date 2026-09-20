import React, { useState } from 'react';
import { Button, Share, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase/client';
import { createFamily } from '@/services/firebase/families';
import { sharedStyles as s } from './sharedStyles';

const inviteMessage = (familyId: string, password: string) =>
  `Join our family on Family Safety Tracker!\n\nGroup ID: ${familyId}\nPassword: ${password}\n\nInstall the app, tap "I have an invite", and enter these to join.`;

// Shown to a signed-in admin who doesn't have a family group yet (brand new
// account, or the very first launch after creating one).
export function CreateFamilyScreen({ uid, onCreated }: { uid: string; onCreated: (familyId: string) => void }) {
  const [familyName, setFamilyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<{ familyId: string; password: string }>();

  const create = async () => {
    setBusy(true);
    setMessage('');
    try {
      setCreated(await createFamily(uid, familyName.trim() || 'My Family'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create family.');
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar style="auto" />
        <View style={s.center}>
          <Text style={s.title}>Family created!</Text>
          <Text style={s.help}>Share these with the people you want to see on your map. This password is only shown once — you can generate a new one later from the app if needed.</Text>
          <Text style={s.code}>Group ID: {created.familyId}</Text>
          <Text style={s.code}>Password: {created.password}</Text>
          <Button title="Share invite (WhatsApp, SMS, etc.)" onPress={() => Share.share({ message: inviteMessage(created.familyId, created.password) })} />
          <Button title="Continue" onPress={() => onCreated(created.familyId)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="auto" />
      <View style={s.center}>
        <Text style={s.title}>Create your family</Text>
        <Text style={s.help}>Give your group a name. You'll get a short Group ID and password to share with members afterward.</Text>
        <TextInput value={familyName} onChangeText={setFamilyName} placeholder="Family name" style={s.input} />
        <Button title="Create family" onPress={create} disabled={busy} />
        <Button title="Log out" onPress={() => signOut(auth)} disabled={busy} />
        {message ? <Text style={s.error}>{message}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
