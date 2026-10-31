# Programar publicaciones con Metricool

Esta carpeta tiene la pieza que falta para poder programar desde el Content Studio:
una **Edge Function de Supabase** que recibe la publicación desde la app y la deja
programada en el planificador de Metricool.

**Requiere plan Advanced o Custom de Metricool.** La API no está disponible en los
planes inferiores.

---

## Por qué hace falta esta función

El token de Metricool **no puede vivir dentro del `index.html`**. Cualquiera que abra
"Ver código fuente" lo vería, y con él tendría control total de la cuenta — ojo, un
mismo token cubre **todas** las marcas, no solo una.

La función resuelve eso: el token vive en los secretos de Supabase y nunca sale al
navegador. La app le habla a la función; la función le habla a Metricool.

```
Tu app  →  Edge Function  →  API de Metricool  →  las redes
           (aquí el token)
```

Además la función comprueba que quien pide tenga **sesión iniciada** en la app. Sin
eso, cualquiera que descubriera la URL podría publicar en las redes de la clienta.

---

## Paso 1 · Sacar los datos de Metricool

En Metricool, **Configuración de cuenta → API**:

- **Token de acceso** — cópialo, lo vas a pegar en Supabase (no en el código).
- **userId** — es el número que sale después de `userId` en la URL de la app.
- **blogId** — el número después de `blogId` en la URL, con la marca abierta.
  **Necesitas uno por cada marca**: abre Real Estate, anota su número; abre Finanzas,
  anota el suyo.

## Paso 2 · Guardar los secretos en Supabase

En tu proyecto de Supabase, **Edge Functions → Secrets** (o Settings → Edge Functions):

| Nombre | Valor |
|---|---|
| `METRICOOL_TOKEN` | el token del paso 1 |
| `METRICOOL_USER_ID` | tu userId |

> El token va **aquí**, no en el código ni en un chat. Es el único lugar seguro.

## Paso 3 · Desplegar la función

En **Edge Functions → Deploy a new function**:

1. Nómbrala exactamente **`programar`**.
2. Borra el código de ejemplo y pega el contenido completo de `index.ts`
   (el archivo que está al lado de este).
3. Dale a Deploy.
4. Copia la URL que te queda. Se ve así:
   `https://<tu-proyecto>.supabase.co/functions/v1/programar`

## Paso 4 · Conectar la app

Abre `index.html` y busca `METRICOOL_FN_URL`:

```js
const METRICOOL_FN_URL = "";   // ← pega aquí la URL del paso 3
const METRICOOL_TZ = "America/New_York";
```

Y en `BRANDS`, ponle a cada marca su `blogId`:

```js
{id:"realestate", ..., metricoolBlogId:"123456"},
{id:"finanzas",   ..., metricoolBlogId:"789012"},
```

Sube el cambio y listo.

---

## Cómo se usa

**Sola, al aprobar.** Al marcar **Diseño aprobado** en un post, carrusel o historia
—o **Aprobado para publicar** en un reel— la pieza entra sola a Metricool en el
siguiente horario libre a partir de mañana:

| Pieza | Horario | Redes |
|---|---|---|
| Reels | 19:00, uno por día | Instagram, Facebook y TikTok (con el video) |
| Posts y carruseles | 12:00, uno por día entre los dos | Instagram y Facebook |
| Historias | 09:00, 13:00 y 17:00 | Instagram y Facebook |

Si se retira la aprobación o se desaprueba el diseño, se quita de Metricool. Si a la
pieza le falta la imagen (o el video, en un reel), la app avisa y no la programa.
Los horarios y las redes están en `PROG_AUTO`, dentro de `index.html`.

**Lo aprobado antes de conectar.** En **Settings → Metricool → Programar todo lo
aprobado que falta** se programa, en orden, todo lo aprobado que todavía no lo está.

**A mano.** El botón **Programar** de cada pieza sigue estando: eliges fecha, hora y
redes. Lo que se programa a mano no se quita al retirar la aprobación.

El botón se pone verde y muestra cuándo y dónde quedó programada.

Hay una casilla para dejarla **como borrador** en Metricool: entra al planificador pero
no se publica sola. Sirve para revisar allá antes de soltarla.

---

## Lo que conviene saber

**Las historias con stickers interactivos no se pueden programar.** Encuestas, quiz y
preguntas no se publican por API con ninguna herramienta — es un límite de Instagram,
no de Metricool. Esas siguen siendo manuales.

**Las imágenes tienen que ser públicas.** Las que están en Drive ya lo son. La función
las pasa primero por Metricool para que las sirva desde su dominio; si alguna falla, te
avisa cuál en vez de programar la pieza con una imagen rota.

**Los videos van como enlace de descarga de Drive.** Metricool los descarga de ahí al
publicar. Drive no deja que una página web los cargue, pero sí un servidor; la carpeta
tiene que estar compartida como "Cualquier persona con el enlace".

**El primer envío real puede necesitar un ajuste.** El código está escrito según la
documentación de la API, pero hasta no hacer una llamada de verdad con tu cuenta no se
sabe si hay algún detalle propio de tu configuración. Si el primer intento da error, el
mensaje que salga en la app dice exactamente qué respondió Metricool.

**Prueba con una pieza primero.** Márcala como borrador, comprueba que aparece bien en
el planificador de Metricool, y recién ahí empieza a programar en serio.

---

## Si algo falla

| Mensaje | Qué pasa |
|---|---|
| *Metricool todavía no está conectado* | Falta el paso 4: pegar la URL en `METRICOOL_FN_URL` |
| *Falta el blogId de Metricool para…* | Esa marca no tiene su `metricoolBlogId` en `BRANDS` |
| *Necesitas iniciar sesión* | La sesión expiró; vuelve a entrar en la app |
| *Faltan los secretos METRICOOL_…* | Falta el paso 2 en Supabase |
| *Metricool 401* | El token no es válido o el plan no da acceso a la API |
| *No se pudo preparar una de las imágenes* | Esa imagen no es accesible públicamente |
