import type { ImageSourcePropType } from 'react-native';

export type SessionStatus = 'idle' | 'detecting' | 'success';
export type ScanStatus = 'idle' | 'scanning' | 'done';
export type CardId = 'profile' | 'scanner';
export type AreaId = 'kabukicho' | 'ikebukuro' | 'akihabara';

export type Profile = {
  electricId: string;
  avatar: ImageSourcePropType | null;
  visitCount: number;
  headcount: number;
};

export type FoundUser = {
  electricId: string;
  headcount: number;
  color: 'blue' | 'red' | 'purple';
};

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Person = {
  id: string;
  coordinate: Coordinate;
};

export type Sticker = {
  electricId: string;
  headcount: number;
  coordinate: Coordinate;
};

export type AreaBoundary = {
  coordinates: Coordinate[];
  fillColor: string;
  strokeColor: string;
};

export type AreaData = {
  headcount: number;
  people: Person[];
  stickers: Sticker[];
  boundary: AreaBoundary | null;
};

export type ChatMessage = {
  number: number;
  senderId: string;
  time: string;
  body: string;
  kind: 'message' | 'system';
};