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
  const [ghost, updateGhost] = useState(false);
  const [ghostSeconds, setGhostSeconds] = useState(0);
  const ghostStart = useRef<number | null>(null);
  function setGhost(value: boolean) {
    if (status !== 'success' && value) return;
    if (value === ghost) return;
    ghostStart.current = value ? Date.now() : null;
    setGhostSeconds(0);
    updateGhost(value);
  }
  useEffect(() => {
    if (!ghost) return;
    const timer = setInterval(() => setGhostSeconds(Math.floor((Date.now() - (ghostStart.current ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [ghost]);
  const onlineStart = useRef<number | null>(null);
  const loginTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'success') return;

    const interval = setInterval(() => {
      setOnlineSeconds(Math.floor((Date.now() - (onlineStart.current ?? Date.now())) / 1000));
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
      onlineStart.current = Date.now();
      setProfile(MOCK_PROFILE);
      setOnlineSeconds(0);
      setStatus('success');
      loginTimer.current = null;
    }, SESSION_DETECTING_MS);
  }

  function reset() {
    if (loginTimer.current) clearTimeout(loginTimer.current);
    loginTimer.current = null;
    onlineStart.current = null;
    setStatus('idle');
    setProfile(null);
    setOnlineSeconds(0);
    setGhost(false);
  }

  return (
    <SessionContext.Provider
      value={{ status, profile, onlineSeconds, ghostSeconds, ghost, setGhost, simulateLogin, reset }}
    >
      {children}
    </SessionContext.Provider>
  );
}