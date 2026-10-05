import { NumberText } from '@/components/number-text';
import { GradientText } from '@/components/gradient-text';
import type { ChatMessage } from '@/types';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';

export function MapChat({ messages, onScrolling, topSpacing }: { topSpacing: number; messages: ChatMessage[]; onScrolling: (active: boolean) => void }) {
  const offset = useRef(0), origin = useRef(0), content = useRef(0), viewport = useRef(0);
  const following = useRef(true), dragging = useRef(false);
  const count = useRef(messages.length); count.current = messages.length;
  const [readThrough, setReadThrough] = useState(messages.length);
  useEffect(() => {
    if (following.current && !dragging.current) setReadThrough(messages.length);
  }, [messages.length]);
  const unread = Math.max(0, messages.length - readThrough);
  const translation = useRef(new Animated.Value(0)).current;
  const callback = useRef(onScrolling); callback.current = onScrolling;
  function move(next: number, userScroll = true) {
    offset.current = Math.max(0, Math.min(Math.max(0, content.current - viewport.current), next));
    translation.setValue(Math.max(0, viewport.current - content.current) - offset.current);
    if (userScroll) {
      following.current = content.current - viewport.current - offset.current < 20;
      if (following.current) setReadThrough(count.current);
    }
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
  return <View pointerEvents="box-none" style={styles.mask}>
    <View pointerEvents="box-none" style={styles.viewport} onLayout={event => { const previous = offset.current; viewport.current = event.nativeEvent.layout.height; move(following.current && !dragging.current ? content.current : offset.current, false); if (dragging.current) origin.current += offset.current - previous; }}>
      <Animated.View pointerEvents="box-none" style={[styles.log, { transform: [{ translateY: translation }] }]} onLayout={event => { content.current = event.nativeEvent.layout.height; move(following.current && !dragging.current ? content.current : offset.current, false); }}>
        {/* 先頭余白も履歴の一部として移動・計測する。 */}
        <View pointerEvents="none" style={{ height: topSpacing, flexShrink: 0 }} />
        {messages.map((message, index) => <View pointerEvents="box-none" key={`${message.number}-${index}`} style={styles.message}>
          <View {...pan.panHandlers} hitSlop={6} style={styles.metaRow}><NumberText color="#777973" style={styles.meta}>{message.kind === 'system' ? 'SERVE' : `${message.number}  id: `}</NumberText>{message.kind !== 'system' && <GradientText color="#666862" style={styles.meta}>{message.senderId}</GradientText>}<GradientText color="#777973" style={styles.meta}>{`  ${message.time}`}</GradientText></View>
          <View {...pan.panHandlers} hitSlop={6} style={styles.bodyRow}>{message.kind === 'system' && <SymbolView name="arrow.right.to.line" size={21} tintColor="#62645E" />}{message.kind === 'system' ? <GradientText color="#454842" style={styles.body}>{message.body}</GradientText> : <NumberText style={styles.body}>{message.body}</NumberText>}</View>
        </View>)}
      </Animated.View>
    </View>
    {unread > 0 && <Pressable accessibilityRole="button" accessibilityLabel={`新着${unread}件。最新のチャットへ移動`} onPress={() => move(content.current)} style={({ pressed }) => [styles.newMessages, pressed && styles.newMessagesPressed]}>
      <SymbolView name="arrow.down" size={14} tintColor="#168EFF" /><NumberText color="#168EFF" style={styles.newMessagesText}>{`新着 ${unread}件`}</NumberText>
    </Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  newMessages: { position: 'absolute', bottom: 6, right: 0, minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 22, borderCurve: 'continuous', backgroundColor: '#FFFFFFF2', shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  newMessagesPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  newMessagesText: { color: '#168EFF', fontSize: 14, fontWeight: '600' }, mask: { flex: 1 }, viewport: { flex: 1, overflow: 'hidden' }, log: { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: 8 }, message: { marginBottom: 16 }, metaRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }, meta: { color: '#777973', fontSize: 13, fontWeight: '600' }, bodyRow: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 }, body: { flexShrink: 1, color: '#454842ef', fontSize: 16, fontWeight: '600', lineHeight: 22 }, anchor: { color: '#318FFF' } });
