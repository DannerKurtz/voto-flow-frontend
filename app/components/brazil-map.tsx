'use client';

import { useMemo, useState } from 'react';
import { brazilStatePaths } from './brazil-map-paths';
import { stateAppearance, type PresidentialComparison } from '../lib/comparison';
import { candidateTheme, mapTheme } from '../lib/theme';

const stateNames: Record<string, string> = { ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins' };

type StateShape = { code: string; path: string; centerX: number; centerY: number; width: number; height: number };
type DisputedState = StateShape & { comparison: PresidentialComparison; margin: number; flavio: number; lula: number };

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
const badgeWidth = 390;
const badgeHeight = 180;

function formatPercentage(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

export function BrazilMap({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'leadership' | 'dispute'>('dispute');
  const activeAppearance = activeState ? stateAppearance(comparisons[activeState], stateNames[activeState]) : null;

  const disputedStates = useMemo(() => {
    const candidates = stateShapes.flatMap((shape) => {
      const comparison = comparisons[shape.code];
      const appearance = stateAppearance(comparison, stateNames[shape.code]);
      if (!comparison || !appearance.shares) return [];
      const { flavio, lula } = appearance.shares;
      const margin = Math.abs(flavio - lula);
      if (margin > mapTheme.swingMarginPercentagePoints) return [];
      return [{ ...shape, comparison, margin, flavio, lula }];
    }).sort((left, right) => left.margin - right.margin);

    const selected: DisputedState[] = [];
    for (const candidate of candidates) {
      const overlapsBadge = selected.some((placed) =>
        Math.abs(placed.centerX - candidate.centerX) < badgeWidth &&
        Math.abs(placed.centerY - candidate.centerY) < badgeHeight,
      );
      if (!overlapsBadge) selected.push(candidate);
      if (selected.length === 3) break;
    }
    return selected;
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
        <desc id="map-description">Na visão Disputa, as cores são distribuídas em gradiente diagonal proporcional aos percentuais estaduais. Estados com margem de até cinco pontos percentuais recebem uma faixa hachurada. Na visão Liderança, cada estado usa a cor viva do candidato mais votado.</desc>
        <defs>
          <pattern id="swing-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(38)">
            <rect width="12" height="12" fill={mapTheme.tension} fillOpacity=".72" />
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
          const hatchWidth = shape.width * (0.04 + tension * (mapTheme.maximumHatchWidthPercentage - 4) / 100);
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
      </svg>

      {viewMode === 'dispute' && disputedStates.map((state) => {
        const tag = state.margin < 1 ? 'Voto a voto' : 'Disputa apertada';
        return <div
          key={`badge-${state.code}`}
          className="map-floating-badge"
          style={{ left: `${state.centerX / 10}%`, top: `${state.centerY / 10}%` }}
          aria-label={`${stateNames[state.code]}, ${tag}: Flávio ${formatPercentage(state.flavio)}, Lula ${formatPercentage(state.lula)}`}
        >
          <div className="map-badge-topline"><span>{tag}</span><b>{stateNames[state.code]}</b></div>
          <div className="map-badge-percentages"><strong>{formatPercentage(state.flavio)}</strong><strong>{formatPercentage(state.lula)}</strong></div>
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
      {viewMode === 'dispute' && <span><i className="legend-swing" />Voto a voto</span>}
      <span><i className="legend-neutral" />Apurando</span>
    </div>
  </section>;
}
