import { useState } from 'react';
import { initialChat } from '@/mocks/map-data';
import type { AreaId, ChatMessage } from '@/types';

export function useChat(areaId: AreaId) {
  const [logs, setLogs] = useState<Record<AreaId, ChatMessage[]>>(() => ({ kabukicho: initialChat('kabukicho'), ikebukuro: initialChat('ikebukuro'), akihabara: initialChat('akihabara') }));
  function send(text: string) {
    const body = text.trim();
    if (!body) return;
    setLogs(current => ({ ...current, [areaId]: [...current[areaId], {
      number: Math.max(0, ...current[areaId].map(message => message.number)) + 1,
      // ASSUMED: 投稿者は固定モック。エリア別ログは画面内のメモリーのみ。
      senderId: '*4647', time: new Date().toTimeString().slice(0, 8), body, kind: 'message',
    }] }));
  }
  return { messages: logs[areaId], send };
}
