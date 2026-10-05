import { AreaMap, type MapPerson } from '@/features/area-map';
import { MapChat, type MapChatHandle } from '@/features/map-chat';
import { useArea } from '@/hooks/useArea';
import { useChat } from '@/hooks/useChat';
import { useSession } from '@/hooks/useSession';
import { MAP_AREAS, MOCK_LOCATION } from '@/mocks/map-data';
import type { AreaId, Coordinate } from '@/types';
import { AssetPlaceholder } from '@/components/asset-placeholder';
import { BlurView } from 'expo-blur';
import { MapBubble } from '@/components/map-bubble';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { LongPressEvent } from 'react-native-maps';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
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
  const chatBounds = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const touchStart = useSharedValue({ x: 0, y: 0 });
  const chatRef = useRef<MapChatHandle>(null);
  const chatView = useRef<View>(null);
  function measureChat() { chatView.current?.measureInWindow((x, y, width, height) => { chatBounds.value = { x, y, width, height }; }); }
  useEffect(() => {
    const frame = Keyboard.addListener('keyboardWillChangeFrame', event => {
      const visible = Math.max(0, windowHeight - event.endCoordinates.screenY);
      keyboardHeight.value = withTiming(visible, { duration: event.duration || 250 });
      keyboardOpen.value = withTiming(visible > 0 ? 1 : 0, { duration: event.duration || 250 });
    });
    const show = Keyboard.addListener('keyboardDidShow', measureChat);
    const hide = Keyboard.addListener('keyboardDidHide', measureChat);
    return () => { frame.remove(); show.remove(); hide.remove(); };
  }, [windowHeight, keyboardHeight, keyboardOpen, chatBounds]);
  const bottomStyle = useAnimatedStyle(() => ({ bottom: keyboardHeight.value, paddingHorizontal: interpolate(keyboardOpen.value, [0, 1], [27, 12]), paddingBottom: interpolate(keyboardOpen.value, [0, 1], [Math.max(8, insets.bottom - 4), 8]) }));
  const focusStyle = useAnimatedStyle(() => ({ opacity: chatFocus.value }));
  const mutedStyle = useAnimatedStyle(() => ({ opacity: 1 - chatFocus.value * 0.85 }));
  function dragChat(dy: number) { chatRef.current?.drag(dy); }
  const chatGesture = Gesture.Pan().manualActivation(true)
    .onTouchesDown((event, manager) => {
      const touch = event.allTouches[0]; const bounds = chatBounds.value;
      if (!touch || event.numberOfTouches !== 1 || touch.absoluteX < bounds.x || touch.absoluteX > bounds.x + bounds.width || touch.absoluteY < bounds.y || touch.absoluteY > bounds.y + bounds.height) { manager.fail(); return; }
      touchStart.value = { x: touch.absoluteX, y: touch.absoluteY };
    })
    .onTouchesMove((event, manager) => {
      const touch = event.allTouches[0]; if (!touch || event.numberOfTouches !== 1) { manager.fail(); return; }
      const dx = Math.abs(touch.absoluteX - touchStart.value.x), dy = Math.abs(touch.absoluteY - touchStart.value.y);
      if (dx > 10 && dx > dy) manager.fail();
      else if (dy > 10 && dy > dx) manager.activate();
    })
    .onStart(() => { chatFocus.value = withTiming(1, { duration: 180 }); })
    .onChange(event => { scheduleOnRN(dragChat, event.changeY); })
    .onTouchesUp((_event, manager) => { manager.end(); })
    .onFinalize(() => { chatFocus.value = withTiming(0, { duration: 350 }); });
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
  function selectArea(id: AreaId) {
    setMention(null);
    setAreaId(id);
    move(MAP_AREAS.find(item => item.id === id)!.center);
  }
  function submit() { if (!draft.trim()) return; send(draft); setDraft(''); }
  const elapsedSeconds = ghost ? ghostSeconds : onlineSeconds;
  const elapsed = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
  return <GestureDetector gesture={chatGesture}><View style={styles.scene}>
    <AreaMap ref={map} area={area} onMention={offerMention} onMapLongPress={mapLongPress} onMapPress={() => { setMention(null); Keyboard.dismiss(); }} onReady={() => { map.current?.setNativeProps({ showsBuildings: false }); }} />
    <LinearGradient pointerEvents="none" colors={['#EEEFE9', '#EEEFE9F0', '#EEEFE900']} locations={[0, 0.58, 1]} style={[styles.topVeil, { height: insets.top + 160 }]} />
    <Animated.View entering={FadeIn.duration(450)} style={[styles.header, { top: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="スキャナーに戻る" onPress={onBack} style={styles.headerButton}><SymbolView name="chevron.left" tintColor="#555753" size={26} weight="medium" /></Pressable>
      <AssetPlaceholder style={styles.wordmark} />
      <View style={styles.headerButton}><AssetPlaceholder style={styles.exitPlaceholder} /></View>
    </Animated.View>
    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.areaRow, { top: insets.top + 67 }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaScroll} contentContainerStyle={styles.areaTabs}>
        {MAP_AREAS.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: areaId === item.id }} onPress={() => selectArea(item.id)} style={[styles.areaTab, areaId === item.id && styles.activeArea]}>
          <Text style={[styles.areaName, areaId === item.id && styles.activeText]}>{item.name}</Text><SymbolView name="person.fill" size={14} tintColor={areaId === item.id ? '#FFFFFF' : '#777777'} /><Text style={[styles.count, areaId === item.id && styles.activeText]}>{item.headcount}</Text>
        </Pressable>)}
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="現在地に戻る（モック）" onPress={() => { setAreaId('kabukicho'); move(MOCK_LOCATION); }} style={styles.locationButton}><SymbolView name="location.fill" size={23} tintColor="#101010" /></Pressable>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, focusStyle]}><BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} /></Animated.View>
      <Animated.View pointerEvents="box-none" style={[styles.bottom, bottomStyle]}>
        <Animated.View ref={chatView} onLayout={measureChat} pointerEvents="none" entering={FadeIn.delay(250).duration(500)} style={styles.chat}><MapChat ref={chatRef} key={areaId} messages={messages} /></Animated.View>
        {status === 'success' && <Animated.View pointerEvents="none" style={[styles.onlineBubble, mutedStyle]}><MapBubble><View style={styles.onlinePill}><View style={styles.onlineDot} /><Text style={styles.onlineText}>{ghost ? 'ゴースト' : 'オンライン'} {elapsed}</Text></View></MapBubble></Animated.View>}
        {mention && <View style={styles.mentionPrompt}><Text style={styles.mentionText}>このユーザーにメンション付きでチャットしますか？</Text><Pressable accessibilityRole="button" onPress={insertMention} style={styles.mentionButton}><Text style={styles.mentionButtonText}>@付きチャット</Text></Pressable></View>}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={[styles.composer, mutedStyle]}>
          <TextInput ref={inputRef} accessibilityLabel="チャットメッセージ" placeholder="入力…" placeholderTextColor="#A5A5A5" value={draft} onChangeText={setDraft} onSubmitEditing={submit} returnKeyType="send" blurOnSubmit={false} style={styles.input} />
          {status === 'success' && <Pressable accessibilityRole="switch" accessibilityLabel="ゴーストモード" accessibilityState={{ checked: ghost }} onPress={() => setGhost(!ghost)} style={[styles.ghostButton, ghost && styles.ghostEnabled]}><GhostIcon /></Pressable>}
        </Animated.View>
      </Animated.View>
  </View></GestureDetector>;
}
// ASSUMED: 画像からの寸法近似。ネイティブ地図の道路・文字はApple Mapsの表示に従う。
const styles = StyleSheet.create({
  mentionPrompt: { backgroundColor: '#FFFFFFEE', borderRadius: 22, padding: 16, marginBottom: 8, gap: 12 }, mentionText: { color: '#222222', fontSize: 16 }, mentionButton: { backgroundColor: '#168EFF', padding: 12, borderRadius: 18, alignItems: 'center' }, mentionButtonText: { color: '#FFFFFF', fontWeight: '700' },
  scene: { flex: 1, backgroundColor: '#E9EAE5' }, topVeil: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { position: 'absolute', left: 16, right: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, brand: { alignItems: 'center' }, wordmark: { width: 128, height: 40, borderRadius: 4 }, exitPlaceholder: { width: 33, height: 33, borderRadius: 3 }, brandText: { color: '#000000', fontSize: 16, fontWeight: '900', marginTop: -3 },
  areaRow: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 6, height: 46 }, areaScroll: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 25 }, areaTabs: { padding: 5, gap: 3 }, areaTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4, borderRadius: 22 }, activeArea: { backgroundColor: '#008FFF' }, areaName: { color: '#777777', fontSize: 16, fontWeight: '600', marginRight: 3 }, count: { color: '#777777', fontSize: 15 }, activeText: { color: '#FFFFFF' }, locationButton: { width: 46, height: 46, backgroundColor: '#FFFFFF', borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  keyboard: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' }, bottom: { position: 'absolute', left: 0, right: 0 }, chat: { height: 260, marginBottom: 4 }, onlineBubble: { alignSelf: 'flex-end', marginBottom: 0, marginRight: 2 }, onlinePill: { borderRadius: 24, backgroundColor: '#E3F4EA', paddingLeft: 8, paddingRight: 4, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#25B278' }, onlineText: { color: '#25B278', fontSize: 15, fontWeight: '500' }, onlineTail: { alignSelf: 'flex-end', marginRight: 20, width: 0, height: 0, borderLeftWidth: 12, borderTopWidth: 12, borderLeftColor: 'transparent', borderTopColor: '#FFFFFF' }, composer: { shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, backgroundColor: '#FFFFFF', borderRadius: 34, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', padding: 9, gap: 9 }, input: { flex: 1, height: 40, backgroundColor: '#F4F4F4', borderRadius: 24, paddingHorizontal: 16, color: '#555555', fontSize: 16 }, ghostButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#008FFF', alignItems: 'center', justifyContent: 'center' }, ghostEnabled: { backgroundColor: '#7E83A3' },
});
