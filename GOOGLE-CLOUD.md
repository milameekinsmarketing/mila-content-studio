# Pasar Google Drive a la cuenta de Mila

La carpeta **ya está cambiada** en el código (`index.html`, línea 1205). Lo que falta es
el **ID de cliente de Google**, que todavía vive en el proyecto de Google Cloud de
Escuela Digital.

Todo esto se hace en el navegador, con la sesión iniciada como
**milameekinsmarketing@gmail.com**. Son unos diez minutos.

> Una buena noticia antes de empezar: la app pide el permiso **`drive.file`**, que es el
> más estrecho que existe — solo ve los archivos que ella misma crea, nunca el resto del
> Drive. Por eso Google no exige el proceso de verificación que sí piden otros permisos.

---

## 1. Crear el proyecto

1. Entra a **https://console.cloud.google.com** con la cuenta de Mila.
2. Arriba a la izquierda, al lado del logo, haz clic en el **selector de proyectos**.
3. **Proyecto nuevo** (*New project*).
   - Nombre: `Mila Content Studio`
   - Organización: deja *Sin organización* (*No organization*)
4. **Crear**. Espera a que termine y **selecciona el proyecto nuevo** en ese mismo
   selector — es el error más común: seguir configurando sobre otro proyecto.

---

## 2. Activar la Drive API

1. Menú ☰ → **APIs y servicios** → **Biblioteca** (*Library*).
2. Busca `Google Drive API`.
3. Entra y dale **Habilitar** (*Enable*).

---

## 3. Configurar la pantalla de permisos

Menú ☰ → **APIs y servicios** → **Pantalla de consentimiento de OAuth**
(en la interfaz nueva aparece como *Google Auth Platform → Branding*).

1. Tipo de usuario: **Externo** (*External*) → **Crear**.
2. Rellena:
   - Nombre de la aplicación: `Content Studio`
   - Correo de asistencia: `milameekinsmarketing@gmail.com`
   - Datos de contacto del desarrollador: `milameekinsmarketing@gmail.com`
   - El logo y lo demás se puede dejar vacío.
3. **Guardar y continuar**.
4. **Permisos** (*Scopes*) → **Añadir o quitar permisos** → busca y marca:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
   → **Actualizar** → **Guardar y continuar**.
5. **Usuarios de prueba** → **Añadir usuarios**: agrega
   `milameekinsmarketing@gmail.com` y **también tu correo**, o no vas a poder subir
   archivos desde la app.
6. **Guardar y continuar** → **Volver al panel**.

### Opcional, pero recomendado

En esa misma pantalla, el botón **Publicar aplicación** (*Publish app*) quita el aviso de
"aplicación no verificada" y el límite de usuarios de prueba. Con el permiso `drive.file`
no hace falta pasar por la revisión de Google. Si te da pereza, déjalo en **Prueba**: la
app funciona igual, solo sale un aviso al entrar la primera vez.

---

## 4. Crear el ID de cliente

Menú ☰ → **APIs y servicios** → **Credenciales** (*Credentials*).

1. **+ Crear credenciales** → **ID de cliente de OAuth**.
2. Tipo de aplicación: **Aplicación web** (*Web application*).
3. Nombre: `Content Studio Web`
4. En **Orígenes autorizados de JavaScript** → **+ Añadir URI**, pega exactamente:
   ```
   https://milameekinsmarketing.github.io
   ```
   Sin barra al final y sin la ruta del repositorio. Solo eso.

   > Si también quieres probar abriendo el archivo desde tu computadora con un servidor
   > local, agrega además `http://localhost:8000`.

5. **URIs de redireccionamiento autorizados**: déjalo **vacío**. La app usa el flujo de
   token del navegador y no lo necesita.
6. **Crear**.
7. Se abre una ventana con el **ID de cliente**. Cópialo. Se ve así:
   ```
   123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```
   (El *secreto de cliente* que aparece al lado **no se usa** y no debe ir nunca en el
   código. Ignóralo.)

---

## 5. Ponerlo en el código

En `index.html`, **línea 1204**:

```js
const GOOGLE_CLIENT_ID = "AQUÍ-EL-ID-DE-CLIENTE-NUEVO";
```

Mándame el ID y lo cambio yo, o cámbialo tú: es una sola línea. Después, `git push`, y
GitHub Pages lo publica solo.

---

## 6. Comprobar que quedó bien

Abre `https://milameekinsmarketing.github.io/mila-content-studio/?v=1`, entra, y sube una
imagen a cualquier pieza.

| Lo que ves | Qué significa |
|---|---|
| Pide permiso de Google y sube bien | Listo |
| "Aplicación no verificada" | Normal en modo Prueba. *Configuración avanzada → Ir a Content Studio* |
| "Error 400: redirect_uri_mismatch" o "origin_mismatch" | El origen del paso 4 está mal escrito, o aún no tomó efecto. Espera unos minutos |
| "Acceso bloqueado: no has sido añadido como usuario de prueba" | Falta agregar ese correo en el paso 3.5 |
| No abre el selector de archivos | Es un defecto conocido: cuando falla la autorización de Drive, el popup se queda con el gesto del clic. Recarga la página |

Al final, entra a la carpeta de Drive de Mila y confirma que el archivo llegó ahí.

---

## 7. Cuando todo funcione

Puedes borrar el ID de cliente viejo del proyecto de Google Cloud de Escuela Digital. No
lo hagas antes: si algo falla, volver atrás es cambiar una línea.
