# Primeros pasos — mudanza a la cuenta de Mila

Esta carpeta es el Content Studio completo y limpio: 1,5 MB en vez de los 233 MB del
repositorio viejo, porque se quedó fuera `marketologa/`, que es otro proyecto.

Cuenta de GitHub de Mila: **`milameekinsmarketing`**
Cuenta de Google (Drive): **milameekinsmarketing@gmail.com**
Dirección que va a quedar: **https://milameekinsmarketing.github.io/mila-content-studio/**

Sigue los pasos en orden. Del 5 al 7 son los que se olvidan y los que rompen cosas.

---

## 1. Crear el repositorio

En **github.com → New repository**, con la cuenta de Mila:

- Nombre: `mila-content-studio`
- **Privado**
- **Sin** README, sin .gitignore, sin licencia — que quede vacío

Después, en **Settings → Collaborators → Add people**, te agrega a ti con permiso
**Write**, para que puedas seguir trabajando.

---

## 2. Subir esta carpeta

Desde tu computadora, parada dentro de esta carpeta:

```bash
git init
git add -A
git commit -m "Content Studio de Mila Meekins"
git branch -M main
git remote add origin https://github.com/milameekinsmarketing/mila-content-studio.git
git push -u origin main
```

(El commit ya viene hecho en el paquete, así que si `git init` dice que ya existe un
repositorio, sáltate las tres primeras líneas y ve directo a `git remote add`.)

---

## 3. Encender GitHub Pages

En el repositorio nuevo: **Settings → Pages → Source: GitHub Actions**.

Se despliega solo en cada push a `main`. La primera vez tarda un par de minutos.

---

## 4. Transferir el proyecto de Supabase

Es el mismo proyecto de siempre, solo cambia de dueño. **Ni la dirección ni la clave
cambian**, así que el `index.html` no se toca y Mila no pierde nada de lo que tiene
guardado.

En **supabase.com → el proyecto → Settings → General → Transfer project**. Mila necesita
una cuenta de Supabase y aceptar la transferencia.

---

## 5. Avisarle a Supabase de la dirección nueva

**Este es el paso que rompe el login si se olvida.** Los correos de acceso siguen
apuntando a la dirección vieja hasta que lo cambies.

En Supabase: **Authentication → URL Configuration**

- **Site URL**: `https://milameekinsmarketing.github.io/mila-content-studio/`
- **Redirect URLs**: agrega esa misma dirección

Deja un tiempo la dirección vieja también en Redirect URLs, por si alguien tiene un
correo de acceso sin usar.

---

## 6. Google Drive

**La carpeta ya está cambiada en el código** (`index.html`, línea 1205): apunta a la
carpeta de Mila, `10OXQUC8oj01M4lM6BnF-6Uc1WuoKIf7A`. No hay nada que hacer aquí, solo
dos cosas que confirmar:

- Que esa carpeta esté **compartida contigo con permiso de Editor**, o no vas a poder
  subir archivos desde la app.
- Que los archivos que ya estaban subidos **se quedan en la carpeta vieja**: no se mueven
  solos. Si hay media que valga la pena conservar, muévela a mano en Drive, o deja la
  carpeta vieja compartida con Mila para que los links viejos sigan abriendo.

---

## 7. El ID de cliente de Google

**Hecho.** El proyecto de Google Cloud `Mila Meekins` ya existe en la cuenta de ella, con
la Drive API activada, el permiso `drive.file` (no sensible, sin revisión de Google) y un
ID de cliente propio, ya puesto en `index.html` línea 1204.

Queda un solo pendiente: **borrar el ID de cliente viejo** del proyecto de Google Cloud de
Escuela Digital — pero solo cuando hayas comprobado que subir una imagen funciona desde
la dirección nueva. Antes no: si algo falla, volver atrás es cambiar una línea.

---

## 8. Comprobar que todo quedó bien

Abre `https://milameekinsmarketing.github.io/mila-content-studio/?v=1` y verifica, en este
orden:

1. **Entrar con tu correo.** Si no llega el correo o el enlace te manda a la dirección
   vieja, falta el paso 5.
2. **Que estén las tres marcas** y su contenido: Real Estate, Una escapadita y Finanzas
   con Propósito.
3. **Subir una imagen a cualquier pieza.** Si no abre el selector de archivos o sale un
   aviso de Google Drive, falta el paso 6 o el 7.
4. **Abrir la carpeta de Drive de Mila** y confirmar que la imagen llegó ahí.
5. **Guardar un cambio** y recargar, para confirmar que llegó a la nube.

---

## Y después

El repositorio viejo (`escueladigitalusa-a11y/MIla-proyecto`) **no lo borres todavía**.
Déjalo un par de semanas hasta estar segura de que el nuevo funciona. Después puedes
dejarlo solo con `marketologa/`, que es a lo que de verdad pertenece.

Para trabajar en el repositorio nuevo con Claude: se abre en **claude.ai/code**, se
conecta `mila-content-studio` y listo. El archivo `CLAUDE.md` de la raíz se lee solo y
trae todo el contexto del proyecto.
