import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { RoundedText as Text } from '@/components/rounded-text';
import { paleTextColor } from '@/components/gradient-text';

// 同じTextレイアウトをマスクに使い、文章の折り返しを保って数字・IDだけ着色する。
export function NumberText({ children, style, color = '#454842' }: { children: string; style?: StyleProp<TextStyle>; color?: string }) {
  const parts = children.split(/(@[^\s@]+|>>\d+|\*[\w…]+|\d+(?::\d+)*(?:[.,]\d+)?)/g);
  const group = (part: string, index: number) => index % 2 === 0 ? 'plain' : part.startsWith('@') || part.startsWith('>>') ? 'anchor' : 'number';
  return <View accessible accessibilityLabel={children} style={styles.container}>
    <Text accessible={false} style={style}>{parts.map((part, i) => <Text key={i} style={group(part, i) !== 'plain' ? styles.hidden : undefined}>{part}</Text>)}</Text>
    {(['number', 'anchor'] as const).filter(kind => parts.some((part, i) => group(part, i) === kind)).map(kind => {
      const tint = kind === 'anchor' ? '#318FFF' : color;
      return <MaskedView key={kind} pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill} maskElement={<Text accessible={false} style={style}>{parts.map((part, i) => <Text key={i} style={group(part, i) === kind ? styles.mask : styles.hidden}>{part}</Text>)}</Text>}>
        <LinearGradient colors={[tint, paleTextColor(tint)]} style={StyleSheet.absoluteFill} />
      </MaskedView>;
    })}
  </View>;
}
const styles = StyleSheet.create({ container: { flexShrink: 1 }, hidden: { color: 'transparent' }, mask: { color: '#000000' } });
