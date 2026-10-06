# Halloween V — Plataformas

Estrutura visual oficial das plataformas de **Halloween V — A Última Lanterna**.

## Lotes

- `5A-estrada-retorno/` — A Estrada que Volta
- `5B-vila-janelas/` — As Casas sem Espera / vila de Halloween
- `5C-relogios-reflexos/` — O Relógio sem Ontem
- `5D-jardim-memorias/` — O Jardim das Coisas Guardadas
- `5E-cidade-rotulos/` — A Cidade sem Jack
- `5F-caminho-promessa/` — A Encruzilhada da Promessa
- `5G-sala-espelhos-final/` — A Última Lanterna / arena de O Miserável
- `5Z-shared/` — peças utilitárias e transições

## Regra técnica

A colisão continua sendo controlada pelas estruturas `GROUND` e `PLATFORMS` em
`game/phase5.js`. Os PNGs são desenhados como camada visual por cima dessa
geometria para preservar a jogabilidade já testada.

Os assets são carregados por setor: área atual + vizinhas. Isso evita colocar
todos os PNGs pesados da fase na memória ao mesmo tempo.

## Integração atual

- 5A: chão principal da Estrada do Retorno
- 5B: três trechos de chão + três plataformas elevadas
- 5C: três trechos de chão + três plataformas elevadas
- 5D: três trechos de chão + três plataformas elevadas
- 5E: três trechos de chão + três plataformas elevadas
- 5F: cinco trechos sequenciais no Caminho da Promessa
- 5G: arena final dividida em blocos visuais
- 5Z: quatro peças usadas como acabamento de transição; restantes ficam como biblioteca de polimento
