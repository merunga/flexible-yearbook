# Flexible Yearbook

Sitio estático de proyectos del año de Flexible. Se publica en GitHub Pages con cada push a `main`.

## Cargar un proyecto

Una carpeta por proyecto dentro del grupo (`proyectos/5-6`, `proyectos/7-9` o `proyectos/9-13`):

```
proyectos/7-9/01-robots-de-carton/
  proyecto.md
  portada.jpg
  foto-1.jpg
  video.mp4
```

Fotos (`jpg png webp gif avif`) y videos (`mp4 webm mov m4v`) de la carpeta forman la galería, en orden alfabético.

### `proyecto.md`

```md
---
titulo: Robots de cartón
descripcion: Texto corto para la tarjeta (si falta, se usa el primer párrafo)
fecha: Junio 2026
orden: 1                  # orden dentro del grupo (si falta, nombre de carpeta)
portada: portada.jpg      # si falta: portada.* o la primera imagen
galeria: [foto-2.jpg, foto-1.jpg]   # opcional: orden/selección manual
links:
  - titulo: Instructivo
    url: https://...
embeds:
  - https://www.youtube.com/watch?v=...
---

Texto libre en **markdown**. Imágenes de la carpeta: ![](foto-1.jpg)

Una URL sola en su línea se convierte en embed:

https://vimeo.com/76979871
```

Embeds soportados: YouTube, Vimeo, Google Drive (archivo), Spotify, Scratch. Otras URLs quedan como link.

## Imágenes y videos

- Imágenes: máx. ~2000px de lado y JPG/WebP (no se procesan en el build).
- Videos: van por Git LFS (`git lfs install` una vez). Límites de GitHub: 100 MB por archivo, ~1 GB el sitio publicado. Comprimir antes:

```bash
ffmpeg -i in.mov -vf "scale=-2:720" -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 96k -movflags +faststart out.mp4
```

- Videos largos o muchos: mejor subirlos a YouTube/Vimeo (no listado) y usar `embeds`.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:4321 y regenera al guardar cambios. Build en `dist/` (`npm run build`). Estilos en `src/styles.css`, grupos en `src/groups.json`.

## Deploy

Settings → Pages → Source: **GitHub Actions**. El workflow `.github/workflows/pages.yml` corre en cada push a `main`.
