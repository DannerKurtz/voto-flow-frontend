import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { GoogleAnalytics } from './components/google-analytics';
import { candidateTheme, mapTheme } from './lib/theme';
import './styles.css';

export const metadata: Metadata = {
  title: 'Voto Flow',
  description: 'Apuração oficial das Eleições Gerais 2026',
};

const themeVariables = {
  '--blue': candidateTheme.flavio.color,
  '--red': candidateTheme.lula.color,
  '--tension': mapTheme.tension,
} as CSSProperties;

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR" style={themeVariables}>
    <body>{children}<GoogleAnalytics /></body>
  </html>;
}
