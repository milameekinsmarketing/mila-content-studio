# Plantilla base — Content Studio

Copia limpia de la app, sin contenido ni marca. Sirve para montar el workspace de un
cliente nuevo.

El `index.html` de esta carpeta es la app completa: mismas secciones, mismos cupos,
mismo Feed Preview, deshacer/rehacer, Dashboard, limpieza por mes y todo lo demás.
Lo único que cambia por cliente es el bloque de configuración de arriba.

---

## Antes de empezar

Cada cliente necesita **lo suyo**, no lo de otro:

| Pieza | Por qué |
|---|---|
| Proyecto de Supabase propio | Es el aislamiento real. Sin esto, dos clientes verían el mismo contenido |
| Carpeta de Google Drive propia | Sus imágenes no deben caer en la carpeta de otro |
| Repositorio y URL propios | Cada cliente entra a su propia dirección |

> **No reutilices el proyecto de Supabase de otro cliente.** La clave de la app va
> visible en el HTML, así que compartir proyecto significa que, si las reglas de acceso
> no están perfectas, un cliente puede leer los datos del otro. Un proyecto por cliente
> evita el problema de raíz y es gratis en el plan free.

---

## Paso 1 · Crear el repositorio

1. Crea un repositorio nuevo en GitHub (puede ser privado).
2. Copia dentro el `index.html` de esta carpeta.
3. Actívale GitHub Pages: **Settings → Pages → Source: Deploy from a branch → main → /(root)**.
4. Anota la URL que te da, del estilo `https://<usuario>.github.io/<repo>/`.

## Paso 2 · Crear el proyecto de Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un **proyecto nuevo**.
2. Ve a **SQL Editor** y ejecuta:

```sql
create table workspace_state (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz default now(),
  updated_by  uuid
);

alter table workspace_state enable row level security;

-- Solo las personas con sesión iniciada en ESTE proyecto pueden leer y escribir.
create policy "acceso con sesion" on workspace_state
  for all to authenticated using (true) with check (true);
```

3. En **Settings → API** copia la **Project URL** y la clave **anon public**.
4. En **Authentication → Providers**, activa lo que vayas a usar:
   - **Email** para las cuentas del equipo.
   - **Anonymous** si quieres el botón de entrada en un clic para el cliente.
   - **Google** si quieren entrar con su cuenta de Google.
5. En **Authentication → Users**, crea la cuenta del cliente y la del equipo.

## Paso 3 · Configurar el archivo

Abre `index.html` y busca arriba el bloque
**`CONFIGURACIÓN DEL CLIENTE`**. Es lo único que se toca:

```js
const CLIENTE_ID     = "cliente";              // corto, sin espacios ni acentos
const CLIENTE_NOMBRE = "NOMBRE DEL CLIENTE";   // se ve en la pantalla de inicio de sesión
const CLIENTE_BAJADA = "RUBRO O ESLOGAN";

const CONTENT_QUOTA  = { posts:8, reels:12, carousels:4, stories:30, youtube:4 };
const HASHTAGS_BASE  = "";

const SUPABASE_URL      = "";   // ← Project URL del paso 2
const SUPABASE_ANON_KEY = "";   // ← clave anon del paso 2
```

`CLIENTE_ID` separa lo que se guarda en el navegador. Si dos clientes comparten el mismo
id, sus copias locales se pisan al abrirlas en la misma computadora.

Mientras `SUPABASE_URL` esté vacío, la app funciona **solo local**: guarda en ese
navegador, no pide iniciar sesión y no se conecta a ninguna nube. Sirve para probar.

## Paso 4 · Poner la marca

Busca `const LOGO_GOLD` y reemplaza los tres logos por los del cliente, en formato
data URI. Para convertir un PNG:

```bash
echo "data:image/png;base64,$(base64 -w0 logo.png)"
```

- `LOGO_GOLD` → menú lateral
- `LOGO_WHITE` → pie del Feed Preview
- El tercero solo hace falta si el cliente tendrá una segunda marca

Usa PNG con **fondo transparente** y unos 300 px de ancho.

Después, en `const BRANDS`, pon el nombre, la bajada y los datos del perfil.

Si quieres cambiar los colores, están en `:root`, al inicio del CSS
(`--navy`, `--gold`, `--cream`…).

## Paso 5 · Google Drive (opcional)

Sin esto, las imágenes se guardan comprimidas dentro del dato del workspace y los
videos no se pueden subir.

1. En [Google Cloud Console](https://console.cloud.google.com), crea un proyecto o usa
   uno existente, y habilita la **Google Drive API**.
2. Crea un **ID de cliente OAuth** de tipo *Aplicación web* y agrega la URL de GitHub
   Pages del paso 1 en **Orígenes autorizados de JavaScript**.
3. Crea en Drive una carpeta **para este cliente** y copia su ID de la barra de
   direcciones.
4. Pégalos en el archivo:

```js
const GOOGLE_CLIENT_ID      = "";
const GOOGLE_DRIVE_FOLDER_ID = "";
```

## Paso 6 · Probar antes de entregar

- [ ] Abre la URL y entra con la cuenta del cliente.
- [ ] Crea un post, recarga la página: sigue ahí.
- [ ] Ábrela en **otra computadora** con la misma cuenta: aparece lo mismo.
- [ ] Sube una imagen y compruébala en la carpeta de Drive del cliente.
- [ ] Cambia el Rol a **Viewer** y verifica que la edición queda bloqueada.
- [ ] Abre la app de **otro cliente** en el mismo navegador y confirma que no se mezclan.

---

## Cargar el contenido inicial

Hay dos caminos:

**Desde la app** — crear las piezas a mano. Bien si son pocas.

**Precargado en el archivo** — si el cliente llega con su contenido ya desarrollado, se
escribe en los arreglos `CONTENT_POSTS`, `CONTENT_REELS`, `CONTENT_CAROUSELS`,
`CONTENT_STORIES` y `CONTENT_YOUTUBE`, y se conecta en `BRAND_CONTENT`. Ojo: eso solo
llega a una marca **que todavía está vacía**; una vez que el cliente empezó a trabajar,
su contenido manda y el precargado ya no entra.

## Varias marcas de un mismo cliente

Si un cliente maneja dos marcas (como Real Estate y Finanzas con Propósito), **no hace
falta otra copia**: agrega un segundo bloque en `BRANDS` con otro `id` y su propio logo.
Aparece un selector arriba del menú y cada marca lleva su contenido por separado.

Otra copia de la plantilla es solo para **otro cliente**.

## Cuando mejore el motor

Esta plantilla es una copia, no un enlace: las mejoras que se hagan en la app de un
cliente **no llegan solas** a los demás. Para propagarlas hay que llevar el cambio a
cada copia.

Por eso conviene mantener el bloque de configuración y los logos **al inicio del
archivo y bien separados**: así actualizar el motor es reemplazar el resto del archivo
sin tocar lo del cliente.
