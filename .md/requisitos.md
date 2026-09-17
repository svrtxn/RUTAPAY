# RutaPay

RutaPay es una plataforma web para gestionar viajes, pagos y reportes de conductores de forma simple, rápida y centralizada.

## 🚀 Tecnologías

* **Frontend:** React
* **Backend:** Express.js
* **Base de datos:** PostgreSQL
* **API:** REST
* **Control de versiones:** Git / GitHub

## 📋 Funcionalidades

### 👤 Choferes

* Inicio de sesión seguro.
* Registro de viajes.
* Consulta de viajes realizados.
* Resumen mensual de pagos.
* Consulta de sueldo proporcional y viáticos.
* Exportación de planilla mensual en Excel.
* Cambio de contraseña.

### 🧑‍💼 Administración

* Dashboard con resumen mensual.
* Gestión de choferes.
* Registro y administración de viajes.
* Consulta de información por chofer y mes.
* Reportes mensuales.
* Exportación de reportes en Excel.
* Configuración de sueldo proporcional y viáticos.

## 🏗️ Arquitectura

```text
rutapay/
├── frontend/        # Aplicación React
├── backend/         # API Express.js
├── database/        # Scripts y configuración PostgreSQL
└── README.md
```

## ⚙️ Requisitos

* Node.js 20+
* npm
* PostgreSQL 15+
* Git

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd rutapay
```

### 2. Backend

```bash
cd backend
npm install
```

Crear un archivo `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/rutapay
JWT_SECRET=tu_secreto
```

Iniciar el servidor:

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🗄️ Base de datos

RutaPay utiliza PostgreSQL para almacenar:

* Usuarios y roles.
* Información de choferes.
* Viajes registrados.
* Configuración mensual.
* Información necesaria para reportes y pagos.

## 📊 Cálculo mensual

El total a pagar a cada chofer se calcula como:

```text
Total a pagar =
Monto de viajes
+ Sueldo proporcional
+ Viáticos
```

Los valores mensuales se mantienen asociados a su respectivo mes para conservar correctamente el historial.

## 🔐 Roles

### CHOFER

Acceso a las funcionalidades relacionadas con sus propios viajes y pagos.

### ADMIN

Acceso a la gestión de choferes, viajes, reportes y configuración del sistema.

## 📁 Variables de entorno

Las variables sensibles deben mantenerse en archivos `.env` y **no deben subirse al repositorio**.

Asegúrate de incluir `.env` en `.gitignore`.

## 📌 Estado del proyecto

> 🚧 Proyecto en desarrollo.
