# Content Studio — contexto del proyecto

Lee esto antes de tocar nada. Resume cómo está hecho, por qué, y las reglas que no se
negocian. Está escrito para quien llega nuevo al repositorio.

---

## Qué es

Una app de **un solo archivo** (`index.html`, ~9.200 líneas) para planificar el contenido
de redes sociales de Mila Meekins. Sin build, sin framework, sin dependencias de
compilación: HTML + CSS + JavaScript dentro de un IIFE. Se abre en el navegador y ya.

En producción vive en GitHub Pages: https://milameekinsmarketing.github.io/mila-content-studio/

Maneja **tres marcas a la vez** desde un selector arriba del menú:

| Marca | Qué es | Cupo mensual |
|---|---|---|
| `realestate` | Mila Meekins Real Estate | 12 reels · 4 YouTube · 4 carruseles · 8 posts · 30 historias |
| `escapadita` | Una escapadita con Mila — guía de Carolina del Norte (el Triángulo) | 4 · 4 · 8 · 8 · 25 |
| `finanzas` | Finanzas con Propósito | usa el cupo global |

Secciones: Dashboard · Reels · YouTube · Carruseles · Posts · Historias · Fin de mes ·
Feed Preview · Settings.

---

## Lo que NO se hace

Estas son decisiones de la clienta, no preferencias de estilo. Rómpelas y el trabajo se
devuelve.

1. **Nada de emojis de brillitos** en ningún copy: ✨ 🌟 💫 ⭐ 🪄. Ninguno, en ninguna marca.
2. **La palabra "prosperidad" no se usa.** Se dice "servicio".
3. **No se inventan testimonios, reseñas ni cifras de ventas.** Las piezas de credibilidad
   llevan los datos entre corchetes — `[N] casas`, `[cita textual]`, `[N] días` — y una
   nota al final diciendo que se completan con datos reales. Si una pieza necesita una
   reseña, la pieza pide *la captura de la reseña real*, no escribe la reseña.
4. **No se desprestigia a nadie.** Las recomendaciones de lugares se basan en reseñas
   públicas y se dice de dónde salen. Nada de "cómo saber si X es malo".
5. **Los carruseles van de 4 a 5 láminas**, y la última es siempre llamado a la acción de
   realtor ("¿Buscas mudarte? Soy Realtor, escríbeme"). Los carruseles viejos del Mes 1 de
   Real Estate todavía tienen 7–11 láminas; eso es deuda pendiente, no el formato a copiar.
6. **Los guiones van toma por toma**, en este formato exacto:

```
Toma 1:
La modelo dice: …
La acción que hace: …
El texto en pantalla será: …
```

Reels: 6 tomas. YouTube: 35 tomas de 13 segundos = 7:35 (Escapadita usa 17 = 3:41).
En YouTube la acción de cada toma **continúa la de la anterior** — nunca empieza de cero.

7. **Las descripciones de YouTube** llevan: gancho, duración, capítulos con su minuto
   **verificados contra las tomas** (toma N empieza en `(N-1)×13` segundos), CTA de
   realtor y aviso legal.

---

## Cómo está organizado el contenido

Cada pieza es un objeto con `num`, `pillar`, `title`, `mes`, `days` y los campos propios de
su formato (`desarrollo`, `copy`, `designText`, `slides`, `idea`). Los arreglos viven en el
propio `index.html`:

```
CONTENT_REELS / CONTENT_YOUTUBE / CONTENT_CAROUSELS / CONTENT_POSTS / CONTENT_STORIES   → realestate
ESC_REELS / ESC_YOUTUBE / ESC_CARRUSELES / ESC_POSTS / ESC_STORIES                      → escapadita
FIN_REELS / FIN_CAROUSELS / FIN_POSTS / FIN_STORIES                                     → finanzas
BRAND_CONTENT  ← conecta cada marca con sus arreglos
```

**Importante: todo `const` que use `seed()` tiene que estar declarado ANTES de
`let S = seed();`.** Si no, el archivo revienta con un error de zona muerta temporal.

---

## Lo más delicado del motor: cómo llega el contenido nuevo sin pisar el trabajo de nadie

La clienta trabaja todos los días sobre su copia guardada. El contenido nuevo que se
escribe aquí tiene que llegarle **sin borrar lo que ella editó**. Eso lo resuelve
`mergeIntoSeed()`, y hay que entenderlo antes de agregar contenido.

