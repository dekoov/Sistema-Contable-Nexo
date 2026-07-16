# Frontend — Sistema Contable (Nexo)

SPA en **React 19 + Vite** para el sistema de Facturación, Inventario y Cuentas por Cobrar (CxC). Consume el backend Java EE (`backend_api`, JAX-RS/Payara) vía REST, con autenticación JWT (login local y Google OAuth) y navegación protegida por roles.

---

## 1. Stack técnico

| Categoría | Tecnología |
|---|---|
| Framework | React 19.2 |
| Build tool | Vite 8 (`@vitejs/plugin-react`) |
| Enrutamiento | react-router-dom 7 |
| HTTP client | axios 1.18 (instancia central con interceptores) |
| UI | Bootstrap 5.3 (clases utilitarias) + `src/styles/global.css` |
| Iconos | lucide-react |
| Auth | JWT propio (login/password) + Google Identity Services (GSI) |
| Lint | ESLint 10 (`eslint.config.js`, flat config) |

El estado se maneja con `useState`/`useEffect` local en cada página, y la sesión vive en `AuthContext` + `sessionStorage`.

---

## 2. Requisitos previos

- Node.js ≥ 20 LTS (por Vite 8 / ESLint 10 / React 19).
- npm ≥ 10 (viene con Node 20).
- Backend `backend_api` corriendo (Payara) accesible en la red local, o vía el proxy Nginx/HAProxy del `docker/`.
- Un **Google OAuth Client ID** (tipo "Web application") si se va a usar el login con Google.

---

## 3. Instalación

