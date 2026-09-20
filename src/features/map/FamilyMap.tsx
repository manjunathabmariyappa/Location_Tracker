import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { FamilyMember, MemberLocation } from '@/types/domain';

// This map uses Leaflet + OpenStreetMap tiles inside a WebView instead of react-native-maps
// (Google Maps SDK). Google Maps Platform requires a billing account to be linked even for
// its free tier, while OpenStreetMap tiles are free and require no API key or billing account.
// Tapping a marker's "Navigate" link still opens the device's Google Maps app for turn-by-turn
// directions — that's just a URL deep link, not the paid SDK, so it stays free.
function buildHtml(points: { uid: string; latitude: number; longitude: number; label: string }[]) {
  const center = points[0] ?? { latitude: 20, longitude: 0 };
  const zoom = points.length ? 13 : 2;
  const markers = points
    .map(point => {
      const destination = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
      const safeLabel = point.label.replace(/</g, '&lt;').replace(/'/g, '&#39;');
      return `L.marker([${point.latitude}, ${point.longitude}]).addTo(map).bindPopup("<b>${safeLabel}</b><br/><a href='${destination}' target='_blank' rel='noopener'>Navigate</a>");`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${center.latitude}, ${center.longitude}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

export function FamilyMap({ members, locations, fullScreen }: { members: FamilyMember[]; locations: MemberLocation[]; fullScreen?: boolean }) {
  const points = useMemo(
    () =>
      locations.map(location => ({
        uid: location.uid,
        latitude: location.latitude,
        longitude: location.longitude,
        label: `${members.find(member => member.uid === location.uid)?.displayName ?? 'Family member'} — Accuracy ±${Math.round(location.accuracy)}m`,
      })),
    [members, locations],
  );
  const html = useMemo(() => buildHtml(points), [points]);
  return (
    <View style={[styles.container, fullScreen ? styles.containerFullScreen : null]}>
      <WebView
        style={StyleSheet.absoluteFill}
        originWhitelist={['*']}
        source={{ html }}
        onShouldStartLoadWithRequest={request => {
          if (request.url.startsWith('https://www.google.com/maps')) {
            Linking.openURL(request.url);
            return false;
          }
          return true;
        }}
      />
      {locations.length === 0 ? (
        <View style={styles.empty}>
          <Text>No shared locations yet.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 320, overflow: 'hidden', borderRadius: 12 },
  containerFullScreen: { height: undefined, flex: 1, borderRadius: 0 },
  empty: { position: 'absolute', alignSelf: 'center', top: 130, backgroundColor: 'white', padding: 12, borderRadius: 8 },
});
