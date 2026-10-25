import { brazilStatePaths } from '../brazil-map-paths.ts';

export const stateNames: Record<string, string> = { ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins' };

export type StateShape = { code: string; path: string; centerX: number; centerY: number; width: number; height: number };
export type DisputedState = StateShape & { margin: number; flavio: number; lula: number };
export type BadgePlacement = { state: DisputedState; x: number; y: number };

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

export const stateShapes = Object.entries(brazilStatePaths).map(([code, path]) => getStateShape(code, path));
export const badgeSlots = [
  [16, 22], [38, 22], [61, 22], [84, 22],
  [16, 42], [38, 42], [61, 42], [84, 42],
  [16, 62], [38, 62], [61, 62], [84, 62],
  [16, 82], [38, 82], [61, 82], [84, 82],
] as const;
