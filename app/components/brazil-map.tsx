'use client';

import { useState } from 'react';
import { brazilStatePaths } from './brazil-map-paths';
import { stateAppearance, type PresidentialComparison } from '../lib/comparison';
import { candidateTheme, mapTheme } from '../lib/theme';

const stateNames: Record<string, string> = { ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins' };

export function BrazilMap({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const [activeState, setActiveState] = useState<string | null>(null);
  const activeAppearance = activeState ? stateAppearance(comparisons[activeState], stateNames[activeState]) : null;
  return <section className="map-panel" aria-labelledby="map-title">
    <div className="map-heading"><div><p className="eyebrow">Por unidade federativa</p><h2 id="map-title">Mapa da apuração</h2></div><span>Máxima intensidade: 70%</span></div>
    <div className="map-canvas"><svg viewBox="0 0 1000 1000" role="img" aria-describedby="map-description"><title>Mapa do Brasil com liderança por estado</title><desc id="map-description">Azul representa liderança de Flávio Bolsonaro, vermelho representa liderança de Lula e cinza indica empate ou apuração pendente.</desc>{Object.entries(brazilStatePaths).map(([code, path]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return <path key={code} d={path} tabIndex={0} aria-label={appearance.label} className="state-path" style={{ fill: appearance.fill }} stroke={mapTheme.neutralStroke} onPointerEnter={() => setActiveState(code)} onFocus={() => setActiveState(code)} onBlur={() => setActiveState(null)} />; })}</svg>
      <div className="map-tooltip" aria-live="polite">{activeState && activeAppearance ? <><strong>{stateNames[activeState]}</strong><span>{activeAppearance.label.replace(`${stateNames[activeState]}: `, '')}</span></> : <span>Passe o mouse ou navegue pelo teclado para consultar uma UF.</span>}</div>
    </div>
    <div className="map-legend" aria-label="Legenda do mapa"><span><i className="legend-blue" />{candidateTheme.flavio.name}</span><span><i className="legend-red" />{candidateTheme.lula.name}</span><span><i className="legend-neutral" />Apurando ou empate</span></div>
  </section>;
}
