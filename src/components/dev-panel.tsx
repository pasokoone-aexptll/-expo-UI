import { RoundedText as Text } from '@/components/rounded-text';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSession } from '@/hooks/useSession';

export function DevPanel() {
  const { simulateLogin, reset } = useSession();

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" onPress={simulateLogin} style={styles.button}><Text style={styles.label}>ログインを擬似実行</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={reset} style={styles.button}><Text style={styles.label}>リセット</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 8, paddingVertical: 6 },
  label: { fontSize: 16, color: '#007AFF' },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // ASSUMED: 開発パネル内のボタン間隔です。
    gap: 12,
  },
});