```bash
cd frontend_app
npm install
cp .env.example .env
# editar .env con tus valores
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## 4. Variables de entorno

Archivo `.env` (basado en `.env.example`), leído por Vite (`import.meta.env`):

```env
VITE_API_URL=/api
BACKEND_TARGET=http://localhost:8080
VITE_USE_MOCK_API=false
VITE_GOOGLE_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
VITE_ENABLE_MOCK_LOGIN=false
```

| Variable | Usada en | Propósito |
|---|---|---|
| `VITE_API_URL` | `src/api/apiClient.js` | `baseURL` de axios. Con `/api`, las peticiones se emiten relativas al mismo host y el dev-server las reenvía por proxy (ver `vite.config.js`). |
| `BACKEND_TARGET` | `vite.config.js` | Solo en desarrollo: destino real al que el proxy de Vite reenvía `/api/*` (por defecto `http://localhost:8080` si no se define). **No** es leída por el código de la app, solo por la config de Vite. |
|`VITE_USE_MOCK_API` | referenciada en `reportesInventarioApi.js` | Bandera para forzar datos simulados en vez de llamar al backend real (usar el mismo nombre en ambos lados, ver nota abajo). |
| `VITE_GOOGLE_CLIENT_ID` | `src/pages/auth/LoginPage.jsx` | Client ID de Google usado para inicializar el botón de "Sign in with Google" (GSI). |
| `VITE_ENABLE_MOCK_LOGIN` | `src/pages/auth/LoginPage.jsx` | Si es `"true"`, muestra un botón "Entrar en modo demostración" que evita el backend (`loginMock()` en `AuthContext`). Debe estar en `false` en producción. |


---

## 6. Arquitectura y estructura de carpetas

Arquitectura basada en **capas por responsabilidad** (no por feature-folder puro): una capa de acceso a datos (`api/`), una capa de estado de sesión (`auth/`), componentes de layout/UI reutilizables (`components/`), páginas por módulo de negocio (`pages/`) y configuración transversal (`routes/`, `utils/`).

```
frontend_app/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/                  # Un módulo por recurso REST del backend
│   ├── auth/                 # Sesión, contexto de auth y guard de rutas
│   ├── components/
│   │   ├── common/           # Piezas de UI genéricas (loading, diálogos)
│   │   ├── layout/           # Shell de la app (sidebar, topbar, layout)
│   │   └── system/           # Widgets de estado de infraestructura
│   ├── pages/                # Una carpeta por módulo de negocio
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── common/           # 403 / 404 / placeholder
│   │   ├── cxc/               ├── reportes/
│   │   ├── dashboard/
│   │   ├── facturacion/       ├── reportes/
│   │   ├── integracion/
│   │   └── inventario/        ├── reportes/
│   ├── routes/
│   │   └── menuConfig.js     # Qué aparece en el menú y con qué roles
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   └── navigationConfig.js  # Iconos/colores/descr. del menú (solo UI)
│   ├── App.jsx                # Definición de todas las rutas (<Routes>)
│   └── main.jsx                # Entry point: providers + render
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md                  # (README original del proyecto, más breve)
```

### Flujo general

```
main.jsx
 └─ BrowserRouter
     └─ AuthProvider (auth/AuthContext.jsx)   ← estado de sesión global
         └─ App.jsx (<Routes>)
             ├─ /login, /403                   ← públicas
             └─ <ProtectedRoute>                ← exige sesión
                 └─ <AppLayout> (Sidebar + Topbar)
                     └─ páginas de src/pages/**
                         └─ src/api/*Api.js → apiClient.js → backend REST
```

1. `main.jsx` monta `AuthProvider` (contexto de sesión) dentro de `BrowserRouter`, envolviendo `App`.
2. `App.jsx` declara todas las rutas con `react-router-dom`. Rutas de negocio están anidadas bajo `<ProtectedRoute>` + `<AppLayout>`.
3. Cada página de `pages/**` llama funciones de `src/api/*.js` para leer/escribir datos.
4. Todas esas funciones usan la instancia única `apiClient` (axios), que inyecta el JWT y centraliza el manejo de expiración de sesión.
5. `Sidebar` construye el menú cruzando `routes/menuConfig.js` (rutas + roles) con `utils/navigationConfig.js` (iconos/colores/textos), filtrando por el rol del usuario en `AuthContext`.

---

## 7. Integración con el backend

- **URL base**: `VITE_API_URL` (por defecto `/api`). En desarrollo, Vite proxea `/api/*` hacia `BACKEND_TARGET` (`vite.config.js`, sección `server.proxy`). En producción, `/api` debe ser resuelto por el servidor web/reverse proxy (Nginx/HAProxy, ver `docker/nginx/nginx.conf`) hacia el clúster Payara.
- **Autenticación**: JWT Bearer. El backend expone `POST /api/auth/login` (Google idToken) y `POST /api/auth/login-password` (usuario/contraseña) — ver `AuthResource.java` (`@Path("/auth")`).
- **Formato del token**: JWT firmado con HMAC (`JwtAuthFilter.java`, backend). El frontend no decodifica el token: lo trata como opaco y lo reenvía tal cual.
- **Encabezado usado**: `Authorization: Bearer <token>` en cada petición saliente (inyectado automáticamente, ver `apiClient.js`).
- **Content-Type**: `application/json` por defecto en todas las peticiones.
- **Expiración / 401**: el interceptor de respuesta de `apiClient.js` detecta cualquier `401`, limpia `sessionStorage` (`accessToken`, `currentUser`) y dispara un evento global `auth:expired`. `AuthContext` escucha ese evento y desloguea al usuario en memoria, lo que hace que `ProtectedRoute` redirija a `/login` en el siguiente render.
- **Nodo/instancia backend**: `GET /api/system/instance` (`SystemResource.java`, `@Path("/system")`) se usa solo para mostrar en el Topbar contra qué nodo Payara del clúster respondió la petición (útil para verificar balanceo de carga), vía `src/api/systemApi.js` + `ServerInstanceBadge.jsx`.

---

## 9. Autorización (roles)

- El rol (`user.role`, ej. `"ADMIN"`) viaja dentro del objeto `user` normalizado en el login y se guarda en `sessionStorage`/contexto.
- **A nivel de ruta**: `ProtectedRoute` acepta una prop `allowedRoles`. En `App.jsx`, la ruta `/admin/usuarios` está envuelta en un `ProtectedRoute` anidado con `allowedRoles={["ADMIN"]}`; si el rol del usuario no está en la lista, se redirige a `/403` (`ForbiddenPage.jsx`).
- **A nivel de menú**: `routes/menuConfig.js` permite anotar un ítem con `roles: [...]` (usado hoy solo en "Usuarios"). `Sidebar.jsx` filtra `visibleItems` comparando `item.roles.includes(user?.role)`, de modo que un usuario sin el rol requerido ni siquiera ve la opción en el menú (defensa en profundidad junto con el `ProtectedRoute`).

---

## 10. Rutas de la aplicación (`src/App.jsx`)

| Ruta | Página | Auth | Rol |
|---|---|---|---|
| `/login` | `LoginPage` | Pública | — |
| `/403` | `ForbiddenPage` | Pública | — |
| `/` | redirect a `/dashboard` | Requiere sesión | — |
| `/dashboard` | `DashboardPage` | Requiere sesión | — |
| `/admin/usuarios` | `UsuariosPage` | Requiere sesión | `ADMIN` |
| `/facturacion/clientes` | `ClientesPage` | Requiere sesión | — |
| `/facturacion/ciudades` | `CiudadesPage` | Requiere sesión | — |
| `/facturacion/facturas` | `FacturasPage` | Requiere sesión | — |
| `/facturacion/reportes/ventas-ciudad` | `VentasCiudadPage` | Requiere sesión | — |
| `/facturacion/reportes/matriz-clientes` | `MatrizClientesPage` | Requiere sesión | — |
| `/inventario/articulos` | `ArticulosPage` | Requiere sesión | — |
| `/inventario/tipos-movimiento` | `TiposMovimientoPage` | Requiere sesión | — |
| `/inventario/comprobantes` | `ComprobantesPage` | Requiere sesión | — |
| `/inventario/reportes/movimientos` | `MovimientosInventarioPage` | Requiere sesión | — |
| `/cxc/cobradores` | `CobradoresPage` | Requiere sesión | — |
| `/cxc/formas-pago` | `FormasPagoPage` | Requiere sesión | — |
| `/cxc/pagos` | `PagosPage` | Requiere sesión | — |
| `/cxc/reportes/estado-cuenta` | `EstadoCuentaPage` | Requiere sesión | — |
| `/cxc/reportes/matriz-recaudacion` | `MatrizRecaudacionPage` | Requiere sesión | — |
| `/integracion/cola` | `IntegracionColaPage` | Requiere sesión | — |
| `*` | `NotFoundPage` | Pública | — |


---

## 12. Reportes y exportación CSV

Los cinco reportes del sistema (`EstadoCuentaPage`, `MatrizRecaudacionPage`, `MatrizClientesPage`, `VentasCiudadPage`, `MovimientosInventarioPage`) siguen el mismo patrón: consumen su función correspondiente de `api/reportes*Api.js`, aplican filtros locales (fechas, cliente, ciudad, etc. según el reporte) y renderizan una tabla.

`MovimientosInventarioPage.jsx` implementa además la exportación a **CSV** sin librerías externas:

1. Construye un arreglo de filas (`filas`) con encabezados y datos de movimientos + stock actual.
2. Escapa cada celda con una función `escaparCsv` (comillas/comas) y une filas con `\n`.
3. Antepone un BOM `\uFEFF` para forzar UTF-8 correcto al abrir el archivo en Excel.
4. Crea un `Blob` (`text/csv;charset=utf-8;`), genera una URL con `URL.createObjectURL`, y dispara la descarga vía un `<a download="reporte-inventario.csv">` sintético que se agrega, se clickea y se remueve del DOM.
5. Libera el `ObjectURL` con `URL.revokeObjectURL` tras la descarga.

Nombre de archivo fijo: `reporte-inventario.csv`. se exporta todo lo que esté cargado en memoria en ese momento.

---

## 13. Manejo de errores

- **Errores de red/servidor**: cada módulo `api/*.js` expone `obtenerMensaje*Error(error)`, que inspecciona `error.response?.data?.message` (o similar) y devuelve un texto amigable; si no hay respuesta del backend, cae a un mensaje genérico. Las páginas usan esa función para poblar un `<div className="alert">` en vez de mostrar el error crudo de axios.
- **Errores de autenticación (401)**: interceptados de forma centralizada en `apiClient.js` (ver sección 7), no en cada página.
- **Errores de autorización (403 de ruta)**: manejados por `ProtectedRoute` → redirección a `ForbiddenPage`.
- **Rutas no encontradas**: `NotFoundPage` como catch-all (`path="*"`).

---


## 15. Despliegue

1. `npm run build` genera `dist/` (estáticos listos para servir).
2. Servir `dist/` detrás de un servidor web/reverse proxy que también enrute `/api` hacia el backend. El repositorio incluye un `docker/nginx/nginx.conf` de referencia que balancea `/` hacia un upstream `payara_backend` (3 nodos Payara) — en un despliegue real de este frontend, se debe añadir un `location /` que sirva los archivos de `dist/` y mantener un `location /api` apuntando al mismo upstream.
3. Variables de entorno de producción: definir `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` y `VITE_ENABLE_MOCK_LOGIN=false` **antes** del `npm run build` (Vite las incrusta en el bundle en tiempo de compilación, no son configurables en runtime).
4. `BACKEND_TARGET` solo aplica al servidor de desarrollo de Vite; no tiene efecto en el build de producción.

---

## 16. Backend relacionado

- Proyecto: `backend_api/` (mismo repositorio), Java EE / Jakarta EE 11 sobre Payara 7, JAX-RS para los recursos REST, JWT (JJWT) para autenticación, y persistencia vía `persistence.xml`.
- Módulos backend equivalentes a los del frontend: `facturacion`, `inventario`, `cobranzas` (CxC), `integracion`, `usuarios`, `config` (filtros/CORS/JWT).
- Para levantar ambos en conjunto en desarrollo: iniciar Payara con el backend desplegado en `:8080`, apuntar `BACKEND_TARGET` a esa URL en el `.env` del frontend, y correr `npm run dev`. Para un entorno más cercano a producción, usar los `docker-compose-*.yml` de `docker/` (clúster de PostgreSQL + Payara + Nginx/HAProxy) y servir el build del frontend detrás del mismo proxy.

