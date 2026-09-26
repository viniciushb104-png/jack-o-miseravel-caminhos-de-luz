# Áudio — Fase 1

A Fase 1 usa duas trilhas oficiais, já presentes nesta pasta:

- `phase1-theme.mp3` — **As Casas dos Perdidos**, trilha de exploração, memórias e despedida.
- `phase1-boss.mp3` — **A Guardiã da Última Lanterna**, trilha exclusiva da batalha final.

## Fluxo implementado

1. **Iniciar Jornada** inicia `phase1-theme.mp3`.
2. A trilha de exploração toca em loop durante vila, pomar, cemitério, pontes e ruínas.
3. Durante qualquer diálogo, a música baixa suavemente para cerca de 30% do volume.
4. Ao entrar na Arena da Guardiã com as cinco memórias, a trilha principal faz fade-out e `phase1-boss.mp3` entra com fade-in.
5. Durante o diálogo pré-batalha, o tema do chefão permanece reduzido; quando a luta começa, volta ao volume normal.
6. Ao derrotar a Guardiã, a música do chefão desaparece e **As Casas dos Perdidos** retorna para a libertação de Eleanor.
7. No encerramento da fase, a trilha faz fade-out.
8. O botão **♫ MÚSICA** permite silenciar/reativar o áudio e a preferência fica salva no navegador.
9. Ao trocar de faixa, uma pequena identificação **AGORA TOCANDO** aparece na tela.

## Caminhos

`assets/audio/phase1/phase1-theme.mp3`

`assets/audio/phase1/phase1-boss.mp3`

O controle e as transições ficam em `game/engine/audio.js`; os gatilhos narrativos da Fase 1 ficam em `game/phase1.js`.
