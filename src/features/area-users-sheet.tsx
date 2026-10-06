import { GradientText } from '@/components/gradient-text';
import { RoundedText as Text } from '@/components/rounded-text';
import type { useArea } from '@/hooks/useArea';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { area: ReturnType<typeof useArea>; onClose: () => void };
export function AreaUsersSheet({ area, onClose }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // ASSUMED: 一覧シートは画面高の約62%。上限はSafe Area内、下端はホームインジケーターを避ける。
  const sheetHeight = Math.min(height * 0.62, height - insets.top - 16);
  const translation = useRef(new Animated.Value(height)).current;
  const closing = useRef(false);
  const closeCallback = useRef(onClose); closeCallback.current = onClose;
  const screenHeight = useRef(height); screenHeight.current = height;
  const dragOrigin = useRef(0);
  function open() {
    Animated.spring(translation, { toValue: 0, damping: 28, stiffness: 260, mass: 1, useNativeDriver: true }).start();
  }
  function close() {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(translation, { toValue: screenHeight.current, duration: 230, useNativeDriver: true }).start(({ finished }) => {
      if (finished) closeCallback.current();
    });
  }
  useEffect(() => () => { translation.stopAnimation(); }, [translation]);
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => !closing.current && Math.abs(gesture.dy) > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => translation.stopAnimation(value => { dragOrigin.current = value; }),
    onPanResponderMove: (_, gesture) => translation.setValue(Math.max(0, dragOrigin.current + gesture.dy)),
    onPanResponderRelease: (_, gesture) => { if (gesture.dy > 90 || gesture.vy > 0.8) close(); else open(); },
    onPanResponderTerminate: () => { if (!closing.current) open(); },
  })).current;
  return <Modal transparent animationType="none" visible onShow={open} onRequestClose={close} statusBarTranslucent>
    <View style={styles.overlay} accessibilityViewIsModal onAccessibilityEscape={close}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: translation.interpolate({ inputRange: [0, height], outputRange: [1, 0], extrapolate: 'clamp' }) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="ユーザー一覧を閉じる" style={styles.backdrop} onPress={close} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: translation }] }]}>
        <BlurView pointerEvents="none" intensity={75} tint="light" style={StyleSheet.absoluteFill} />
        <View {...pan.panHandlers} style={styles.heading}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View style={styles.title}><Text accessibilityRole="header" style={styles.areaName}>{area.name}</Text><View style={styles.count}><SymbolView name="person.fill" size={15} tintColor="#555555" /><GradientText color="#333333" style={styles.countText}>{area.users.length}</GradientText></View></View>
            <Pressable accessibilityRole="button" accessibilityLabel="閉じる" onPress={close} style={({ pressed }) => [styles.close, pressed && styles.pressed]}><SymbolView name="xmark" size={17} weight="semibold" tintColor="#666666" /></Pressable>
          </View>
          <Text style={styles.subtitle}>このエリアにいるユーザー</Text>
        </View>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
          {area.users.map(user => <View key={user.id} accessible accessibilityLabel={`${user.label}、電信ID ${user.electricId}`} style={styles.user}>
            <View style={[styles.avatar, { backgroundColor: `${user.color}18` }]}><SymbolView name="person.fill" size={23} tintColor={user.color} /></View>
            <View style={styles.identity}><GradientText color={user.color} style={styles.name}>{user.label}</GradientText><View style={styles.idRow}><Text style={styles.idLabel}>電信ID</Text><GradientText color={user.color} style={styles.electricId}>{user.electricId}</GradientText></View></View>
          </View>)}
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1 }, backdrop: { flex: 1, backgroundColor: '#00000030' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderCurve: 'continuous', backgroundColor: '#FFFFFFDC', overflow: 'hidden' },
  heading: { paddingHorizontal: 24, paddingBottom: 18, paddingTop: 10 }, handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: '#BDBDBD', alignSelf: 'center', marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { flexDirection: 'row', gap: 14, alignItems: 'center' }, areaName: { fontSize: 23, fontWeight: '700', color: '#111111' },
  count: { flexDirection: 'row', alignItems: 'center', gap: 5 }, countText: { fontSize: 18, fontWeight: '600' }, subtitle: { fontSize: 14, color: '#777777', marginTop: 4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00000006', alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.55 },
  list: { paddingHorizontal: 24, paddingBottom: 12 }, user: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#00000010' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, identity: { flex: 1, gap: 4 }, name: { fontSize: 18, fontWeight: '600' }, idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, idLabel: { fontSize: 12, color: '#888888' }, electricId: { fontSize: 13, fontWeight: '600' },
});
