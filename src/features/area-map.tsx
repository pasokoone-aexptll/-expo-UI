import { GradientText } from '@/components/gradient-text';
import { MapBubble } from '@/components/map-bubble';
import { Image } from 'expo-image';
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { PeopleCount } from '@/components/people-count';
import type { getMapArea } from '@/mocks/map-data';

type Props = { area: ReturnType<typeof getMapArea>; onReady: () => void };
export const AreaMap = forwardRef<MapView, Props>(function AreaMap({ area, onReady }, ref) {
  return <MapView ref={ref} onMapReady={onReady} style={StyleSheet.absoluteFill} initialCamera={{ center: area.center, pitch: 45, heading: -25, altitude: 650, zoom: 17 }} mapType="mutedStandard" userInterfaceStyle="light" showsPointsOfInterests={false} showsBuildings={false} showsCompass={false} showsScale={false} showsUserLocation={false}>
    {area.zones.map(zone => <Polygon key={zone.key} coordinates={zone.boundary} fillColor={`${zone.color}35`} strokeColor={zone.color} strokeWidth={1} />)}
    {area.zones.flatMap(zone => zone.people.map(person => <Marker key={person.id} coordinate={person.coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={true}>
      <View style={styles.person}><MapBubble><GradientText color={zone.color} style={styles.personText}>{person.label}</GradientText></MapBubble><View style={[styles.dot, { backgroundColor: zone.color }]} /></View>
    </Marker>))}
    {area.zones.map(zone => <Marker key={zone.key} coordinate={zone.coordinate} anchor={{ x: 0.5, y: 0.7 }}>
      <View style={styles.stickerMarker}><MapBubble><View><Text style={styles.label}>電信ID</Text><GradientText color={zone.color} style={styles.id}>{zone.electricId}</GradientText></View><PeopleCount count={zone.headcount} color={zone.color} /></MapBubble>
        {zone.sticker ? <Image source={zone.sticker} style={styles.sticker} contentFit="contain" /> : <View style={[styles.sticker, styles.placeholder]} />}
      </View>
    </Marker>)}
  </MapView>;
});
const styles = StyleSheet.create({
  person: { alignItems: 'center', padding: 3 }, personLabel: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 8, paddingVertical: 4 }, personText: { fontSize: 13 },
  tail: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF', alignSelf: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF', marginTop: 3 },
  stickerMarker: { alignItems: 'center', width: 110 }, bubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFFDD', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, gap: 3 }, label: { color: '#AAAAAA', fontSize: 9 }, id: { fontSize: 16, fontWeight: '800', fontFamily: 'ui-rounded' }, sticker: { width: 76, height: 76 }, placeholder: { backgroundColor: '#D1D1D1', borderRadius: 14 },
});
