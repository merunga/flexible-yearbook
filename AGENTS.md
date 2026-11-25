# AGENTS.md

Sitio estático con los proyectos del año de Flexible (laboratorio de arte, ciencia, juego y tecnología para infancias). Lo ven las familias. Se publica en GitHub Pages.

## Comandos

- `npm ci`: instala (`marked`, `yaml`; no hay más dependencias)
- `npm run build`: genera `dist/`
- `npm test`: build + validaciones (páginas generadas, links/src locales existentes, sin `undefined` en el HTML)
- `npm run dev`: build + servidor en http://localhost:4321 (rebuild al guardar; `PORT` para cambiarlo). `.claude/launch.json` lo expone a la preview de Claude Code

Correr `npm test` antes de cada commit.

## Estructura

- `scripts/serve.mjs`: servidor local sin dependencias con watch
- `scripts/build.mjs`: generador. Lee `proyectos/`, renderiza HTML con template literals y copia media a `dist/`
- `src/styles.css`: todos los estilos (CSS plano, sin Tailwind ni build)
- `src/lightbox.js`: único JS del cliente (`<dialog>` para las fotos)
- `src/groups.json`: grupos (slug, nombre, color `sun|mint|sky`)
- `public/`: se copia tal cual a `dist/`
- `proyectos/<grupo>/<carpeta-proyecto>/`: contenido (`proyecto.md` + fotos/videos)
- `test/`: tests con `node:test`

Salida: `dist/index.html`, `dist/<grupo>/index.html`, `dist/<grupo>/<proyecto>/index.html` + media.

## Contenido

El formato de `proyecto.md` (frontmatter + markdown, links, embeds, galería) está documentado en `README.md`. Si se cambia el formato, actualizar el README: lo usan personas no técnicas para cargar proyectos.

## Convenciones

- Sin frameworks ni bundler. HTML generado + CSS + JS mínimo. No agregar dependencias sin necesidad clara.
- Rutas siempre relativas (el sitio vive en `/flexible-yearbook/` y puede pasar a un dominio propio). El layout recibe `base` (`""`, `"../"`, `"../../"`).
- Escapar todo texto de usuario con `esc()`. El body markdown se renderiza con `marked`.
- Textos de la UI en español rioplatense (voseo: "Elegí", "Probá").
- Diseño: bordes `2px` color `--ink`, sombra sólida desplazada (`--shadow`), radios `1rem`, tipografías Bricolage Grotesque (títulos) y Atkinson Hyperlegible (texto). Mantener ese lenguaje visual.
- Código conciso, sin comentarios obvios.

## Media

- Videos por Git LFS (`.gitattributes`). Límite de GitHub: 100 MB por archivo, ~1 GB el sitio.
- El build no procesa imágenes; se suben ya optimizadas.

## Deploy

- `.github/workflows/pages.yml`: push a `main` → `npm test` → publica `dist/` en Pages (jobs `build` → `deploy`).
- `.github/workflows/ci.yml`: `npm test` en cada PR.
- Trabajar en ramas y mergear por PR.

## Contexto

- El sitio es público (GitHub Pages no tiene acceso con clave); tiene `noindex`. No agregar datos personales de los chicos (apellidos, etc.).
- Viene de una app de Lovable (TanStack Start + Supabase, con clave para familias y panel admin), reemplazada por este generador. El código original está en el historial de git antes del PR #1.
