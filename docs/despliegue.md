# Despliegue y editor de contenido

Arquitectura:

```
Cliente ──edita──▶ /admin/ (Sveltia CMS) ──commit──▶ GitHub magecnion/desidia (rama main)
                        │ login                              │ push
                        ▼                                    ▼
        Worker «sveltia-cms-auth» (OAuth GitHub)    Workers Builds: npm run build + wrangler deploy
                                                              ▼
                                               Worker «desidia» (sitio estático, dist/)
```

Cada vez que el cliente guarda, se hace un commit en `main`, Cloudflare reconstruye la web y en 1–2 min
está publicada. Si el contenido no cumple el modelo (p. ej. coordenadas fuera del mapa), **el build falla
y la web no cambia** (sigue la versión anterior): por eso conviene activar el aviso del paso 7.

Se usa **Cloudflare Workers** (recomendado por Cloudflare para proyectos nuevos) en lugar de Pages.
Configuración: `wrangler.jsonc`.

## 0. Probar el editor en local (sin cuentas)

1. `npm run dev`
2. En **Chrome** (Firefox/Safari no sirven), abrir http://localhost:4321/admin/index.html
3. «Work with Local Repository» → seleccionar la carpeta del proyecto.
4. Editar o crear un mural/artista: los cambios se escriben en `content/` y `public/media/`.
5. Revisar con `git diff`, comprobar con `npm run build` y descartar o hacer commit.

## 1. Rama de producción

Producción y CMS trabajan sobre `main`. Fusionar `poc-plan` en `main` antes de conectar Cloudflare.

## 2. Web en Cloudflare Workers

1. Cuenta gratuita en https://dash.cloudflare.com
2. **Compute → Workers & Pages → Create application → Import a repository**.
3. Conectar GitHub y dar acceso al repositorio `magecnion/desidia` (si el repo es de `magecnion`, debe
   autorizarlo esa cuenta o una con permisos de administración).
4. Configuración del build:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Production branch: `main`; activar builds de otras ramas (preview por rama).
   - Variable de build `NODE_VERSION` = `24.10.0`.
   - Variable de build `PUBLIC_WEB3FORMS_KEY` = clave de https://web3forms.com (formulario de contacto).
5. Guardar y desplegar. La web queda en `https://desidia.<subdominio>.workers.dev`.

## 3. Worker de autenticación del CMS

1. Desplegar https://github.com/sveltia/sveltia-cms-auth con su botón «Deploy to Cloudflare Workers».
2. Anotar su URL: `https://sveltia-cms-auth.<subdominio>.workers.dev`.

## 4. App OAuth de GitHub

En GitHub (cuenta que administra el proyecto) → Settings → Developer settings → OAuth Apps → New:

- Application name: `Desidia CMS`
- Homepage URL: la URL de la web
- Authorization callback URL: `https://sveltia-cms-auth.<subdominio>.workers.dev/callback`

Generar un client secret y copiar Client ID y Client Secret.

## 5. Variables del Worker de autenticación

Cloudflare → Worker `sveltia-cms-auth` → Settings → Variables and secrets:

| Nombre | Valor |
|---|---|
| `GITHUB_CLIENT_ID` | Client ID del paso 4 |
| `GITHUB_CLIENT_SECRET` | Client Secret del paso 4 (tipo *Secret*) |
| `ALLOWED_DOMAINS` | `desidia.<subdominio>.workers.dev` (y el dominio definitivo, separados por comas) |

## 6. Activar el login en el CMS

En `public/admin/config.yml`, descomentar `base_url` con la URL del paso 3 y poner `site_url` /
`display_url`. Commit en `main`.

## 7. Aviso de builds fallidos

Cloudflare → Notifications → Add → **Workers Builds** (build failed) → email del equipo. Así un error de
contenido del cliente no pasa desapercibido. En el log del build aparece el motivo, p. ej.:
`Mural "x": coordinates fall outside the map`.

## 8. Acceso del cliente

1. El cliente crea una cuenta de GitHub.
2. En `magecnion/desidia` → Settings → Collaborators → invitarle con permiso **Write**.
3. Entra en `https://<web>/admin/` → «Sign In with GitHub».

## 9. Dominio (más adelante)

Worker `desidia` → Settings → Domains & Routes → Custom domain. Añadirlo también a `ALLOWED_DOMAINS`
(paso 5), a `site` en `astro.config.mjs` y a `site_url` en `public/admin/config.yml`.
