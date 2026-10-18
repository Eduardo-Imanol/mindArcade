---
description: Arranca (o detiene) mindArcade en local con Vite en http://localhost:5173
---

Uso: `/run web` (o `/run`) arranca el proyecto; `/run stop` lo detiene.
Argumento recibido: `$ARGUMENTS`

Ejecuta SOLO los pasos de la sección correspondiente. No explores el repo, no leas archivos, no corras tests/lint/build.

## web (por defecto)

1. Comprueba si ya está corriendo:

   ```bash
   curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:5173/ || true
   ```

   - Si devuelve `200`, ya está activo: salta al paso 3.

2. Arranca el servidor Vite en segundo plano (desde la raíz del proyecto):

   ```bash
   nohup node_modules/.bin/vite --port 5173 --strictPort > /tmp/mindarcade-dev.log 2>&1 & echo $! > /tmp/mindarcade-dev.pid
   ```

   Reglas obligatorias:
   - NUNCA uses `--host 0.0.0.0` (en este entorno falla con `uv_interface_addresses ... error 13`).
   - No encadenes nada con `&&` antes del `nohup` (el `&` agruparía todo y bloquearía la shell hasta el timeout).

3. Espera ~3 s y verifica:

   ```bash
   sleep 3; curl -s -o /dev/null -w "HTTP:%{http_code}\n" --max-time 3 http://localhost:5173/; echo "PID:$(cat /tmp/mindarcade-dev.pid)"; cat /tmp/mindarcade-dev.log
   ```

   - Si `HTTP:200`: responde en 3 líneas con URL (`http://localhost:5173/`), PID y log (`/tmp/mindarcade-dev.log`), y recuerda que se detiene con `/run stop`.
   - Si no hay `200`: muestra el contenido del log y el error; no reintentes más de una vez.

## stop

```bash
PID="$(cat /tmp/mindarcade-dev.pid 2>/dev/null || pgrep -f "[v]ite --port 5173" | head -1)"; if [ -n "$PID" ]; then kill "$PID" && echo "detenido PID $PID"; else echo "no estaba corriendo"; fi; sleep 1; curl -s -o /dev/null -w "HTTP:%{http_code}\n" --max-time 2 http://localhost:5173/ || true
```

- `HTTP:000` (o vacío) significa detenido: confírmalo en 1 línea.
- Si sigue devolviendo `200`, lista `pgrep -af "[v]ite --port 5173"`, mata el PID restante y reconfirma.

## cualquier otro argumento

Responde en 1 línea: argumentos válidos: `web` (por defecto) y `stop`.
