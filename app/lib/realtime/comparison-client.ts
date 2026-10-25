import { apiBaseUrl } from '../api-config.ts';
import { parseComparisonList } from './comparison-parser.ts';

export async function loadComparisons(signal: AbortSignal) {
  const response = await fetch(`${apiBaseUrl()}/results/second-round/president`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(response.status === 404
      ? 'A comparação do segundo turno ainda não está configurada no backend.'
      : 'Não foi possível carregar os dados oficiais.');
  }
  return parseComparisonList(await response.json());
}
