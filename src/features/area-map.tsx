import { Image } from 'expo-image';
import { forwardRef, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, type Region, type LongPressEvent } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { PeopleCount } from '@/components/people-count';
import { GradientText } from '@/components/gradient-text';
import { MapBubble } from '@/components/map-bubble';
import type { getMapArea } from '@/mocks/map-data';
import type { Coordinate } from '@/types';

export type MapPerson = { id: string; label: string; coordinate: Coordinate };
type Props = { area: ReturnType<typeof getMapArea>; onReady: () => void; onMention: (person: MapPerson) => void; onMapPress: () => void; onMapLongPress: (event: LongPressEvent) => void; onMoving: (active: boolean) => void };
function Pin({ person, zone, compact, zoomScale, onMention }: { person?: MapPerson; zone: ReturnType<typeof getMapArea>['zones'][number]; compact: boolean; zoomScale: SharedValue<number>; onMention: Props['onMention'] }) {
  const scale = useSharedValue(1);
  const isPerson = !!person;
  // 固定フレーム: 点の中心(y=100) / ステッカー下端(y=210)を地理座標に固定。
  const frameHeight = isPerson ? 110 : 210;
  const anchorY = isPerson ? 100 : 210;
  const animated = useAnimatedStyle(() => {
    const zoom = zoomScale.value;
    const size = scale.value * zoom;
    return { transform: [{ translateY: (1 - size) * (anchorY - frameHeight / 2) }, { scale: size }] };
  });
  function pressIn() { scale.value = withTiming(1.1, { duration: 90 }); }
  function pressOut() { scale.value = withTiming(1, { duration: 160 }); }
  return <Marker coordinate={person?.coordinate ?? zone.coordinate} centerOffset={{ x: 0, y: frameHeight / 2 - anchorY }} anchor={{ x: 0.5, y: anchorY / frameHeight }} stopPropagation>
    <Pressable accessible accessibilityLabel={person ? `${person.label}。長押しでメンション` : `電信ID ${zone.electricId}`} onPressIn={pressIn} onPressOut={pressOut} onLongPress={person ? () => onMention(person) : undefined} delayLongPress={500} style={{ width: 210, height: frameHeight }}>
      <Animated.View style={[styles.pin, { height: frameHeight }, animated]}>
        {person ? <><View style={styles.personBubble}>{!compact && <MapBubble><GradientText color={zone.color} style={styles.personText}>{person.label}</GradientText></MapBubble>}</View><View style={[styles.dot, { backgroundColor: zone.color }]} /></> : <>
          <View style={[styles.stickerBubble, compact && { bottom: 104 }]}><MapBubble><View>{!compact && <Text style={styles.label}>電信ID</Text>}<GradientText color={zone.color} style={styles.id}>{compact ? `…${zone.electricId.slice(-2)}` : zone.electricId}</GradientText></View><PeopleCount count={zone.headcount} color={zone.color} /></MapBubble></View>
          <Image source={zone.sticker} style={[styles.sticker, styles.stickerSize]} contentFit="contain" contentPosition="bottom" />
        </>}
      </Animated.View>
    </Pressable>
  </Marker>;
}
export const AreaMap = forwardRef<MapView, Props>(function AreaMap({ area, onReady, onMention, onMapPress, onMapLongPress, onMoving }, ref) {
  const zoomScale = useSharedValue(1);
  const [compact, setCompact] = useState(false);
  useEffect(() => setCompact(false), [area.id]);
  // ASSUMED: 約500m以上の表示範囲では人名を省き、電信IDは末尾だけにする。
  function updateDetail(region: Region) { setCompact(current => region.latitudeDelta > (current ? 0.004 : 0.005)); }
  function updateScale(region: Region, animated: boolean) {
    // 固定の表示範囲を基準にする。最初のイベント値は初期カメラ遷移で変わるため使わない。
    const span = Math.max(0.00001, region.latitudeDelta) / 0.002;
    const size = 0.1 + 1.15 / (1 + span);
    zoomScale.value = animated ? withTiming(size, { duration: 90 }) : size;
  }
  return <MapView ref={ref} onMapReady={onReady} onRegionChange={region => {
      onMoving(true);
      updateScale(region, true);
    }} onRegionChangeComplete={region => { updateScale(region, false); updateDetail(region); onMoving(false); }} onPress={onMapPress} onLongPress={onMapLongPress} style={StyleSheet.absoluteFill} initialCamera={{ center: area.center, pitch: 45, heading: -25, altitude: 650, zoom: 17 }} mapType="mutedStandard" userInterfaceStyle="light" showsPointsOfInterests={false} showsBuildings={false} showsCompass={false} showsScale={false} showsUserLocation={false}>
    {area.zones.map(zone => <Polygon key={zone.key} coordinates={zone.boundary} fillColor={`${zone.color}35`} strokeColor={zone.color} strokeWidth={1} />)}
    {area.zones.flatMap(zone => zone.people.map(person => <Pin key={person.id} person={person} zone={zone} compact={compact} zoomScale={zoomScale} onMention={onMention} />))}
    {area.zones.map(zone => <Pin key={zone.key} zone={zone} compact={compact} zoomScale={zoomScale} onMention={onMention} />)}
  </MapView>;
});
const styles = StyleSheet.create({
  pin: { width: 210, alignItems: 'center' }, personBubble: { position: 'absolute', bottom: 20 }, personText: { fontSize: 13 }, dot: { position: 'absolute', bottom: 3, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  stickerBubble: { position: 'absolute', bottom: 104 }, label: { color: '#888888', fontSize: 9 }, id: { fontSize: 16, fontWeight: '800', fontFamily: 'ui-rounded' }, sticker: { position: 'absolute', bottom: 0, width: 104, height: 104 }, stickerSize: { width: 104, height: 104 },
});
