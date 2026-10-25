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
- `GET /results/second-round/governors`
- `second-round.governor.updated` no WebSocket `/ws`

O painel apresenta votos, percentuais, apuração, brancos e nulos oficiais. O excedente é sempre identificado como estimativa e só aparece quando a API o disponibiliza.

Ao final da página há um bloco compacto para as disputas estaduais de governador. Ele exibe candidatos, votos, percentuais e totalização enviados pelo backend e recebe mudanças pelo WebSocket. O recurso depende de `GOVERNOR_SECOND_ROUND_TARGETS` no backend e dos alvos EA20 correspondentes em `TSE_POLL_TARGETS`; sem essa configuração, a seção informa que os dados ainda não estão disponíveis.

O frontend não inclui dados de demonstração: todos os resultados apresentados vêm da API/WebSocket do backend, que consulta os recursos oficiais do TSE.

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
- `app/lib/governors.ts` and `app/lib/realtime/governor-*`: contract validation and scoped live session for the state governor bonus.
- `app/components/governor-runoffs.tsx`: compact state cards rendered after the presidential results.
- `app/components/map/geometry.ts`: geometria estática calculada uma vez.
- `app/components/map/model.ts`: aparência e posicionamento dos crachás, recalculados quando os dados mudam.
- `app/components/map/geography.tsx`: SVG memoizado; passar o mouse atualiza o tooltip sem reconstruir os paths.
- `app/lib/theme.ts`: cores compartilhadas pelo SVG e pelo CSS através do layout.
- `app/lib/format.ts`: formatação numérica reutilizada pela interface.

As dependências de transporte da sessão são injetadas nos testes. Há uma única busca REST em andamento; depois da confirmação das inscrições, uma nova leitura recupera mudanças ocorridas durante a conexão. Uma mensagem WebSocket recebida durante essa leitura prevalece sobre a resposta HTTP antiga. Mensagens inválidas são descartadas antes de alterar a tela.

Os testes usam o executor nativo do Node e dados locais, sem consultas ao TSE ou ao Google. Execute com a versão de Node suportada pelo projeto (22) e pnpm 10.26.2.

## Google Analytics 4

A integração está preparada em `app/components/google-analytics.tsx` e só carrega em produção com um ID válido. Enquanto a variável estiver vazia, nenhum script do Google é renderizado.

1. Crie uma propriedade GA4 e um fluxo de dados **Web** para o endereço público do frontend.
2. Copie o **ID de medição**, no formato `G-...`.
3. Na Vercel, configure `NEXT_PUBLIC_GA_MEASUREMENT_ID` somente no ambiente **Production**.
4. Faça um novo build/deploy: as variáveis `NEXT_PUBLIC_*` são incorporadas ao bundle.
5. Abra o site publicado e confirme o acesso no relatório **Em tempo real** do GA4.

O ID é público; não use uma chave de API, segredo ou ID `GTM-...`. Não há variável de Analytics no backend. A configuração utiliza o page view padrão do Google tag, sem eventos personalizados de candidatos, estados ou preferências. Google Signals e personalização de anúncios estão desativados. Não há implementação de banner de consentimento nesta etapa.

O script usa [`next/script` com `afterInteractive`](https://nextjs.org/docs/app/api-reference/components/script) e a [configuração oficial do Google tag](https://developers.google.com/tag-platform/gtagjs/configure). Não carregue o mesmo ID por outro snippet ou GTM para evitar medições duplicadas. A entrega real de eventos depende do ID, do deploy e da verificação no GA4; os testes locais verificam apenas configuração e inicialização.
