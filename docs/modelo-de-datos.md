# Modelo de datos

Contrato de los ficheros de `content/`. Es independiente de la herramienta de edición (hoy Sveltia CMS):
cualquier editor, script o persona que produzca ficheros con esta forma es compatible.
La validación está en `src/domain/schema.ts`; si un fichero no cumple el contrato, el build falla.

## Convenciones

- **Slug** = nombre del fichero sin extensión. Minúsculas, números y guiones (`ana-perez`).
  Es el identificador estable: las referencias entre colecciones usan slugs.
- **Imágenes**: rutas absolutas desde `public/`, p. ej. `/media/murales/mi-mural-1.webp`.
- **Markdown**: los campos marcados como markdown admiten formato básico (negrita, enlaces, párrafos).
- **Campos opcionales**: omitirlos, dejarlos como `""` o como `null` es equivalente (sin valor).

## Mural — `content/murales/<slug>.json`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `titulo` | texto | sí | |
| `year` | entero | sí | Año de realización |
| `artistas` | lista de slugs | sí (≥ 1) | Cada slug debe existir en `content/artistas/` |
| `ubicacion.direccion` | texto | sí | Dirección legible |
| `ubicacion.coordenadas` | texto `"lat, lng"` | sí | Grados decimales, como los copia Google Maps. Debe caer dentro del ámbito del mapa |
| `descripcion` | markdown | no | |
| `fotos` | lista de `{ imagen, pie?, credito? }` | sí (≥ 1) | La primera es la portada |

El enlace a Google Maps **no se guarda**: se genera a partir de las coordenadas.

```json
{
  "titulo": "Nombre del mural",
  "year": 2024,
  "artistas": ["ana-perez", "colectivo-sal"],
  "ubicacion": {
    "direccion": "Calle Ejemplo 12, Argana Alta, Arrecife",
    "coordenadas": "28.97512, -13.56034"
  },
  "descripcion": "Texto en **markdown**.",
  "fotos": [{ "imagen": "/media/murales/nombre-1.webp", "pie": "Vista general", "credito": "Foto: X" }]
}
```

## Artista — `content/artistas/<slug>.json`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `nombre` | texto | sí | |
| `bio` | markdown | no | |
| `foto` | ruta de imagen | no | |
| `instagram` | texto | no | Solo el usuario, sin `@` ni URL |

Los murales de un artista **no se guardan** en su ficha: se calculan a partir de los murales que lo referencian.

## Páginas — `content/paginas/<slug>.md`

`contacto.md` y `open-call.md`. Frontmatter con `titulo`; el cuerpo es markdown.

## Ajustes — `content/ajustes.json`

| Campo | Tipo | Obligatorio |
|---|---|---|
| `email` | email | no |
| `redes` | lista de `{ nombre, url }` | no |

## Cómo obtener las coordenadas

1. En Google Maps, clic derecho sobre el mural.
2. Clic en las coordenadas que aparecen arriba del menú (se copian).
3. Pegarlas tal cual en `coordenadas`.
