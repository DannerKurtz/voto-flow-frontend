'use client';

import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { PresidentialComparison } from '../../lib/comparison';
import { candidateTheme } from '../../lib/theme';
import { formatPercentage, formatVotes } from '../../lib/format';
import { useNationalVoteHistory } from '../../lib/use-national-vote-history';
import { buildCandidateLine, nearestHistoryPoint, voteChart, voteChartScale, voteCoordinates } from './national-vote-model';

const time = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
const detailedTime = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const keys = ['flavio', 'lula'] as const;

export function NationalVoteLineChart({ comparison }: { comparison: PresidentialComparison | undefined }) {
  const { points, loading, error, retry } = useNationalVoteHistory(comparison);
  const [selectedAt, setSelectedAt] = useState<string | null>(null);
  const scale = voteChartScale(points);
  const plotHeight = voteChart.height - voteChart.top - voteChart.bottom;
  const plotWidth = voteChart.width - voteChart.left - voteChart.right;
  const selectedIndex = points.findIndex((point) => point.recordedAt === selectedAt);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : points.length - 1;
  const active = points[activeIndex];
  const activeX = active ? voteCoordinates(active, 'flavio', scale).x : 0;
  const ticks = Array.from({ length: scale.maximum / 25 + 1 }, (_, i) => i * 25);
  const timeTicks = points.length > 1 ? [scale.first, (scale.first + scale.last) / 2, scale.last] : points.map((point) => Date.parse(point.recordedAt));

  function selectPointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const index = nearestHistoryPoint(points, (event.clientX - bounds.left) / bounds.width * voteChart.width, scale);
    if (index >= 0) setSelectedAt(points[index].recordedAt);
  }
  function selectKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!points.length || event.target !== event.currentTarget) return;
    const index = event.key === 'ArrowLeft' ? Math.max(0, activeIndex - 1)
      : event.key === 'ArrowRight' ? Math.min(points.length - 1, activeIndex + 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : null;
    if (index === null) return;
    event.preventDefault();
    setSelectedAt(points[index].recordedAt);
  }

  return <div className="state-line-chart national-line-chart" role="group" aria-label="Evolução dos percentuais nacionais dos candidatos">
    {points.length > 0 ? <div className="national-chart-plot" tabIndex={0} onKeyDown={selectKey}
      aria-label="Gráfico nacional interativo. Use as setas para consultar os horários, ou toque no gráfico."
      onPointerLeave={() => setSelectedAt(null)}>
      <svg viewBox={`0 0 ${voteChart.width} ${voteChart.height}`} role="img" aria-labelledby="national-chart-title national-chart-description"
        onPointerMove={selectPointer} onPointerDown={selectPointer}>
        <title id="national-chart-title">Evolução dos percentuais nacionais</title>
        <desc id="national-chart-description">Percentuais oficiais de Flávio Bolsonaro, em azul, e Lula, em vermelho, durante a apuração presidencial do segundo turno. O eixo horizontal mostra horários de registro em Brasília e o vertical começa em zero por cento.</desc>
        {ticks.map((tick) => {
          const y = voteChart.top + (1 - tick / scale.maximum) * plotHeight;
          return <g key={tick} className="line-chart-grid">
            <line x1={voteChart.left} x2={voteChart.left + plotWidth} y1={y} y2={y} />
            <text x={voteChart.left - 12} y={y + 5} textAnchor="end">{tick}%</text>
          </g>;
        })}
        {keys.map((key) => <path key={key} className={`line-chart-series line-chart-${key}`} d={buildCandidateLine(points, key, scale)} pathLength={1} />)}
        {timeTicks.map((timestamp, index) => <text key={index} className="line-chart-state-label"
          x={voteChart.left + (timeTicks.length === 1 ? 0.5 : index / (timeTicks.length - 1)) * plotWidth}
          y={voteChart.top + plotHeight + 27} textAnchor="middle">{time.format(new Date(timestamp)).replace(':', 'h')}</text>)}
        {active && <g className="national-chart-selection" pointerEvents="none">
          <line x1={activeX} x2={activeX} y1={voteChart.top} y2={voteChart.top + plotHeight} />
          {keys.map((key) => {
            const { x, y } = voteCoordinates(active, key, scale);
            return <circle key={key} className={`national-chart-dot line-chart-point-${key}`} cx={x} cy={y} r="4.5" />;
          })}
          <rect x={activeX - 27} y={voteChart.top + plotHeight + 8} width="54" height="26" rx="4" />
          <text x={activeX} y={voteChart.top + plotHeight + 26} textAnchor="middle">{time.format(new Date(active.recordedAt)).replace(':', 'h')}</text>
        </g>}
      </svg>
      {active && <div className="national-chart-tooltip" role="status"
        style={{ left: `clamp(8px, calc(${activeX / voteChart.width * 100}% - 248px), calc(100% - 248px))` }}>
        {[...active.candidates].sort((a, b) => b.percentage - a.percentage).map((candidate) => <div key={candidate.key} className="national-chart-tooltip-row">
          <span className={`national-chart-party national-chart-party-${candidate.key}`}>{candidateTheme[candidate.key].party}</span>
          <span>{candidateTheme[candidate.key].chartName}</span>
          <strong>{formatPercentage(candidate.percentage)}</strong>
        </div>)}
        <span className="sr-only">Registro às {detailedTime.format(new Date(active.recordedAt))}, horário de Brasília.</span>
      </div>}
    </div> : <p className="map-caption" role="status">{loading ? 'Carregando o histórico nacional…' : 'O gráfico aparecerá quando houver registros oficiais do segundo turno.'}</p>}
    {points.length === 1 && <p className="map-caption">Primeiro registro recebido. As linhas se formarão com as próximas atualizações.</p>}
    {error && <p className="map-caption" role="status">{error} <button type="button" onClick={retry}>Tentar novamente</button></p>}
    <div className="state-line-chart-legend" aria-label="Legenda do gráfico">
      {keys.map((key) => <span key={key}><i className={`line-chart-key line-chart-key-${key}`} />{candidateTheme[key].chartName}</span>)}
      <span className="line-chart-note">Percentuais oficiais do segundo turno · registros em Brasília</span>
    </div>
    {points.length > 0 && <details className="state-line-chart-data">
      <summary>Consultar histórico nacional</summary>
      <div className="state-line-chart-table-scroll"><table>
        <thead><tr><th scope="col">Registro (Brasília)</th>{keys.map((key) => <th key={key} scope="col">{candidateTheme[key].chartName}</th>)}<th scope="col">Apurado</th></tr></thead>
        <tbody>{points.map((point, index) => <tr key={`${point.recordedAt}-${index}`}>
          <th scope="row">{detailedTime.format(new Date(point.recordedAt))}</th>
          {keys.map((key) => {
            const candidate = point.candidates.find((entry) => entry.key === key)!;
            return <td key={key}>{formatPercentage(candidate.percentage)} · {formatVotes(candidate.votes)} votos</td>;
          })}
          <td>{formatPercentage(point.totalizationPercentage)}</td>
        </tr>)}</tbody>
      </table></div>
    </details>}
  </div>;
}
