# Checklist de Pruebas: RutaPay

Este documento contiene un checklist detallado basado en la guía de prueba completa de RutaPay. Úsalo para marcar el progreso de las pruebas de aseguramiento de calidad (QA).

## FASE 0: Preparación del Entorno
- [ ] La base de datos en Supabase tiene desactivado RLS para `monthly_configs` (si aplica).
- [ ] El archivo `.env` del backend tiene configurada la variable `SMTP_PASS` correctamente.
- [ ] El backend se levanta correctamente sin errores (`npm start`).
- [ ] El frontend compila y se levanta correctamente sin errores (`npm run dev`).

## FASE 1: Administrador y Creación de Personal
- [ ] El Administrador puede iniciar sesión (`admin@rutapay.cl`).
- [ ] El Administrador puede ver el Directorio de Choferes.
- [ ] El Administrador puede abrir el modal para "Añadir Chofer".
- [ ] La creación de un chofer funciona y muestra una alerta de éxito verde.
- [ ] El sistema envía el correo de bienvenida con la contraseña temporal autogenerada al correo del chofer.

## FASE 2: Configuración del Sueldo (Administrador)
- [ ] El botón "Configurar Sueldo y Viáticos" abre correctamente el modal para el chofer seleccionado.
- [ ] Se puede asignar un "Sueldo Base Proporcional" correctamente.
- [ ] Se pueden asignar "Viáticos Fijos" correctamente.
- [ ] Los montos guardados persisten en la base de datos (se mantienen al recargar o reabrir el modal).

## FASE 3: Chofer y su Primer Ingreso
- [ ] El Chofer puede iniciar sesión usando su correo y la contraseña temporal del email.
- [ ] El Dashboard del Chofer muestra inmediatamente la suma del sueldo y los viáticos base.
- [ ] El Chofer puede ingresar a "Ajustes" para cambiar su contraseña.
- [ ] El cambio de contraseña exige la contraseña actual (temporal) y la nueva.
- [ ] El Chofer puede cerrar sesión e ingresar nuevamente con su contraseña recién configurada.

## FASE 4: Ingreso de Viajes
- [ ] El Chofer puede registrar un nuevo viaje (Origen, Destino, Monto).
- [ ] El total del Dashboard se actualiza sumando el monto del nuevo viaje en tiempo real.
- [ ] El viaje creado aparece correctamente en la pestaña "Historial".
- [ ] Se pueden registrar múltiples viajes sin errores.
- [ ] El Chofer puede "Descargar Planilla Mensual" y el archivo Excel (.xlsx) se genera correctamente.
- [ ] El Excel del chofer tiene formato correcto y los totales matemáticos son exactos.

## FASE 5: Auditoría General (Administrador)
- [ ] El Administrador puede ver los totales acumulados de todos los choferes en el "Dashboard Global".
- [ ] El monto total en viajes global cuadra con la suma de los viajes ingresados por los choferes.
- [ ] El "Total a Pagar" global cuadra con las configuraciones financieras + viajes de todos los choferes.
- [ ] El botón "Descargar Excel Consolidado" genera un reporte global sin errores y los datos son correctos.

## FASE 6: Auditoría Individual (Administrador)
- [ ] En el Directorio de Choferes, el Administrador puede ingresar al perfil detallado de un chofer.
- [ ] El historial de viajes del chofer es visible para el Administrador.
- [ ] Los montos individuales del chofer coinciden con lo que ve el mismo chofer en su sesión.
- [ ] El botón "Descargar Excel del Chofer" genera correctamente el archivo detallado.

## FASE 7: Recuperación de Contraseñas
- [ ] El flujo "¿Olvidaste tu contraseña?" arroja un error si el correo no existe.
- [ ] El flujo permite ingresar un correo válido de un chofer y muestra un mensaje de éxito.
- [ ] El sistema envía un correo de "Recuperación de Contraseña" con una nueva clave temporal.
- [ ] El Chofer puede iniciar sesión usando esta nueva clave temporal.
