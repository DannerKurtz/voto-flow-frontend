'use client';

import { formatVotes, formatPercentage } from './lib/format';
import { AvailabilityClock } from './components/availability-clock';
import { BrazilMap } from './components/brazil-map';
import { CandidateSummary } from './components/candidate-summary';
import { usePresidentialComparisons } from './lib/use-presidential-comparisons';
import { GovernorRunoffs } from './components/governor-runoffs';

const statusLabels = {
  loading: 'Carregando dados oficiais',
  connected: 'Atualizações em tempo real',
  reconnecting: 'Reconectando atualizações',
  unavailable: 'Dados indisponíveis',
} as const;

export default function Page() {
  const { comparisons, status, error } = usePresidentialComparisons();
  const national = comparisons.br ?? null;
  const secondRound = national?.secondRound ?? null;

  return <main className="second-round-page">
    <header className="site-header">
      <a className="brand" href="#conteudo" aria-label="Voto Flow, ir para o conteúdo"><i aria-hidden="true" />Voto Flow</a>
      <span className={`connection-status status-${status}`}><b aria-hidden="true">●</b> {statusLabels[status]}</span>
    </header>
    <section id="conteudo" className="dashboard-intro" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">Eleições Gerais 2026 · segundo turno</p>
        <h1 id="page-title">Apuração presidencial</h1>
        <p>Dados oficiais da Justiça Eleitoral, recebidos e normalizados pelo Voto Flow.</p>
      </div>
      <AvailabilityClock />
    </section>
    {error && <section className="data-notice" role="status"><strong>Dados ainda não disponíveis.</strong><span>{error}</span></section>}
    <section className="candidate-map-layout" aria-label="Comparação dos candidatos e mapa do Brasil">
      <CandidateSummary candidateKey="flavio" comparison={national} />
      <BrazilMap comparisons={comparisons} />
      <CandidateSummary candidateKey="lula" comparison={national} />
    </section>
    <section className="official-summary" aria-label="Resumo oficial nacional">
      <article><span>Apuração nacional</span><strong>{formatPercentage(secondRound?.totalizationPercentage)}</strong><small>Percentual oficial totalizado</small></article>
      <article><span>Votos em branco</span><strong>{formatVotes(secondRound?.blankVotes)}</strong><small>Dado oficial do segundo turno</small></article>
      <article><span>Votos nulos</span><strong>{formatVotes(secondRound?.nullVotes)}</strong><small>Dado oficial do segundo turno</small></article>
      <article><span>Estimativa</span><strong>{national?.estimatedSurplus.eligible ? 'Disponível' : 'Aguardando base'}</strong><small>Não é um dado oficial do TSE</small></article>
    </section>
    <GovernorRunoffs />
    <footer className="source-note">A estimativa de excedente só é exibida após os dois candidatos alcançarem sua base do primeiro turno em cada abrangência. Nulos e brancos permanecem separados como dados oficiais.</footer>
  </main>;
}
