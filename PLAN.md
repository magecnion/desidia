# Plan — Web de murales de Argana Alta

Web estática con el listado de murales de **Argana Alta (Arrecife, Lanzarote)**, mostrados sobre una
ilustración artística georreferenciada, con filtros por año y artista. Contenido editable por el cliente
sin backend propio.

## Decisiones

| Tema | Decisión |
|---|---|
| Stack | Astro (estático) + Leaflet + Tailwind + Cloudflare Workers (recomendado sobre Pages para proyectos nuevos) |
| Edición de contenido | Sveltia CMS (basado en Git) como **adaptador intercambiable**; login con GitHub del cliente |
| Idioma | Solo castellano |
| Volumen | ~15 murales hoy, < 50 previstos |
| Mapa | Ilustración deformada (artística) → `L.CRS.Simple` + transformación *thin plate spline* calculada en build |
| Ubicación | Campo `coordenadas` ("lat, lng" copiado de Google Maps) + `direccion` manual; enlace a Google Maps generado |
| Contacto | Formulario sencillo (Web3Forms + Turnstile) + redes sociales |
| Open call | Página informativa editable |

## Principio: modelo independiente de la implementación

- `content/` contiene los **datos** (JSON/markdown) y es la única fuente de verdad.
- `docs/modelo-de-datos.md` es el **contrato**. `src/domain/schema.ts` lo valida.
- `src/data/repositorio.ts` es el **puerto** de lectura. Las páginas solo usan el repositorio y el dominio.
- `public/admin/` es el **adaptador del CMS** (hoy Sveltia). Cambiar de CMS = sustituir esa carpeta.
- No se usan formatos propios de ningún CMS (nada de GeoJSON del widget de mapa, etc.).

```
content/                  datos
docs/modelo-de-datos.md   contrato
src/
  domain/                 tipos, validación, lógica pura
  data/repositorio.ts     acceso a datos
  map/                    ilustración, puntos de control, proyección lat/lng → píxel
  scripts/                código de navegador (Leaflet, filtros)
  pages/ components/      presentación
public/
  admin/                  adaptador CMS (Sveltia)
  media/                  imágenes subidas
  mapa/                   ilustración / teselas
```

## Modelo de datos

**Mural** — `content/murales/<slug>.json`
- `titulo` (texto), `year` (entero)
- `artistas` (lista de slugs de artista, ≥ 1)
- `ubicacion.direccion` (texto), `ubicacion.coordenadas` ("lat, lng")
- `descripcion` (markdown, opcional)
- `fotos` (lista de `{ imagen, pie?, credito? }`, ≥ 1; la primera es la portada)

**Artista** — `content/artistas/<slug>.json`
- `nombre`, `bio` (markdown, opcional), `foto` (opcional), `instagram` (usuario, opcional)
- Sus murales se **calculan** a partir de los murales que lo referencian.

**Páginas** — `content/paginas/{contacto,open-call}.md` (`titulo` + cuerpo markdown).
**Ajustes** — `content/ajustes.json` (redes sociales, email de contacto).

## Ubicación de un mural (flujo del cliente)

1. Google Maps → clic derecho sobre el mural → clic en las coordenadas (se copian).
2. Pegar en "Coordenadas". Escribir la dirección.
3. El build valida el formato y que el punto caiga dentro de la ilustración.

## Mapa (opción B)

- Ilustración: dibujo libre (a mano a 600 ppp o digital; vectorizar si encaja con el estilo). Guardar
  original maestro. Exportar ~8000 px lado largo → teselas WebP (`vips dzsave --layout google`).
  Para pruebas, una imagen única de ~4000 px.
- Dibujar elementos reconocibles repartidos (puntos de control), deformación continua, sin marcadores
  dibujados, con margen alrededor.
- 15–25 puntos de control en `src/map/ilustracion.json` (`pixel` + `coordenadas` "lat, lng").
  Se obtienen con la herramienta interna `/calibracion/`: clic en la ilustración → píxel; clic derecho en
  Google Maps → coordenadas. La misma página muestra el error de cada punto (validación cruzada).
- Transformación TPS con `@allmaps/transform` (sobre Web Mercator), calculada en build.
- Formato: una ilustración más cuadrada o vertical aprovecha mejor la pantalla del móvil.
- Popup: foto, título, año, artistas, dirección, "Ver mural", "Abrir en Google Maps".

## Filtros

Año (chips) + artista (selector), combinables, en cliente, sincronizados con la URL
(`/?artista=slug&year=2024`). Contador, limpiar filtros, listado accesible bajo el mapa.

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Mapa + filtros + listado |
| `/artistas` | Índice de artistas |
| `/artistas/[slug]` | Foto, bio, Instagram, listado de sus murales, "Ver en el mapa" |
| `/murales/[slug]` | Galería, artistas, año, dirección + Google Maps, descripción |
| `/contacto` | Texto, formulario, redes |
| `/open-call` | Texto informativo |
| `/admin` | CMS |

## Fases

1. **Base** — repo, Astro, modelo (schema + repositorio + docs), datos de ejemplo, páginas mínimas. ✅
2. **Mapa** — ilustración provisional, proyección TPS, Leaflet, filtros + URL, herramienta de calibración. ✅
   ⚠️ La ilustración provisional es una captura de Google Maps: no publicar la web con ella.
3. **Páginas** — fichas, índice, contacto (formulario + redes), open call, layout, responsive.
4. **CMS** — `public/admin/config.yml` (validado contra el esquema de Sveltia), `wrangler.jsonc`, 404, guía `docs/despliegue.md`. 🔄 pendiente: pasos con cuentas (Cloudflare, OAuth GitHub, acceso del cliente).
5. **Ilustración definitiva** — teselas, puntos de control finales.
6. **Contenido y entrega** — 15 murales, guía para el cliente, SEO, dominio.
