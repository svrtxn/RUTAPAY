# Guía de Prueba Completa de RutaPay (End-to-End)

Este documento es un guión paso a paso para probar **el 100% de las funcionalidades** que hemos construido en RutaPay. Si sigues este guión y todo sale como se espera, puedes estar 100% seguro de que el sistema está listo para producción.

---

## FASE 0: Preparación
Antes de empezar a probar la app, asegúrate de tener el entorno limpio y listo.
1. Abre tu base de datos en Supabase, ve al **SQL Editor** y asegúrate de haber ejecutado este comando (solo se hace una vez en la vida):
   ```sql
   ALTER TABLE public.monthly_configs DISABLE ROW LEVEL SECURITY;
   ```
2. Asegúrate de tener tu archivo `backend/.env` configurado con la contraseña de aplicación de Google (`SMTP_PASS`).
3. Ve a tu terminal, apaga el backend (`Ctrl + C`) y vuelve a encenderlo (`npm start`).
4. En otra terminal, asegúrate de que el frontend también esté corriendo (`npm run dev`).

---

## FASE 1: El Administrador y la creación de personal
1. Abre tu navegador en `http://localhost:5173`.
2. Inicia sesión con las credenciales de administrador (`admin@rutapay.cl` / `RutaPay@2026!`).
3. En el menú lateral, dirígete a **Directorio de Choferes**.
4. Haz clic en **Añadir Chofer**.
5. Ingresa un nombre (ej. "Juan Pérez") y usa **tu correo electrónico personal o secundario** (para que puedas recibir el mensaje).
6. Haz clic en **Crear**.
7. **VERIFICACIÓN:** 
   - Debe aparecer una alerta verde en pantalla.
   - Ve a tu bandeja de entrada del correo secundario y revisa que haya llegado el mensaje de bienvenida con el logo grande de RutaPay y la clave temporal. ¡Copia esa clave temporal!

---

## FASE 2: Configuración del sueldo (Como Administrador)
1. Siguiendo en la pantalla de **Directorio de Choferes**, busca al chofer que acabas de crear.
2. Haz clic en el botón blanco punteado que dice **"Configurar Sueldo y Viáticos"**.
3. Asegúrate de que el mes seleccionado sea el mes actual.
4. Ingresa un **Sueldo Base Proporcional** (ej: `350000`) y **Viáticos Fijos** (ej: `50000`).
5. Haz clic en **Guardar**.
6. **VERIFICACIÓN:** Vuelve a abrir la configuración de ese chofer y verifica que los números (`350.000` y `50.000`) se hayan quedado guardados y aparezcan al abrir el recuadro.

---

## FASE 3: El Chofer y su primer día de trabajo
1. Haz clic en "Cerrar Sesión" en la esquina inferior izquierda.
2. Inicia sesión usando **el correo que usaste en la Fase 1** y la **contraseña temporal** que te llegó por correo.
3. **VERIFICACIÓN:** Al entrar, debes ver que en la caja principal verde de "Total a pagar" ya están sumados los `350.000` de sueldo y `50.000` de viáticos que configuró el administrador (Total: `400.000`), a pesar de que aún tiene `0` viajes.

**Cambio de contraseña:**
1. En la aplicación del chofer, entra a **Ajustes** (ícono de tuerca arriba a la derecha).
2. Escribe la contraseña temporal actual, e ingresa una nueva contraseña (ej: `123456`).
3. Dale a **Actualizar Contraseña**.
4. Cierra sesión y vuelve a entrar con la nueva clave para comprobar que funciona.

---

## FASE 4: Ingreso de Viajes
1. En la vista del Chofer, ve al botón central flotante (o pestaña **Nuevo Viaje**).
2. Ingresa un origen, un destino y un monto (ej: `15000`). Guárdalo.
3. Repite el proceso y agrega un segundo viaje (ej: `25000`).
4. **VERIFICACIÓN:**
   - Ve a la pestaña **Inicio**. El "Monto en viajes" debe decir `40.000`.
   - El "Total a pagar" (cuadro verde gigante) debe haberse sumado automáticamente a `440.000` (`350k + 50k + 40k`).
5. Ve a la pestaña **Historial** y revisa que ambos viajes estén listados correctamente.
6. En **Inicio**, presiona **Descargar Planilla Mensual** y abre el archivo Excel en tu computador. Revisa que el logo se vea bien y los totales cuadren perfectamente.

---

## FASE 5: Auditoría General (Como Administrador)
1. Cierra sesión y vuelve a ingresar como Administrador (`admin@rutapay.cl` / `RutaPay@2026!`).
2. Entra a **Dashboard Global** (Inicio).
3. **VERIFICACIÓN:** En la tarjeta verde gigante debes ver reflejado el trabajo de tu chofer: Los viajes globales (`40.000`), el sueldo total (`350.000`) y el total a pagar de la empresa (`440.000`).
4. Descarga el Excel desde el botón inferior **Descargar Excel Consolidado** y comprueba que la hoja de cálculo genere un resumen limpio para la jefatura de la empresa.

---

## FASE 6: Auditoría Individual por Chofer
1. Ve al **Directorio de Choferes**.
2. Haz clic sobre el recuadro del chofer (donde dice "Ver perfil e historial ->").
3. **VERIFICACIÓN:**
   - La pantalla debe cambiar a la "Vista de Perfil".
   - Deben aparecer los mismos 2 viajes que el chofer creó.
   - Las 4 tarjetas de arriba deben tener los montos exactos (`40.000` en viajes, `440.000` total, etc.).
4. Presiona el botón verde de **Descargar Excel del Chofer** para generar el reporte individual desde la vista del administrador.

---

## FASE 7: Olvidé mi contraseña
1. Cierra sesión.
2. En la pantalla principal, dale a **¿Olvidaste tu contraseña?** debajo del botón de entrar.
3. Ingresa un correo falso (ej: `inventado@correo.com`) y dale enviar.
   - **VERIFICACIÓN:** Debe arrojar error de que la cuenta no existe.
4. Ingresa el correo real de tu chofer y dale enviar.
   - **VERIFICACIÓN:** Debe salir la animación de éxito.
5. Revisa la bandeja de entrada del correo del chofer; debería haber un nuevo mensaje con el asunto "Recuperación de Contraseña" y una nueva clave temporal autogenerada.
6. Usa esa nueva clave para volver a iniciar sesión y confirmar que todo el ciclo está perfecto.

---
**¡FIN DE LA PRUEBA!** Si logras llegar hasta aquí sin errores, el sistema RutaPay está completamente operativo y sin fisuras.
