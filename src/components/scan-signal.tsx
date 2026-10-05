import { useEffect } from 'react';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ARCS = ['M4 9 Q7 12 4 15', 'M8 5 Q15 12 8 19', 'M12 1 Q23 12 12 23'];

function Wave({ index, phase }: { index: number; phase: SharedValue<number> }) {
  const animatedProps = useAnimatedProps(() => ({
    opacity: interpolate((phase.value - index * 0.17 + 1) % 1, [0, 0.15, 0.65, 1], [0.18, 1, 0.18, 0.18]),
  }));
  return <AnimatedPath d={ARCS[index]} animatedProps={animatedProps} />;
}

export function ScanSignal({ side }: { side: 'left' | 'right' }) {
  const phase = useSharedValue(0);
  useEffect(() => {
    // ASSUMED: 文字の近くから外側へ、1.2秒周期で電波を送る。
    phase.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1);
    return () => cancelAnimation(phase);
  }, [phase]);
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <G transform={side === 'left' ? 'translate(24 0) scale(-1 1)' : undefined} stroke="#A5A5A5" strokeWidth={1.6} strokeLinecap="round">
        {[0, 1, 2].map(index => <Wave key={index} index={index} phase={phase} />)}
      </G>
    </Svg>
  );
}
