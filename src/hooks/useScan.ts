import { useCallback, useEffect, useRef, useState } from 'react';

import { MOCK_FOUND_USERS, SCAN_FOUND_INTERVAL_MS } from '@/mocks/mock-data';
import type { FoundUser, ScanStatus } from '@/types';

export function useScan() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [ready, setReady] = useState(false);
  const [found, setFound] = useState<FoundUser[]>([]);
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    running.current = false;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function start() {
    if (running.current) return;
    running.current = true;

    setFound([]);
    setStatus('scanning');
    timers.current = MOCK_FOUND_USERS.map((user, index) =>
      setTimeout(() => {
        setFound((current) => [...current, user]);
        if (index === MOCK_FOUND_USERS.length - 1) { setReady(true); setStatus('done'); }
      }, SCAN_FOUND_INTERVAL_MS * (index + 1)),
    );
  }

  const reset = useCallback(() => {
    clearTimers();
    setFound([]);
    setStatus('idle');
  }, [clearTimers]);

  return { status, found, ready, start, reset };
}