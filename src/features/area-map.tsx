import { RoundedText as Text } from '@/components/rounded-text';
import { GradientText } from '@/components/gradient-text';
import { MapBubble } from '@/components/map-bubble';
import { PeopleCount } from '@/components/people-count';
import type { getMapArea } from '@/mocks/map-data';
import type { Coordinate } from '@/types';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, type LongPressEvent, type Region } from 'react-native-maps';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

// ピンのズーム曲線はここで調整（点・名前・ステッカー共通）。
const PIN_ZOOM_CURVE = {
  minScale: 0.58,       // 広域表示で近づく最小倍率
  maxScale: 1.8,        // 詳細表示で近づく最大倍率
  referenceSpan: 0.0015, // この緯度幅で最小・最大の中間倍率になる
  exponent: 0.8,       // 小さくするほど中間付近の変化が緩やか（正の値）
};

export type MapPerson = { id: string; label: string; coordinate: Coordinate };
type Props = { area: ReturnType<typeof getMapArea>; onReady: () => void; onMention: (person: MapPerson) => void; onMapPress: () => void; onMapLongPress: (event: LongPressEvent) => void; onMoving: (active: boolean) => void };
function Pin({ person, zone, compact, zoomScale, pitchScale, onMention, mapReady, appearanceDelay }: { mapReady: boolean; appearanceDelay: number; person?: MapPerson; zone: ReturnType<typeof getMapArea>['zones'][number]; compact: boolean; zoomScale: SharedValue<number>; pitchScale: SharedValue<number>; onMention: Props['onMention'] }) {
  const scale = useSharedValue(1);
  const appearance = useSharedValue(0);
  useEffect(() => {
    if (!mapReady) return;
    // ASSUMED: 地図の準備後、区域ごとに短い間隔で92%→100%のポップイン。
    appearance.value = withDelay(appearanceDelay, withTiming(1, { duration: 280 }));
    return () => cancelAnimation(appearance);
  }, [mapReady, appearanceDelay, appearance]);
  const isPerson = !!person;
  // 固定フレーム: 点の中心(y=100) / ステッカー下端(y=210)を地理座標に固定。
  const frameHeight = isPerson ? 110 : 210;
  const anchorY = isPerson ? 100 : 210;
  const animated = useAnimatedStyle(() => {
    const zoom = zoomScale.value;
    const size = scale.value * zoom * (0.92 + 0.08 * appearance.value);
    return { opacity: appearance.value, transform: [{ translateY: (1 - size) * (anchorY - frameHeight / 2) }, { scale: size }] };
  });
  const dotPerspective = useAnimatedStyle(() => ({ transform: [{ scaleY: pitchScale.value }] }));
  function pressIn() { scale.value = withTiming(1.1, { duration: 90 }); }
  function pressOut() { scale.value = withTiming(1, { duration: 160 }); }
  return <Marker coordinate={person?.coordinate ?? zone.coordinate} centerOffset={{ x: 0, y: frameHeight / 2 - anchorY }} anchor={{ x: 0.5, y: anchorY / frameHeight }} stopPropagation>
    <Pressable accessible accessibilityLabel={person ? `${person.label}。長押しでメンション` : `電信ID ${zone.electricId}`} onPressIn={pressIn} onPressOut={pressOut} onLongPress={person ? () => onMention(person) : undefined} delayLongPress={500} style={{ width: 210, height: frameHeight }}>
      <Animated.View style={[styles.pin, { height: frameHeight }, animated]}>
        {person ? <><View style={styles.personBubble}>{!compact && <MapBubble><GradientText color={zone.color} style={styles.personText}>{person.label}</GradientText></MapBubble>}</View><Animated.View style={[styles.dot, dotPerspective]}><View style={styles.dotRim}><LinearGradient colors={[zone.color, zone.color === '#168EFF' ? '#94C6FF' : zone.color === '#FF646D' ? '#FFADB4' : '#DC9BFF']} style={styles.dotFill} /></View></Animated.View></> : <>
          <View style={[styles.stickerBubble, compact && { bottom: 104 }]}><MapBubble><View>{!compact && <Text style={styles.label}>電信ID</Text>}<GradientText color={zone.color} style={styles.id}>{compact ? `…${zone.electricId.slice(-2)}` : zone.electricId}</GradientText></View><PeopleCount count={zone.headcount} color={zone.color} /></MapBubble></View>
          <Image source={zone.sticker} style={[styles.sticker, styles.stickerSize]} contentFit="contain" contentPosition="bottom" />
        </>}
      </Animated.View>
    </Pressable>
  </Marker>;
}
export const AreaMap = forwardRef<MapView, Props>(function AreaMap({ area, onReady, onMention, onMapPress, onMapLongPress, onMoving }, ref) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  useImperativeHandle(ref, () => mapRef.current!);
  const pitchScale = useSharedValue(Math.cos(Math.PI / 4));
  const cameraPending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function updatePitch() {
    if (cameraPending.current || !mapRef.current) return;
    cameraPending.current = true;
    try { const camera = await mapRef.current.getCamera(); if (mounted.current) pitchScale.value = withTiming(Math.max(0.4, Math.cos(camera.pitch * Math.PI / 180)), { duration: 100 }); }
    finally { cameraPending.current = false; }
  }
  const zoomScale = useSharedValue(1);
  const [compact, setCompact] = useState(false);
  useEffect(() => setCompact(false), [area.id]);
  // ASSUMED: 約500m以上の表示範囲では人名を省き、電信IDは末尾だけにする。
  function updateDetail(region: Region) { setCompact(current => region.latitudeDelta > (current ? 0.004 : 0.005)); }
  function updateScale(region: Region, animated: boolean) {
    // 固定の表示範囲を基準にする。最初のイベント値は初期カメラ遷移で変わるため使わない。
    const { minScale, maxScale, referenceSpan, exponent } = PIN_ZOOM_CURVE;
    const span = Math.max(0.00001, region.latitudeDelta) / referenceSpan;
    const size = minScale + (maxScale - minScale) / (1 + Math.pow(span, exponent));
    zoomScale.value = animated ? withTiming(size, { duration: 90 }) : size;
  }
  return <MapView ref={mapRef} onMapReady={() => { setMapReady(true); onReady(); }} onRegionChange={region => {
      onMoving(true);
      void updatePitch().catch(() => undefined);
      updateScale(region, true);
    }} onRegionChangeComplete={region => { updateScale(region, false); void updatePitch().catch(() => undefined); updateDetail(region); onMoving(false); }} onPress={onMapPress} onLongPress={onMapLongPress} style={StyleSheet.absoluteFill} initialCamera={{ center: area.center, pitch: 45, heading: -25, altitude: 650, zoom: 17 }} mapType="mutedStandard" userInterfaceStyle="light" showsPointsOfInterests={false} showsBuildings={false} showsCompass={false} showsScale={false} showsUserLocation={false}>
    {area.zones.map(zone => <Polygon key={zone.key} coordinates={zone.boundary} fillColor={`${zone.color}35`} strokeColor={zone.color} strokeWidth={1} />)}
    {area.zones.flatMap((zone, zoneIndex) => zone.people.map((person, personIndex) => <Pin mapReady={mapReady} appearanceDelay={100 + zoneIndex * 90 + personIndex * 18} key={person.id} person={person} zone={zone} compact={compact} zoomScale={zoomScale} pitchScale={pitchScale} onMention={onMention} />))}
    {area.zones.map((zone, zoneIndex) => <Pin mapReady={mapReady} appearanceDelay={80 + zoneIndex * 90} key={zone.key} zone={zone} compact={compact} zoomScale={zoomScale} pitchScale={pitchScale} onMention={onMention} />)}
  </MapView>;
});
const styles = StyleSheet.create({
  pin: { width: 210, alignItems: 'center' }, personBubble: { position: 'absolute', bottom: 20 }, personText: { fontSize: 13 }, dot: { position: 'absolute', bottom: -1, width: 22, height: 22, borderRadius: 11, backgroundColor: '#00000018', padding: 2 }, dotRim: { flex: 1, borderRadius: 9, backgroundColor: '#FFFFFF', padding: 3 }, dotFill: { flex: 1, borderRadius: 6 },
  stickerBubble: { position: 'absolute', bottom: 104 }, label: { color: '#888888', fontSize: 9 }, id: { fontSize: 16, fontWeight: '800', fontFamily: 'ui-rounded' }, sticker: { position: 'absolute', bottom: 0, width: 104, height: 104 }, stickerSize: { width: 104, height: 104 },
});
