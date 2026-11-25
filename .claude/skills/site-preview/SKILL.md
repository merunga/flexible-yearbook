---
name: site-preview
description: Levanta el sitio en localhost (con rebuild al guardar) y abre el navegador, o lo apaga. Usar cuando piden ver, previsualizar, abrir o apagar el preview del sitio.
argument-hint: "[start|stop|status]"
---

Corré desde la raíz del repo:

```bash
npm run preview -- $ARGUMENTS
```

- Sin argumento: si el preview está corriendo lo apaga, si no lo levanta y abre el navegador.
- `start`: levanta (o reabre el navegador si ya corre). `stop`: apaga. `status`: informa.
- URL: http://localhost:4321 (`PORT` para cambiarla). Logs en `.preview.log`.

Respondé con una línea: la URL si quedó corriendo, o que se apagó. Si falla, mostrá el final de `.preview.log`.
