import { paleTextColor } from '@/components/gradient-text';
import MaskedView from '@react-native-masked-view/masked-view';
import { SymbolView } from 'expo-symbols';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Mask, Rect, Text as SvgText } from 'react-native-svg';

export function PeopleCount({ count, color }: { count: number; color: string }) {
  const maskId = useId().replace(/:/g, '');
  const width = count > 9 ? 44 : 35;
  const number = { x: 21, y: 31, fontSize: 18 * 0.92, fontWeight: 'bold' as const, fontFamily: 'ui-rounded' };
  return (
    <View accessible accessibilityLabel={`${count}人`} style={{ width, height: 34 }}>
      <MaskedView style={StyleSheet.absoluteFill} maskElement={
        <Svg width={width} height={34}>
          <Defs>
            <Mask id={maskId} x={0} y={0} width={width} height={34} maskUnits="userSpaceOnUse">
              <Rect width={width} height={34} fill="white" />
              <SvgText {...number} fill="black" stroke="black" strokeWidth={5} strokeLinejoin="round">{count}</SvgText>
            </Mask>
          </Defs>
          <Rect width={width} height={34} fill="white" mask={`url(#${maskId})`} />
        </Svg>
      }>
        <SymbolView name="person.crop.circle.fill" tintColor={color} size={31} />
      </MaskedView>
      <Svg pointerEvents="none" width={width} height={34} style={StyleSheet.absoluteFill}>
        <Defs><LinearGradient id={`${maskId}color`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} /><Stop offset="1" stopColor={paleTextColor(color)} /></LinearGradient></Defs>
        <SvgText {...number} fill={`url(#${maskId}color)`}>{count}</SvgText>
      </Svg>
    </View>
  );
}
