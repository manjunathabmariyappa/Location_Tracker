import React, { useState } from 'react';
import { Button, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FamilyMap } from './FamilyMap';
import type { FamilyMember, MemberLocation } from '@/types/domain';

// Wraps FamilyMap with a tap-to-expand full-screen Modal, since a 320px
// inline map is too small to actually navigate.
export function ExpandableFamilyMap({ members, locations }: { members: FamilyMember[]; locations: MemberLocation[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Pressable onPress={() => setExpanded(true)}>
        <FamilyMap members={members} locations={locations} />
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tap to expand</Text>
        </View>
      </Pressable>

      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <SafeAreaView style={styles.fullScreen}>
          <FamilyMap members={members} locations={locations} fullScreen />
          <View style={styles.closeBar}>
            <Button title="Close map" onPress={() => setExpanded(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hint: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  hintText: { color: 'white', fontSize: 12 },
  fullScreen: { flex: 1, backgroundColor: 'black' },
  closeBar: { padding: 12, backgroundColor: 'white' },
});
