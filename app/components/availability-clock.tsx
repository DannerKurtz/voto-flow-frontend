'use client';

import { useEffect, useState } from 'react';

const target = new Date(process.env.NEXT_PUBLIC_RESULTS_START_AT ?? '2026-10-04T17:00:00-03:00').getTime();
const format = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1_000);
  return [Math.floor(seconds / 3_600), Math.floor(seconds % 3_600 / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0')).join(':');
};

export function AvailabilityClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1_000); return () => clearInterval(id); }, []);
  const open = now >= target;
  return <div className={`availability ${open ? 'available' : ''}`}><span>{open ? 'Consulta liberada há' : 'Consulta oficial em'}</span><strong>{format(Math.abs(target - now))}</strong><small>Horário de Brasília</small></div>;
}
