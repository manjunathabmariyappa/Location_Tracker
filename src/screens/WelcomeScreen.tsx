import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { sharedStyles as s } from './sharedStyles';

// The very first screen: pick whether you're the family admin (managing the
// group, signs in with email/password) or a member joining via an invite
// (Group ID + password, no account needed).
export function WelcomeScreen({ onPickAdmin, onPickMember }: { onPickAdmin: () => void; onPickMember: () => void }) {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="auto" />
      <View style={s.center}>
        <Text style={s.title}>Family Safety</Text>
        <Text style={s.help}>Keep track of the people who matter, with their consent.</Text>

        <Pressable style={[s.card, styles.card]} onPress={onPickAdmin}>
          <Text style={styles.cardTitle}>I'm the Admin</Text>
          <Text style={s.help}>Create and manage a family group, invite members, and see their shared locations.</Text>
        </Pressable>

        <Pressable style={[s.card, styles.card]} onPress={onPickMember}>
          <Text style={styles.cardTitle}>I have an invite</Text>
          <Text style={s.help}>Join a family using the Group ID and password the admin shared with you.</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#CBD5E1' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
});
