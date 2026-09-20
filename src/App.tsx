import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/services/firebase/client';
import { useMyFamily } from '@/hooks/useMyFamily';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { AdminAuthScreen } from '@/screens/AdminAuthScreen';
import { MemberJoinScreen } from '@/screens/MemberJoinScreen';
import { CreateFamilyScreen } from '@/screens/CreateFamilyScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { sharedStyles as s } from '@/screens/sharedStyles';

type AuthView = 'welcome' | 'admin' | 'member';

function AppContent() {
  const [uid, setUid] = useState<string>();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('welcome');
  const { familyId, loading, rememberFamily } = useMyFamily(uid);

  useEffect(
    () =>
      onAuthStateChanged(auth, user => {
        setUid(user?.uid);
        setIsAnonymous(!!user?.isAnonymous);
      }),
    [],
  );

  // Once signed out, always land back on the welcome picker next time.
  useEffect(() => {
    if (!uid) setAuthView('welcome');
  }, [uid]);

  if (!uid) {
    if (authView === 'admin') return <AdminAuthScreen onBack={() => setAuthView('welcome')} />;
    if (authView === 'member') return <MemberJoinScreen onBack={() => setAuthView('welcome')} onJoined={rememberFamily} />;
    return <WelcomeScreen onPickAdmin={() => setAuthView('admin')} onPickMember={() => setAuthView('member')} />;
  }

  if (familyId) return <HomeScreen uid={uid} familyId={familyId} onLeaveFamily={() => setAuthView('welcome')} />;

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar style="auto" />
        <View style={s.center}>
          <Text style={s.help}>Loading your family…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Signed in but no group found yet: an email/password account is an admin
  // who hasn't created a family; an anonymous account needs a Group ID + password.
  if (!isAnonymous) return <CreateFamilyScreen uid={uid} onCreated={rememberFamily} />;
  // Anonymous session but no membership found (e.g. a join was interrupted) —
  // sign out so "Back" actually returns to the welcome picker.
  return <MemberJoinScreen onBack={() => signOut(auth)} onJoined={rememberFamily} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
