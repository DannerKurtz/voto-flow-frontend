import { formatPercentage, formatVotes } from '../lib/format';
import { governorScopeName } from '../lib/governors';
import { useGovernorResults } from '../lib/use-governor-results';
import { candidateTheme } from '../lib/theme';

const candidateColors = [candidateTheme.flavio.color, candidateTheme.lula.color];

export function GovernorRunoffs() {
  const { results, status, error } = useGovernorResults();
  const states = Object.values(results);
  return <section className="governor-runoffs" aria-labelledby="governor-runoffs-title">
    <div className="governor-runoffs-heading">
      <div>
        <p className="eyebrow">Apuração estadual</p>
        <h2 id="governor-runoffs-title">Governadores no segundo turno</h2>
      </div>
      <span className={`connection-status status-${status}`}><b aria-hidden="true">●</b> {status === 'connected' ? 'Ao vivo' : status === 'reconnecting' ? 'Reconectando' : status === 'unavailable' ? 'Indisponível' : 'Carregando'}</span>
    </div>
    {error && <p className="governor-runoff-notice" role="status">{error}</p>}
    {states.length > 0 && <div className="governor-runoff-grid">
      {states.map((result) => {
        const candidates = result.secondRound?.candidates ?? [];
        return <article className="governor-runoff-card" key={result.scope.code}>
          <div className="governor-runoff-card-heading">
            <h3>{governorScopeName(result.scope.code)}</h3>
            {result.secondRound && <span>{formatPercentage(result.secondRound.totalizationPercentage)} apurado</span>}
          </div>
          {result.availability === 'pending' || !result.secondRound
            ? <p className="governor-runoff-pending">Aguardando dados oficiais</p>
            : <>
              <div className="governor-runoff-candidates">
                {candidates.map((candidate, index) => <div className="governor-runoff-candidate" key={candidate.sqcand}>
                  <span className="governor-runoff-candidate-name" title={candidate.name}>
                    <small>{index === 0 ? '1º lugar' : `${index + 1}º lugar`}</small>{candidate.ballotName}
                  </span>
                  <strong style={{ color: candidateColors[index % candidateColors.length] }}>{formatPercentage(candidate.percentage)}</strong>
                  <small>{formatVotes(candidate.votes)} votos</small>
                </div>)}
              </div>
              <div className="governor-runoff-vote-bar" aria-label={candidates.map((candidate) => `${candidate.ballotName}: ${formatPercentage(candidate.percentage)}`).join(', ')}>
                {candidates.map((candidate, index) => <i key={candidate.sqcand} style={{ width: `${Math.max(0, Math.min(100, candidate.percentage))}%`, backgroundColor: candidateColors[index % candidateColors.length] }} />)}
              </div>
            </>}
        </article>;
      })}
    </div>}
    {!error && states.length === 0 && <p className="governor-runoff-notice">{status === 'loading' ? 'Carregando resultados estaduais oficiais…' : 'Aguardando resultados oficiais configurados no backend.'}</p>}
    <p className="governor-runoff-footnote">Dados oficiais do TSE, atualizados pelo Voto Flow.</p>
  </section>;
}
