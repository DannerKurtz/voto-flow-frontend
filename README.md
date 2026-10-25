# Voto Flow Frontend

Dashboard Next.js para acompanhar a comparação presidencial entre o primeiro e o segundo turno das Eleições Gerais de 2026. O navegador nunca consulta o TSE: ele usa somente a API e o WebSocket do Voto Flow Backend.

## Configuração

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

| Variável | Finalidade |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base HTTP do backend; o WebSocket é derivado automaticamente dela. |
| `NEXT_PUBLIC_RESULTS_START_AT` | Horário de Brasília usado pelo contador de disponibilidade. |

## Dados consumidos

- `GET /results/second-round/president`
- `second-round.comparison.updated` no WebSocket `/ws`

O painel apresenta votos, percentuais, apuração, brancos e nulos oficiais. O excedente é sempre identificado como estimativa e só aparece quando a API o disponibiliza.

## Mapa e fotos

O mapa é um SVG local gerado a partir da [API de Malhas do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3), sem biblioteca de mapas ou GeoJSON em runtime.

Os avatares em `public/candidates/` são neutros. Antes de publicar, substitua-os por fotos locais e autorizadas, ajustando os caminhos e textos alternativos em `app/lib/theme.ts` quando necessário.

## Verificação

```bash
pnpm exec tsc --noEmit
pnpm build
```
