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
pnpm typecheck
pnpm test
pnpm build
```

## Organização e responsabilidades

- `app/lib/comparison.ts`: contrato de dados e seletores dos candidatos.
- `app/lib/realtime/comparison-client.ts`: HTTP e validação da resposta.
- `app/lib/realtime/comparison-session.ts`: ciclo da conexão, inscrições, reconexão e conciliação REST/WebSocket, independente do React.
- `app/lib/use-presidential-comparisons.ts`: adaptação da sessão para o estado React e limpeza ao desmontar.
- `app/components/map/geometry.ts`: geometria estática calculada uma vez.
- `app/components/map/model.ts`: aparência e posicionamento dos crachás, recalculados quando os dados mudam.
- `app/components/map/geography.tsx`: SVG memoizado; passar o mouse atualiza o tooltip sem reconstruir os paths.
- `app/lib/theme.ts`: cores compartilhadas pelo SVG e pelo CSS através do layout.
- `app/lib/format.ts`: formatação numérica reutilizada pela interface.

As dependências de transporte da sessão são injetadas nos testes. Há uma única busca REST em andamento; depois da confirmação das inscrições, uma nova leitura recupera mudanças ocorridas durante a conexão. Uma mensagem WebSocket recebida durante essa leitura prevalece sobre a resposta HTTP antiga. Mensagens inválidas são descartadas antes de alterar a tela.

Os testes usam o executor nativo do Node e dados locais, sem consultas ao TSE ou ao Google. Execute com a versão de Node suportada pelo projeto (22) e pnpm 10.26.2.
