'use client';

import { useState } from 'react';
import { formatVotes, formatPercentage } from '../lib/format';
import { candidateFor, estimatedVotes, type CandidateKey, type PresidentialComparison } from '../lib/comparison';
import { candidateTheme } from '../lib/theme';

type Props = { candidateKey: CandidateKey; comparison: PresidentialComparison | null };

export function CandidateSummary({ candidateKey, comparison }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const theme = candidateTheme[candidateKey];
  const secondRound = candidateFor(comparison?.secondRound ?? null, candidateKey);
  const firstRound = candidateFor(comparison?.firstRound ?? null, candidateKey);
  const surplus = estimatedVotes(comparison, candidateKey);

  return <article className={`candidate-summary candidate-${candidateKey}`}>
    <div className="candidate-photo" aria-label={theme.alt}>
      {imageFailed
        ? <span aria-hidden="true">{theme.initials}</span>
        : <img src={theme.imagePath} alt={theme.alt} onError={() => setImageFailed(true)} />}
    </div>
    <p className="candidate-label">Segundo turno</p>
    <h2>{secondRound?.name ?? theme.name}</h2>
    {secondRound?.party && <p className="candidate-party">{secondRound.party}</p>}
    <strong className="candidate-percentage">{formatPercentage(secondRound?.percentage)}</strong>
    <p className="candidate-votes">{formatVotes(secondRound?.votes)} votos</p>
    <dl className="candidate-comparison">
      <div>
        <dt>1º turno</dt>
        <dd>{formatVotes(firstRound?.votes)} <small>({formatPercentage(firstRound?.percentage)})</small></dd>
      </div>
      <div>
        <dt>Excedente</dt>
        <dd>{surplus === null ? 'Indisponível' : formatVotes(surplus)}{surplus !== null && <small> estimativa</small>}</dd>
      </div>
    </dl>
  </article>;
}
