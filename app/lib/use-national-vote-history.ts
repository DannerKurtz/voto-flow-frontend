'use client';

import { useEffect, useState } from 'react';
import { apiBaseUrl } from './api-config';
import type { PresidentialComparison } from './comparison';
import { parseVoteHistory, type VoteHistoryPoint } from './national-vote-history';

type HistoryState = { electionCode: string | null; points: VoteHistoryPoint[]; loading: boolean; error: string | null };

export function useNationalVoteHistory(comparison: PresidentialComparison | undefined) {
  const electionCode = comparison?.secondRound?.electionCode ?? null;
  const revision = JSON.stringify(comparison?.secondRound ?? null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<HistoryState>({ electionCode: null, points: [], loading: false, error: null });

  useEffect(() => {
    if (!electionCode) return;
    const controller = new AbortController();
    setState((previous) => ({ electionCode, points: previous.electionCode === electionCode ? previous.points : [], loading: true, error: null }));
    async function load() {
      try {
        const response = await fetch(`${apiBaseUrl()}/results/second-round/president/br/history`, {
          cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
        });
        if (!response.ok) throw new Error('Não foi possível carregar o histórico nacional.');
        const history = parseVoteHistory(await response.json());
        if (history.electionCode !== electionCode) throw new Error('O histórico recebido pertence a outra eleição.');
        if (!controller.signal.aborted) setState({ electionCode, points: history.points, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setState((previous) => ({ ...previous, loading: false,
          error: error instanceof Error ? error.message : 'Histórico indisponível.' }));
      }
    }
    void load();
    return () => controller.abort();
  }, [electionCode, revision, attempt]);

  return { ...(state.electionCode === electionCode ? state : { points: [], loading: Boolean(electionCode), error: null }),
    retry: () => setAttempt((value) => value + 1) };
}
