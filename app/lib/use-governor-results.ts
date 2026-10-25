'use client';

import { useEffect, useState } from 'react';
import { websocketUrl } from './api-config';
import type { GovernorState } from './governors';
import { loadGovernors } from './realtime/governor-client';
import { startGovernorSession } from './realtime/governor-session';

export function useGovernorResults() {
  const [state, setState] = useState<GovernorState>({ results: {}, status: 'loading', error: null });
  useEffect(() => {
    return startGovernorSession({
      load: loadGovernors,
      createSocket: () => new WebSocket(websocketUrl()),
      onChange: setState,
    });
  }, []);
  return state;
}
