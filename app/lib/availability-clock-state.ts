export type AvailabilityClockState = {
  status: 'countdown' | 'waiting' | 'available';
  milliseconds: number;
};

export function getAvailabilityClockState(
  now: number | null,
  target: number,
  officialResultsAvailable: boolean,
): AvailabilityClockState {
  if (officialResultsAvailable) return { status: 'available', milliseconds: 0 };
  if (now === null || now < target) {
    return { status: 'countdown', milliseconds: now === null ? 0 : target - now };
  }
  return { status: 'waiting', milliseconds: now - target };
}
