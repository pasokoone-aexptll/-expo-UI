import { AreaMap } from '@/features/area-map';
import { MapChat } from '@/features/map-chat';
import { useArea } from '@/hooks/useArea';
import { useChat } from '@/hooks/useChat';
import { useSession } from '@/hooks/useSession';
import { MAP_AREAS, MOCK_LOCATION } from '@/mocks/map-data';
import type { AreaId, Coordinate } from '@/types';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type MapView from 'react-native-maps';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

function GhostIcon() {
  return <Svg width={23} height={26} viewBox="0 0 24 28"><Path d="M3 24V12a9 9 0 0 1 18 0v12l-4-3-5 4-5-4z" fill="none" stroke="white" strokeWidth={2.2} strokeLinejoin="round" /><Circle cx={9} cy={11} r={1.3} fill="white" /><Circle cx={15} cy={11} r={1.3} fill="white" /></Svg>;
}
export function MapScene({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [areaId, setAreaId] = useState<AreaId>('kabukicho');
  const [draft, setDraft] = useState('');
  const area = useArea(areaId);
  const { messages, send } = useChat(areaId);
  const { ghost, setGhost, onlineSeconds } = useSession();
  const map = useRef<MapView>(null);
  function move(center: Coordinate) {
    map.current?.animateCamera({ center, pitch: 45, heading: -25, altitude: 650 }, { duration: 650 });
  }
  function selectArea(id: AreaId) {
    setAreaId(id);
    move(MAP_AREAS.find(item => item.id === id)!.center);
  }
  function submit() { if (!draft.trim()) return; send(draft); setDraft(''); }
  const elapsed = `${String(Math.floor(onlineSeconds / 60)).padStart(2, '0')}:${String(onlineSeconds % 60).padStart(2, '0')}`;
  return <View style={styles.scene}>
    <AreaMap ref={map} area={area} />
    <LinearGradient pointerEvents="none" colors={['#EEEFE9', '#EEEFE9F0', '#EEEFE900']} locations={[0, 0.58, 1]} style={[styles.topVeil, { height: insets.top + 160 }]} />
    <Animated.View entering={FadeIn.duration(450)} style={[styles.header, { top: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="スキャナーに戻る" onPress={onBack} style={styles.headerButton}><SymbolView name="chevron.left" tintColor="#555753" size={26} weight="medium" /></Pressable>
      <View style={styles.brand}><Image source={require('@/assets/images/map/wordmark.svg')} contentFit="contain" style={styles.wordmark} /><Text style={styles.brandText}>DreamCloud</Text></View>
      <Pressable accessibilityRole="switch" accessibilityLabel="ゴーストモード" accessibilityState={{ checked: ghost }} onPress={() => setGhost(!ghost)} style={styles.headerButton}><SymbolView name="figure.walk.departure" tintColor={ghost ? '#A1A49E' : '#00B77A'} size={33} /></Pressable>
    </Animated.View>
    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.areaRow, { top: insets.top + 67 }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaScroll} contentContainerStyle={styles.areaTabs}>
        {MAP_AREAS.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: areaId === item.id }} onPress={() => selectArea(item.id)} style={[styles.areaTab, areaId === item.id && styles.activeArea]}>
          <Text style={[styles.areaName, areaId === item.id && styles.activeText]}>{item.name}</Text><SymbolView name="person.fill" size={14} tintColor={areaId === item.id ? '#FFFFFF' : '#777777'} /><Text style={[styles.count, areaId === item.id && styles.activeText]}>{item.headcount}</Text>
        </Pressable>)}
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="現在地に戻る（モック）" onPress={() => { setAreaId('kabukicho'); move(MOCK_LOCATION); }} style={styles.locationButton}><SymbolView name="location.fill" size={23} tintColor="#101010" /></Pressable>
    </Animated.View>
    <KeyboardAvoidingView pointerEvents="box-none" behavior="padding" style={styles.keyboard}>
      <View pointerEvents="box-none" style={[styles.bottom, { paddingBottom: insets.bottom - 4}]}>
        <Animated.View entering={FadeIn.delay(250).duration(500)} style={styles.chat}><MapChat key={areaId} messages={messages} /></Animated.View>
        <View pointerEvents="none" style={styles.onlineBubble}><View style={styles.onlinePill}><View style={styles.onlineDot} /><Text style={styles.onlineText}>オンライン {elapsed}</Text></View><View style={styles.onlineTail} /></View>
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.composer}>
          <TextInput accessibilityLabel="チャットメッセージ" placeholder="入力…" placeholderTextColor="#A5A5A5" value={draft} onChangeText={setDraft} onSubmitEditing={submit} returnKeyType="send" blurOnSubmit={false} style={styles.input} />
          <Pressable accessibilityRole="switch" accessibilityLabel="ゴーストモード" accessibilityState={{ checked: ghost }} onPress={() => setGhost(!ghost)} style={[styles.ghostButton, ghost && styles.ghostEnabled]}><GhostIcon /></Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  </View>;
}
// ASSUMED: 画像からの寸法近似。ネイティブ地図の道路・文字はApple Mapsの表示に従う。
const styles = StyleSheet.create({
  scene: { flex: 1, backgroundColor: '#E9EAE5' }, topVeil: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { position: 'absolute', left: 16, right: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, brand: { alignItems: 'center' }, wordmark: { width: 128, height: 32 }, brandText: { color: '#000000', fontSize: 16, fontWeight: '900', marginTop: -3 },
  areaRow: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 6, height: 46 }, areaScroll: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 25 }, areaTabs: { padding: 5, gap: 3 }, areaTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4, borderRadius: 22 }, activeArea: { backgroundColor: '#008FFF' }, areaName: { color: '#777777', fontSize: 16, fontWeight: '600', marginRight: 3 }, count: { color: '#777777', fontSize: 15 }, activeText: { color: '#FFFFFF' }, locationButton: { width: 46, height: 46, backgroundColor: '#FFFFFF', borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  keyboard: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' }, bottom: { paddingHorizontal: 24 }, chat: { height: 260, marginBottom: 4 }, onlineBubble: { alignSelf: 'flex-end', marginBottom: 0, marginRight: 2 }, onlinePill: { borderRadius: 24, borderWidth: 5, borderColor: '#FFFFFF', backgroundColor: '#E3F4EA', paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#25B278' }, onlineText: { color: '#25B278', fontSize: 15, fontWeight: '500' }, onlineTail: { alignSelf: 'flex-end', marginRight: 20, width: 0, height: 0, borderLeftWidth: 12, borderTopWidth: 12, borderLeftColor: 'transparent', borderTopColor: '#FFFFFF' }, composer: { backgroundColor: '#FFFFFF', borderRadius: 34, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', padding: 9, gap: 9 }, input: { flex: 1, height: 40, backgroundColor: '#F4F4F4', borderRadius: 24, paddingHorizontal: 16, color: '#555555', fontSize: 16 }, ghostButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#008FFF', alignItems: 'center', justifyContent: 'center' }, ghostEnabled: { backgroundColor: '#7E83A3' },
});
