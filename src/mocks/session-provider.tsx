import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { MOCK_PROFILE, SESSION_DETECTING_MS } from '@/mocks/mock-data';
import { SessionContext } from '@/hooks/useSession';
import type { Profile, SessionStatus } from '@/types';

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  const [ghost, setGhost] = useState(false);
  const loginTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'success') return;

    const interval = setInterval(() => {
      setOnlineSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(
    () => () => {
      if (loginTimer.current) clearTimeout(loginTimer.current);
    },
    [],
  );

  function simulateLogin() {
    if (status !== 'idle') return;

    setStatus('detecting');
    loginTimer.current = setTimeout(() => {
      setProfile(MOCK_PROFILE);
      setOnlineSeconds(0);
      setStatus('success');
      loginTimer.current = null;
    }, SESSION_DETECTING_MS);
  }

  function reset() {
    if (loginTimer.current) clearTimeout(loginTimer.current);
    loginTimer.current = null;
    setStatus('idle');
    setProfile(null);
    setOnlineSeconds(0);
    setGhost(false);
  }

  return (
    <SessionContext.Provider
      value={{ status, profile, onlineSeconds, ghost, setGhost, simulateLogin, reset }}
    >
      {children}
    </SessionContext.Provider>
  );
}