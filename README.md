# Jack o Miserável — Caminhos de Luz

Site/jogo narrativo em estética **16-bit / Super Nintendo**, continuação do universo do musical **Jack o Miserável — Redentor dos Perdidos**.

## Premissa

Depois dos acontecimentos do musical, Jack descobre que sua lanterna não serve apenas para iluminar o próprio caminho. A cada Halloween, a chama revela trilhas para pessoas que se perderam entre memórias, promessas e despedidas.

> Jack não coleta almas. Jack ajuda pessoas.

## Estado atual

- Tela de abertura inspirada em cartuchos de 16-bit.
- Arte principal integrada ao projeto em versão pixelada otimizada.
- Portal responsivo para desktop e celular.
- Navegação em estilo menu de RPG.
- Seções de lore, personagens, musical, capítulos, memórias e créditos.
- Primeiro capítulo preparado: **Halloween I — As Casas dos Perdidos**.
- Progresso básico salvo no navegador com `localStorage`.
- Efeitos sonoros de menu gerados no navegador, sem arquivos externos.

## Estrutura

```
/
├── index.html
├── styles.css
├── script.js
└── assets/
    └── hero-data.txt
```

A arte de abertura é carregada pelo navegador a partir de `hero-data.txt`, evitando dependência de hospedagem externa e preservando o visual retro no GitHub Pages.

## Próximo passo

Construir a primeira fase jogável de plataforma dentro de **As Casas dos Perdidos**, mantendo a linguagem visual 16-bit, a lanterna como mecânica central e a ajuda às almas como eixo narrativo.

## Créditos

Universo, conceito, história e direção criativa: **Vinicius Diniz**.
