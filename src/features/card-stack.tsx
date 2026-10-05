import * as SplashScreen from 'expo-splash-screen';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, clamp, Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ProfileCard } from '@/features/profile-card';
import { ScannerCard } from '@/features/scanner-card';
import { useScan } from '@/hooks/useScan';
import { useSession } from '@/hooks/useSession';
import { readLastCard, writeLastCard } from '@/storage/card-preference';
import { colors } from '@/theme';
import type { CardId } from '@/types';

export function CardStack({ expansion, resetKey, onScanComplete }: { expansion: SharedValue<number>; resetKey: number; onScanComplete: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { status, profile, onlineSeconds, ghostSeconds, ghost, setGhost } = useSession();
  const { status: scanStatus, found, ready: scanReady, start, reset } = useScan();
  // タブと同じ並び: 左がスキャナー、右がログイン。
  const page = useSharedValue(1);
  const dragStart = useSharedValue(1);
  const [selected, setSelected] = useState<CardId>('profile');
  const [ready, setReady] = useState(false);
  const [profileAnimating, setProfileAnimating] = useState(false);
  const generation = useRef(0);
  const scanGrowth = useSharedValue(0);
  const busy = scanStatus !== 'idle';
  useEffect(() => {
    scanGrowth.value = withTiming(busy ? 1 : 0, { duration: 700, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(scanGrowth);
  }, [busy, scanGrowth]);
  const locked = !ready || profileAnimating || status === 'detecting' || busy;
  const cancelScan = useCallback(() => {
    generation.current += 1;
    cancelAnimation(expansion);
    expansion.value = 0;
    reset();
  }, [expansion, reset]);
  useEffect(() => { cancelScan(); }, [resetKey, cancelScan]);
  useEffect(() => {
    if (scanStatus !== 'done') return;
    const currentGeneration = generation.current;
    const finish = () => {
      if (currentGeneration === generation.current) onScanComplete();
    };
    // ASSUMED: 発見情報が消えてから1.8秒で全面へ拡大する。
    expansion.value = withDelay(1450, withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }, finished => {
      if (finished) scheduleOnRN(finish);
    }));
    return () => cancelAnimation(expansion);
  }, [scanStatus, expansion, onScanComplete]);
  useEffect(() => {
    let mounted = true;
    void readLastCard().catch(() => null).then(saved => {
      if (!mounted) return;
      const card = saved ?? 'profile';
      page.value = card === 'scanner' ? 0 : 1;
      setSelected(card);
      setReady(true);
      void SplashScreen.hideAsync().catch(() => undefined);
    });
    return () => { mounted = false; generation.current += 1; };
  }, [page]);
  const saveSelection = useCallback((next: number) => {
    const card = next === 0 ? 'scanner' : 'profile';
    setSelected(card);
    void writeLastCard(card).catch(() => undefined);
  }, []);
  function selectTab(next: number) {
    if (locked) return;
    page.value = withTiming(next, { duration: 320, easing: Easing.out(Easing.cubic) });
    saveSelection(next);
  }
  const pan = Gesture.Pan().enabled(!locked)
    .activeOffsetX([-10, 10]).failOffsetY([-18, 18])
    .onStart(() => { cancelAnimation(page); dragStart.value = page.value; })
    .onUpdate(event => { page.value = clamp(dragStart.value - event.translationX / width, 0, 1); })
    .onEnd(event => {
      const next = event.velocityX < -500 ? 1 : event.velocityX > 500 ? 0 : page.value >= 0.5 ? 1 : 0;
      page.value = withTiming(next, { duration: 280, easing: Easing.out(Easing.cubic) });
      scheduleOnRN(saveSelection, next);
    })
    .onFinalize((_event, success) => {
      if (!success) {
        const next = page.value >= 0.5 ? 1 : 0;
        page.value = withTiming(next, { duration: 280 });
        scheduleOnRN(saveSelection, next);
      }
    });

  // ASSUMED: ヘッダー・タブ・開発用ボタンの領域を避け、隣のカードは完全に画面外へ置く。
  const contentTop = insets.top + (__DEV__ ? 100 : 76);
  const contentBottom = height - insets.bottom - 90;
  const availableHeight = Math.max(260, contentBottom - contentTop);
  const cardWidth = Math.min(width * 0.88, availableHeight / 1.12);
  const profileHeight = Math.min(cardWidth * 1.12, availableHeight - 64);
  const scannerIdleHeight = Math.min(profileHeight * 1.15, availableHeight);
  const scannerIdleTop = contentTop + (availableHeight - scannerIdleHeight - 64) / 2;
  const scannerHeight = Math.min(height * 0.66, availableHeight);
  const scannerTop = contentTop + (availableHeight - scannerHeight) / 2;
  const profileTop = contentTop + (availableHeight - profileHeight - 64) / 2;
  const scannerStyle = useAnimatedStyle(() => ({
    left: interpolate(expansion.value, [0, 1], [(width - cardWidth) / 2, 0]),
    top: interpolate(expansion.value, [0, 0.62, 1], [interpolate(scanGrowth.value, [0, 1], [Math.max(contentTop, scannerIdleTop), scannerTop]), height * 0.05, 0]),
    // scaleを減らさない: 横幅は開始時から単調に増える。
    width: interpolate(expansion.value, [0, 1], [cardWidth, width]),
    height: interpolate(expansion.value, [0, 0.62, 1], [interpolate(scanGrowth.value, [0, 1], [scannerIdleHeight, scannerHeight]), height * 0.90, height]),
    borderRadius: interpolate(expansion.value, [0, 0.62, 1], [42, 42, Math.max(42, width * 0.15)]),
    transform: [{ translateX: -page.value * width }, { perspective: 900 }, { rotateY: `${page.value * 55}deg` }],
  }));
  const profileStyle = useAnimatedStyle(() => ({
    opacity: 1 - expansion.value,
    transform: [{ translateX: (1 - page.value) * width }, { perspective: 900 }, { rotateY: `${(page.value - 1) * 55}deg` }],
  }));
  const tabWidth = Math.min(240, width * 0.56);
  const tabItemWidth = (tabWidth - 8) / 2;
  const glassAvailable = isLiquidGlassAvailable();
  const tabStyle = useAnimatedStyle(() => ({ opacity: Math.max(0.01, 1 - expansion.value) }));
  const selectionStyle = useAnimatedStyle(() => ({ transform: [{ translateX: page.value * tabItemWidth }] }));
  return (
    <View pointerEvents="box-none" style={styles.stage}>
      <GestureDetector gesture={pan}>
        <View pointerEvents="box-none" style={[styles.stage, styles.cardLayer]}>
          <Animated.View pointerEvents={selected === 'profile' ? 'auto' : 'none'} style={[styles.profile, { left: (width - cardWidth) / 2, top: profileTop }, profileStyle]}>
            <ProfileCard cardWidth={cardWidth} cardHeight={profileHeight} status={status} profile={profile} onlineSeconds={ghost ? ghostSeconds : onlineSeconds} ghost={ghost} setGhost={setGhost} onAnimationLockChange={setProfileAnimating} />
          </Animated.View>
          <Animated.View pointerEvents={selected === 'scanner' ? 'auto' : 'none'} style={[styles.scanner, scannerStyle]}>
            <ScannerCard width={cardWidth} height={scannerHeight} idleHeight={scannerIdleHeight} electricId={profile?.electricId ?? ''} sessionStatus={status} isMain={selected === 'scanner'} expansion={expansion} scanStatus={scanStatus} found={found} ready={scanReady} start={scanReady ? onScanComplete : start} cancel={cancelScan} />
          </Animated.View>
        </View>
      </GestureDetector>
      <Animated.View pointerEvents={busy ? 'none' : 'auto'} style={[styles.tabs, { bottom: insets.bottom + 8, width: tabWidth, left: (width - tabWidth) / 2, backgroundColor: glassAvailable ? 'transparent' : '#FFFFFF' }, tabStyle]}>
        {glassAvailable && <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />}
        <Animated.View pointerEvents="none" style={[styles.selection, { width: tabItemWidth }, selectionStyle]}><LinearGradient colors={['#2E7CFF', '#AECBFF']} style={StyleSheet.absoluteFill} /></Animated.View>
        {([{ card: 'scanner', label: 'スキャナー' }, { card: 'profile', label: 'ログイン' }] as const).map((tab, index) => (
          <Pressable key={tab.card} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.card, disabled: locked }} disabled={locked} onPress={() => selectTab(index)} style={styles.tab}>
            <Text style={[styles.tabText, selected === tab.card && styles.selectedText]}>{tab.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden' },
  cardLayer: { zIndex: 2 },
  profile: { position: 'absolute' },
  scanner: { position: 'absolute', zIndex: 2, overflow: 'hidden', backgroundColor: colors.scanner, borderCurve: 'continuous' },
  tabs: { position: 'absolute', zIndex: 1, height: 46, flexDirection: 'row', borderRadius: 23, borderCurve: 'continuous', overflow: 'hidden', padding: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 27, borderCurve: 'continuous' },
  selection: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 19, overflow: 'hidden' },
  tabText: { color: '#101010', fontSize: 16, fontWeight: '600' },
  selectedText: { color: '#FFFFFF', fontWeight: '700' },
});
