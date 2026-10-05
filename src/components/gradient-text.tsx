import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { RoundedText as Text } from '@/components/rounded-text';

export function paleTextColor(color: string) {
  return '#' + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * 0.68 + 255 * 0.32).toString(16).padStart(2, '0')).join('');
}
export function GradientText({ children, color, style }: { children: string | number; color: string; style?: StyleProp<TextStyle> }) {
  return <MaskedView style={styles.container} accessible accessibilityLabel={String(children)} maskElement={<Text accessible={false} style={[style, { color: '#000000' }]}>{children}</Text>}><LinearGradient colors={[color, paleTextColor(color)]}><Text accessible={false} style={[style, { opacity: 0 }]}>{children}</Text></LinearGradient></MaskedView>;
}

const styles = StyleSheet.create({ container: { flexShrink: 1 } });
