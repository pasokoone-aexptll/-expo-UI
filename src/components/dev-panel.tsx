import { Button, StyleSheet, View } from 'react-native';

import { useSession } from '@/hooks/useSession';

export function DevPanel() {
  const { simulateLogin, reset } = useSession();

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Button title="ログインを擬似実行" onPress={simulateLogin} />
      <Button title="リセット" onPress={reset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // ASSUMED: 開発パネル内のボタン間隔です。
    gap: 12,
  },
});