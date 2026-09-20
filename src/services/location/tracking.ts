import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { publishLocation } from '@/services/firebase/families';

export const LOCATION_TASK = 'family-safety-location-task';
let activeFamilyId: string | undefined;
let activeUid: string | undefined;

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !activeFamilyId || !activeUid) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;
  await publishLocation(activeFamilyId, activeUid, { latitude: latest.coords.latitude, longitude: latest.coords.longitude, accuracy: latest.coords.accuracy ?? 0, capturedAt: new Date(), provider: latest.coords.altitude != null ? 'gps' : 'network' });
});

export const requestLocationPermissions = async () => {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) return { foreground: false, background: false };
  const background = await Location.requestBackgroundPermissionsAsync();
  return { foreground: true, background: background.status === Location.PermissionStatus.GRANTED };
};

export const startSharing = async (familyId: string, uid: string) => {
  const permissions = await requestLocationPermissions();
  if (!permissions.foreground) throw new Error('Foreground location permission is required.');
  activeFamilyId = familyId; activeUid = uid;
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await publishLocation(familyId, uid, { latitude: current.coords.latitude, longitude: current.coords.longitude, accuracy: current.coords.accuracy ?? 0, capturedAt: new Date(), provider: 'gps' });
  if (permissions.background && !(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) await Location.startLocationUpdatesAsync(LOCATION_TASK, { accuracy: Location.Accuracy.Balanced, timeInterval: 15 * 60 * 1000, distanceInterval: 100, deferredUpdatesInterval: 15 * 60 * 1000, pausesUpdatesAutomatically: true, foregroundService: { notificationTitle: 'Family Safety location sharing', notificationBody: 'Your family can see your latest shared location.', notificationColor: '#2563EB' }, showsBackgroundLocationIndicator: true });
  return permissions;
};

export const stopSharing = async () => { activeFamilyId = undefined; activeUid = undefined; if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK); };
