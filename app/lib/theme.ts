export const candidateTheme = {
  flavio: { name: 'Flávio Bolsonaro', chartName: 'Flávio Bolsonaro', party: 'PL', color: '#0055ff', initials: 'FB', imagePath: '/candidates/flavio-bolsonaro.png', alt: 'Foto de Flávio Bolsonaro' },
  lula: { name: 'Luiz Inácio Lula da Silva', chartName: 'Lula', party: 'PT', color: '#ff1e42', initials: 'L', imagePath: '/candidates/luiz-inacio-lula-da-silva.png', alt: 'Foto de Luiz Inácio Lula da Silva' },
} as const;

export const mapTheme = {
  neutral: 'var(--map-neutral)',
  neutralStroke: 'var(--map-neutral-stroke)',
  tension: '#7c1ae8',
  swingMarginPercentagePoints: 5,
  maximumHatchWidthPercentage: 78,
} as const;
