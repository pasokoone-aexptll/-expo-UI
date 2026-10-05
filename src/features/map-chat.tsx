import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GradientText } from '@/components/gradient-text';
import type { ChatMessage } from '@/types';

export type MapChatHandle = { drag: (dy: number) => void };
export const MapChat = forwardRef<MapChatHandle, { messages: ChatMessage[] }>(function MapChat({ messages }, ref) {
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const content = useRef(0);
  const viewport = useRef(0);
  const following = useRef(true);
  useImperativeHandle(ref, () => ({ drag(dy) {
    offset.current = Math.max(0, Math.min(content.current - viewport.current, offset.current - dy));
    following.current = content.current - viewport.current - offset.current < 20;
    scroll.current?.scrollTo({ y: offset.current, animated: false });
  } }), []);
  return <MaskedView pointerEvents="none" style={styles.mask} maskElement={<LinearGradient colors={['transparent', '#000000', '#000000']} locations={[0, 0.18, 1]} style={StyleSheet.absoluteFill} />}>
    <ScrollView ref={scroll} scrollEnabled={false} showsVerticalScrollIndicator={false} onLayout={event => { viewport.current = event.nativeEvent.layout.height; }} onContentSizeChange={(_width, height) => { content.current = height; if (following.current) { offset.current = Math.max(0, height - viewport.current); scroll.current?.scrollTo({ y: offset.current, animated: false }); } }} contentContainerStyle={styles.log}>
      {messages.map((message, index) => <View key={`${message.number}-${index}`} style={styles.message}>
        <View style={styles.metaRow}><Text style={styles.meta}>{message.kind === 'system' ? 'SERVE' : `${message.number}  id: `}</Text>{message.kind !== 'system' && <GradientText color="#555753" style={styles.meta}>{message.senderId}</GradientText>}<Text style={styles.meta}>  {message.time}</Text></View>
        <View style={styles.bodyRow}>{message.kind === 'system' && <SymbolView name="arrow.right.to.line" size={20} tintColor="#454743" />}<Text style={styles.body}>{message.body.split(/(>>\d+)/g).map((part, i) => <Text key={i} style={part.startsWith('>>') ? styles.anchor : undefined}>{part}</Text>)}</Text></View>
      </View>)}
    </ScrollView>
  </MaskedView>;
});
const styles = StyleSheet.create({ mask: { flex: 1 }, log: { paddingTop: 30, paddingBottom: 8 }, message: { marginBottom: 14 }, metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }, meta: { color: '#666862', fontSize: 13, fontWeight: '600' }, bodyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, body: { flex: 1, color: '#292C27', fontSize: 16, fontWeight: '600', lineHeight: 22 }, anchor: { color: '#318FFF' } });
