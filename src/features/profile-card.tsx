import { CardHandle } from '@/components/card-handle';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, createAnimatedComponent, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { PeopleCount } from '@/components/people-count';
import { RainCloud } from '@/components/rain-cloud';
import type { Profile, SessionStatus } from '@/types';

const AnimatedCircle = createAnimatedComponent(Circle);
const AnimatedPath = createAnimatedComponent(Path);
const RADIUS = 143;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ProfileCardProps = {
  cardWidth: number;
  cardHeight: number;
  status: SessionStatus;
  profile: Profile | null;
  onlineSeconds: number;
  ghost: boolean;
  setGhost: (value: boolean) => void;
  onAnimationLockChange: (locked: boolean) => void;
};

export function ProfileCard({ cardWidth, cardHeight, status, profile, onlineSeconds, ghost, setGhost, onAnimationLockChange }: ProfileCardProps) {
  const previousStatus = useRef(status);
  const reveal = useSharedValue(0);
  const rotation = useSharedValue(0);
  const completion = useSharedValue(0);
  const check = useSharedValue(0);
  const flip = useSharedValue(status === 'success' ? 1 : 0);
  useEffect(() => {
    let unlock: ReturnType<typeof setTimeout> | undefined;
    if (status === 'idle') {
      reveal.value = 0;
      rotation.value = 0; completion.value = 0; check.value = 0; flip.value = 0;
      onAnimationLockChange(false);
    } else if (status === 'detecting') {
      reveal.value = withTiming(1, { duration: 650, easing: Easing.inOut(Easing.cubic) });
      onAnimationLockChange(true);
      rotation.value = 0;
      rotation.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1);
    } else if (previousStatus.current === 'detecting') {
      onAnimationLockChange(true);
      // ASSUMED: 上(12時)から白いレールを青線が一周し、チェック→反転。
      completion.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
      check.value = withDelay(300, withTiming(1, { duration: 180 }));
      flip.value = withDelay(760, withTiming(1, { duration: 460 }));
      unlock = setTimeout(() => onAnimationLockChange(false), 1220);
    } else {
      completion.value = 1; check.value = 1; flip.value = 1;
      onAnimationLockChange(false);
    }
    previousStatus.current = status;
    return () => {
      if (unlock) clearTimeout(unlock);
      cancelAnimation(reveal); cancelAnimation(rotation); cancelAnimation(completion); cancelAnimation(check); cancelAnimation(flip);
    };
  }, [status, reveal, rotation, completion, check, flip, onAnimationLockChange]);
  const cloudMotion = useAnimatedStyle(() => ({ transform: [{ translateY: -20 * reveal.value }] }));
  const wordMotion = useAnimatedStyle(() => ({ transform: [{ translateY: 28 * reveal.value }] }));
  const grayCloud = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, reveal.value) }));
  const blueCloud = useAnimatedStyle(() => ({ opacity: Math.min(1, reveal.value) }));
  const dotMotion = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, (reveal.value - 0.15) / 0.85)) }));
  const scanProps = useAnimatedProps(() => ({ strokeDashoffset: -rotation.value * CIRCUMFERENCE }));
  const successProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - completion.value) }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: 84 * (1 - check.value) }));
  const frontStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180}deg` }] }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${-180 + flip.value * 180}deg` }] }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: 1 - flip.value }));
  const electricId = profile?.electricId ?? '';
  const ringSize = Math.min(cardWidth * 0.90, cardHeight - 48);
  const minutes = String(Math.floor(onlineSeconds / 60)).padStart(2, '0');
  const seconds = String(onlineSeconds % 60).padStart(2, '0');
  return (
    <View style={{ width: cardWidth, height: cardHeight + 64 }}>
      <Animated.View style={[styles.face, { width: cardWidth, height: cardHeight }, frontStyle]}>
        <CardHandle />
        <View style={[styles.ringFrame, { width: ringSize, height: ringSize, top: 26 }]}>
          <Svg width={ringSize} height={ringSize} viewBox="0 0 320 320">
            <Circle cx={160} cy={160} r={158} fill="#F5F5F5" />
            {status === 'idle' ? (
              <Circle cx={160} cy={160} r={RADIUS} fill="none" stroke="#E5E5E5" strokeWidth={4} strokeDasharray="13 13" strokeLinecap="round" />
            ) : (
              <>
                <Circle cx={160} cy={160} r={RADIUS} fill="none" stroke="#FFFFFF" strokeWidth={8} />
              </>
            )}
            {status === 'detecting' && <AnimatedCircle cx={160} cy={160} r={RADIUS} rotation={-90} origin="160, 160" fill="none" stroke="#168EFF" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE * 0.72} ${CIRCUMFERENCE * 0.28}`} animatedProps={scanProps} />}
            {status === 'success' && <AnimatedCircle cx={160} cy={160} r={RADIUS} rotation={-90} origin="160, 160" fill="none" stroke="#168EFF" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} animatedProps={successProps} />}
            {status === 'success' && <AnimatedPath d="M128 163 L151 186 L198 138" fill="none" stroke="#168EFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={84} animatedProps={checkProps} />}
          </Svg>
          {status !== 'success' && <View style={{ position: 'absolute', width: ringSize * 0.43, height: ringSize * 0.60 }}>
            <Animated.View style={[{ position: 'absolute', top: 12, width: '100%', height: ringSize * 0.43 * 318 / 462 }, cloudMotion]}>
              <Animated.View style={[StyleSheet.absoluteFill, grayCloud]}><Image source={require('@/assets/images/login/mono-dream-only.png')} contentFit="contain" style={StyleSheet.absoluteFill} /></Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, blueCloud]}><Image source={require('@/assets/images/login/dream.png')} contentFit="contain" style={StyleSheet.absoluteFill} /></Animated.View>
            </Animated.View>
            <Animated.View style={[{ position: 'absolute', top: ringSize * 0.035, alignSelf: 'center' }, dotMotion]}><RainCloud width={ringSize * 0.34} active={status === 'detecting'} dotsOnly /></Animated.View>
            <Animated.View style={[{ position: 'absolute', top: ringSize * 0.36, width: '100%', height: ringSize * 0.43 * 132 / 452 }, wordMotion]}><Image source={require('@/assets/images/login/mono-text-dream.png')} contentFit="contain" style={StyleSheet.absoluteFill} /></Animated.View>
          </View>}
        </View>
        <Image source={require('@/assets/images/login/barcode.png')} contentFit="contain" style={styles.frontBarcode} />
      </Animated.View>
      <Animated.View style={[styles.face, { width: cardWidth, height: cardHeight }, backStyle]}>
        <CardHandle />
        <View style={styles.identity}>
          <Image source={require('@/assets/images/login/dream.png')} contentFit="contain" style={{ width: cardWidth * 0.16, height: cardWidth * 0.11 }} />
          <View style={styles.idBlock}><Text style={styles.mutedLabel}>電信ID</Text><MaskedView maskElement={<Text style={styles.electricId}>{electricId}</Text>}><LinearGradient colors={['#2E7CFF', '#AECBFF']}><Text style={[styles.electricId, { opacity: 0 }]}>{electricId}</Text></LinearGradient></MaskedView></View>
          <Pressable accessibilityRole="button" style={styles.editButton}><Text style={styles.editText}>編集</Text></Pressable>
        </View>
        <View style={styles.stickerArea}>
        <View style={[styles.sticker, { width: cardHeight * 0.27, height: cardHeight * 0.27 }]}>
          <Image source={require('@/assets/images/login/demo-sticker.png')} contentFit="contain" style={StyleSheet.absoluteFill} />
          <View style={styles.stickerCount}><PeopleCount count={profile?.headcount ?? 0} color="#454545" /></View>
        </View>
        <View style={styles.onlinePill}><View style={styles.onlineDot} /><Text style={styles.onlineText}>オンライン {minutes}:{seconds}</Text></View>
        </View>
        <View style={styles.footer}>
          <Image source={require('@/assets/images/login/tokyo-city-background.png')} contentFit="cover" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['#00000035', '#000000A0']} style={StyleSheet.absoluteFill} />
          <Text style={styles.visitText}>過去に{profile?.visitCount ?? 0}回、{electricId}電信結界に入りました</Text>
          <View style={styles.customizeRow}><Text style={styles.customizeText}>電信結界プロファイルでカスタマイズしましょう</Text><SymbolView name="chevron.right" tintColor="#E6E6E6" size={12} /></View>
          <View style={styles.footerActions}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: ghost }} onPress={() => setGhost(!ghost)} style={styles.ghostButton}><Text style={styles.ghostText}>{ghost ? 'ゴーストを解除' : 'ゴーストにする'}</Text></Pressable>
            <Image source={require('@/assets/images/login/barcode.png')} contentFit="contain" style={styles.footerBarcode} />
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.caption, { top: cardHeight + 14 }, captionStyle]}>
        {status === 'detecting' ? <><Text style={styles.detectedText}>NFCステッカーのタッチを検出しました</Text><Text style={styles.captionText}>そのまま離さずにお待ちください</Text></> : <Text style={styles.captionText}>{status === 'idle' ? 'NFCステッカーにタッチして電信結界にログイン' : '電信結界へ記録が完了しました'}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { position: 'absolute', borderRadius: 42, borderCurve: 'continuous', overflow: 'hidden', backfaceVisibility: 'hidden', backgroundColor: '#FFFFFF', alignItems: 'center', boxShadow: '0px 8px 24px rgba(0,0,0,0.06)' },
  ringFrame: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerLogo: { position: 'absolute' },
  detectingLogo: { position: 'absolute', alignItems: 'center', gap: 1 },
  frontBarcode: { position: 'absolute', bottom: 9, width: '30%', height: 10 },
  identity: { width: '100%', paddingHorizontal: 20, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  idBlock: { flex: 1 },
  mutedLabel: { color: '#898989', fontSize: 15 },
  electricId: { color: '#5B99FF', fontFamily: 'ui-rounded', fontSize: 24, fontWeight: '700' },
  editButton: { minWidth: 60, minHeight: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 1, paddingVertical: 6, borderRadius: 24, borderCurve: 'continuous', backgroundColor: '#F1F1F1' },
  editText: { color: '#777777', fontSize: 17, fontWeight: '600' },
  stickerArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  sticker: { alignSelf: 'center' },
  stickerCount: { position: 'absolute', bottom: -2, right: -12, padding: 3, borderWidth: 0, borderColor: '#FFFFFF', borderRadius: 24, backgroundColor: '#FFFFFF', transform: [{ scale: 1.2 }] },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, borderCurve: 'continuous', backgroundColor: '#E5F5ED' },
  onlineDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#30B87A' },
  onlineText: { color: '#2BB57A', fontSize: 14, fontWeight: '600' },
  footer: { width: '100%', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, gap: 8 },
  visitText: { color: '#FFFFFF', fontSize: 15 },
  customizeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customizeText: { color: '#E6E6E6', fontSize: 14, flexShrink: 1 },
  footerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: 12 },
  ghostButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderCurve: 'continuous', backgroundColor: '#FFFFFF' },
  ghostText: { color: '#707070', fontSize: 16 },
  footerBarcode: { width: '35%', height: 10 },
  caption: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  captionText: { color: '#858585', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  detectedText: { color: '#438BFF', fontSize: 16, lineHeight: 22, textAlign: 'center' },
});
