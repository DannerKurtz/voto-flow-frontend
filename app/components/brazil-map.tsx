'use client';

import { useMemo, useState } from 'react';
import { brazilStatePaths } from './brazil-map-paths';
import { stateAppearance, type PresidentialComparison } from '../lib/comparison';
import { candidateTheme, mapTheme } from '../lib/theme';

const stateNames: Record<string, string> = { ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins' };

type StateShape = { code: string; path: string; centerX: number; centerY: number; width: number; height: number };
type DisputedState = StateShape & { margin: number; flavio: number; lula: number };
type BadgePlacement = { state: DisputedState; x: number; y: number };

function getStateShape(code: string, path: string): StateShape {
  const points = Array.from(path.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g), (match) => [Number(match[1]), Number(match[2])] as const);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return { code, path, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY };
}

const stateShapes = Object.entries(brazilStatePaths).map(([code, path]) => getStateShape(code, path));
const badgeSlots = [
  [16, 22], [38, 22], [61, 22], [84, 22],
  [16, 42], [38, 42], [61, 42], [84, 42],
  [16, 62], [38, 62], [61, 62], [84, 62],
  [16, 82], [38, 82], [61, 82], [84, 82],
] as const;

function formatPercentage(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

export function BrazilMap({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'leadership' | 'dispute'>('dispute');
  const activeAppearance = activeState ? stateAppearance(comparisons[activeState], stateNames[activeState]) : null;

  const { badgePlacements, disputedCount } = useMemo(() => {
    const candidates = stateShapes.flatMap((shape) => {
      const comparison = comparisons[shape.code];
      const appearance = stateAppearance(comparison, stateNames[shape.code]);
      if (!comparison || !appearance.shares) return [];
      const { flavio, lula } = appearance.shares;
      const margin = Math.abs(flavio - lula);
      if (margin > mapTheme.swingMarginPercentagePoints) return [];
      return [{ ...shape, margin, flavio, lula }];
    }).sort((left, right) => left.margin - right.margin);

    const availableSlots = [...badgeSlots];
    const placements: BadgePlacement[] = [];
    for (const candidate of candidates) {
      if (placements.length === 10 || availableSlots.length === 0) break;
      let bestIndex = 0;
      let bestDistance = Infinity;
      availableSlots.forEach(([x, y], index) => {
        const distance = Math.hypot(x * 10 - candidate.centerX, y * 10 - candidate.centerY);
        if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
      });
      const [x, y] = availableSlots.splice(bestIndex, 1)[0];
      placements.push({ state: candidate, x, y });
    }
    return { badgePlacements: placements, disputedCount: candidates.length };
  }, [comparisons]);

  return <section className="map-panel" aria-labelledby="map-title">
    <div className="map-heading">
      <div><p className="eyebrow">Por unidade federativa</p><h2 id="map-title">Mapa eleitoral</h2></div>
      <div className="map-view-toggle" role="group" aria-label="Modo de visualização do mapa">
        <button type="button" className={viewMode === 'leadership' ? 'is-active' : ''} aria-pressed={viewMode === 'leadership'} onClick={() => setViewMode('leadership')}>Liderança</button>
        <button type="button" className={viewMode === 'dispute' ? 'is-active' : ''} aria-pressed={viewMode === 'dispute'} onClick={() => setViewMode('dispute')}>Disputa</button>
      </div>
    </div>

    <div className="map-canvas">
      <div className="map-graphic">
      <svg viewBox="0 0 1000 1000" role="img" aria-describedby="map-description">
        <title>Mapa eleitoral do Brasil por estado</title>
        <desc id="map-description">Cada estado é dividido diagonalmente na proporção dos votos. Na visão Disputa, estados com margem de até cinco pontos percentuais recebem uma faixa hachurada cuja largura cresce conforme a disputa se aproxima do empate. Os crachás identificam as dez menores margens disponíveis.</desc>
        <defs>
          <pattern id="swing-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(38)">
            <path d="M0 0V12" stroke={candidateTheme.flavio.color} strokeWidth="4" />
            <path d="M6 0V12" stroke={candidateTheme.lula.color} strokeWidth="4" />
          </pattern>
          {stateShapes.map((shape) => {
            const appearance = stateAppearance(comparisons[shape.code], stateNames[shape.code]);
            const flavioShare = appearance.shares
              ? appearance.shares.flavio / (appearance.shares.flavio + appearance.shares.lula) * 100
              : 50;
            const transition = 0.6;
            return <g key={`defs-${shape.code}`}>
              <clipPath id={`state-clip-${shape.code}`}><path d={shape.path} /></clipPath>
              {appearance.shares && <linearGradient id={`state-gradient-${shape.code}`} x1="0%" y1="100%" x2="100%" y2="22%">
                <stop offset="0%" stopColor={candidateTheme.flavio.color} />
                <stop offset={`${Math.max(0, flavioShare - transition)}%`} stopColor={candidateTheme.flavio.color} />
                <stop offset={`${flavioShare}%`} stopColor={mapTheme.tension} />
                <stop offset={`${Math.min(100, flavioShare + transition)}%`} stopColor={candidateTheme.lula.color} />
                <stop offset="100%" stopColor={candidateTheme.lula.color} />
              </linearGradient>}
            </g>;
          })}
        </defs>

        {stateShapes.map((shape) => {
          const comparison = comparisons[shape.code];
          const appearance = stateAppearance(comparison, stateNames[shape.code]);
          const closeMargin = appearance.shares ? Math.abs(appearance.shares.flavio - appearance.shares.lula) : Infinity;
          const tension = Math.max(0, 1 - closeMargin / mapTheme.swingMarginPercentagePoints);
          const hatchWidth = shape.width * (0.06 + tension * (mapTheme.maximumHatchWidthPercentage - 6) / 100);
          const title = appearance.label;

          return <g
            key={shape.code}
            className="state-region"
            tabIndex={0}
            role="img"
            aria-label={title}
            onPointerEnter={() => setActiveState(shape.code)}
            onPointerLeave={() => setActiveState(null)}
            onFocus={() => setActiveState(shape.code)}
            onBlur={() => setActiveState(null)}
          >
            <path
              d={shape.path}
              className="state-base"
              fill={viewMode === 'dispute' && appearance.shares ? `url(#state-gradient-${shape.code})` : appearance.fill}
              stroke={mapTheme.neutralStroke}
            />
            {viewMode === 'dispute' && appearance.shares && closeMargin <= mapTheme.swingMarginPercentagePoints && <g clipPath={`url(#state-clip-${shape.code})`} aria-hidden="true">
              <g transform={`rotate(-38 ${shape.centerX} ${shape.centerY})`}>
                <rect
                  x={shape.centerX - hatchWidth / 2}
                  y={shape.centerY - shape.height}
                  width={hatchWidth}
                  height={shape.height * 2}
                  fill="url(#swing-hatch)"
                />
              </g>
            </g>}
          </g>;
        })}
        {stateShapes.map((shape) => <text key={`label-${shape.code}`} className="state-abbreviation" x={shape.centerX} y={shape.centerY} aria-hidden="true">{shape.code.toUpperCase()}</text>)}
        {viewMode === 'dispute' && badgePlacements.map(({ state, x, y }) => <line key={`leader-${state.code}`} className="badge-leader" x1={x * 10} y1={y * 10} x2={state.centerX} y2={state.centerY} />)}
      </svg>

      {viewMode === 'dispute' && badgePlacements.map(({ state, x, y }) => {
        const tag = state.margin < 1 ? 'VOTO A VOTO' : 'DISPUTA ACIRRADA';
        return <div
          key={`badge-${state.code}`}
          className="map-floating-badge"
          style={{ left: `${x}%`, top: `${y}%` }}
          aria-label={`${stateNames[state.code]}, ${tag}: Flávio ${formatPercentage(state.flavio)}, Lula ${formatPercentage(state.lula)}`}
        >
          <div className="map-badge-topline"><span><i className={state.margin < 1 ? 'badge-dot badge-dot-tie' : 'badge-dot'} />{state.code.toUpperCase()} · {tag}</span></div>
          <div className="map-badge-percentages"><strong>{formatPercentage(state.flavio)}</strong><small>VS</small><strong>{formatPercentage(state.lula)}</strong></div>
          <div className="map-badge-bar" role="img" aria-label={`Flávio ${formatPercentage(state.flavio)}, Lula ${formatPercentage(state.lula)}`}>
            <span className="map-badge-blue" style={{ width: `${state.flavio}%` }} />
            <span className="map-badge-red" style={{ width: `${state.lula}%` }} />
            <i aria-hidden="true" />
          </div>
        </div>;
      })}
      </div>

      <div className="map-tooltip" aria-live="polite">
        {activeState && activeAppearance
          ? <><strong>{stateNames[activeState]}</strong><span>{activeAppearance.label.replace(`${stateNames[activeState]}: `, '')}</span></>
          : <span>Passe o mouse ou navegue pelo teclado para consultar uma UF.</span>}
      </div>
    </div>

    <div className="map-legend" aria-label="Legenda do mapa">
      <span><i className="legend-blue" />{candidateTheme.flavio.name}</span>
      <span><i className="legend-red" />{candidateTheme.lula.name}</span>
      {viewMode === 'dispute' && <span><i className="legend-swing" />Faixa hachurada: zona em disputa</span>}
      <span><i className="legend-neutral" />Apurando</span>
    </div>
    {viewMode === 'dispute' && <p className="map-caption">Proporção territorial de votos e faixa hachurada de competitividade nos estados em disputa. <strong>{disputedCount} estados</strong> dentro da margem de até {mapTheme.swingMarginPercentagePoints} pontos percentuais.</p>}
  </section>;
}
