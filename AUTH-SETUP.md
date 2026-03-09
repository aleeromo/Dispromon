# Autenticación y RBAC — Instalación y migraciones

## 1. Instalar dependencias nuevas del backend

Desde la raíz del proyecto:

```bash
cd backend
npm install bcrypt jsonwebtoken
```

(O si ya tienes `node_modules` instalado, con `npm install` se instalarán las nuevas dependencias añadidas al `package.json`.)

## 2. Actualizar la base de datos (Prisma)

Sigue estos pasos en orden dentro de la carpeta `backend`:

```bash
cd backend
npx prisma generate
npx prisma db push
```

- `prisma generate`: regenera el cliente de Prisma (incluye el modelo `User`).
- `prisma db push`: aplica los cambios del esquema a la base SQLite (crea la tabla `User` sin generar archivos de migración).

Si prefieres usar migraciones con nombre:

```bash
cd backend
npx prisma migrate dev --name add_user_auth
```

## 3. Crear el usuario administrador (seed)

```bash
cd backend
npm run db:seed
```

Esto crea el usuario **admin** (nombre de usuario) con contraseña **123456** y rol **ADMIN** (si no existe ya).

## 4. Variables de entorno (opcional)

En producción, define un secreto para JWT:

- **Backend:** crea un archivo `backend/.env` con:
  ```
  JWT_SECRET=tu-secreto-muy-seguro-aqui
  ```

Si no defines `JWT_SECRET`, el backend usa un valor por defecto solo válido para desarrollo.

## 5. Resumen de comandos (orden)

| Paso | Comando | Dónde |
|------|---------|--------|
| 1 | `npm install` | `backend/` (instala bcrypt y jsonwebtoken) |
| 2 | `npx prisma generate` | `backend/` |
| 3 | `npx prisma db push` | `backend/` |
| 4 | `npm run db:seed` | `backend/` |

Luego inicia backend y frontend como de costumbre. Al abrir la app se mostrará la pantalla de login; usa **Nombre de usuario: admin** y **Contraseña: 123456** para entrar.
