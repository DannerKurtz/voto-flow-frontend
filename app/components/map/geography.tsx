import { memo } from 'react';
import { candidateTheme, mapTheme } from '../../lib/theme';
import type { BadgePlacement } from './geometry';
import type { MapState, MapViewMode } from './model';

type Props = {
  states: MapState[];
  viewMode: MapViewMode;
  badgePlacements: BadgePlacement[];
  onActiveStateChange: (code: string | null) => void;
};

// Hovering a state changes the tooltip, not the expensive SVG tree.
export const MapGeography = memo(function MapGeography({ states, viewMode, badgePlacements, onActiveStateChange }: Props) {
  return (
      <svg viewBox="0 0 1000 1000" role="img" aria-describedby="map-description">
        <title>Mapa eleitoral do Brasil por estado</title>
        <desc id="map-description">Cada estado é dividido diagonalmente na proporção dos votos. Na visão Disputa, estados com margem de até cinco pontos percentuais recebem uma faixa hachurada cuja largura cresce conforme a disputa se aproxima do empate. Os crachás identificam as dez menores margens disponíveis.</desc>
        <defs>
          <pattern id="swing-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(38)">
            <path d="M0 0V12" stroke={candidateTheme.flavio.color} strokeWidth="4" />
            <path d="M6 0V12" stroke={candidateTheme.lula.color} strokeWidth="4" />
          </pattern>
          {states.map((shape) => {
            const { appearance, flavioShare } = shape;
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

        {states.map((shape) => {
          const { appearance, closeMargin, hatchWidth } = shape;
          const title = appearance.label;

          return <g
            key={shape.code}
            className="state-region"
            tabIndex={0}
            role="img"
            aria-label={title}
            onPointerEnter={() => onActiveStateChange(shape.code)}
            onPointerLeave={() => onActiveStateChange(null)}
            onFocus={() => onActiveStateChange(shape.code)}
            onBlur={() => onActiveStateChange(null)}
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
        {states.map((shape) => <text key={`label-${shape.code}`} className="state-abbreviation" x={shape.centerX} y={shape.centerY} aria-hidden="true">{shape.code.toUpperCase()}</text>)}
        {viewMode === 'dispute' && badgePlacements.map(({ state, x, y }) => <line key={`leader-${state.code}`} className="badge-leader" x1={x * 10} y1={y * 10} x2={state.centerX} y2={state.centerY} />)}
      </svg>
  );
});
