import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, type StyleProp, type TextStyle } from 'react-native';
export function GradientText({ children, color, style }: { children: string; color: string; style?: StyleProp<TextStyle> }) {
  const pale = '#' + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * 0.68 + 255 * 0.32).toString(16).padStart(2, '0')).join('');
  return <MaskedView maskElement={<Text style={[style, { color: '#000000' }]}>{children}</Text>}><LinearGradient colors={[color, pale]}><Text style={[style, { opacity: 0 }]}>{children}</Text></LinearGradient></MaskedView>;
}
