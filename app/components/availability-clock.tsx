'use client';

import { useEffect, useState } from 'react';
import { getAvailabilityClockState } from '../lib/availability-clock-state';

const target = new Date(process.env.NEXT_PUBLIC_RESULTS_START_AT ?? '2026-10-25T17:00:00-03:00').getTime();
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1_000);
  return [Math.floor(seconds / 3_600), Math.floor(seconds % 3_600 / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0')).join(':');
}

export function AvailabilityClock({ officialResultsAvailable }: { officialResultsAvailable: boolean }) {
  // Server and first client render must agree; the clock starts after hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  if (!Number.isFinite(target)) return null;
  const clock = getAvailabilityClockState(now, target, officialResultsAvailable);
  return <div className={`availability ${clock.status === 'available' ? 'available' : ''}`}>
    <span>{clock.status === 'countdown' ? 'Consulta oficial em' : clock.status === 'waiting' ? 'Aguardando dados oficiais há' : 'Consulta liberada'}</span>
    <strong>{clock.status === 'available' ? 'Dados oficiais' : `${clock.status === 'waiting' ? '+' : ''}${now === null ? '--:--:--' : formatDuration(clock.milliseconds)}`}</strong>
    <small>{clock.status === 'available' ? 'Apuração atualizada em tempo real' : clock.status === 'waiting' ? 'Acréscimo após o horário previsto · Brasília' : 'Horário de Brasília'}</small>
  </div>;
}
