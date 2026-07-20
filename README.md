# Clan Banner

Genera el SVG de un banner de Minecraft a partir de un string, usando las
texturas reales del juego.

## Cómo funciona

`clan-banner.js` expone `ClanBanner.bannerSvg(banner, opts)`:

- Entrada: un string `"BASE;patrón:COLOR,patrón:COLOR,..."`
  (p.ej. `"CYAN;stripe_bottom:RED,cross:BLACK"`).
- Salida: un string SVG, listo para `innerHTML`.
- Cada textura del banner es una máscara en gris. Un filtro SVG `feColorMatrix`
  multiplica su RGB por el color del tinte y conserva el alpha, igual que el
  renderizador del juego. Las capas se componen en orden con el `source-over`
  normal del SVG.
- Los 16 colores son los valores exactos de Minecraft.
- Sin dependencias.

## Uso

1. Conseguir las 44 texturas del banner y ponerlas en `assets/banner/`:

   ```bash
   npm run fetch-assets                 # última versión
   npm run fetch-assets -- -v 1.20.5    # versión concreta
   npm run fetch-assets -- -o assets/banner
   ```

2. Incluir el script:

   ```html
   <script src="clan-banner.js"></script>
   ```

3. Llamar a `bannerSvg`:

   ```js
   const svg = ClanBanner.bannerSvg("CYAN;stripe_bottom:RED,cross:BLACK", {
     textureBase: "assets/banner/",
   });
   ```

## Demo

`web/index.html` es una página autocontenida (texturas embebidas) para probar
cualquier string. Se genera con:

```bash
npm run build-web
```

## Requisitos

- Node.js **>= 22.6** (ejecuta los `.ts` con type-stripping nativo, sin build).
