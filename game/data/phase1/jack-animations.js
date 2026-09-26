// Mapa oficial do atlas HD do Jack — Halloween I
// Atlas: 8 colunas x 4 linhas; células uniformes de 320x320 px.
// Arquivo esperado: assets/game/phase1/sprites-hd/jack-atlas-hd.png
window.JACK_ANIMATIONS = Object.freeze({
  cell: 320,
  cols: 8,
  rows: 4,

  render: Object.freeze({
    width: 190,
    height: 190,
    offsetY: -132
  }),

  timing: Object.freeze({
    idleFps: 2.4,
    walkFps: 9,
    runFps: 12,
    attackDuration: 0.48,
    landDuration: 0.16
  }),

  animations: Object.freeze({
    // 0-3: poses paradas. O quadro 1 mostra a lanterna ao lado do corpo.
    idle: Object.freeze([0, 2, 3, 2]),
    idleLantern: Object.freeze([1]),

    // 4-9: caminhada completa, alternando claramente as duas pernas.
    walk: Object.freeze([4, 5, 6, 7, 8, 9]),

    // 10-15: corrida.
    run: Object.freeze([10, 11, 12, 13, 14, 15]),

    // 16-17: abaixar / deslocamento baixo.
    crouch: Object.freeze([16]),
    crouchMove: Object.freeze([16, 17]),

    // 18-21: fases do salto.
    jumpStart: Object.freeze([18]),
    jumpRise: Object.freeze([19]),
    jumpApex: Object.freeze([20]),
    jumpFall: Object.freeze([21]),

    // 22-23: aterrissagem / recuperação e dano.
    land: Object.freeze([22, 23]),
    hurt: Object.freeze([22]),

    // 25-26: Jack leva a abóbora-lanterna para cima e libera a Luz.
    attack: Object.freeze([25, 26, 26, 25])
  })
});
