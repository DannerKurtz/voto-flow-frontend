'use client';

import { useEffect, useRef, useState } from 'react';
import { apiBaseUrl, websocketUrl, type ComparisonList, type PresidentialComparison } from './comparison';

export type RealtimeStatus = 'loading' | 'connected' | 'reconnecting' | 'unavailable';

function displayLoadError(reason: unknown): string {
  return reason instanceof Error && reason.message.startsWith('A comparação')
    ? reason.message
    : 'O backend não respondeu. Tente novamente quando a integração estiver disponível.';
}

export function usePresidentialComparisons() {
  const [comparisons, setComparisons] = useState<Record<string, PresidentialComparison>>({});
  const [status, setStatus] = useState<RealtimeStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const scopesRef = useRef<string[]>([]);
  useEffect(() => {
    let active = true; let socket: WebSocket | undefined; let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const load = async (): Promise<string[]> => {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
      const response = await fetch(`${apiBaseUrl()}/results/second-round/president`, { signal });
      if (!response.ok) throw new Error(response.status === 404 ? 'A comparação do segundo turno ainda não está configurada no backend.' : 'Não foi possível carregar os dados oficiais.');
      const payload = await response.json() as ComparisonList;
      const scopes = payload.results.map((comparison) => comparison.scope.code);
      if (active) { scopesRef.current = scopes; setComparisons(Object.fromEntries(payload.results.map((comparison) => [comparison.scope.code, comparison]))); setError(null); }
      return scopes;
    };
    const subscribe = (scopes: string[]) => scopes.forEach((scopeCode) => socket?.send(JSON.stringify({ type: 'subscribe.second-round-comparison', scopeCode })));
    const connect = () => {
      socket = new WebSocket(websocketUrl());
      socket.onopen = async () => { try { const scopes = scopesRef.current.length > 0 ? scopesRef.current : await load(); if (!active) return; subscribe(scopes); setStatus('connected'); } catch (reason) { if (!active) return; setStatus('unavailable'); setError(displayLoadError(reason)); } };
      socket.onmessage = (event) => { try { const message = JSON.parse(event.data) as { type?: string; data?: { comparison?: PresidentialComparison } }; const comparison = message.data?.comparison; if (message.type === 'second-round.comparison.updated' && comparison && active) setComparisons((current) => ({ ...current, [comparison.scope.code]: comparison })); } catch { /* ignore malformed messages */ } };
      socket.onclose = () => { if (!active) return; setStatus('reconnecting'); reconnectTimer = setTimeout(connect, 3_000); };
    };
    void load().then(() => active && setStatus('reconnecting')).catch((reason) => { if (!active) return; setStatus('unavailable'); setError(displayLoadError(reason)); });
    connect();
    return () => { active = false; controller.abort(); if (reconnectTimer) clearTimeout(reconnectTimer); socket?.close(); };
  }, []);
  return { comparisons, status, error };
}
