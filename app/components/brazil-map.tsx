'use client';

import { useMemo, useState } from 'react';
import { MapGeography } from './map/geography';
import { buildMapBadges, buildMapStates } from './map/model';
import { stateNames } from './map/geometry';
import { formatPercentage } from '../lib/format';
import type { PresidentialComparison } from '../lib/comparison';
import { stateAppearance } from '../lib/map-appearance';
import { candidateTheme, mapTheme } from '../lib/theme';

export function BrazilMap({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'leadership' | 'dispute'>('dispute');
  const activeAppearance = activeState ? stateAppearance(comparisons[activeState], stateNames[activeState]) : null;

  const states = useMemo(() => buildMapStates(comparisons), [comparisons]);
  const { badgePlacements, disputedCount } = useMemo(() => buildMapBadges(states), [states]);

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
      <MapGeography states={states} viewMode={viewMode} badgePlacements={badgePlacements} onActiveStateChange={setActiveState} />

      {viewMode === 'dispute' && badgePlacements.map(({ state, x, y }) => {
        const tag = state.margin < 1 ? 'VOTO A VOTO' : 'DISPUTA ACIRRADA';
        return <div
          key={`badge-${state.code}`}
          className="map-floating-badge"
          style={{ left: `${x}%`, top: `${y}%` }}
          aria-label={`${stateNames[state.code]}, ${tag}: Flávio ${formatPercentage(state.flavio, true)}, Lula ${formatPercentage(state.lula, true)}`}
        >
          <div className="map-badge-topline"><span><i className={state.margin < 1 ? 'badge-dot badge-dot-tie' : 'badge-dot'} />{state.code.toUpperCase()} · {tag}</span></div>
          <div className="map-badge-percentages"><strong>{formatPercentage(state.flavio, true)}</strong><small>VS</small><strong>{formatPercentage(state.lula, true)}</strong></div>
          <div className="map-badge-bar" role="img" aria-label={`Flávio ${formatPercentage(state.flavio, true)}, Lula ${formatPercentage(state.lula, true)}`}>
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
