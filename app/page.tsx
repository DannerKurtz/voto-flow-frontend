'use client';

import { useEffect, useState } from 'react';

import { ApurationChart } from './components/apuration-chart';
import { AvailabilityClock } from './components/availability-clock';

type Result = { electionCode: string; scopeCode: string; officeCode: string; sourcePayload: any; updatedAt: string };
type Snapshot = { createdAt: string; sourcePayload: any };

const options = [
  ['6257', 'br', '0001', 'Presidente', 'Brasil'],
  ['6259', 'sp', '0003', 'Governador', 'São Paulo'],
  ['6259', 'sp', '0005', 'Senador', 'São Paulo'],
  ['6259', 'sp', '0006', 'Deputado Federal', 'São Paulo'],
  ['6259', 'sp', '0007', 'Deputado Estadual', 'São Paulo'],
];
const fallbackApi = 'https://voto-flow-backend.onrender.com';
const configuredApi = process.env.NEXT_PUBLIC_API_URL;
const api = configuredApi?.startsWith('http://') || configuredApi?.startsWith('https://')
  ? configuredApi
  : fallbackApi;

function voteTotal(candidate: { vap?: string | number }): number {
  return Number(String(candidate.vap ?? '0').replace(/\D/g, '')) || 0;
}

export default function Page() {
  const [selected, setSelected] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [state, setState] = useState('Carregando dados oficiais…');
  const choice = options[selected];
  const path = `/results/${choice[0]}/${choice[1]}/${choice[2]}`;

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const load = async () => {
      const [currentResponse, snapshotsResponse] = await Promise.all([
        fetch(api + path, { signal: controller.signal }),
        fetch(`${api + path}/snapshots`, { signal: controller.signal }),
      ]);
      if (!currentResponse.ok || !snapshotsResponse.ok) throw new Error('Result unavailable');
      const [current, history] = await Promise.all([currentResponse.json(), snapshotsResponse.json()]);
      if (live) {
        setResult(current);
        setSnapshots(history);
        setState('Conectado ao backend');
      }
    };

    setResult(null);
    setSnapshots([]);
    setState('Carregando dados oficiais…');
    load().catch(() => live && setState('Resultado ainda não disponível'));

    const ws = new WebSocket(api.replace(/^http/, 'ws') + '/ws');
    ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', electionCode: choice[0], scopeCode: choice[1], officeCode: choice[2] }));
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'result.updated' && live) load().catch(() => undefined);
    };

    return () => {
      live = false;
      controller.abort();
      ws.close();
    };
  }, [path, choice]);

  const data = result?.sourcePayload;
  const office = data?.carg?.[0];
  const candidates = (office?.agr?.flatMap((scope: any) => scope.par?.flatMap((party: any) => party.cand?.map((candidate: any) => ({ ...candidate, partyName: party.nm })) ?? []) ?? []) ?? [])
    .sort((left: any, right: any) => voteTotal(right) - voteTotal(left));

  return <main>
    <header><b><i />Voto Flow</b><span className={result ? 'live' : 'offline'}>● {state}</span></header>
    <section className="intro"><h1>Apuração 2026</h1><p>Acompanhe a totalização das eleições gerais com dados oficiais armazenados pelo Voto Flow.</p><AvailabilityClock /><label>Resultado acompanhado<select value={selected} onChange={(event) => setSelected(+event.target.value)}>{options.map((option, index) => <option key={option[3]} value={index}>{option[3]} · {option[4]}</option>)}</select></label></section>
    <section className="grid"><article className="results"><div className="heading"><div><h2>{choice[3]} · {choice[4]}</h2><p>Arquivo EA20 oficial</p></div><strong>{data?.s?.pst ?? '—'}<small> totalizado</small></strong></div>{result ? <><div className="meta"><span>Última atualização<br /><b>{new Date(result.updatedAt).toLocaleString('pt-BR')}</b></span><span>Seções<br /><b>{data?.s?.st ?? '—'} de {data?.s?.ts ?? '—'}</b></span><span>Votos válidos<br /><b>{Number(data?.v?.vv ?? 0).toLocaleString('pt-BR')}</b></span></div><div className="table"><div className="row labels"><span># Candidato</span><span>Votos</span><span>%</span><span>Situação</span></div>{candidates.map((candidate: any, index: number) => <div className="row" key={candidate.sqcand}><span><em>{index + 1}</em><b>{candidate.nmu}</b><small>{candidate.n} · {candidate.partyName}</small></span><span>{voteTotal(candidate).toLocaleString('pt-BR')}</span><span>{candidate.pvap}%</span><span className={candidate.e === 's' ? 'elected' : ''}>{candidate.st}</span></div>)}</div></> : <div className="empty">{state}<br /><button onClick={() => location.reload()}>Tentar novamente</button></div>}</article><aside><article><h3>Evolução da apuração</h3><ApurationChart snapshots={snapshots} /><p>O gráfico é construído apenas com snapshots persistidos pelo backend.</p></article><article><h3>Fonte e integridade</h3><p>Dados recebidos do TSE pelo backend. A autenticidade JWS ainda não está marcada como verificada.</p></article></aside></section>
  </main>;
}
