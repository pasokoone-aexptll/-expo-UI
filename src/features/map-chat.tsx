import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '@/types';

export function MapChat({ messages }: { messages: ChatMessage[] }) {
  const scroll = useRef<ScrollView>(null);
  const following = useRef(true);
  return <MaskedView style={styles.mask} maskElement={<LinearGradient colors={['transparent', '#000000', '#000000']} locations={[0, 0.18, 1]} style={StyleSheet.absoluteFill} />}>
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onScroll={event => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; following.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 40; }} scrollEventThrottle={32} onContentSizeChange={() => { if (following.current) scroll.current?.scrollToEnd({ animated: true }); }} contentContainerStyle={styles.log}>
      {messages.map((message, index) => <View key={`${message.number}-${index}`} style={styles.message}>
        <Text style={styles.meta}>{message.kind === 'system' ? 'SERVE' : `${message.number}  id: ${message.senderId}`}  {message.time}</Text>
        <Text style={styles.body}>{message.kind === 'system' ? '⇥ ' : ''}{message.body.split(/(>>\d+)/g).map((part, i) => <Text key={i} style={part.startsWith('>>') ? styles.anchor : undefined}>{part}</Text>)}</Text>
      </View>)}
    </ScrollView>
  </MaskedView>;
}
const styles = StyleSheet.create({ mask: { flex: 1 }, log: { paddingTop: 30, paddingBottom: 8 }, message: { marginBottom: 14 }, meta: { color: '#878984AA', fontSize: 13, fontWeight: '600' }, body: { color: '#696C65BB', fontSize: 16, fontWeight: '600', lineHeight: 22 }, anchor: { color: '#57AFFF' } });
