# Jack o Miserável — Caminhos de Luz

Portal/jogo narrativo em estética **16-bit / Super Nintendo**, continuação do universo do musical **Jack o Miserável — Redentor dos Perdidos**.

## Premissa

Depois dos acontecimentos do musical, Jack descobre que sua lanterna não serve apenas para iluminar o próprio caminho. A cada Halloween, a chama revela trilhas para pessoas que se perderam entre memórias, promessas e despedidas.

> Jack não coleta almas. Jack ajuda pessoas.

## Menu atual

A página inicial foi refeita como um menu horizontal de jogo, inspirado diretamente na arte-base do projeto:

- cenário 16-bit em tela cheia;
- título e subtítulo sobre o cenário;
- botões navy/dourado em estilo RPG;
- menu vertical à direita;
- painel de progresso;
- versão responsiva;
- modo horizontal otimizado para celular;
- aviso discreto para girar o celular quando aberto em retrato;
- suporte a vídeo animado em loop com fallback automático para imagem estática.

## Arquivos do menu

```
assets/
├── images/
│   └── menu/
│       └── menu-poster.webp
└── videos/
    └── menu/
        ├── README.md
        ├── jack-menu-bg-loop.mp4   ← adicionar aqui
        └── jack-menu-bg-loop.webm  ← opcional
```

### Vídeo do Gemini

Exporte o fundo animado com este nome:

```
jack-menu-bg-loop.mp4
```

e coloque em:

```
assets/videos/menu/jack-menu-bg-loop.mp4
```

O HTML já está configurado. Não é necessário alterar código quando o vídeo for adicionado.

## Estado atual

- Menu horizontal funcional.
- Poster otimizado já salvo no repositório.
- Navegação entre História, Personagens, Músicas & Musical, Fases, Memórias e Créditos.
- Primeiro capítulo preparado: **Halloween I — As Casas dos Perdidos**.
- Progresso básico salvo com `localStorage`.
- Estrutura pronta para receber o protótipo jogável da primeira fase.

## Próximo passo

Adicionar o vídeo animado do menu e depois construir a primeira fase jogável de plataforma em **As Casas dos Perdidos**.

## Créditos

Universo, conceito, história e direção criativa: **Vinicius Diniz**.
