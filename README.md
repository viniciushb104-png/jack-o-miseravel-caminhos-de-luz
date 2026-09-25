# Jack o Miserável — Caminhos de Luz

Portal/jogo narrativo em estética **16-bit / Super Nintendo**, continuação do universo do musical **Jack o Miserável — Redentor dos Perdidos**.

## Premissa

Depois dos acontecimentos do musical, Jack descobre que sua lanterna não serve apenas para iluminar o próprio caminho. A cada Halloween, a chama revela trilhas para pessoas que se perderam entre memórias, promessas e despedidas.

> Jack não coleta almas. Jack ajuda pessoas.

## Menu

A página inicial funciona como menu do jogo:

- cenário 16-bit em tela cheia;
- fundo animado em vídeo com poster estático de segurança;
- botões navy/dourado em estilo RPG;
- painel de progresso;
- versão responsiva e otimizada para celular;
- acesso direto à primeira fase por **Iniciar Jornada** ou pelo mapa de fases.

## Halloween I — As Casas dos Perdidos

A primeira rota já possui um **protótipo jogável sem inimigos**, focado em movimento e exploração.

### Mecânicas atuais

- andar para esquerda e direita;
- correr com **Shift**;
- pular com altura variável;
- gravidade e colisão com plataformas;
- coyote time e jump buffer para deixar o pulo mais confortável;
- câmera acompanhando Jack;
- plataformas de pedra, madeira e ponte;
- cenário noturno com parallax procedural;
- lanternas, abóboras, vila, montanhas e castelo;
- checkpoint que aumenta a Luz para 02;
- queda com retorno à última luz;
- conclusão da rota e reinício;
- controles de toque no celular;
- progresso básico salvo com localStorage.

### Controles

**PC:** A/D ou ←/→ para andar, Espaço/↑ para pular e Shift para correr.

**Celular:** botões de movimento e pulo aparecem automaticamente. A experiência foi desenhada para funcionar melhor na horizontal.

## Estrutura principal

    /
    ├── index.html
    ├── styles.css
    ├── script.js
    ├── game/
    │   ├── phase1.html
    │   ├── phase1.css
    │   └── phase1.js
    └── assets/
        ├── images/menu/menu-poster.webp
        ├── sprites/jack/data/
        │   ├── jack-mini.1.b64
        │   ├── jack-mini.2.b64
        │   └── jack-mini.3.b64
        └── videos/menu/
            └── jack-menu-bg-loop.mp4

O atlas compacto do Jack é reconstruído no navegador a partir dos três arquivos .b64, permitindo manter os sprites dentro do próprio repositório.

## Próximas etapas

Expandir **As Casas dos Perdidos** com os sprites transparentes de cenário, animações adicionais do Jack, almas/NPCs, memórias e objetivos narrativos — ainda priorizando exploração antes de introduzir inimigos.

## Créditos

Universo, conceito, história e direção criativa: **Vinicius Diniz**.
