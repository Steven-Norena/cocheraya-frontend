# 💻 CocheraYa — Frontend Web (React + TypeScript + Vite)

---

## 📑 Portada del Proyecto

* **Proyecto:** CocheraYa — Plataforma Web Inteligente de Estacionamiento On-Demand
* **Curso:** CS 2031 Desarrollo Basado en Plataformas
* **Periodo:** 2026-2
* **Institución:** Universidad de Ingeniería y Tecnología (UTEC) — Lima, Perú
* **Despliegue en Producción:** [CocheraYa Web en Netlify](https://parkshare-utec.netlify.app) *(o accesible mediante el bundle de producción)*

---

## 👥 Tabla de Participación de los Integrantes (Rúbrica de Evaluación)

En cumplimiento con el criterio de evaluación de la segunda entrega del curso, a continuación se presenta la tabla de participación individual de cada integrante del equipo:

| Integrante | Código UTEC | Correo Institucional | Principales Aportes | Participación (%) |
| :--- | :--- | :--- | :--- | :---: |
| **Christian Mar Carrillo** | 202410512 | christian.mar@utec.edu.pe | Arquitectura REST Backend con Spring Boot 3.2, geoespacial PostGIS, transaccionalidad pesimista, eventos asíncronos y aprovisionamiento Docker/Cloud. | **100 %** |
| **Steven Daniel Noreña Paredes** | 202510642 | steven.norena@utec.edu.pe | Desarrollo del cliente Web (React 18 + TS + Vite), integración con mapa interactivo Leaflet, breadcrumbs, lazy loading y diseño de interfaces UI/UX. | **100 %** |
| **Luciano Gabriel Rivera Valentin** | 202410149 | luciano.rivera@utec.edu.pe | Desarrollo de la aplicación móvil nativa (React Native + Expo), integración de sensores (GPS, Cámara para QR, galería), arquitectura modular y consumo de API. | **100 %** |
| **Anthony Yair Caypane Ramirez** | 202410690 | anthony.caypane@utec.edu.pe | Integración de endpoints de reservas y billetera auditada, manejo global de errores (Error Boundary), validaciones client-side y políticas CORS. | **100 %** |

---

## 🚀 Tecnologías Principales

- **React 18 & TypeScript:** Desarrollo de componentes reactivos con tipado estático y robusto.
- **Vite:** Herramienta de compilación ultrarrápida para desarrollo moderno en frontend.
- **React Router DOM v7:** Gestión de rutas dinámicas (`:id`), parámetros de búsqueda (`?page=&size=`), rutas protegidas (`<ProtectedRoute>`) y lazy loading.
- **Axios:** Cliente HTTP centralizado con interceptores para inyección automática de JWT, renovación de Refresh Tokens y cancelación de solicitudes con `AbortController`.
- **Leaflet & React Leaflet:** Biblioteca interactiva de mapas para geolocalización en tiempo real y visualización de cocheras con pines dinámicos.
- **Context API:** Gestión de estado global de sesión (`AuthContext`), roles (`DRIVER`, `HOST`, `ADMIN`) y saldo sincronizado de la billetera.
- **CSS Vanilla (Custom Design System):** Sistema de diseño responsivo basado en CSS Variables, soporte de modo oscuro/claro y animaciones sutiles.

---

## 🧱 Arquitectura del Proyecto y Componentes

El frontend sigue una arquitectura modular y limpia con separación estricta de responsabilidades:

```text
src/
├── assets/         # Recursos estáticos (imágenes, iconos, SVGs)
├── components/     # Más de 10 componentes reutilizables (presentacionales)
│   ├── AuthGuard.tsx    # Envoltura de rutas protegidas por rol (PrivateRoute)
│   ├── Badge.tsx        # Indicadores de estado visuales
│   ├── Breadcrumbs.tsx  # Navegación jerárquica e indicadores de ubicación
│   ├── Button.tsx       # Botón con estados de carga y prevención de doble submit
│   ├── Card.tsx         # Contenedores con estilos uniformes y sombras
│   ├── ChatModal.tsx    # Mensajería en tiempo real entre conductor y host
│   ├── ErrorBoundary.tsx# Captura de errores de renderizado para evitar caídas
│   ├── Input.tsx        # Entradas de formularios con validación visual integrada
│   ├── Modal.tsx        # Modales emergentes accesibles
│   ├── Sidebar.tsx      # Navegación lateral persistente con selector de vistas
│   ├── Spinner.tsx      # Indicadores de carga visual no bloqueantes
│   └── ThemeToggle.tsx  # Alternador de tema visual claro/oscuro
├── context/        # Estado global (AuthContext para persistencia JWT y balance)
├── hooks/          # Hooks reutilizables (useAuth, useFetch, useForm con useReducer, useDebounce)
├── services/       # Capa de comunicación con el backend (Axios centralizado)
│   ├── api.ts              # Configuración base, headers e interceptores
│   ├── authService.ts      # Registro, login, refresh y sesión
│   ├── parkingService.ts   # CRUD de cocheras, búsqueda espacial y dashboard
│   ├── reservationService.ts # Reservas, check-in, check-out y QR
│   ├── reviewService.ts    # Calificaciones y reseñas comunitarias
│   └── walletService.ts    # Balance, transacciones paginadas y recargas
└── views/          # 11 vistas diferenciadas por rol
    ├── admin/      # UserManagement (Gestión y deshabilitación de cuentas con PATCH)
    ├── auth/       # Login y Register
    ├── driver/     # MapSearch, Reservations (con simulación QR), Favorites y Wallet
    ├── host/       # Dashboard, ManageSpaces, AddSpaceForm, Wallet y ScanSimulation
    └── NotFound.tsx# Manejo amigable de rutas 404
```

---

## 🔌 Integración con la API y Axios Centralizado (Rúbrica 3.1)

La comunicación con el backend se realiza exclusivamente a través del cliente centralizado de **Axios** en [api.ts](src/services/api.ts):

* **Configuración Centralizada:** Se define `API_BASE_URL` dinámicamente mediante `import.meta.env.VITE_API_URL` con fallback automático a `http://localhost:8080/api/v1`.
* **Métodos HTTP Completos:** Implementa peticiones `GET`, `POST`, `PUT`, `DELETE` y `PATCH` (utilizado en la consola administrativa para desactivar usuarios en `/admin/users/:id/disable`).
* **Interceptor de Petición:** Agrega automáticamente el token JWT a la cabecera `Authorization: Bearer <token>` en todas las solicitudes.
* **Interceptor de Respuesta:** Intercepta respuestas `401 Unauthorized`. Si existe un `refreshToken`, realiza automáticamente una petición a `/auth/refresh-token`, renueva el token y reintenta la solicitud fallida de manera imperceptible para el usuario.
* **Request Cancellation:** Se integra `AbortController` en peticiones concurrentes a través del custom hook `useFetch` para prevenir fugas de memoria y condiciones de carrera.

---

## 🧩 Componentes y Arquitectura React (Rúbrica 3.2)

* **Más de 10 Componentes Reutilizables:** Se implementan 12 componentes genéricos independientes (`Button`, `Input`, `Card`, `Badge`, `Modal`, `ChatModal`, `Sidebar`, `Spinner`, `ThemeToggle`, `ErrorBoundary`, `Breadcrumbs`, `AuthGuard`).
* **Uso Eficiente de Hooks de React:**
  - `useState` y `useEffect` para ciclo de vida local.
  - `useContext` para el estado global en `AuthContext`.
  - `useReducer` implementado en `useForm.ts` para control predecible de acciones del formulario (`SET_FIELD`, `SET_ERRORS`, `SET_SUBMITTING`, `RESET`).
  - `useMemo` y `useCallback` para memorizar funciones de consulta y evitar re-renderizados innecesarios en `Wallet` y `MapSearch`.
* **TypeScript Estricto:** Tipado exhaustivo de DTOs, interfaces de respuesta y propiedades de componentes.

---

## 🚦 Routing y Navegación (Rúbrica 3.3)

* **Rutas Dinámicas y Query Params:** Enrutamiento dinámico mediante `react-router-dom` con parámetros de ruta (ej: `/host/edit-space/:id`) y parámetros de búsqueda para paginación y filtros (`?page=0&size=10&type=CHARGE`).
* **Rutas Protegidas (`ProtectedRoute`):** Restringe el acceso a módulos específicos según el rol del usuario (`DRIVER`, `HOST`, `ADMIN`).
* **Lazy Loading & Suspense:** Todas las vistas principales se cargan diferidamente mediante `React.lazy()` envueltas en un `<Suspense>` con spinner de carga.
* **Breadcrumbs:** Indicador visual de ubicación jerárquica en todas las páginas internas mediante el componente `<Breadcrumbs />`.
* **Rutas 404:** Redirección amigable a `<NotFound />` ante URLs inexistentes.

---

## ⚠️ Manejo de Errores, Estados de Carga y Validaciones (Rúbrica 3.4)

* **Try-Catch Exhaustivo:** Todas las llamadas al backend están encapsuladas en bloques de captura de excepciones.
* **Error Boundaries:** `<ErrorBoundary>` previene la caída completa de la interfaz en caso de errores en componentes críticos.
* **Prevención de Doble-Submit:** Botones de acción (`Button`) bloqueados con estado `disabled={loading}` durante la ejecución de solicitudes.
* **Manejo Diferenciado de Códigos HTTP:** Gestión específica de 400 (validación), 401 (no autenticado / expirado), 403 (acceso prohibido), 404 (no encontrado), 409 (espacio no disponible) y 500 (error de servidor).
* **Retry Logic:** Botones de "Reintentar" integrados en los paneles de billetera y reservas para recuperar datos sin recargar la página.

---

## 🎨 UI/UX y Diseño Visual (Rúbrica 4.1 & 4.2)

* **Diseño Moderno:** Interfaz estilizada inspirada en aplicaciones financieras con paleta de colores coherente y moderna (violeta, esmeralda y tonalidades neutras).
* **Responsive:** Adaptabilidad fluida para pantallas móviles, tablets y monitores de escritorio.
* **Búsqueda con Debounce:** Entrada de texto con debounce de 300 ms en el mapa interactivo para optimizar consultas de cocheras.
* **Confirmación para Acciones Destructivas:** Alertas de confirmación previa antes de eliminar cocheras o cancelar reservas.
* **Estados Vacíos:** Mensajes ilustrativos con botones de llamada a la acción ante listas vacías.

---

## 📄 Paginación en Endpoints (Rúbrica 4.4)

La aplicación implementa paginación física del lado del servidor en **dos endpoints del backend**:
1. `GET /api/v1/wallet/transactions?page=0&size=10` (Historial general de billetera).
2. `GET /api/v1/wallet/transactions/{type}?page=0&size=10` (Historial filtrado por tipo: `TOPUP`, `CHARGE`, `REFUND`).

* **Controles Intuitivos:** Botones Anterior, Siguiente y navegación directa por números de página.
* **Información Visual:** Indicador *"Mostrando X-Y de Z resultados"*.
* **Selector de Tamaño de Página:** Opciones de visualización de **10, 25, 50 y 100 elementos por página**, cumpliendo de forma exacta con la especificación de la rúbrica.
* **Persistencia en URL:** Los parámetros `page`, `size` y `type` se conservan en la URL para permitir compartir o guardar enlaces directos.

---

## 🛠️ Instalación y Uso Local

```bash
# 1. Clonar repositorio
git clone https://github.com/Steven-Norena/cocheraya-frontend.git
cd cocheraya-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Compilar para producción
npm run build
```
La aplicación web estará disponible en `http://localhost:5173`.
