import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
export function MapBubble({ children }: PropsWithChildren) {
  return <View style={styles.shadow}><View style={styles.tail} /><View style={styles.body}><BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />{children}</View></View>;
}
const styles = StyleSheet.create({
  shadow: { alignItems: 'center', paddingBottom: 7, shadowColor: '#30383F', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  body: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 9, paddingRight: 6, paddingVertical: 4, borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#FFFFFF9C' },
  tail: { position: 'absolute', bottom: 2, width: 13, height: 13, borderRadius: 4, backgroundColor: '#FFFFFFCC', transform: [{ rotate: '45deg' }] },
});
