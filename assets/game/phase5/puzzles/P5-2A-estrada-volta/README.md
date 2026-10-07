# Halloween V — P5-2A · A Estrada que Volta

Assets oficiais do puzzle inicial da Fase 5.

Suba nesta pasta os 6 arquivos do ZIP:

- `phase5-road-blocked-seal.png`
- `phase5-road-blocked-seal-glow.png`
- `phase5-bell-call-wave-01.png`
- `phase5-bell-call-wave-02.png`
- `phase5-return-arrow-light.png`
- `phase5-return-path-open-fx.png`

## Uso previsto

- `phase5-road-blocked-seal.png`
  Barreira principal quando a estrada recusa Jack.

- `phase5-road-blocked-seal-glow.png`
  Aura/névoa luminosa da barreira.

- `phase5-bell-call-wave-01.png`
  Primeira onda visual do sino chamando Jack para trás.

- `phase5-bell-call-wave-02.png`
  Segunda onda, maior e mais suave.

- `phase5-return-arrow-light.png`
  Indicação diegética de retorno, usada com parcimônia.

- `phase5-return-path-open-fx.png`
  Efeito de abertura quando Jack finalmente volta e o caminho aceita passagem.

## Regra técnica

Todos os arquivos devem permanecer PNG com transparência e os nomes acima devem ser preservados exatamente.


## Integração

Integrado em `game/phase5.js`.

Fluxo:
1. Jack chega ao bloqueio.
2. O selo e sua aura se revelam.
3. As duas ondas do sino chamam visualmente para trás.
4. A seta de luz reforça a direção sem substituir a descoberta.
5. Ao retornar ao início, o caminho se reorganiza com `phase5-return-path-open-fx.png`.
6. O portão genérico da primeira área deixa de ser desenhado.
