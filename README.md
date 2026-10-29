# Content Studio — Mila Meekins

App de **un solo archivo** (`index.html`) para planificar el contenido de redes sociales:
Dashboard, Reels, YouTube, Carruseles, Posts, Historias, Fin de mes y **Feed Preview**.
Sin build ni framework. El workspace vive en **Supabase** y se comparte en tiempo real
entre el equipo y la clienta.

En producción: https://milameekinsmarketing.github.io/mila-content-studio/

Maneja **tres marcas** desde un selector arriba del menú, cada una con su contenido, su
logo y su cupo mensual:

| Marca | Contenido cargado |
|---|---|
| **Mila Meekins Real Estate** | 3 meses completos · 41 reels · 12 videos · 17 carruseles · 25 posts · 109 historias |
| **Una escapadita con Mila** | Mes 1 · 4 reels · 4 videos · 8 carruseles · 8 posts · 25 historias |
| **Finanzas con Propósito** | Mes 1 · 12 reels · 4 carruseles · 8 posts · 30 historias |

Las piezas vienen **listas para producir**: guiones toma por toma, captions terminados,
carruseles lámina por lámina e historias con su texto. Solo falta cargar fotos y videos.

> **¿Vienes a trabajar en el código?** Lee [`CLAUDE.md`](CLAUDE.md) primero. Explica la
> arquitectura, las reglas de contenido que no se negocian y —lo más importante— cómo
> llega el contenido nuevo sin pisar lo que la clienta ya editó.

## Cómo usarla

1. Abre `index.html` en el navegador (o publica la carpeta en GitHub Pages / Netlify).
2. Inicia sesión con el correo y contraseña que te haya dado tu administrador (ver
   "Configurar Supabase" abajo si eres tú quien administra el workspace).
3. Edita cualquier campo: se guarda solo (localStorage como caché) y se sincroniza con
   Supabase — **Guardar Cambios** / `Ctrl+S` (`⌘S`) fuerza el guardado inmediato. Los
   cambios de otras personas conectadas se reflejan solos, sin recargar.

## Configurar Supabase (solo una vez)

El workspace está conectado al proyecto de Supabase `Mila Meekins Real Estate`. Para
administrar quién tiene acceso:

