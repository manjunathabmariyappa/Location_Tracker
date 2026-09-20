import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, gap: 12 },
  center: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 30, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { color: '#475569' },
  heading: { fontSize: 19, fontWeight: '700', marginTop: 20, color: '#0F172A' },
  input: { backgroundColor: 'white', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 8 },
  label: { fontSize: 16 },
  help: { color: '#475569', lineHeight: 20 },
  code: { color: '#1D4ED8', fontFamily: 'monospace', fontSize: 16 },
  error: { color: '#B91C1C' },
  link: { color: '#1D4ED8', fontWeight: '600' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, gap: 8 },
});
