import { RoundedText as Text } from '@/components/rounded-text';
import { useSession } from '@/hooks/useSession';
import { BlurView } from 'expo-blur';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

export function LogoutProgress() {
  const { isLoggingOut } = useSession();
  return <Modal visible={isLoggingOut} transparent animationType="fade" onRequestClose={() => {}}>
    <View style={styles.backdrop} accessibilityViewIsModal>
      <View accessible accessibilityLabel="ログアウト中です" accessibilityState={{ busy: true }} style={styles.popup}>
        <BlurView pointerEvents="none" intensity={70} tint="light" style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#168EFF" />
        <Text style={styles.text}>ログアウト中です…</Text>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000020', paddingHorizontal: 32 },
  popup: { width: 248, maxWidth: '100%', paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center', gap: 18, backgroundColor: '#FFFFFFDD', borderRadius: 30, borderCurve: 'continuous', overflow: 'hidden' },
  text: { color: '#444444', fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