Funciona con un **sello** por marca: `CONTENT_STAMP`. Si el sello guardado no coincide con
el del código, se corre la actualización y después se guarda el sello nuevo.

```js
const CONTENT_STAMP = {
  finanzas:   "bloque-01-tomas",
  realestate: "mes-03-completo-b",
  escapadita: "mes-01-v8"
};
```

**Si agregas o cambias contenido, sube el sello de esa marca.** Si no lo haces, el cambio
no le llega a nadie que ya tenga la app cargada. Es el error más fácil de cometer aquí.

Dentro de la actualización hay tres mecanismos, de menos a más invasivo:

1. **Sección vacía → se llena entera.** Una marca que nunca tuvo contenido recibe todo.
2. **Se suman las piezas nuevas.** Las que traen un `num` que todavía no existe se
   agregan al final. Nunca reemplazan nada.
3. **Se refresca lo que nadie tocó.** `refrescar(coll, campo, previos)` reemplaza un campo
   solo si está vacío o si sigue siendo *exactamente* el texto que la app entregó antes.
   Por eso existen `FIN_COPY_V1`, `RE_M2_V1`, `RE_COPY_V1`, `RE_ST_V1` y `ESC_V1`: guardan
   lo entregado para poder reconocer una pieza intacta. **Si cambias un texto que ya se
   entregó, guarda el anterior en el mapa que corresponda** o el cambio no llegará.
4. **`reemplazarIntactas()`** va más lejos: reemplaza la pieza *entera* (otro título, otras
   láminas) si todos sus campos siguen intactos, y se lleva las que ya no existen. Las
   láminas conservan su imagen y su id: solo cambia el texto.

**El orden importa: `reemplazarIntactas()` corre ANTES que `refrescar()`.** Al revés,
`refrescar()` rellena un campo vacío con el texto nuevo y entonces `reemplazarIntactas()`
ve una pieza con título viejo y copy nuevo, no reconoce ninguna versión entregada, la da
por editada a mano y deja la mezcla. Solo comparando contra lo que la clienta realmente
tiene se sabe si tocó la pieza.

Una pieza se reconoce por su `num` y, si lo perdió, **por su título**. Y un campo cuenta
como intacto también cuando está vacío.

Hay un botón en **Settings → Rellenar** que hace esta misma comprobación a mano, para
cuando el navegador de la clienta se quedó con una versión vieja.

---

## Dónde vive el estado

- `S` — el estado en memoria. `seed(brandId)` lo construye, `render()` lo pinta.
- `localStorage` (`mila.studio.v1`) — copia de este navegador. Formato
  `{v:4, brands:{...}}` vía `packWorkspace()` / `unpackWorkspace()`.
- **Supabase** — la fuente real: tabla `workspace_state` (una fila JSONB), auth y realtime.
  Proyecto `rgxxyezzxaqaawswreyl`. Las reglas de acceso solo dejan leer y escribir a quien
  tenga sesión iniciada.
- Preferencias por navegador (rol, marca activa) van en sus propias claves y se fuerzan
  después de cada `seed`/`merge`.

Si Supabase no responde, la app lo dice y ofrece entrar con la copia local. No se queda
muerta.

---

## Qué hace la app, además de guardar texto

Cosas que no se deducen leyendo los arreglos de contenido:

- **Selector de marca** arriba del menú. Cambiar de marca reconstruye el estado entero.
- **Meses de contenido.** Cada sección tiene pestañas de mes con su cupo (`48/30`). El
  Feed Preview lleva su propio calendario de meses, aparte.
- **Avisos en el menú.** Un ⚠ ámbar con cuántos campos de texto están vacíos y un icono
  de imagen rota en rojo con cuántas piezas no tienen imagen. En carruseles **solo cuenta
  la lámina 1**.
- **"Mover a otro mes"** en cada post, reel, carrusel, video e historia. En las historias
  es el icono de calendario arriba a la derecha, porque la tarjeta es demasiado alta para
  poner el botón con texto al final.
- **Recuadros multimedia.** Reels: video, portada y **foto de referencia** (cómo tiene que
  verse la toma). YouTube: video y portada. Cualquiera se amplía a pantalla completa y se
  descarga. Se suben con `mediaBox()`, que ya trae los botones de ampliar y descargar.
- **Google Drive, opcional.** Si `GOOGLE_CLIENT_ID` y `GOOGLE_DRIVE_FOLDER_ID` están
  puestos, las imágenes se suben a Drive y se guarda el link; los videos van siempre a
  Drive. Si la autorización falla, la imagen se guarda embebida en el workspace.
