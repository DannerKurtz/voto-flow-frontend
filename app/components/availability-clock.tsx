'use client';

import { useEffect, useState } from 'react';

const target = new Date(process.env.NEXT_PUBLIC_RESULTS_START_AT ?? '2026-10-25T17:00:00-03:00').getTime();
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1_000);
  return [Math.floor(seconds / 3_600), Math.floor(seconds % 3_600 / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0')).join(':');
}

export function AvailabilityClock() {
  // Server and first client render must agree; the clock starts after hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  if (!Number.isFinite(target)) return null;
  const open = now !== null && now >= target;
  return <div className={`availability ${open ? 'available' : ''}`}>
    <span>{open ? 'Consulta liberada há' : 'Consulta oficial em'}</span>
    <strong>{now === null ? '--:--:--' : formatDuration(Math.abs(target - now))}</strong>
    <small>Horário de Brasília</small>
  </div>;
}
