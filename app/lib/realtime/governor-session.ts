import type { GovernorResult, GovernorState } from '../governors.ts';
import { parseGovernorUpdate } from './governor-parser.ts';

type Socket = Pick<WebSocket, 'send' | 'close' | 'onopen' | 'onclose' | 'onmessage' | 'onerror'>;
type Dependencies = {
  load(signal: AbortSignal): Promise<GovernorResult[]>;
  createSocket(): Socket;
  onChange(state: GovernorState): void;
  reconnectDelayMs?: number;
};

export function startGovernorSession(dependencies: Dependencies): () => void {
  const controller = new AbortController();
  const revisions = new Map<string, number>();
  let state: GovernorState = { results: {}, status: 'loading', error: null };
  let stopped = false;
  let socket: Socket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingLoad: Promise<string[]> | undefined;
  const emit = (patch: Partial<GovernorState>) => {
    if (stopped) return;
    state = { ...state, ...patch };
    dependencies.onChange(state);
  };
  const fail = (reason: unknown) => emit({
    status: 'unavailable', error: reason instanceof Error ? reason.message : 'Não foi possível consultar os governos estaduais.',
  });
  function load() {
    if (pendingLoad) return pendingLoad;
    const atStart = new Map(revisions);
    pendingLoad = dependencies.load(controller.signal).then((results) => {
      if (stopped) return [];
      const next = { ...state.results };
      for (const result of results) {
        if ((revisions.get(result.scope.code) ?? 0) === (atStart.get(result.scope.code) ?? 0)) next[result.scope.code] = result;
      }
      emit({ results: next, error: null });
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
    let connection: Socket;
    try { connection = dependencies.createSocket(); } catch { reconnect(); return; }
    socket = connection;
    let awaiting = new Set<string>();
    connection.onopen = async () => {
      try {
        const scopes = Object.keys(state.results).length ? Object.keys(state.results) : await load();
        if (stopped || socket !== connection) return;
        awaiting = new Set(scopes);
        for (const scopeCode of scopes) connection.send(JSON.stringify({ type: 'subscribe.second-round-governor', scopeCode }));
        if (awaiting.size === 0) emit({ status: 'connected', error: null });
      } catch (reason) {
        if (!stopped && socket === connection) { fail(reason); connection.close(); }
      }
    };
    connection.onmessage = (event) => {
      if (stopped || socket !== connection) return;
      const result = parseGovernorUpdate(event.data);
      if (result) {
        const code = result.scope.code;
        revisions.set(code, (revisions.get(code) ?? 0) + 1);
        emit({ results: { ...state.results, [code]: result } });
        return;
      }
      try {
        const message = JSON.parse(String(event.data));
        if (message?.type === 'subscribed' && message.data?.subscription === 'second-round-governor'
          && awaiting.delete(message.data.scopeCode) && awaiting.size === 0) {
          void load().then(() => {
            if (socket === connection) emit({ status: 'connected', error: null });
          }).catch((reason) => {
            if (socket === connection && !stopped) { fail(reason); connection.close(); }
          });
        }
      } catch { /* Ignore invalid or unrelated frames. */ }
    };
    connection.onerror = () => connection.close();
    connection.onclose = () => {
      if (socket !== connection) return;
      socket = undefined;
      reconnect();
    };
  }
  void load().catch(fail);
  connect();
  return () => {
    stopped = true;
    controller.abort();
    clearTimeout(timer);
    if (socket) { socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null; socket.close(); }
  };
}
