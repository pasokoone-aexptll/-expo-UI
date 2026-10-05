import { CardHandle } from '@/components/card-handle';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, FadeInDown, interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue, withDelay, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { PeopleCount } from '@/components/people-count';
import { RainCloud } from '@/components/rain-cloud';
import { ScanSignal } from '@/components/scan-signal';

import type { FoundUser, ScanStatus, SessionStatus } from '@/types';

type ScannerCardProps = {
  width: number;
  height: number;
  idleHeight: number;
  electricId: string;
  sessionStatus: SessionStatus;
  isMain: boolean;
  expansion: SharedValue<number>;
  scanStatus: ScanStatus;
  found: FoundUser[];
  ready: boolean;
  start: () => void;
  cancel: () => void;
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const resultColors = { blue: '#609DFF', red: '#FF767E', purple: '#C467F0' } as const;

function Discovery({ user, index, done }: { user: FoundUser; index: number; done: boolean }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (done) opacity.value = withDelay(650 + index * 140, withTiming(0, { duration: 380 }));
    return () => cancelAnimation(opacity);
  }, [done, index, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View entering={FadeInDown.duration(320)}>
      <Animated.View style={[styles.resultItem, animatedStyle]}>
        <BlurView pointerEvents="none" intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
        <View>
          <Text style={styles.resultLabel}>電信ID</Text>
          <Text style={[styles.resultId, { color: resultColors[user.color] }]}>{user.electricId}</Text>
        </View>
        <PeopleCount count={user.headcount} color={resultColors[user.color]} />
        <Text style={styles.resultText}>を発見しました</Text>
      </Animated.View>
    </Animated.View>
  );
}