1. **Crear cuentas de acceso** — en el [panel de Supabase](https://supabase.com/dashboard)
   → tu proyecto → **Authentication → Users → Add user** → correo + contraseña. No hay
   registro público: cada persona (tú, tu equipo, la clienta) necesita que se la creen ahí.
2. **Esquema de base de datos** — si el proyecto es nuevo, corre una vez el archivo
   [`supabase/schema.sql`](supabase/schema.sql) desde **SQL Editor → New query**. Crea la
   tabla `workspace_state` (todo el contenido en una fila JSON), activa seguridad a nivel
   de fila (solo usuarios con sesión iniciada leen/escriben) y habilita Realtime.
3. Las credenciales del proyecto (Project URL + `anon public` key) ya están dentro de
   `index.html` — son seguras de exponer en el navegador porque el acceso real lo controla
   la seguridad a nivel de fila (RLS) de Supabase, no la clave en sí.
4. Si Supabase no responde (sin internet, proyecto caído), la app sigue funcionando con la
   última copia guardada en ese navegador y avisa con un mensaje — nada se pierde.

### Activar "Continuar con Google" (opcional)

El botón ya está en la pantalla de login, pero necesita que actives el proveedor en
Supabase primero — si no, muestra un error al usarlo:

1. En [Google Cloud Console](https://console.cloud.google.com/) → crea (o usa) un proyecto
   → **APIs & Services → Credentials → Create Credentials → OAuth client ID** → tipo
   **Web application**.
2. Supabase → tu proyecto → **Authentication → Providers → Google**, actívalo — ahí te
   muestra la **Callback URL** exacta que debes pegar en Google Cloud, en **Authorized
   redirect URIs**.
3. Copia el **Client ID** y **Client Secret** que te dio Google y pégalos en esa misma
   pantalla de Supabase → **Save**.
4. Cualquier cuenta de Google puede entrar así — si quieres limitarlo a correos
   específicos, revísalo en la configuración del proveedor o restringe el dominio en la
   pantalla de consentimiento de Google Cloud.

### Activar "Entrar como Clienta" (acceso de un clic, opcional)

El botón ya está en la pantalla de login, debajo de "Continuar con Google". Deja entrar
directo, sin correo ni contraseña — pensado para que la clienta nunca se quede afuera —
y la deja en rol **Editor** automáticamente (puede aprobar/desaprobar diseños y dejar
notas, no puede eliminar nada ni marcar algo como revisado/publicado). Necesita que
actives el inicio de sesión anónimo en Supabase, si no, muestra un error al usarlo:

1. Supabase → tu proyecto → **Authentication → Providers** (o **Sign In / Providers**,
   según la versión) → busca **Anonymous Sign-Ins** → actívalo → **Save**.
2. Ya está — no hace falta ningún dato adicional, a diferencia de Google.
3. Cada clic en "Entrar como Clienta" crea una identidad anónima distinta en Supabase
   (verás varias filas nuevas en Authentication → Users con "Providers: Anonymous"), pero
   todas ven y editan el mismo workspace compartido — no hay pérdida de datos ni
   confusión entre ellas, es solo la forma en que Supabase identifica sesiones sin
   contraseña.

### Activar Google Drive para imágenes (opcional)

Por decisión explícita: las **imágenes** (no el resto del contenido, que sigue en
Supabase) se guardan subiéndolas a una carpeta de Google Drive en vez de dentro del dato
— así no se llena el almacenamiento. Mientras no lo actives, sigue funcionando como
antes (imagen comprimida guardada junto con el resto del contenido).

⚠️ A diferencia de Supabase, Drive no tiene una "clave pública protegida por reglas": cada
persona que suba una imagen debe autorizar el acceso a Drive una vez (aparte del login de
la app), y ese permiso se vence cada ~1 hora — puede que a veces vuelva a pedir
autorización.

1. **Crear el proyecto y las credenciales** — en
   [Google Cloud Console](https://console.cloud.google.com/):
   - **APIs & Services → Library** → busca **Google Drive API** → **Enable**.
   - **APIs & Services → OAuth consent screen** → tipo **External** → completa nombre de
     la app y tu correo. En **Publishing status** déjalo en **Testing** y agrega en
     **Test users** el correo de Google de cada persona que vaya a subir imágenes (tú, tu
     equipo, tu clienta) — así no hace falta pasar por la verificación de Google.
   - **APIs & Services → Credentials → Create Credentials → OAuth client ID** → tipo
     **Web application** → en **Authorized JavaScript origins** agrega
     `https://milameekinsmarketing.github.io` → **Create**. Copia el **Client ID** que
     te da (termina en `.apps.googleusercontent.com`).
2. **Crear la carpeta compartida** — en [Google Drive](https://drive.google.com), crea una
   carpeta (p. ej. "Mila Content Studio — Imágenes"), compártela con **Editor** a cada
   correo que vaya a subir imágenes, ábrela y copia el **ID de la carpeta**: es la parte
   final de la URL, después de `folders/` (ej. `https://drive.google.com/drive/folders/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**).
3. Pásame el **Client ID** y el **ID de la carpeta** y los conecto en `index.html`
   (constantes `GOOGLE_CLIENT_ID` y `GOOGLE_DRIVE_FOLDER_ID`, cerca del inicio del
   `<script>`).

## Qué incluye

### Marca real
- Logo real de Mila Meekins Real Estate (monograma "M" con ventana, tomado del Brand Board)
  en la barra lateral, el pie de página y como avatar por defecto.
- Paleta exacta del board: navy `#1A1E39` y dorado `#DBB879`.
- Tipografía: **Montserrat** en toda la interfaz — wordmark, titulares, cuerpo de texto —
  una sola familia por pedido explícito, sin mezclar con la pareja serif que traía el
  Brand Board.

### Edición total con rol de usuario
- Selector de rol en la barra superior y en *Settings*:
  - **Admin** — edita todo, elimina piezas, administra el perfil y es el único que puede
    marcar un formato como **revisado y listo para publicar**.
  - **Editor** — edita y puntúa, aprueba/desaprueba diseños y deja notas, pero no elimina
    ni marca como revisado.
  - **Viewer** — solo lectura (todos los controles de edición se ocultan).
- El Rol es una preferencia **de este navegador**, no del workspace compartido: cada
  persona ve y usa su propio Rol sin afectar a las demás, aunque el resto del contenido
  sí se sincronice para todos en tiempo real.
- Cada texto es editable in-place en Posts, Reels, Carruseles y Historias.
- Estados por pieza: Borrador · En revisión · Programado · Publicado.
- Crear, duplicar, plegar, eliminar y reordenar piezas.

### Check de "Revisado y listo para publicar"
- Todos los formatos (Posts, Reels, Carruseles e Historias) tienen un check dedicado.
- Solo el rol **Admin** puede marcarlo; al activarlo aparece un ✓ verde en la tarjeta y
  un distintivo circular sobre la miniatura correspondiente en el Feed Preview.

### Miniatura, fecha y pilar en cada formato
- La cabecera de cada Post, Reel, Carrusel e Historia muestra una **miniatura** de su
  imagen principal (se ve incluso con la tarjeta plegada), la **fecha de creación** y un
  chip del **pilar de marca** (Educación, Patrimonio, Servicio, Fe, Relaciones).
- Los reels además muestran si son formato "🎥 Cámara" o "🎨 Animado".

### Meses de contenido: Posts, Reels, Carruseles e Historias comparten un calendario
- Las cuatro secciones traen, arriba del todo, pestañas de **Mes 1 / Mes 2 / Mes 3…** —
  el mismo calendario editorial compartido entre las cuatro (cambiar de mes en Posts
  también lo cambia en Reels, Carruseles e Historias). Cada pestaña muestra un contador
  con el **cupo mensual real** de la marca: **8/8 posts**, **12/12 reels**, **4/4
  carruseles**, **30/30 historias**.
- El cupo es solo informativo — pasarse no bloquea nada, se puede seguir creando o
  moviendo piezas. Cada tarjeta trae un selector chiquito para reasignar su mes sin
  salir de la tarjeta ni tener que recordar el orden.
- El contenido cargado del Banco de Ideas ya viene repartido en 3 meses según ese cupo
  (los carruseles son los que más meses necesitan: 4+4+2). "Nuevo mes" agrega otro;
  renombrar es directo sobre la etiqueta; eliminar un mes no borra ninguna pieza — las
  que tenía pasan al primer mes que quede (avisa cuántas antes de confirmar), y no se
  puede eliminar si es el único mes.

### Filtros por tandas
- Posts/Reels/Carruseles/Historias ya se organizan por el mes de contenido de arriba;
  la barra de filtros de esas secciones solo trae **ordenar** (más recientes/antiguos).

### Imágenes y media adjuntas
- Clic en cualquier zona visual (post 4:5, portada de reel 9:16, slides 1080×1350, media
  de historia, foto de perfil) para adjuntar un archivo.
- Cada imagen se reescala y comprime antes de guardarse, para no reventar el
  almacenamiento del navegador.

### Feed Preview: meses en pestañas, 24 espacios fijos por mes
- El Feed Preview se organiza en **meses**, mostrados como pestañas abribles arriba de la
  cuadrícula (una sola visible a la vez). Cada mes trae siempre **exactamente 24 espacios**
  fijos — el cupo real de un mes (8 posts + 12 reels + 4 carruseles) — ni crecen ni se
  achican, y arranca vacío, con cada espacio en blanco diciendo
  "Elegir publicación · Formato → título".
- El botón **"Nuevo mes"** crea una pestaña más (numerada automáticamente, renombrable
  escribiendo directo sobre su etiqueta) y cambia a ella. Cada pestaña muestra cuántos de
  sus 24 espacios están ocupados (`N/24`) y, si hay más de un mes, un botón de papelera
  para eliminarla — con aviso si todavía tiene espacios ocupados (la pieza en sí no se
  borra, solo deja de estar programada ese mes); no se puede eliminar el último mes que
  quede.
- Clic en un espacio vacío abre una **lista plegable**: primero se elige el formato (Posts,
  Reels o Carruseles, cada uno con su conteo de títulos), y al abrirlo aparecen todos
  los títulos de esa colección con su miniatura — o un aviso "Sin media" si la pieza
  todavía no tiene imagen. Al elegir un título, su media se coloca sola en el espacio.
- Una pieza no puede ocupar dos espacios a la vez **en ningún mes**; si ya está colocada,
  el picker lo indica ("Ya en Mes X · #N") en vez de dejar duplicarla.
- Una pieza ya colocada se puede **mover a otro mes** con el selector "Mover a…" que
  aparece al pasar el cursor sobre su espacio — la coloca en el primer espacio libre del
  mes destino, o avisa si ese mes ya está lleno (24/24).
- Cada tarjeta de un formato muestra un chip clicable **"En Feed · Mes X #N"** con su
  posición exacta; al hacer clic, cambia a ese mes y salta directo a esa celda, resaltándola.
- Al revés, hacer clic en una celda ocupada abre exactamente ese formato para editarlo;
  el botón de papelera en la esquina de la celda solo vacía el espacio, sin borrar la pieza.
- Subir o reemplazar la imagen de cualquier formato la refleja **al instante** en su celda
  del feed — sin recargar ni guardar primero.
- Arrastra una celda ocupada sobre otra (vacía o llena) **dentro del mismo mes** para
  intercambiar su posición, o usa "Vaciar este mes" para dejar solo ese mes en blanco de
  nuevo (los demás meses no se tocan).

### El número de Post/Reel/Carrusel es su orden real de publicación
- El "# Post N" / "Reel N" / "# Carrusel N" que aparece en la cabecera de cada pieza ya
  no es su número original del Banco de Ideas: es la posición **real** que ocupa en el
  Feed Preview, contada igual que los espacios de la grilla — empezando en el espacio de
  más abajo a la derecha (**#1**) y subiendo hacia arriba y hacia la izquierda hasta el
  primer espacio (**#24**). Es un solo número compartido entre los tres formatos: si el
  espacio #14 de un mes es un Reel, ese Reel es el "Reel 14", y el próximo Post que caiga
  en el espacio #15 sería el "# Post 15".
- Mientras una pieza no esté colocada en ningún espacio de ningún mes, su cabecera dice
  **"Sin programar"** en vez de un número — y en cuanto la colocas, el número aparece
  solo, sin tocar nada a mano.
- El chip "En Feed · Mes X #N" de cada tarjeta usa este mismo número, así que siempre
  coincide con el que se ve en la cabecera.

### Organizar Google Drive por orden del feed
- En *Settings* → **Cuenta** (solo si Google Drive está activo) hay un botón
  **"Organizar por orden del feed"**: crea (o reutiliza) una subcarpeta por mes dentro de
  tu carpeta de Drive del workspace, y renombra la portada de cada Post/Reel/Carrusel
  ya colocado en el Feed Preview con su número de orden — ej. `01 - Post - Título.jpg` —
  para que, ordenados alfabéticamente en Drive, queden listos para publicar en el orden
  correcto de un vistazo.
- Solo toca la **portada** de cada pieza (la que se ve en el Feed Preview), no cada slide
  de un carrusel. Las piezas que todavía no están
  colocadas en ningún espacio, o cuya imagen vive solo comprimida en el dato (nunca se
  subió a Drive), no se tocan — el aviso final dice cuántas se organizaron y cuántas se
  saltaron, y por qué.
- Es una acción manual: se corre cuando la pidas, no automáticamente en cada cambio. Se
  puede correr varias veces sin problema — si un archivo ya está en su carpeta correcta,
  simplemente se vuelve a mover a la misma carpeta y renombrar con el mismo nombre.

### Check de "Publicado"
- Además del check de revisión, todos los formatos (Posts, Reels, Carruseles e Historias)
  tienen un segundo check dedicado: **Publicado**, también exclusivo del rol Admin.
- Al marcarlo, toda la tarjeta se tiñe de verde (cabecera, miniatura, número) y, si esa
  pieza está colocada en el Feed Preview, su celda recibe un marco verde y el distintivo
  "✓ Publicado" — de un vistazo se distingue lo publicado de lo que todavía no.

### Checks de "Diseño aprobado" / "Diseño desaprobado"
- Debajo del check de "Publicado", Posts, Carruseles e Historias tienen un segundo
  par de checks para registrar el feedback de la clienta sobre el diseño visual:
  **Diseño aprobado** y **Diseño desaprobado** — se excluyen entre sí, marcar uno
  desmarca el otro.
- A diferencia de "Revisado" y "Publicado" (exclusivos del rol Admin), estos los puede
  marcar cualquier rol con permiso de edición (Editor o Admin).
- Debajo aparece siempre un campo de nota — **"¿Qué no le gustó del diseño?"** — para
  anotar el detalle del feedback cuando el diseño queda desaprobado.

### Guía de distribución de Posts
- Un panel plegable al inicio de la sección de Posts recoge todo lo que no pertenece a
  una sola pieza sino a la colección completa: el enfoque de diseño (poco texto en el
  arte + mensaje instantáneo + caption que profundiza + CTA específico), los principios
  de marca, y el **orden narrativo sugerido de publicación** — Down payment → Testimonio
  → Consejo de Mila → Propósito → Checklist → Equity → Gratitud → Servicios → Fe →
  Compromiso — como una secuencia de chips clicables que saltan directo al post real.
  Cierra con las cuatro impresiones que se busca dejar en quien descubre el perfil.

### Reels: tarjeta mínima + checklist + portada
- Cada reel se edita con solo 3 campos de texto: **Título**, **Tomas —
  Desarrollo y acción** (un espacio grande único para el guion completo) y **Copy**.
  Sin miniatura de detalle, sin fecha, sin pilar — el desglose que tenía antes se retiró
  a pedido explícito.
- Sí trae una **Portada** (imagen 9:16, subir/reemplazar/quitar): es la única media del
  reel y es la que se ve en su celda del Feed Preview — así se puede visualizar
  realmente cómo queda el reel en el feed, en vez de solo el texto de su título.
- Debajo lleva un **checklist** de 3 puntos, exclusivo del rol Admin: **Aprobado para
  publicar** y **Publicado** (checkboxes de etiqueta fija — a diferencia del resto de
  la app, el texto no cambia según el estado, solo el color) y **Valoración (1 a 10)**
  con el mismo medidor de estrellas que usan Posts y Carruseles.

### Reels con guion de producción toma por toma
- La sección Reels pasó de 15 a **17 espacios**, para reflejar exactamente el
  documento final de guiones ("Guiones Reels - Avatar Mila"), que organiza 17 piezas
  numeradas — incluye los 7 guiones originales, 8 guiones nuevos y 2 versiones
  alternativas de temas que ya existían (down payment y preguntas frecuentes).
- Cada reel trae en "Tomas — Desarrollo y acción" sus tomas completas (3 a 5 según la
  pieza), cada una con **La modelo dice**, **La acción que hace** y **El texto en
  pantalla será** — copiado palabra por palabra del documento entregado, verificado
  automáticamente contra el original sin ninguna discrepancia.
- Título, copy, checks y valoración de cada reel se cargaron en blanco (no venían en
  este documento), en el mismo orden en que aparecen en el archivo.

### Contenido desarrollado, campo por campo
- **Posts:** el texto completo del arte con su jerarquía (antetítulo, titular, sellos,
  letra pequeña), el concepto visual y la composición, el caption largo desarrollado, un CTA
  con palabra clave («Comenta DOWN», «CITA», «EQUITY», «MI HOGAR», «MILA» / «EMPEZAR»),
  hashtags y **Notas de publicación**: el empuje en Stories, la serie a la que pertenece la
  pieza y su posición en el orden sugerido del feed.
- **Carruseles:** cada slide trae su texto desarrollado (portada → desarrollo → resumen → CTA),
  además de hook global, CTA, caption e hashtags.
- **Historias:** formato del sticker (Encuesta, Quiz, Repost, Tip…), el texto exacto que va
  en pantalla, el seguimiento sugerido y una media 9:16 por cargar.

### Avisos de cumplimiento
- Las piezas que lo requieren muestran una banda de aviso antes de publicar, tomada de las
  notas de producción del documento: testimonios que necesitan **autorización escrita**
  (Post 21, Carruseles 30 y 50, Historias 42, 46 y 89), datos que exigen **verificar fuente
  y fecha** (Post 12, Historia 37), el recordatorio de **remitir a un profesional certificado**
  en temas migratorios o legales (Carrusel 3) y el **tono testimonial** en contenido de fe.

### Medidor de receptividad (1–10 con estrellas)
- Post, Reel y Carrusel tienen un medidor de **Receptividad del público** de 1 a
  10 estrellas, con puntaje numérico y etiqueta (Baja / Media / Alta receptividad).
- Volver a hacer clic en la misma estrella baja un punto.
- El Dashboard calcula la receptividad media sobre las piezas ya puntuadas.

### Dashboard: estado del contenido por mes / trimestre
- Una tabla en el Dashboard cruza **Posts, Reels, Carruseles e Historias** (filas) con
  **7 categorías** (columnas): Revisados, Por revisar, Diseño aprobado, Diseño
  desaprobado, Publicado, Copy faltante e Imagen faltante.
- Un interruptor **"Por mes" / "Por trimestre"** arriba de la tabla cambia el alcance —
  un trimestre es simplemente 3 meses de contenido seguidos, agrupados. Las flechas
  a los lados navegan entre meses o trimestres.
- **Cada número es clicable** y lleva directo a la primera pieza de esa categoría que
  todavía falta — por ejemplo, "Imagen faltante: 3" en Reels te lleva al primer Reel sin
  portada. En cuanto arreglas esa, el próximo clic en el mismo número te lleva sola a la
  que antes era la segunda, y así sucesivamente — no hay que recordar en cuál ibas.
- Si una categoría está en cero, el clic solo avisa "al día" en vez de navegar a ningún
  lado.

### Extras
- Búsqueda global sobre posts, reels, carruseles e historias.
- Registro de actividad reciente y acciones rápidas en el Dashboard (incluye "Nueva Historia").
- Exportar / importar el workspace completo en `.json` y restablecer al contenido de ejemplo.
- Diseño responsive (escritorio, tablet y móvil).

## Datos

El workspace vive en Supabase (tabla `workspace_state`, protegida con seguridad a nivel de
fila) y se sincroniza en tiempo real entre todas las personas con sesión iniciada. Cada
navegador guarda además una copia local bajo la clave `mila.studio.v1` de `localStorage`,
usada como caché y como respaldo si no hay conexión con Supabase. Usa *Settings → Exportar*
para descargar un `.json` de todo el workspace en cualquier momento.
