import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { createAdmin, signInAdmin } from '@/services/firebase/auth';
import { sharedStyles as s } from './sharedStyles';

export function AdminAuthScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (action: () => Promise<unknown>) => {
    if (!email.trim() || password.length < 6) {
      setMessage('Enter an email and a password with 6+ characters.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await action();
      // On success, onAuthStateChanged (wired up in App.tsx) will pick up
      // the new session and move us forward automatically.
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="auto" />
      <View style={s.center}>
        <Text style={s.title}>Admin sign in</Text>
        <Text style={s.help}>First time here? Create an account, then sign in with it every time after.</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="Admin email" autoCapitalize="none" keyboardType="email-address" style={s.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password (6+ characters)" secureTextEntry style={s.input} />
        <Button title="Sign in" onPress={() => run(() => signInAdmin(email, password))} disabled={busy} />
        <Button title="Create admin account" onPress={() => run(() => createAdmin(email, password))} disabled={busy} />
        <Button title="Back" onPress={onBack} disabled={busy} />
        {message ? <Text style={s.error}>{message}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
