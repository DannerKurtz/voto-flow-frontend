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
    <div className="map-heading"><div><p className="eyebrow">Por unidade federativa</p><h2 id="map-title">Mapa de calor</h2></div><span>Interpolação visual por UF</span></div>
    <div className="map-canvas"><svg viewBox="0 0 1000 1000" role="img" aria-describedby="map-description"><title>Mapa de calor da distribuição de votos por estado</title><desc id="map-description">Um mapa de calor interpolado a partir dos percentuais estaduais: azul para Flávio Bolsonaro e vermelho para Lula. Não representa resultados municipais. Cinza indica empate ou apuração pendente.</desc><defs><clipPath id="brazil-outline">{Object.entries(brazilStatePaths).map(([code, path]) => <path key={code} d={path} />)}</clipPath><filter id="state-heat" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="13" /></filter></defs><g clipPath="url(#brazil-outline)" filter="url(#state-heat)">{Object.entries(brazilStatePaths).map(([code, path]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return <path key={code} d={path} fill={appearance.fill} />; })}</g>{Object.entries(brazilStatePaths).map(([code, path]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return <path key={code} d={path} tabIndex={0} aria-label={appearance.label} className="state-path" fill="transparent" stroke={mapTheme.neutralStroke} onPointerEnter={() => setActiveState(code)} onFocus={() => setActiveState(code)} onBlur={() => setActiveState(null)} />; })}</svg>
      <div className="map-tooltip" aria-live="polite">{activeState && activeAppearance ? <><strong>{stateNames[activeState]}</strong><span>{activeAppearance.label.replace(`${stateNames[activeState]}: `, '')}</span></> : <span>Passe o mouse ou navegue pelo teclado para consultar uma UF.</span>}</div>
    </div>
    <div className="map-legend" aria-label="Legenda do mapa"><span><i className="legend-blue" />{candidateTheme.flavio.name}</span><span><i className="legend-red" />{candidateTheme.lula.name}</span><span><i className="legend-neutral" />Apurando</span></div>
  </section>;
}
