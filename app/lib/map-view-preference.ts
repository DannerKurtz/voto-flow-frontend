export const mapViewPreferenceKey = 'voto-flow-map-view-mode';

export const mapViewModes = ['leadership', 'dispute', 'chart'] as const;
export type MapViewMode = typeof mapViewModes[number];

export function parseMapViewMode(value: string | null): MapViewMode | null {
  return mapViewModes.find((mode) => mode === value) ?? null;
}

export function readMapViewPreference(storage: Pick<Storage, 'getItem'>): MapViewMode {
  return parseMapViewMode(storage.getItem(mapViewPreferenceKey)) ?? 'dispute';
}

export function writeMapViewPreference(storage: Pick<Storage, 'setItem'>, viewMode: MapViewMode): void {
  storage.setItem(mapViewPreferenceKey, viewMode);
}
