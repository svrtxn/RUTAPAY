# Guía de Despliegue: RutaPay

Esta guía te explica paso a paso cómo subir tu aplicación a internet de forma gratuita usando **Render** (para el Backend) y **Vercel** (para el Frontend).

Como tienes el código en GitHub con diferentes ramas, el proceso es muy directo. **No necesitas "buildear" (compilar) nada manualmente en tu computador**, Vercel y Render lo harán por ti de forma automática.

> IMPORTANTE: El orden importa. **Siempre debes desplegar el Backend primero**, porque necesitarás la URL que te entregue Render para poder configurar el Frontend en Vercel.

---

## 1. Despliegue del Backend (Render)

Render alojará tu servidor Express.js (la API que se conecta a Supabase). Aquí subiremos la versión optimizada SIN WhatsApp.

### Paso a paso:
1. Entra a [Render.com](https://render.com/) e inicia sesión con tu cuenta de GitHub.
2. En el panel principal, haz clic en el botón **New +** y selecciona **Web Service**.
3. Selecciona la opción **Build and deploy from a Git repository** (y presiona Next).
4. Busca y conecta tu repositorio `RUTAPAY` de GitHub.
5. Completa la configuración del Web Service exactamente así:
   - **Name:** `rutapay-backend` (o el nombre que quieras)
   - **Branch:** `deploy/sin-whatsapp` ⚠️ *(CRÍTICO: Asegúrate de escribir/elegir esta rama y NO la main)*
   - **Root Directory:** `backend` ⚠️ *(CRÍTICO: Debes escribir `backend` aquí)*
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free` (Gratis)
6. Desplázate hacia abajo hasta la sección **Environment Variables** (Variables de Entorno) y haz clic en "Add Environment Variable". Debes agregar las mismas variables que tienes en tu archivo `.env` local:
   - Variable 1: 
     - Key: `SUPABASE_URL` 
     - Value: *(Pega aquí la URL de tu Supabase)*
   - Variable 2: 
     - Key: `SUPABASE_KEY` 
     - Value: *(Pega aquí la Key de tu Supabase)*
   - Variable 3: 
     - Key: `JWT_SECRET` 
     - Value: *(Pon una contraseña secreta, ej: `mi-secreto-super-seguro-2026`)*
7. Haz clic en **Create Web Service** (abajo del todo).
8. Verás una pantalla negra estilo terminal. Espera unos minutos a que termine de descargar las cosas. Cuando termine, dirá `"API de RutaPay funcionando. 🚀"` y se marcará como "Live".
9. Arriba a la izquierda, debajo del nombre, verás un link (ej: `https://rutapay-backend-xyz.onrender.com`). Haz clic en él para confirmar que funciona.
10. **Copia esa URL**, la vas a necesitar para el siguiente paso.

---

## 2. Despliegue del Frontend (Vercel)

Vercel alojará tu aplicación React (lo que ven los usuarios y el administrador). Usaremos la rama `main` por defecto.

### Paso a paso:
1. Entra a [Vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New...** y luego en **Project**.
3. En la lista de repositorios, busca `RUTAPAY` y haz clic en **Import**.
4. Completa la configuración del proyecto así:
   - **Project Name:** `rutapay-app`
   - **Framework Preset:** Debe decir `Vite` automáticamente. Si no, selecciónalo.
   - **Root Directory:** Haz clic en "Edit", selecciona la carpeta `frontend` y guarda.
5. Desplázate hacia abajo y abre la sección **Environment Variables**.
6. Agrega la siguiente variable de entorno:
   - **Name:** `VITE_API_URL`
   - **Value:** *(Pega aquí la URL que te dio Render en el paso anterior, sin el `/` al final. Ej: `https://rutapay-backend-xyz.onrender.com`)*
   - Haz clic en **Add**.
7. Haz clic en el botón grande **Deploy**.
8. Espera un par de minutos. Vercel compilará automáticamente el proyecto.
9. Cuando termine verás una pantalla de felicitaciones. Haz clic en **Continue to Dashboard** y luego presiona el botón **Visit** para ir a tu nueva URL (ej: `https://rutapay-app.vercel.app`).
10. ¡Listo! Deberías ver la pantalla de Login de tu aplicación funcionando en internet.

---

## 3. Consideraciones Finales

### Modo Reposo en Render (¡Importante que sepas esto!)
En el plan gratuito, Render "duerme" tu backend si nadie lo usa durante 15 minutos. 
Cuando el primer usuario del día intente iniciar sesión, la aplicación puede tardar **unos 30 a 50 segundos** en responder mientras el backend "despierta" (parecerá que se quedó pegado en "Cargando..."). 
Esto es completamente normal y solo pasa en el primer inicio de sesión tras un periodo de inactividad. Los siguientes clics serán instantáneos.

### ¿Cómo actualizar la aplicación en el futuro?
No tendrás que repetir todo esto. La magia de conectarlo con GitHub es que se actualiza solo:
- **Si modificas el Frontend:** Solo haz commit y push a la rama `main` en GitHub. Vercel detectará el cambio y compilará la nueva versión automáticamente.
- **Si modificas el Backend:** Debes pushear tus cambios a tu rama `deploy/sin-whatsapp` (usando comandos git, o haciendo un PR). Render detectará el cambio en esa rama y se reiniciará con el nuevo código.
