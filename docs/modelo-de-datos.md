# Modelo de datos

Contrato de los ficheros de `content/`. Es independiente de la herramienta de edición (hoy Sveltia CMS):
cualquier editor, script o persona que produzca ficheros con esta forma es compatible.
La validación está en `src/domain/schema.ts`; si un fichero no cumple el contrato, el build falla.

## Convenciones

- **Slug** = nombre del fichero sin extensión. Minúsculas, números y guiones (`ana-perez`).
  Es el identificador estable: las referencias entre colecciones usan slugs.
- **Imágenes**: rutas absolutas desde `public/`, p. ej. `/media/murals/mi-mural-1.webp`.
- **Markdown**: los campos marcados como markdown admiten formato básico (negrita, enlaces, párrafos).
- **Campos opcionales**: omitirlos, dejarlos como `""` o como `null` es equivalente (sin valor).

## Mural — `content/murals/<slug>.json`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `title` | texto | sí | |
| `year` | entero | sí | Año de realización |
| `artists` | lista de slugs | sí (≥ 1) | Cada slug debe existir en `content/artists/` |
| `location.address` | texto | sí | Dirección legible |
| `location.coordinates` | texto `"lat, lng"` | sí | Grados decimales, como los copia Google Maps. Debe caer dentro del ámbito del mapa |
| `description` | markdown | no | |
| `photos` | lista de `{ image, caption?, credit? }` | sí (≥ 1) | La primera es la portada |

El enlace a Google Maps **no se guarda**: se genera a partir de las coordenadas.

```json
{
  "title": "Nombre del mural",
  "year": 2024,
  "artists": ["ana-perez", "colectivo-sal"],
  "location": {
    "address": "Calle Ejemplo 12, Argana Alta, Arrecife",
    "coordinates": "28.97512, -13.56034"
  },
  "description": "Texto en **markdown**.",
  "photos": [{ "image": "/media/murals/nombre-1.webp", "caption": "Vista general", "credit": "Foto: X" }]
}
```

## Artista — `content/artists/<slug>.json`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `name` | texto | sí | |
| `bio` | markdown | no | |
| `photo` | ruta de imagen | no | |
| `instagram` | texto | no | Solo el usuario, sin `@` ni URL |

Los murales de un artista **no se guardan** en su ficha: se calculan a partir de los murales que lo referencian.

## Páginas — `content/pages/<slug>.md`

`contact.md` y `open-call.md`. Frontmatter con `title`; el cuerpo es markdown.

## Ajustes — `content/settings.json`

| Campo | Tipo | Obligatorio |
|---|---|---|
| `email` | email | no |
| `socials` | lista de `{ name, url }` | no |

## Cómo obtener las coordenadas

1. En Google Maps, clic derecho sobre el mural.
2. Clic en las coordenadas que aparecen arriba del menú (se copian).
3. Pegarlas tal cual en `coordinates`.
