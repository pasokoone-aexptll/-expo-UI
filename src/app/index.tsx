import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { DevPanel } from '@/components/dev-panel';
import { CardStack } from '@/features/card-stack';
import { colors } from '@/theme';

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  const expansion = useSharedValue(0);
  const [resetKey, setResetKey] = useState(0);
  useFocusEffect(useCallback(() => { setResetKey(value => value + 1); }, []));
  const openMap = useCallback(() => router.push('/map'), []);
  const chromeStyle = useAnimatedStyle(() => ({ opacity: 1 - expansion.value }));

  return (
    <View style={styles.container}>
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, chromeStyle]}><AppHeader /></Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.devPanel, { top: insets.top + 60 }, chromeStyle]}
      >
        <DevPanel />
      </Animated.View>
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 3 }]}><CardStack expansion={expansion} resetKey={resetKey} onScanComplete={openMap} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.page,
  },
  devPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    // ASSUMED: ホームインジケーターより上に保つ開発用パネルの余白です。
    height: 32,
  },
});
