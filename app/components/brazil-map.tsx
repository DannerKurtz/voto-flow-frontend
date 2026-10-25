'use client';

import { useState } from 'react';
import { brazilStatePaths } from './brazil-map-paths';
import { stateAppearance, type PresidentialComparison } from '../lib/comparison';
import { candidateTheme, mapTheme } from '../lib/theme';

const stateNames: Record<string, string> = { ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins' };
const mosaicSide = 10;
const mosaicCellSize = 3;
const mosaicDotRadius = 1.15;

function scoreMosaicCell(scopeCode: string, index: number) {
  const seed = Array.from(scopeCode).reduce((total, character) => total * 31 + character.charCodeAt(0), 0);
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function mosaicCells(scopeCode: string, lulaPercentage: number) {
  const cellCount = mosaicSide * mosaicSide;
  const lulaCellCount = Math.round(Math.min(100, Math.max(0, lulaPercentage)) / 100 * cellCount);
  const lulaCells = new Set(Array.from({ length: cellCount }, (_, index) => index).sort((left, right) => scoreMosaicCell(scopeCode, left) - scoreMosaicCell(scopeCode, right)).slice(0, lulaCellCount));
  return Array.from({ length: cellCount }, (_, index) => ({
    index,
    fill: lulaCells.has(index) ? candidateTheme.lula.color : candidateTheme.flavio.color,
    cx: (index % mosaicSide) * mosaicCellSize + mosaicCellSize / 2,
    cy: Math.floor(index / mosaicSide) * mosaicCellSize + mosaicCellSize / 2,
  }));
}

export function BrazilMap({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const [activeState, setActiveState] = useState<string | null>(null);
  const activeAppearance = activeState ? stateAppearance(comparisons[activeState], stateNames[activeState]) : null;
  return <section className="map-panel" aria-labelledby="map-title">
    <div className="map-heading"><div><p className="eyebrow">Por unidade federativa</p><h2 id="map-title">Distribuição de votos</h2></div><span>Mosaico proporcional por UF</span></div>
    <div className="map-canvas"><svg viewBox="0 0 1000 1000" role="img" aria-describedby="map-description"><title>Mapa do Brasil com distribuição de votos por estado</title><desc id="map-description">Cada estado usa um mosaico proporcional aos percentuais estaduais: azul para Flávio Bolsonaro e vermelho para Lula. Não representa resultados municipais. Cinza indica empate ou apuração pendente.</desc><defs>{Object.entries(brazilStatePaths).map(([code]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return appearance.shares ? <pattern key={code} id={`vote-mosaic-${code}`} patternUnits="userSpaceOnUse" width={mosaicSide * mosaicCellSize} height={mosaicSide * mosaicCellSize}><rect width="100%" height="100%" fill={mapTheme.neutral} />{mosaicCells(code, appearance.shares.lula).map((cell) => <circle key={cell.index} cx={cell.cx} cy={cell.cy} r={mosaicDotRadius} fill={cell.fill} />)}</pattern> : null; })}</defs>{Object.entries(brazilStatePaths).map(([code, path]) => { const appearance = stateAppearance(comparisons[code], stateNames[code]); return <path key={code} d={path} tabIndex={0} aria-label={appearance.label} className="state-path" style={{ fill: appearance.shares ? `url(#vote-mosaic-${code})` : appearance.fill }} stroke={mapTheme.neutralStroke} onPointerEnter={() => setActiveState(code)} onFocus={() => setActiveState(code)} onBlur={() => setActiveState(null)} />; })}</svg>
      <div className="map-tooltip" aria-live="polite">{activeState && activeAppearance ? <><strong>{stateNames[activeState]}</strong><span>{activeAppearance.label.replace(`${stateNames[activeState]}: `, '')}</span></> : <span>Passe o mouse ou navegue pelo teclado para consultar uma UF.</span>}</div>
    </div>
    <div className="map-legend" aria-label="Legenda do mapa"><span><i className="legend-blue" />{candidateTheme.flavio.name}</span><span><i className="legend-red" />{candidateTheme.lula.name}</span><span><i className="legend-neutral" />Apurando</span></div>
  </section>;
}
