import { GradientText } from '@/components/gradient-text';
import type { ChatMessage } from '@/types';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

export function MapChat({ messages, onScrolling }: { messages: ChatMessage[]; onScrolling: (active: boolean) => void }) {
  const offset = useRef(0), origin = useRef(0), content = useRef(0), viewport = useRef(0);
  const following = useRef(true), dragging = useRef(false);
  const translation = useRef(new Animated.Value(0)).current;
  const callback = useRef(onScrolling); callback.current = onScrolling;
  function move(next: number) {
    offset.current = Math.max(0, Math.min(Math.max(0, content.current - viewport.current), next));
    translation.setValue(-offset.current);
    following.current = content.current - viewport.current - offset.current < 20;
  }
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 3,
    onPanResponderGrant: () => { origin.current = offset.current; },
    onPanResponderMove: (_event, gesture) => {
      if (Math.abs(gesture.dy) > 3 && !dragging.current) { dragging.current = true; callback.current(true); }
      move(origin.current - gesture.dy);
    },
    onPanResponderRelease: () => { dragging.current = false; callback.current(false); },
    onPanResponderTerminate: () => { dragging.current = false; callback.current(false); },
    onPanResponderTerminationRequest: () => !dragging.current,
  })).current;
  // 親と余白はbox-none。文字行から触れたときだけドラッグを取得する。
  return <MaskedView pointerEvents="box-none" style={styles.mask} maskElement={<LinearGradient colors={['transparent', '#000000', '#000000']} locations={[0, 0.14, 1]} style={StyleSheet.absoluteFill} />}>
    <View pointerEvents="box-none" style={styles.viewport} onLayout={event => { const previous = offset.current; viewport.current = event.nativeEvent.layout.height; move(following.current ? content.current : offset.current); if (dragging.current) origin.current += offset.current - previous; }}>
      <Animated.View pointerEvents="box-none" style={[styles.log, { transform: [{ translateY: translation }] }]} onLayout={event => { content.current = event.nativeEvent.layout.height; move(following.current ? content.current : offset.current); }}>
        {messages.map((message, index) => <View pointerEvents="box-none" key={`${message.number}-${index}`} style={styles.message}>
          <View {...pan.panHandlers} style={styles.metaRow}><Text style={styles.meta}>{message.kind === 'system' ? 'SERVE' : `${message.number}  id: `}</Text>{message.kind !== 'system' && <GradientText color="#666862" style={styles.meta}>{message.senderId}</GradientText>}<Text style={styles.meta}>  {message.time}</Text></View>
          <View {...pan.panHandlers} style={styles.bodyRow}>{message.kind === 'system' && <SymbolView name="arrow.right.to.line" size={21} tintColor="#62645E" />}<Text style={styles.body}>{message.body.split(/(@[^\s@]+|>>\d+)/g).map((part, i) => <Text key={i} style={(part.startsWith('>>') || part.startsWith('@')) ? styles.anchor : undefined}>{part}</Text>)}</Text></View>
        </View>)}
      </Animated.View>
    </View>
  </MaskedView>;
}
const styles = StyleSheet.create({ mask: { flex: 1 }, viewport: { flex: 1, overflow: 'hidden' }, log: { paddingTop: 30, paddingBottom: 8 }, message: { marginBottom: 16 }, metaRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }, meta: { color: '#777973', fontSize: 13, fontWeight: '600' }, bodyRow: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 }, body: { flexShrink: 1, color: '#454842ef', fontSize: 16, fontWeight: '600', lineHeight: 22 }, anchor: { color: '#318FFF' } });
