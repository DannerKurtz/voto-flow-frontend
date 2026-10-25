'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapGeography } from './map/geography';
import { buildMapBadges, buildMapStates } from './map/model';
import { stateNames } from './map/geometry';
import { formatPercentage } from '../lib/format';
import type { PresidentialComparison } from '../lib/comparison';
import { stateAppearance } from '../lib/map-appearance';
import { candidateTheme, mapTheme } from '../lib/theme';
import { readMapViewPreference, writeMapViewPreference, type MapViewMode } from '../lib/map-view-preference';
import { StateVoteLineChart } from './map/state-vote-line-chart';

export function BrazilMap({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('dispute');
  const [viewModeRestored, setViewModeRestored] = useState(false);

  useEffect(() => {
    try {
      setViewMode(readMapViewPreference(window.localStorage));
    } catch {
      // Keep the default view when browser storage is unavailable.
    }
    setViewModeRestored(true);
  }, []);

  useEffect(() => {
    if (!viewModeRestored) return;
    try {
      writeMapViewPreference(window.localStorage, viewMode);
    } catch {
      // The selected view remains usable for this session if storage is unavailable.
    }
  }, [viewMode, viewModeRestored]);

  const activeAppearance = activeState ? stateAppearance(comparisons[activeState], stateNames[activeState]) : null;

  const states = useMemo(() => buildMapStates(comparisons), [comparisons]);
  const hoveredShape = states.find((state) => state.code === activeState);
  const hoverX = hoveredShape ? hoveredShape.centerX / 10 : 50;
  const hoverAlignment = hoverX <= 20 ? 'left' : hoverX >= 80 ? 'right' : 'center';
  const { badgePlacements, disputedCount } = useMemo(() => buildMapBadges(states), [states]);

  return <section className="map-panel" aria-labelledby="map-title">
    <div className="map-heading">
      <div><p className="eyebrow">Por unidade federativa</p><h2 id="map-title">{viewMode === 'chart' ? 'Gráfico por estado' : 'Mapa eleitoral'}</h2></div>
      <div className="map-view-toggle" role="group" aria-label="Modo de visualização dos resultados por estado">
        <button type="button" className={viewMode === 'leadership' ? 'is-active' : ''} aria-pressed={viewMode === 'leadership'} onClick={() => setViewMode('leadership')}>Liderança</button>
        <button type="button" className={viewMode === 'dispute' ? 'is-active' : ''} aria-pressed={viewMode === 'dispute'} onClick={() => setViewMode('dispute')}>Disputa</button>
        <button type="button" className={viewMode === 'chart' ? 'is-active' : ''} aria-pressed={viewMode === 'chart'} onClick={() => setViewMode('chart')}>Gráfico</button>
      </div>
    </div>

    {viewMode === 'chart' ? <StateVoteLineChart comparisons={comparisons} /> : <div className="map-canvas">
      <div className="map-graphic">
      <MapGeography states={states} viewMode={viewMode} badgePlacements={badgePlacements} onActiveStateChange={setActiveState} />

      {viewMode === 'dispute' && badgePlacements.filter(({ state }) => state.code !== activeState).map(({ state, x, y }) => {
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

      {activeState && activeAppearance && hoveredShape && <div
        className="map-floating-badge map-hover-badge"
        style={{
          left: `${Math.max(3, Math.min(97, hoverX))}%`,
          top: `${Math.max(10, Math.min(90, hoveredShape.centerY / 10))}%`,
          transform: `translate(${hoverAlignment === 'left' ? '0' : hoverAlignment === 'right' ? '-100%' : '-50%'}, -50%)`,
        }}
        aria-label={activeAppearance.label}
      >
        <div className="map-badge-topline"><span>{activeState.toUpperCase()}</span></div>
        {activeAppearance.shares
          ? <>
            <div className="map-badge-percentages"><strong>{formatPercentage(activeAppearance.shares.flavio, true)}</strong><small>VS</small><strong>{formatPercentage(activeAppearance.shares.lula, true)}</strong></div>
            <div className="map-badge-bar" role="img" aria-label={`Flávio ${formatPercentage(activeAppearance.shares.flavio, true)}, Lula ${formatPercentage(activeAppearance.shares.lula, true)}`}>
              <span className="map-badge-blue" style={{ width: `${activeAppearance.shares.flavio}%` }} />
              <span className="map-badge-red" style={{ width: `${activeAppearance.shares.lula}%` }} />
              <i aria-hidden="true" />
            </div>
          </>
          : <p className="map-hover-pending">Dados ainda não disponíveis</p>}
      </div>}
      </div>

      <div className="map-tooltip" aria-live="polite">
        <span>{activeState && activeAppearance
          ? `${stateNames[activeState]}: ${activeAppearance.label.replace(`${stateNames[activeState]}: `, '')}`
          : 'Passe o mouse, toque ou navegue pelo teclado sobre uma UF para ver o resumo da apuração.'}</span>
      </div>
    </div>}

    {viewMode !== 'chart' && <div className="map-legend" aria-label="Legenda do mapa">
      <span><i className="legend-blue" />{candidateTheme.flavio.name}</span>
      <span><i className="legend-red" />{candidateTheme.lula.name}</span>
      {viewMode === 'dispute' && <span><i className="legend-swing" />Faixa hachurada: zona em disputa</span>}
      <span><i className="legend-neutral" />Apurando</span>
    </div>}
    {viewMode === 'dispute' && <p className="map-caption">Proporção territorial de votos e faixa hachurada de competitividade nos estados em disputa. <strong>{disputedCount} estados</strong> dentro da margem de até {mapTheme.swingMarginPercentagePoints} pontos percentuais.</p>}
  </section>;
}
