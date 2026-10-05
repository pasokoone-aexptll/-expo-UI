import { Image } from 'expo-image';
import { forwardRef, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, type Region, type LongPressEvent } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { PeopleCount } from '@/components/people-count';
import { GradientText } from '@/components/gradient-text';
import { MapBubble } from '@/components/map-bubble';
import type { getMapArea } from '@/mocks/map-data';
import type { Coordinate } from '@/types';

export type MapPerson = { id: string; label: string; coordinate: Coordinate };
type Props = { area: ReturnType<typeof getMapArea>; onReady: () => void; onMention: (person: MapPerson) => void; onMapPress: () => void; onMapLongPress: (event: LongPressEvent) => void };
function Pin({ person, zone, compact, onMention }: { person?: MapPerson; zone: ReturnType<typeof getMapArea>['zones'][number]; compact: boolean; onMention: Props['onMention'] }) {
  const scale = useSharedValue(1);
  const isPerson = !!person;
  // 固定フレーム: 点の中心(y=73) / ステッカー下端(y=150)を地理座標に固定。
  const frameHeight = isPerson ? 80 : 150;
  const anchorY = isPerson ? 73 : 150;
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - scale.value) * (anchorY - frameHeight / 2) }, { scale: scale.value }] }));
  function pulse() { scale.value = withSequence(withTiming(1.12, { duration: 140 }), withTiming(1, { duration: 200 })); }
  return <Marker coordinate={person?.coordinate ?? zone.coordinate} centerOffset={{ x: 0, y: frameHeight / 2 - anchorY }} anchor={{ x: 0.5, y: anchorY / frameHeight }} stopPropagation onPress={pulse}>
    <Pressable accessible accessibilityLabel={person ? `${person.label}。長押しでメンション` : `電信ID ${zone.electricId}`} onPress={pulse} onLongPress={person ? () => onMention(person) : undefined} delayLongPress={500} style={{ width: 126, height: frameHeight }}>
      <Animated.View style={[styles.pin, { height: frameHeight }, animated]}>
        {person ? <><View style={styles.personBubble}>{!compact && <MapBubble><GradientText color={zone.color} style={styles.personText}>{person.label}</GradientText></MapBubble>}</View><View style={[styles.dot, { backgroundColor: zone.color }]} /></> : <>
          <View style={[styles.stickerBubble, compact && { bottom: 60 }]}><MapBubble><View>{!compact && <Text style={styles.label}>電信ID</Text>}<GradientText color={zone.color} style={styles.id}>{compact ? `…${zone.electricId.slice(-2)}` : zone.electricId}</GradientText></View><PeopleCount count={zone.headcount} color={zone.color} /></MapBubble></View>
          <Image source={zone.sticker} style={[styles.sticker, compact && styles.compactSticker]} contentFit="contain" contentPosition="bottom" />
        </>}
      </Animated.View>
    </Pressable>
  </Marker>;
}
export const AreaMap = forwardRef<MapView, Props>(function AreaMap({ area, onReady, onMention, onMapPress, onMapLongPress }, ref) {
  const [compact, setCompact] = useState(false);
  useEffect(() => setCompact(false), [area.id]);
  // ASSUMED: 約500m以上の表示範囲では人名を省き、電信IDは末尾だけにする。
  function updateDetail(region: Region) { setCompact(current => region.latitudeDelta > (current ? 0.004 : 0.005)); }
  return <MapView ref={ref} onMapReady={onReady} onRegionChangeComplete={updateDetail} onPress={onMapPress} onLongPress={onMapLongPress} style={StyleSheet.absoluteFill} initialCamera={{ center: area.center, pitch: 45, heading: -25, altitude: 650, zoom: 17 }} mapType="mutedStandard" userInterfaceStyle="light" showsPointsOfInterests={false} showsBuildings={false} showsCompass={false} showsScale={false} showsUserLocation={false}>
    {area.zones.map(zone => <Polygon key={zone.key} coordinates={zone.boundary} fillColor={`${zone.color}35`} strokeColor={zone.color} strokeWidth={1} />)}
    {area.zones.flatMap(zone => zone.people.map(person => <Pin key={person.id} person={person} zone={zone} compact={compact} onMention={onMention} />))}
    {area.zones.map(zone => <Pin key={zone.key} zone={zone} compact={compact} onMention={onMention} />)}
  </MapView>;
});
const styles = StyleSheet.create({
  pin: { width: 126, alignItems: 'center' }, personBubble: { position: 'absolute', bottom: 14 }, personText: { fontSize: 13 }, dot: { position: 'absolute', bottom: 2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  stickerBubble: { position: 'absolute', bottom: 80 }, label: { color: '#888888', fontSize: 9 }, id: { fontSize: 16, fontWeight: '800', fontFamily: 'ui-rounded' }, sticker: { position: 'absolute', bottom: 0, width: 80, height: 80 }, compactSticker: { width: 60, height: 60 },
});
