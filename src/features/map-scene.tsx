import MaskedView from '@react-native-masked-view/masked-view';
import { AssetPlaceholder } from '@/components/asset-placeholder';
import { AreaMap, type MapPerson } from '@/features/area-map';
import { MapChat } from '@/features/map-chat';
import { useArea } from '@/hooks/useArea';
import { useChat } from '@/hooks/useChat';
import { useSession } from '@/hooks/useSession';
import { MOCK_LOCATION } from '@/mocks/map-data';
import type { AreaId, Coordinate } from '@/types';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { LongPressEvent } from 'react-native-maps';
import Animated, { FadeIn, FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

function GhostIcon() {
  return <Svg width={23} height={26} viewBox="0 0 24 28"><Path d="M3 24V12a9 9 0 0 1 18 0v12l-4-3-5 4-5-4z" fill="none" stroke="white" strokeWidth={2.2} strokeLinejoin="round" /><Circle cx={9} cy={11} r={1.3} fill="white" /><Circle cx={15} cy={11} r={1.3} fill="white" /></Svg>;
}
export function MapScene({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [areaId, setAreaId] = useState<AreaId>('kabukicho');
  const [draft, setDraft] = useState('');
  const [mention, setMention] = useState<MapPerson | null>(null);
  const inputRef = useRef<TextInput>(null);
  const area = useArea(areaId);
  const { messages, send } = useChat(areaId);
  const { status, ghost, setGhost, onlineSeconds, ghostSeconds } = useSession();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useSharedValue(0);
  const keyboardOpen = useSharedValue(0);
  const chatFocus = useSharedValue(0);
  const mapMoving = useSharedValue(0);
  useEffect(() => {
    const frame = Keyboard.addListener('keyboardWillChangeFrame', event => {
      const visible = Math.max(0, windowHeight - event.endCoordinates.screenY);
      keyboardHeight.value = withTiming(visible, { duration: event.duration || 250 });
      keyboardOpen.value = withTiming(visible > 0 ? 1 : 0, { duration: event.duration || 250 });
    });
    return () => frame.remove();
  }, [windowHeight, keyboardHeight, keyboardOpen]);
  const bottomStyle = useAnimatedStyle(() => ({ bottom: keyboardHeight.value, paddingHorizontal: interpolate(keyboardOpen.value, [0, 1], [27, 12]), paddingBottom: interpolate(keyboardOpen.value, [0, 1], [Math.max(8, insets.bottom - 4), 8]) }));
  const restingBlur = useAnimatedStyle(() => ({ opacity: (1 - mapMoving.value) * (1 - chatFocus.value) }));
  const focusStyle = useAnimatedStyle(() => ({ opacity: chatFocus.value }));
  const mutedStyle = useAnimatedStyle(() => ({ opacity: 1 - chatFocus.value * 0.85 }));
  const chatOpacity = useAnimatedStyle(() => ({ opacity: interpolate(chatFocus.value, [0, 1], [interpolate(mapMoving.value, [0, 1], [0.78, 0.22]), 1]) }));
  function setChatScrolling(active: boolean) { chatFocus.value = withTiming(active ? 1 : 0, { duration: 180 }); }
  function setMapMoving(active: boolean) { mapMoving.value = withTiming(active ? 1 : 0, { duration: 150 }); }
  const map = useRef<MapView>(null);
  const currentArea = useRef(areaId);
  currentArea.current = areaId;
  async function mapLongPress(event: LongPressEvent) {
    const position = event.nativeEvent.position;
    const requestedArea = areaId;
    const nativeMap = map.current;
    if (!nativeMap) return;
    // MapKitの長押しでも点の画面位置で判定。離れた場所はメンション対象にしない。
    const candidates = await Promise.all(area.zones.flatMap(zone => zone.people).map(async person => {
      try { const point = await nativeMap.pointForCoordinate(person.coordinate); return { person, distance: Math.hypot(point.x - position.x, point.y - position.y) }; }
      catch { return { person, distance: Infinity }; }
    }));
    const nearest = candidates.sort((a, b) => a.distance - b.distance)[0];
    if (currentArea.current === requestedArea && nearest?.distance < 28) offerMention(nearest.person);
  }
  function offerMention(person: MapPerson) {
    setMention(person);
    map.current?.animateCamera({ center: person.coordinate, altitude: 90, zoom: 20, pitch: 45 }, { duration: 850 });
  }
  function insertMention() {
    if (!mention) return;
    setDraft(current => `@${mention.label} ${current}`);
    setMention(null);
    inputRef.current?.focus();
  }
  function move(center: Coordinate) {
    map.current?.animateCamera({ center, pitch: 45, heading: -25, altitude: 650 }, { duration: 650 });
  }
  function submit() { if (!draft.trim()) return; send(draft); setDraft(''); }
  const elapsedSeconds = ghost ? ghostSeconds : onlineSeconds;
  const elapsed = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
  return <View style={styles.scene}>
    <AreaMap ref={map} area={area} onMoving={setMapMoving} onMention={offerMention} onMapLongPress={mapLongPress} onMapPress={() => { setMention(null); Keyboard.dismiss(); }} onReady={() => { map.current?.setNativeProps({ showsBuildings: false }); }} />
    <Animated.View pointerEvents="none" style={[styles.readingBlur, { height: windowHeight * 0.45 + 100 }, restingBlur]}>
      <MaskedView style={StyleSheet.absoluteFill} maskElement={<LinearGradient colors={['transparent', '#000000']} locations={[0, 1]} style={StyleSheet.absoluteFill} />}><BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} /></MaskedView>
    </Animated.View>
    <LinearGradient pointerEvents="none" colors={['#EEEFE9', '#EEEFE9F0', '#EEEFE900']} locations={[0, 0.58, 1]} style={[styles.topVeil, { height: insets.top + 160 }]} />
    <Animated.View entering={FadeIn.duration(450)} style={[styles.header, { top: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="スキャナーに戻る" onPress={onBack} style={styles.headerButton}><SymbolView name="chevron.left" tintColor="#555753" size={26} weight="medium" /></Pressable>
      <View style={styles.areaPill}><Text style={styles.areaTitle}>{area.name}</Text><SymbolView name="person.fill" size={16} tintColor="#111111" /><Text style={styles.areaCount}>{area.headcount}</Text></View>
      <View style={styles.headerButton}><AssetPlaceholder style={styles.exitPlaceholder} /></View>
    </Animated.View>
    {status === 'success' && <Animated.View pointerEvents="none" style={[styles.statusLine, { top: insets.top + 70 }, mutedStyle]}><Text style={styles.onlineText}>{ghost ? 'ゴースト' : 'オンライン'} {elapsed}</Text></Animated.View>}
    <Pressable accessibilityRole="button" accessibilityLabel="現在地に戻る（モック）" onPress={() => { setAreaId('kabukicho'); move(MOCK_LOCATION); }} style={[styles.locationButton, { position: 'absolute', right: 20, top: insets.top + 64 }]}><SymbolView name="location.fill" size={23} tintColor="#101010" /></Pressable>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, focusStyle]}><BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} /></Animated.View>
    <Animated.View pointerEvents="box-none" style={[styles.bottom, bottomStyle]}>
      <Animated.View pointerEvents="box-none" entering={FadeIn.delay(250).duration(500)} style={[styles.chat, { height: windowHeight * 0.45 }, chatOpacity]}><MapChat key={areaId} messages={messages} onScrolling={setChatScrolling} /></Animated.View>
      {mention && <View style={styles.mentionPrompt}><Text style={styles.mentionText}>このユーザーにメンション付きでチャットしますか？</Text><Pressable accessibilityRole="button" onPress={insertMention} style={styles.mentionButton}><Text style={styles.mentionButtonText}>@付きチャット</Text></Pressable></View>}
      <Animated.View entering={FadeInDown.delay(180).duration(400)} style={[styles.composer, mutedStyle]}>
        <TextInput ref={inputRef} accessibilityLabel="チャットメッセージ" placeholder="入力…" placeholderTextColor="#A5A5A5" value={draft} onChangeText={setDraft} onSubmitEditing={submit} returnKeyType="send" blurOnSubmit={false} style={styles.input} />
        {status === 'success' && <Pressable accessibilityRole="switch" accessibilityLabel="ゴーストモード" accessibilityState={{ checked: ghost }} onPress={() => setGhost(!ghost)} style={[styles.ghostButton, ghost && styles.ghostEnabled]}><GhostIcon /></Pressable>}
      </Animated.View>
    </Animated.View>
  </View>;
}
// ASSUMED: 画像からの寸法近似。ネイティブ地図の道路・文字はApple Mapsの表示に従う。
const styles = StyleSheet.create({
  mentionPrompt: { backgroundColor: '#FFFFFFEE', borderRadius: 32, borderCurve: 'continuous', padding: 14, marginBottom: 10, gap: 12, flexDirection: 'row', alignItems: 'center' }, mentionText: { flex: 1, color: '#888888', fontSize: 12, lineHeight: 19 }, mentionButton: { backgroundColor: '#168EFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderCurve: 'continuous', alignItems: 'center' }, mentionButtonText: { color: '#FFFFFF', fontWeight: '700' },
  areaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 25, borderCurve: 'continuous', paddingHorizontal: 19, height: 46 }, areaTitle: { fontSize: 17, color: '#111111', fontWeight: '700', marginRight: 3 }, areaCount: { fontSize: 16, color: '#111111' }, statusLine: { position: 'absolute', left: 70, right: 70, alignItems: 'center' },
  readingBlur: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  scene: { flex: 1, backgroundColor: '#E9EAE5' }, topVeil: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { position: 'absolute', left: 16, right: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, brand: { alignItems: 'center' }, wordmark: { width: 128, height: 40, borderRadius: 4, borderCurve: 'continuous' }, exitPlaceholder: { width: 33, height: 33, borderRadius: 3, borderCurve: 'continuous' }, brandText: { color: '#000000', fontSize: 16, fontWeight: '900', marginTop: -3 },
  areaRow: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 6, height: 46 }, areaScroll: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 25, borderCurve: 'continuous' }, areaTabs: { padding: 5, gap: 3 }, areaTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4, borderRadius: 22, borderCurve: 'continuous' }, activeArea: { backgroundColor: '#008FFF' }, areaName: { color: '#777777', fontSize: 16, fontWeight: '600', marginRight: 3 }, count: { color: '#777777', fontSize: 15 }, activeText: { color: '#FFFFFF' }, locationButton: { width: 46, height: 46, backgroundColor: '#FFFFFF', borderRadius: 23, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  keyboard: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' }, bottom: { position: 'absolute', left: 0, right: 0 }, chat: { height: 260, marginBottom: 4 }, onlineBubble: { alignSelf: 'flex-end', marginBottom: 0, marginRight: 2 }, onlinePill: { borderRadius: 24, borderCurve: 'continuous', backgroundColor: '#E3F4EA', paddingLeft: 8, paddingRight: 4, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }, onlineDot: { width: 7, height: 7, borderRadius: 4, borderCurve: 'continuous', backgroundColor: '#25B278' }, onlineText: { color: '#25B278', fontSize: 15, fontWeight: '500' }, onlineTail: { alignSelf: 'flex-end', marginRight: 20, width: 0, height: 0, borderLeftWidth: 12, borderTopWidth: 12, borderLeftColor: 'transparent', borderTopColor: '#FFFFFF' }, composer: { shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, backgroundColor: '#FFFFFF', borderRadius: 34, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', padding: 9, gap: 9 }, input: { flex: 1, height: 40, backgroundColor: '#F4F4F4', borderRadius: 24, borderCurve: 'continuous', paddingHorizontal: 16, color: '#555555', fontSize: 16 }, ghostButton: { width: 40, height: 40, borderRadius: 20, borderCurve: 'continuous', backgroundColor: '#008FFF', alignItems: 'center', justifyContent: 'center' }, ghostEnabled: { backgroundColor: '#7E83A3' },
});
