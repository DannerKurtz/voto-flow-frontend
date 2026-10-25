const fallbackApi = 'https://voto-flow-backend.onrender.com';

export function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) return fallbackApi;
  try {
    const url = new URL(configured);
    return ['http:', 'https:'].includes(url.protocol) ? url.href.replace(/\/$/, '') : fallbackApi;
  } catch { return fallbackApi; }
}

export function websocketUrl(): string {
  return `${apiBaseUrl().replace(/^http/, 'ws')}/ws`;
}
