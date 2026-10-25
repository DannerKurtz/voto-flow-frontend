import type { PresidentialComparison } from '../../lib/comparison.ts';
import { stateAppearance } from '../../lib/map-appearance.ts';
import { mapTheme } from '../../lib/theme.ts';
import { stateNames, stateShapes, badgeSlots, type BadgePlacement } from './geometry.ts';

export function buildMapStates(comparisons: Record<string, PresidentialComparison>) {
  return stateShapes.map((shape) => {
    const appearance = stateAppearance(comparisons[shape.code], stateNames[shape.code]);
    const closeMargin = appearance.shares ? Math.abs(appearance.shares.flavio - appearance.shares.lula) : Infinity;
    const tension = Math.max(0, 1 - closeMargin / mapTheme.swingMarginPercentagePoints);
    const hatchWidth = shape.width * (0.06 + tension * (mapTheme.maximumHatchWidthPercentage - 6) / 100);
    const flavioShare = appearance.shares
      ? appearance.shares.flavio / (appearance.shares.flavio + appearance.shares.lula) * 100
      : 50;
    return { ...shape, appearance, closeMargin, hatchWidth, flavioShare };
  });
}
export type MapState = ReturnType<typeof buildMapStates>[number];
export type { MapViewMode } from '../../lib/map-view-preference.ts';

export function buildMapBadges(states: MapState[]) {
  const candidates = states.flatMap((shape) => {
    if (!shape.appearance.shares || shape.closeMargin > mapTheme.swingMarginPercentagePoints) return [];
    return [{ ...shape, ...shape.appearance.shares, margin: shape.closeMargin }];
  }).sort((left, right) => left.margin - right.margin);
  const availableSlots = [...badgeSlots];
  const badgePlacements: BadgePlacement[] = [];
  for (const candidate of candidates.slice(0, 10)) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    availableSlots.forEach(([x, y], index) => {
      const distance = Math.hypot(x * 10 - candidate.centerX, y * 10 - candidate.centerY);
      if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    const [x, y] = availableSlots.splice(bestIndex, 1)[0];
    badgePlacements.push({ state: candidate, x, y });
  }
  return { badgePlacements, disputedCount: candidates.length };
}
