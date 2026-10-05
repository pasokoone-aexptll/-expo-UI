import type { AreaId, Coordinate, ChatMessage } from '@/types';

// ASSUMED: 中心座標・ポリゴン・点の配置はUI確認用。実際の結界や現在地ではありません。
export const MAP_AREAS = [
  { id: 'kabukicho', name: '歌舞伎町', headcount: 17, center: { latitude: 35.6944, longitude: 139.7034 } },
  { id: 'ikebukuro', name: '池袋', headcount: 24, center: { latitude: 35.7302, longitude: 139.7112 } },
  { id: 'akihabara', name: '秋葉原', headcount: 12, center: { latitude: 35.6997, longitude: 139.7711 } },
] as const;
export const MOCK_LOCATION = MAP_AREAS[0].center;
export const MAP_COLORS = ['#168EFF', '#FF646D', '#C33AFF'] as const;
export function getMapArea(id: AreaId) {
  const area = MAP_AREAS.find(item => item.id === id)!;
  const coordinate = (x: number, y: number): Coordinate => ({ latitude: area.center.latitude + y * 0.001, longitude: area.center.longitude + x * 0.001 });
  const groups = [{ x: -0.7, y: 0.85, id: '*2591', count: 5 }, { x: 0.5, y: 0, id: '*4647', count: 7 }, { x: 0.55, y: -1, id: '*2591', count: 5 }];
  return { ...area, zones: groups.map((g, index) => ({
    key: `${id}-${index}`, color: MAP_COLORS[index], electricId: g.id, headcount: g.count,
    coordinate: coordinate(g.x, g.y), sticker: index === 1 ? require('@/assets/images/login/demo-sticker.png') : null,
    boundary: [[-0.65,0.4],[0.65,0.4],[0.65,-0.4],[-0.65,-0.4]].map(([x,y]) => coordinate(g.x+x,g.y+y)),
    people: Array.from({ length: id === 'kabukicho' ? g.count : 3 }, (_, n) => ({ id: `${id}-${index}-${n}`, label: '_x_y_x_oO', coordinate: coordinate(g.x - 0.5 + (n % 3) * 0.34, g.y - 0.3 + Math.floor(n / 3) * 0.21) })),
  })) };
}
export function initialChat(id: AreaId): ChatMessage[] {
  const area = MAP_AREAS.find(item => item.id === id)!;
  return [
    { number: 8, senderId: 'nemu_o0x', time: '00:20:01', body: 'わかる最近いない', kind: 'message' },
    { number: 9, senderId: '_x_y_x_o0', time: '00:22:09', body: 'みんなホテルじゃない？', kind: 'message' },
    { number: 10, senderId: 'nyan_x_y_x', time: '00:26:40', body: '土日は広場おおい', kind: 'message' },
    { number: 0, senderId: 'SERVE', time: '00:19:43', body: `4ever_luv_uが${area.name}ログイン`, kind: 'system' },
    { number: 11, senderId: 'nyan_x_y_x', time: '00:26:47', body: '>>9 神社のところには人いたけど', kind: 'message' },
  ];
}
