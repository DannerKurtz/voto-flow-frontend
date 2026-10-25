import { apiBaseUrl } from '../api-config.ts';
import { parseGovernorList } from './governor-parser.ts';

export async function loadGovernors(signal: AbortSignal) {
  const response = await fetch(`${apiBaseUrl()}/results/second-round/governors`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]), cache: 'no-store',
  });
  if (!response.ok) throw new Error(response.status === 404
    ? 'Os resultados dos governos estaduais ainda não estão configurados no backend.'
    : 'Não foi possível carregar a apuração dos governos estaduais.');
  return parseGovernorList(await response.json());
}
