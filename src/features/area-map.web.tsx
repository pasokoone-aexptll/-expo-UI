import { RoundedText as Text } from '@/components/rounded-text';
import { forwardRef, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { AreaMap as NativeAreaMap } from './area-map';
export type { MapPerson } from './area-map';

// react-native-mapsはiOS/Android専用。Webでは実行時にimportしない。
// ネイティブMapViewのrefはnullのままとし、架空の座標やカメラ操作を返さない。
export const AreaMap = forwardRef<MapView, ComponentProps<typeof NativeAreaMap>>(function AreaMap({ onMapPress }, _ref) {
  return <Pressable onPress={onMapPress} style={styles.background} accessible={false}>
    <View pointerEvents="none" style={styles.notice}>
      <Text style={styles.title}>地図はiOSで表示されます</Text>
      <Text style={styles.body}>Webではチャットやユーザー一覧を確認できます。</Text>
    </View>
  </Pressable>;
});
const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFill, backgroundColor: '#E9EAE5' },
  notice: { position: 'absolute', top: '30%', left: 24, right: 24, alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '600', color: '#555753', textAlign: 'center' },
  body: { fontSize: 14, color: '#777973', textAlign: 'center' },
});