export function ScannerCard({ width, height, idleHeight, electricId, sessionStatus, isMain, expansion, scanStatus, found, ready, start, cancel }: ScannerCardProps) {
  const [screenActive, setScreenActive] = useState(true);
  useFocusEffect(useCallback(() => {
    setScreenActive(true);
    return () => setScreenActive(false);
  }, []));
  const viewport = useWindowDimensions();
  const busy = scanStatus !== 'idle';
  const canScan = isMain && !busy;
  const cloudWidth = Math.min(width * 0.30, idleHeight * 0.2);
  const scanningCloudWidth = Math.min(width * 0.27, height * 0.162);
  const descriptionLines = Math.ceil(77 / Math.max(1, Math.floor((width - 44) / 14)));
  const descriptionTop = idleHeight - 94 - (35 + descriptionLines * 20);
  const mainCloudTop = Math.min(idleHeight * 0.29, descriptionTop - cloudWidth * 141 / 116 - 16);
  const scan = useSharedValue(0);
  useEffect(() => {
    scan.value = withTiming(busy ? 1 : 0, { duration: 700, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(scan);
  }, [busy, scan]);

  // ASSUMED: 元PNGの地平線は高さの約31%、日本は(x:49%, y:44%)。
  // 透明余白を含むcoverではなく、元の縦横比で地球本体を配置します。
  const earthStyle = useAnimatedStyle(() => {
    const imageWidth = width * 3.2 * interpolate(scan.value, [0, 1], [1, 1.22]) * interpolate(expansion.value, [0, 1], [1, 2.8 / 1.22]);
    const imageHeight = imageWidth * 3196 / 5711;
    const horizon = interpolate(scan.value, [0, 1], [idleHeight, height]) * interpolate(scan.value, [0, 1], [0.63, 0.46]);
    return {
      width: imageWidth,
      height: imageHeight,
      left: interpolate(expansion.value, [0, 1], [width, viewport.width]) / 2 - imageWidth * 0.49,
      top: interpolate(expansion.value, [0, 1], [horizon - imageHeight * 0.315, viewport.height * 0.5 - imageHeight * 0.44]),
    };
  });
  const chromeStyle = useAnimatedStyle(() => ({ opacity: interpolate(expansion.value, [0, 0.35, 1], [1, 0, 0], 'clamp') }));
  const brandStyle = useAnimatedStyle(() => ({
    top: interpolate(scan.value, [0, 1], [mainCloudTop, Math.max(96, height * 0.18) + 10]),
    left: (interpolate(expansion.value, [0, 1], [width, viewport.width]) - cloudWidth) / 2,
    opacity: interpolate(expansion.value, [0, 0.4, 1], [1, 0, 0], 'clamp'),
    transform: [{ scale: interpolate(scan.value, [0, 1], [1, scanningCloudWidth / cloudWidth]) * interpolate(expansion.value, [0, 1], [1, 0.6]) }],
  }));
  const descriptionStyle = useAnimatedStyle(() => ({ left: 22, top: descriptionTop, right: 22, opacity: 1 - expansion.value }));
  const blurProps = useAnimatedProps(() => ({ intensity: interpolate(expansion.value, [0, 0.7, 1], [0, 85, 100]) }));
  const blurStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, expansion.value * 3) }));
  const markerStyle = useAnimatedStyle(() => ({
    // 日本の基準点に追随させ、スキャン時の拡大でマーカーだけずれないようにする。
    top: interpolate(expansion.value, [0, 1], [
      interpolate(scan.value, [0, 1], [idleHeight, height]) * interpolate(scan.value, [0, 1], [0.63, 0.46])
        + width * 3.2
        * interpolate(scan.value, [0, 1], [1, 1.22]) * (3196 / 5711) * (0.44 - 0.315),
      viewport.height * 0.5,
    ]) - 10,
    opacity: 1 - expansion.value,
  }));

  return (
    <View style={styles.content}>
      <Animated.View pointerEvents="none" style={[styles.earthBackground, earthStyle]}>
        <Image source={require('@/assets/images/scanner/earth-night.png')} contentFit="contain" allowDownscaling={false} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, blurStyle]}><AnimatedBlurView tint="dark" animatedProps={blurProps} style={StyleSheet.absoluteFill} /></Animated.View>
      <Animated.View style={[styles.topChrome, chromeStyle]}>
        <CardHandle dark />
        <View style={styles.connectionRow}>
          <Text style={styles.connectionLabel}>電信ID</Text>
          <View style={styles.connectionValueRow}>
            <MaskedView style={styles.connectionIdMask} maskElement={<Text style={styles.connectionValueMask}>{electricId || '*…'}</Text>}>
              <LinearGradient colors={['#2E7CFF', '#AECBFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
            </MaskedView>
            {sessionStatus === 'success' && <Text style={styles.connectionState}>に接続済み</Text>}
          </View>
        </View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.brandGroup, brandStyle]}>
        <RainCloud width={cloudWidth} active={busy && screenActive} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.locationMarker, markerStyle]} />
      {!busy && (
        <Animated.View pointerEvents="none" style={[styles.description, descriptionStyle]}>
          <Text style={styles.title}>スキャナー</Text>
          <Text style={styles.body}>街にスキャンして街の様子を確認したり、街のチャットで連絡をとってこれからの予定を決めたり、新たな友達を見つけたりしましょう。</Text>
        </Animated.View>
      )}
      <Animated.View style={[styles.bottomActions, chromeStyle]}>
        {busy ? (
          <>
            <View style={styles.resultList}>
              {found.map((user, index) => <Discovery key={`${user.color}-${user.electricId}`} user={user} index={index} done={scanStatus === 'done'} />)}
            </View>
            <View style={styles.scanningLabel}>
              <ScanSignal side="left" />
              <Text style={styles.scanningText}>街をスキャンしています</Text>
              <ScanSignal side="right" />
            </View>
          </>
        ) : null}
        {busy && <Text style={styles.cancelHint}>タップしてキャンセル</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel={busy ? "スキャンをキャンセル" : ready ? "マップを開く" : "街をスキャンする"} accessibilityState={{ disabled: !isMain }} disabled={!isMain} onPress={busy ? cancel : start} style={[styles.scanButton, !canScan && styles.scanButtonDisabled]}>
          {busy ? <ActivityIndicator size="small" color="#494949" /> : <Image source={require('@/assets/images/scanner/scanner-mascot.png')} contentFit="contain" style={styles.mascot} />}
          <Text style={[styles.scanButtonText, !busy && styles.idleButtonText]}>{busy ? `電信結界を${found.length}件発見` : ready ? '準備完了・マップを開く' : '街をスキャンする'}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ASSUMED: Figma静止画の比率からの目視近似。カード外の寸法・傾きは既存設定を維持。
const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#000000', alignItems: 'center' },
  earthBackground: { position: 'absolute' },
  cancelHint: { textAlign: 'center', color: '#CCCCCC', fontSize: 12 },
  topChrome: { width: '100%', alignItems: 'center' },
  connectionRow: { width: '100%', marginTop: 20, paddingHorizontal: 22 },
  connectionLabel: { color: '#999999', fontSize: 12 },
  connectionValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectionIdMask: { width: 74, height: 28 },
  connectionValueMask: { color: '#FFFFFF', fontFamily: 'ui-rounded', fontSize: 22, fontWeight: 'bold', lineHeight: 28 },
  connectionState: { color: '#D5D5D5', fontSize: 14 },
  brandGroup: { position: 'absolute', alignSelf: 'center' },
  locationMarker: { position: 'absolute', alignSelf: 'center', width: 20, height: 20, borderRadius: 10, borderCurve: 'continuous', backgroundColor: '#5499FF', borderWidth: 3, borderColor: '#FFFFFF' },
  bottomActions: { position: 'absolute', left: 22, right: 22, bottom: 22, gap: 10 },
  description: { position: 'absolute', gap: 12 },
  title: { color: '#FFFFFF', fontSize: 24 },
  body: { color: '#D0D0D0', fontSize: 14, lineHeight: 20 },
  scanButton: { height: 44, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderCurve: 'continuous', backgroundColor: '#FFFFFF' },
  scanButtonDisabled: { backgroundColor: '#AAAAAA' },
  mascot: { position: 'absolute', left: 8, bottom: 0, width: 90, height: 64 },
  scanButtonText: { color: '#333333', fontSize: 15 },
  idleButtonText: { paddingLeft: 35 },
  scanningLabel: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2, marginTop: 22 },
  scanningText: { color: '#A5A5A5', fontSize: 14, marginHorizontal: 6 },
  resultList: { minHeight: 132, gap: 7, alignItems: 'flex-start' },
  resultItem: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: 28, borderCurve: 'continuous', paddingHorizontal: 15, paddingVertical: 5, overflow: 'hidden', backgroundColor: '#33333330', gap: 5 },
  resultLabel: { color: '#B1B1B1', fontSize: 12 },
  resultId: { fontFamily: 'ui-rounded', fontSize: 16, fontWeight: 'bold' },
  resultText: { color: '#BBBBBB', fontSize: 15, flexShrink: 1 },
});
