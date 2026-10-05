import { StyleSheet, View } from 'react-native';

export function CardHandle({ dark = false }: { dark?: boolean }) {
  return <View style={[styles.frame, dark && styles.darkFrame]}><View style={[styles.bar, dark && styles.darkBar]} /></View>;
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', marginTop: 8, width: 67, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#DEDEDE', alignItems: 'center', justifyContent: 'center' },
  darkFrame: { borderColor: '#454545' },
  darkBar: { backgroundColor: '#737373' },
  bar: { width: 59, height: 6, borderRadius: 3, backgroundColor: '#D8D8D8' },
});
