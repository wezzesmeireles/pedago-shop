# Ícone e splash do app

Coloque aqui as imagens de origem e o `@capacitor/assets` gera todos os tamanhos
do Android automaticamente.

## Arquivos necessários (Wesley)
- `icon.png` — **1024×1024**, a logo do Site Pedagógico. Sem transparência nas
  bordas (vira fundo preto em alguns launchers). Quadrada.
- `splash.png` — **2732×2732**, logo centralizada num fundo da cor da marca
  (a tela de abertura). Opcional, mas recomendado.

## Gerar (a partir de `apps/mobile`)
```bash
pnpm dlx @capacitor/assets generate --android
pnpm exec cap sync android
```

Isso popula `android/app/src/main/res/` (mipmaps do ícone + drawables do splash).

> Enquanto não houver a arte, o app usa o ícone padrão do Capacitor — funciona
> pra testar, mas **troque antes de publicar na Play**.
