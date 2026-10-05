import type { FoundUser, Profile } from '@/types';

export const MOCK_PROFILE: Profile = {
  electricId: '*4647',
  avatar: null,
  visitCount: 54,
  headcount: 7,
};

export const MOCK_FOUND_USERS: FoundUser[] = [
  { electricId: '*2591', headcount: 5, color: 'blue' },
  { electricId: '*4647', headcount: 7, color: 'red' },
  { electricId: '*2591', headcount: 3, color: 'purple' },
];

// ASSUMED: モックのログイン検出時間です。
export const SESSION_DETECTING_MS = 2000;

// ASSUMED: スキャン中に発見情報を追加する間隔です。
export const SCAN_FOUND_INTERVAL_MS = 1200;