- **Settings → Rellenar lo que falte**, **Quitar imágenes**, y los roles Admin / Editor /
  Viewer, que son una preferencia de cada navegador y no del workspace.

---

## Cómo trabajar aquí

**Edita el contenido con un script de Python**, no a mano. Los arreglos son JSON dentro del
HTML y se serializan con `json.dumps(arr, ensure_ascii=False, indent=2)`, que reproduce el
formato existente exactamente.

**Verifica la sintaxis después de cada cambio**:

```bash
python3 -I -c "
import re
s=open('index.html',encoding='utf-8').read()
open('/tmp/chk.js','w').write(re.search(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',s,re.S).group(1))
" && node --check /tmp/chk.js
```

**Prueba en el navegador antes de dar algo por hecho.** Playwright con el Chromium que ya
está instalado:

```js
chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
```

Probar de verdad significa: cargar la página, recorrer las secciones de las tres marcas,
confirmar que no hay errores de JavaScript, y — cuando toques el motor de fusión —
simular el estado guardado de la clienta con una pieza editada a mano y comprobar que
sobrevive.

**Los commits van en español**, explicando qué cambió y por qué, no solo qué archivo.

---

## Qué hay hoy

```
realestate   reels 41 (17/12/12)  ·  youtube 12 (4/4/4)  ·  carruseles 17 (9/4/4)
             posts 25 (9/8/8)     ·  historias 109 (49/30/30)
escapadita   reels 4 · youtube 4 · carruseles 8 · posts 8 · historias 25   (solo Mes 1)
finanzas     reels 12 · carruseles 4 · posts 8 · historias 30              (solo Mes 1)
```

Las historias del Mes 2 y 3 de Real Estate siguen una estructura pedida por la clienta:
5 de "sobre mí" · 5 reseñas de Google · 5 de Facebook · 15 casas vendidas, con el texto
literal "Primera casa vendida", "Segunda casa vendida"…

---

## Lo que falta

- **Metricool no está conectado.** La Edge Function está escrita (`supabase/functions/programar/`)
  pero nunca se desplegó. `METRICOOL_FN_URL` está vacío. El token va en los secretos de
  Supabase, **nunca en el código ni en un chat**. Pasos en su `INSTRUCCIONES.md`.
- **El logo de Una escapadita con Mila** sigue siendo un monograma provisional.
- **Los carruseles viejos del Mes 1** de Real Estate tienen 7–11 láminas y no siguen el
  formato de 5 con CTA.
- **Finanzas con Propósito** solo tiene Mes 1.
- **Las piezas de credibilidad** tienen corchetes por llenar con datos reales.
- **Los carruseles de comida de Escapadita** tienen `⭐ ___ · ___ reseñas` para confirmar
  antes de publicar.
- **Si la autorización de Google Drive falla, el selector de archivos no abre.** El popup
  de Google consume el gesto del clic y Chrome bloquea el diálogo después
  («File chooser dialog can only be shown with a user activation»). Afecta a portada,
  video y referencia por igual. Se arregla pidiendo el token *antes* del clic, o abriendo
  el selector primero y subiendo a Drive después.

---

## El resto del repositorio

- `plantilla/` — copia limpia para montar un cliente nuevo. Sin contenido ni marca; lo
  único que se toca es el bloque de configuración de arriba. **Un proyecto de Supabase por
  cliente**: la clave de la app va visible en el HTML, así que compartir proyecto hace que
  el aislamiento dependa de que las reglas estén perfectas. Ver `plantilla/PLANTILLA.md`.
  Las mejoras del motor hay que portarlas a mano: es una copia, no un enlace.
- `supabase/functions/programar/` — la función que programa en Metricool sin exponer el token.
- `.github/workflows/` — despliegue a GitHub Pages en cada push a la rama por defecto.
- `marketologa/` — **no es parte de esta app.** Es otro proyecto que comparte repositorio:
  piezas gráficas y videos para un curso de marketing. Ignórala si vienes a trabajar en el
  Content Studio. Pesa cientos de megas en archivos de video, así que clonar el
  repositorio completo es lento; `git clone --filter=blob:none` ayuda.

Un detalle práctico: el navegador de la clienta cachea el HTML con ganas. Para ver un
cambio recién subido hay que abrir con `?v=N` al final de la dirección.
