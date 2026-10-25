import type { PresidentialComparison } from '../../lib/comparison';
import { candidateTheme } from '../../lib/theme';
import { formatPercentage } from '../../lib/format';
import { buildCandidateLine, buildStateVotePoints, stateVoteChart } from './line-chart-model';

const percentageTicks = [0, 25, 50, 75, 100];

export function StateVoteLineChart({ comparisons }: { comparisons: Record<string, PresidentialComparison> }) {
  const points = buildStateVotePoints(comparisons);
  const plotWidth = stateVoteChart.width - stateVoteChart.left - stateVoteChart.right;
  const plotHeight = stateVoteChart.height - stateVoteChart.top - stateVoteChart.bottom;
  const flavioLine = buildCandidateLine(points, 'flavio');
  const lulaLine = buildCandidateLine(points, 'lula');
  const hasResults = points.some((point) => point.flavio !== null || point.lula !== null);

  return <div className="state-line-chart" role="group" aria-label="Percentual de votos dos candidatos por estado">
    {hasResults ? <div className="state-line-chart-scroll">
      <svg viewBox={`0 0 ${stateVoteChart.width} ${stateVoteChart.height}`} role="img" aria-labelledby="state-line-chart-title state-line-chart-description">
        <title id="state-line-chart-title">Percentual de votos por estado</title>
        <desc id="state-line-chart-description">Linhas com os percentuais oficiais de Flávio Bolsonaro e Luiz Inácio Lula da Silva no segundo turno, ordenadas pela sigla da unidade federativa. Estados sem dados aparecem sem pontos e interrompem as linhas.</desc>
        {percentageTicks.map((tick) => {
          const y = stateVoteChart.top + ((100 - tick) / 100) * plotHeight;
          return <g key={tick} className={tick === 50 ? 'line-chart-grid line-chart-midpoint' : 'line-chart-grid'}>
            <line x1={stateVoteChart.left} x2={stateVoteChart.left + plotWidth} y1={y} y2={y} />
            <text x={stateVoteChart.left - 10} y={y + 4} textAnchor="end">{tick}%</text>
          </g>;
        })}
        <path className="line-chart-series line-chart-flavio" d={flavioLine} pathLength={1} />
        <path className="line-chart-series line-chart-lula" d={lulaLine} pathLength={1} />
        {points.map((point, index) => {
          const x = stateVoteChart.left + (index / (points.length - 1)) * plotWidth;
          const labelY = stateVoteChart.top + plotHeight + 26;
          return <g key={point.code}>
            <text className="line-chart-state-label" x={x} y={labelY} textAnchor="middle">{point.code.toUpperCase()}</text>
            {point.flavio !== null && <circle className="line-chart-point line-chart-point-flavio" cx={x} cy={stateVoteChart.top + ((100 - point.flavio) / 100) * plotHeight} r="4" style={{ animationDelay: `${250 + index * 12}ms` }}>
              <title>{`${point.name}: ${candidateTheme.flavio.name} ${formatPercentage(point.flavio, true)}`}</title>
            </circle>}
            {point.lula !== null && <circle className="line-chart-point line-chart-point-lula" cx={x} cy={stateVoteChart.top + ((100 - point.lula) / 100) * plotHeight} r="4" style={{ animationDelay: `${350 + index * 12}ms` }}>
              <title>{`${point.name}: ${candidateTheme.lula.name} ${formatPercentage(point.lula, true)}`}</title>
            </circle>}
          </g>;
        })}
      </svg>
    </div> : <p className="map-caption" role="status">O gráfico aparecerá quando houver resultados oficiais do segundo turno por estado.</p>}
    <div className="state-line-chart-legend" aria-label="Legenda do gráfico">
      <span><i className="line-chart-key line-chart-key-flavio" />{candidateTheme.flavio.name}</span>
      <span><i className="line-chart-key line-chart-key-lula" />{candidateTheme.lula.name}</span>
      <span className="line-chart-note">Percentual oficial por UF · linhas interrompidas indicam dados pendentes</span>
    </div>
    <details className="state-line-chart-data">
      <summary>Consultar percentuais por estado</summary>
      <div className="state-line-chart-table-scroll">
        <table>
          <thead><tr><th scope="col">Estado</th><th scope="col">{candidateTheme.flavio.name}</th><th scope="col">{candidateTheme.lula.name}</th></tr></thead>
          <tbody>{points.map((point) => <tr key={point.code}>
            <th scope="row">{point.name} ({point.code.toUpperCase()})</th>
            <td>{formatPercentage(point.flavio, true)}</td>
            <td>{formatPercentage(point.lula, true)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  </div>;
}
