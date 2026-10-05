import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type AssetPlaceholderProps = {
  style?: StyleProp<ViewStyle>;
};

export function AssetPlaceholder({ style }: AssetPlaceholderProps) {
  return <View accessible={false} style={[styles.placeholder, style]} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#D1D1D1',
  },
});