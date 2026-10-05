import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

export function RoundedText({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[style, styles.rounded]} />;
}
const styles = StyleSheet.create({ rounded: { fontFamily: 'ui-rounded' } });
