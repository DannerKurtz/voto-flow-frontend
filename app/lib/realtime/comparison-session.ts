import type { PresidentialComparison } from '../comparison.ts';
import { parseComparisonUpdate } from './comparison-parser.ts';

export type RealtimeStatus = 'loading' | 'connected' | 'reconnecting' | 'unavailable';
export type ComparisonState = {
  comparisons: Record<string, PresidentialComparison>;
  status: RealtimeStatus;
  error: string | null;
};
export type ComparisonSocket = Pick<WebSocket, 'send' | 'close' | 'onopen' | 'onclose' | 'onmessage' | 'onerror'>;
type SessionDependencies = {
  load(signal: AbortSignal): Promise<PresidentialComparison[]>;
  createSocket(): ComparisonSocket;
  onChange(state: ComparisonState): void;
  reconnectDelayMs?: number;
};

// Owns transport lifecycle independently of React; one instance per mounted dashboard.
export function startComparisonSession(dependencies: SessionDependencies): () => void {
  const controller = new AbortController();
  let stopped = false;
  let socket: ComparisonSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingLoad: Promise<string[]> | undefined;
  const revisions = new Map<string, number>();
  let state: ComparisonState = { comparisons: {}, status: 'loading', error: null };
  const emit = (patch: Partial<ComparisonState>) => {
    if (stopped) return;
    state = { ...state, ...patch };
    dependencies.onChange(state);
  };
  const reportFailure = (reason: unknown) => emit({
    status: 'unavailable',
    error: reason instanceof Error ? reason.message : 'O backend não respondeu. Tente novamente em instantes.',
  });

  function load(): Promise<string[]> {
    if (pendingLoad) return pendingLoad;
    const atStart = new Map(revisions);
    pendingLoad = dependencies.load(controller.signal).then((results) => {
      if (stopped) return [];
      const comparisons = { ...state.comparisons };
      for (const comparison of results) {
        const code = comparison.scope.code;
        // A newer WS update takes precedence over an older in-flight HTTP snapshot.
        if ((revisions.get(code) ?? 0) === (atStart.get(code) ?? 0)) comparisons[code] = comparison;
      }
      emit({ comparisons, error: null });
      return results.map((result) => result.scope.code);
    }).finally(() => { pendingLoad = undefined; });
    return pendingLoad;
  }

  function reconnect() {
    if (stopped) return;
    emit({ status: 'reconnecting' });
    clearTimeout(timer);
    timer = setTimeout(connect, dependencies.reconnectDelayMs ?? 3_000);
  }

  function connect() {
    if (stopped) return;
    let connection: ComparisonSocket;
    try { connection = dependencies.createSocket(); } catch { reconnect(); return; }
    socket = connection;
    let awaitingSubscriptions = new Set<string>();
    connection.onopen = async () => {
      try {
        const scopes = Object.keys(state.comparisons).length ? Object.keys(state.comparisons) : await load();
        if (stopped || socket !== connection) return;
        awaitingSubscriptions = new Set(scopes);
        for (const scopeCode of scopes) connection.send(JSON.stringify({ type: 'subscribe.second-round-comparison', scopeCode }));
        if (scopes.length === 0) emit({ status: 'connected', error: null });
      } catch (reason) {
        if (stopped || socket !== connection) return;
        reportFailure(reason);
        connection.close();
      }
    };
    connection.onmessage = (event) => {
      if (stopped || socket !== connection) return;
      const comparison = parseComparisonUpdate(event.data);
      if (comparison) {
        const code = comparison.scope.code;
        revisions.set(code, (revisions.get(code) ?? 0) + 1);
        emit({ comparisons: { ...state.comparisons, [code]: comparison } });
        return;
      }
      try {
        const message = JSON.parse(String(event.data));
        if (message?.type === 'subscribed' && message.data?.subscription === 'second-round-comparison'
          && awaitingSubscriptions.delete(message.data.scopeCode) && awaitingSubscriptions.size === 0) {
          // Backfill the gap between the initial snapshot (or disconnection) and subscription.
          void load().then(() => {
            if (socket === connection) emit({ status: 'connected', error: null });
          }).catch((reason) => {
            if (socket === connection && !stopped) { reportFailure(reason); connection.close(); }
          });
        }
      } catch { /* Non-protocol messages cannot update dashboard state. */ }
    };
    connection.onerror = () => connection.close();
    connection.onclose = () => {
      if (socket !== connection) return;
      socket = undefined;
      reconnect();
    };
  }

  void load().catch(reportFailure);
  connect();
  return () => {
    stopped = true;
    controller.abort();
    clearTimeout(timer);
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      socket.close();
    }
  };
}
