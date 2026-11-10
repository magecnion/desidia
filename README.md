# Murales de Argana Alta

Web estática (Astro) con los murales de Argana Alta (Arrecife, Lanzarote). Ver [PLAN.md](PLAN.md) y
[docs/modelo-de-datos.md](docs/modelo-de-datos.md).

```sh
npm install
npm run dev      # http://localhost:4321
npm run preview  # build + wrangler dev (como en Cloudflare)
npm test         # tests
npm run check    # tipos
npm run build    # valida el contenido y genera dist/
```

Variables de entorno: `PUBLIC_WEB3FORMS_KEY` (formulario de contacto).

Editor de contenido en `/admin/` (Sveltia CMS). Despliegue en Cloudflare Workers: ver
[docs/despliegue.md](docs/despliegue.md).
