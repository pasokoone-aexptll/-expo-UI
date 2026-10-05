import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssetPlaceholder } from '@/components/asset-placeholder';

export function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <AssetPlaceholder style={styles.wordmark} />
      <View style={styles.actions}>
        <AssetPlaceholder style={styles.exitIcon} />
        <AssetPlaceholder style={styles.avatar} />
      </View>
    </View>
  );
}

// ASSUMED: プレースホルダー寸法とSafeArea内のヘッダー余白は画像からの目視近似です。
const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    width: 126,
    height: 38,
    borderRadius: 2, borderCurve: 'continuous',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exitIcon: {
    width: 30,
    height: 32,
    borderRadius: 2, borderCurve: 'continuous',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19, borderCurve: 'continuous',
  },
});