# Monday Clone — Aplicación web modular

Clon operativo y estético de Monday.com: modo oscuro (#121212), acento azul (#0073EA), vistas Tabla, Kanban y Cronograma.

## Requisitos

- **Node.js** 18+ (recomendado 20+)
- Nada más: SQLite se usa automáticamente vía Prisma.

## Instalación y arranque

Sigue estos pasos en orden en la terminal.

### 1. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 2. Crear la base de datos y tablas (Prisma + SQLite)

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. (Opcional) Datos iniciales

```bash
cd backend
npm run db:seed
```

### 4. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 5. Logo en el sidebar

Copia tu `logo.png` en la carpeta pública del frontend para que se vea en el sidebar.

- **PowerShell:** `Copy-Item ".\logo.png" ".\frontend\public\logo.png"`
- **CMD:** `copy ".\logo.png" "frontend\public\logo.png"`

(Si `logo.png` está en la raíz del proyecto; ajusta la ruta si no.)

### 6. Iniciar el backend

Desde la raíz del proyecto:

```bash
cd backend
npm run dev
```

Deja esta terminal abierta. El backend quedará en **http://localhost:3001**.

### 7. Iniciar el frontend (en otra terminal)

Desde la raíz del proyecto:

```bash
cd frontend
npm run dev
```

El frontend quedará en **http://localhost:5173**. Abre esa URL en el navegador. Si ejecutaste el seed, inicia sesión con **Nombre de usuario: admin** y **Contraseña: 123456**.

---

## Resumen de comandos (orden)

| Paso | Comando | Dónde |
|------|---------|--------|
| 1 | `npm install` | `backend/` |
| 2 | `npx prisma generate` | `backend/` |
| 3 | `npx prisma db push` | `backend/` |
| 4 | `npm run db:seed` (opcional) | `backend/` |
| 5 | `npm install` | `frontend/` |
| 6 | `npm run dev` | `backend/` (dejar corriendo) |
| 7 | `npm run dev` | `frontend/` (otra terminal) |

---

## Estructura del proyecto

- **backend/** — API Node.js + Express, Prisma, SQLite  
  - `prisma/schema.prisma` — modelo (Workspaces, Boards, Groups, Items, Columns, ItemValues)  
  - `src/index.js` — servidor  
  - `src/routes/` — workspaces, boards, groups, items, columns, values, upload  

- **frontend/** — React (Vite) + Tailwind  
  - `src/components/Sidebar.jsx` — workspaces y boards, logo arriba  
  - `src/pages/BoardPage.jsx` — pestañas Tabla / Kanban / Cronograma  
  - `src/components/board/` — BoardTable, BoardKanban, BoardTimeline y celdas editables  

## Funcionalidades

- **Sidebar:** listado de workspaces y boards; crear workspace/board; logo; enlace "Gestión de Usuarios" (solo rol ADMIN).
- **Autenticación:** login por nombre de usuario y contraseña (sin email). Roles: ADMIN, VENTAS, DISENO, TALLER.
- **Gestión de Usuarios (solo ADMIN):** ruta `/gestion-usuarios` para crear usuarios (nombre, contraseña, rol).
- **Vista Tabla:** columnas: Nombre del Proyecto, Folio, Estatus, Link de Drive, Fecha de Instalación, Tipo de Trabajo (sin Inversión). Link de Drive con permisos por rol.
- **Carpetas físicas:** al crear un proyecto se crea la carpeta en disco (variable `PROJECTS_BASE_PATH` en `backend/.env`; por defecto `backend/data/proyectos`). Rutas: `PROYECTOS/[MES]/[FOLIO]/` o `[CLIENTE]/[MES]/[FOLIO]/`.
- **Vista Kanban:** columnas por Status; arrastrar y soltar para cambiar estado.
- **Vista Cronograma:** barras de tiempo tipo Gantt según la columna Cronograma.
- **Nuevo board:** se crean por defecto columnas Status y Cronograma y un grupo inicial.

## Tecnologías

- Backend: Node.js, Express, Prisma, SQLite, Multer (uploads).  
- Frontend: React 18, Vite, Tailwind CSS, React Router, @dnd-kit (drag & drop), date-fns.

---

## Solución de problemas

### Error `EPERM` al ejecutar `prisma generate` (Windows)

Windows a veces bloquea archivos que Prisma está generando. Prueba en este orden:

1. **Script automático** (desde `backend/`):
   ```bash
   npm run db:fix
   ```
   Borra la carpeta `.prisma` y vuelve a generar el cliente.

2. **A mano:** cierra todas las terminales y Cursor que tengan el proyecto abierto. Luego:
   ```bash
   cd backend
   rmdir /s /q node_modules\.prisma
   npx prisma generate
   ```

3. Si sigue fallando, abre **PowerShell o CMD como Administrador**, ve a `backend/` y ejecuta de nuevo `npx prisma generate`.

### Error `EADDRINUSE: address already in use :::3001`

El puerto 3001 está ocupado (otra instancia del backend, otro programa, etc.).

- **Opción A:** El backend ahora prueba puertos 3001, 3002, … hasta 3010. Si arranca en otro puerto (por ejemplo 3002), verás en consola:
  ```
  Backend en http://localhost:3002
  (Puerto 3001 estaba ocupado. Crea frontend/.env con: VITE_API_PORT=3002)
  ```
  Crea el archivo `frontend/.env` con:
  ```
  VITE_API_PORT=3002
  ```
  y reinicia el frontend (`npm run dev` en `frontend/`).

- **Opción B:** Liberar el puerto 3001 en Windows:
  1. Ver qué proceso lo usa: `netstat -ano | findstr :3001`
  2. Anota el PID (último número de la línea).
  3. Cerrar el proceso: `taskkill /PID <número> /F`
  4. Vuelve a ejecutar `npm run dev` en `backend/`.
