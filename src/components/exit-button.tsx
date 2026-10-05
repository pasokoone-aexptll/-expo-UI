import { useSession } from '@/hooks/useSession';
import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

export function ExitButton({ size = 32 }: { size?: number }) {
  const { status, logout } = useSession();
  const enabled = status === 'success';
  return <Pressable accessibilityRole="button" accessibilityLabel="電信結界からログアウト" accessibilityState={{ disabled: !enabled }} disabled={!enabled} hitSlop={8} onPress={logout} style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && styles.pressed]}>
    <Image source={require('@/assets/images/header/exit.png')} contentFit="contain" tintColor={enabled ? undefined : '#C7C7C7'} style={StyleSheet.absoluteFill} />
  </Pressable>;
}
const styles = StyleSheet.create({ button: { alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.65, transform: [{ scale: 0.94 }] } });
