'use client';

import { useEffect, useState } from 'react';
import { websocketUrl } from './api-config';
import { loadComparisons } from './realtime/comparison-client';
import { startComparisonSession, type ComparisonState } from './realtime/comparison-session';

export function usePresidentialComparisons() {
  const [state, setState] = useState<ComparisonState>({ comparisons: {}, status: 'loading', error: null });
  useEffect(() => startComparisonSession({
    load: loadComparisons,
    createSocket: () => new WebSocket(websocketUrl()),
    onChange: setState,
  }), []);
  return state;
}
