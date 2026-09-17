# Estatus del Proyecto RutaPay

**Fecha de Actualización:** 13 de Septiembre de 2026
**Fase Actual:** Release Candidate (Listo para Pruebas de Aceptación)

El proyecto se encuentra en un estado avanzado y completamente funcional. El backend y el frontend están comunicados y las integraciones con Supabase (Autenticación y Base de Datos) así como los servicios de correo SMTP operan correctamente.

---

## ✨ Funcionalidades Actuales

### 1. Perfil Administrador (Superadmin)
- **Autenticación:** Inicio de sesión restringido (ej. `admin@rutapay.cl`).
- **Gestión de Choferes:**
  - Creación de nuevos choferes.
  - Envío automático de correo electrónico de bienvenida con contraseña temporal.
  - Edición y visualización de perfiles.
- **Configuración Financiera:**
  - Asignación de Sueldo Base Proporcional.
  - Asignación de Viáticos Fijos mensuales.
- **Módulo de Reportes:**
  - Dashboard Global con métricas financieras totales de la empresa.
  - Generación y descarga de Reporte Global (Consolidado) en formato Excel.
  - Generación y descarga de Reporte Individual (Por chofer) en formato Excel.

### 2. Perfil Chofer
- **Autenticación y Seguridad:**
  - Inicio de sesión con credenciales temporales.
  - Actualización de contraseña desde los ajustes.
  - Recuperación de contraseña olvidada mediante correo.
- **Operación Diaria:**
  - Dashboard en tiempo real que suma Sueldo Base, Viáticos y Viajes.
  - Ingreso de nuevos viajes (Origen, Destino y Monto).
  - Visualización del historial completo de viajes.
- **Reportes:**
  - Generación y descarga de Planilla Mensual personal en formato Excel.

---

## 🚀 Posibles Mejoras (Roadmap Futuro)

### Mejoras Operativas

- **PWA (Progressive Web App):** Habilitar instalación móvil e interfaz offline para zonas de baja cobertura celular. X

### Mejoras de Administración
- **Gráficos y Analíticas visuales:** Gráficos de tendencias, mayores gastos por rutas y meses.  X
- **Pausar Choferes:** Permitir la desactivación temporal de usuarios sin eliminar su historial. X
- **Módulo de Flota:** Asignar vehículos específicos a choferes y llevar un control de sus mantenciones y kilometrajes. X 

### Mejoras Técnicas
- **Paginación:** Implementar paginación en historiales largos de viajes.X
- **Notificaciones WhatsApp:** Reemplazar el envío de credenciales por email con mensajes automatizados a WhatsApp. X
