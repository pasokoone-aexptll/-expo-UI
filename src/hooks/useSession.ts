import { createContext, useContext } from 'react';

import type { Profile, SessionStatus } from '@/types';

export type SessionValue = {
  status: SessionStatus;
  isLoggingOut: boolean;
  profile: Profile | null;
  onlineSeconds: number;
  ghostSeconds: number;
  ghost: boolean;
  setGhost: (value: boolean) => void;
  simulateLogin: () => void;
  logout: () => void;
  reset: () => void;
};

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}