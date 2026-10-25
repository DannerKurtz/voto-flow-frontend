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
    <div className="map-heading"><div><p className="eyebrow">Por unidade federativa</p><h2 id="map-title">Distribuição de votos</h2></div><span>Azul à esquerda · vermelho à direita</span></div>
    <div className="map-canvas"><svg viewBox="0 0 1000 1000" role="img" aria-describedby="map-description"><title>Mapa do Brasil com distribuição de votos por estado</title><desc id="map-description">Cada estado é dividido proporcionalmente: azul para Flávio Bolsonaro e vermelho para Lula. Cinza indica apuração pendente.</desc><defs>{Object.entries(brazilStatePaths).map(([code]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return appearance.shares ? <clipPath key={code} id={`flavio-share-${code}`} clipPathUnits="objectBoundingBox"><rect width={Math.min(1, Math.max(0, appearance.shares.flavio / 100))} height="1" x="0" y="0" /></clipPath> : null; })}</defs>{Object.entries(brazilStatePaths).map(([code, path]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return <g key={code} tabIndex={0} aria-label={appearance.label} onPointerEnter={() => setActiveState(code)} onFocus={() => setActiveState(code)} onBlur={() => setActiveState(null)}>{appearance.shares ? <><path d={path} className="state-path" style={{ fill: candidateTheme.lula.color }} stroke={mapTheme.neutralStroke} /><path d={path} className="state-path" style={{ fill: candidateTheme.flavio.color }} stroke={mapTheme.neutralStroke} clipPath={`url(#flavio-share-${code})`} /></> : <path d={path} className="state-path" style={{ fill: appearance.fill }} stroke={mapTheme.neutralStroke} />}</g>; })}</svg>
      <div className="map-tooltip" aria-live="polite">{activeState && activeAppearance ? <><strong>{stateNames[activeState]}</strong><span>{activeAppearance.label.replace(`${stateNames[activeState]}: `, '')}</span></> : <span>Passe o mouse ou navegue pelo teclado para consultar uma UF.</span>}</div>
    </div>
    <div className="map-legend" aria-label="Legenda do mapa"><span><i className="legend-blue" />{candidateTheme.flavio.name}</span><span><i className="legend-red" />{candidateTheme.lula.name}</span><span><i className="legend-neutral" />Apurando</span></div>
  </section>;
}
