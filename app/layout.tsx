import type { Metadata } from 'next'; import './styles.css';
export const metadata: Metadata = { title: 'Voto Flow', description: 'Apuração oficial das Eleições Gerais 2026' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
