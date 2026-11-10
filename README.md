# 💻 CocheraYa — Frontend Web (React + TypeScript + Vite)
---

# 👤 Integrantes:
- Steven Daniel Noreña Paredes (202510642)

...
  
## 📑 Portada
* **Proyecto:** CocheraYa — Cliente Web
* **Curso:** CS 2031 Desarrollo Basado en Plataforma
* **Institución:** Universidad de Ingeniería y Tecnología (UTEC) — Lima, Perú
* **Despliegue en Producción:** [Enlace de Producción (Netlify)](https://parkshare-utec.netlify.app)

---

## 🚀 Tecnologías Principales

- **React 18 & TypeScript:** Desarrollo de componentes reactivos con tipado estático y robusto.
- **Vite:** Herramienta de compilación rápida para desarrollo moderno en frontend.
- **React Router DOM v6/v7:** Gestión avanzada de enrutamiento dinámico, rutas protegidas y lazy loading.
- **Axios:** Cliente HTTP para la comunicación con la API REST del backend.
- **Leaflet & React Leaflet:** Biblioteca interactiva de mapas para geolocalización y búsqueda visual.
- **Context API:** Gestión de estado global (autenticación, sesión y datos compartidos del usuario).
- **CSS Vanilla (Custom Design System):** Estilizado responsivo personalizado, priorizando la velocidad de carga y fluidez de transacciones.

---

## 🧱 Arquitectura del Proyecto y Componentes

El frontend sigue una arquitectura modular y limpia estructurada de la siguiente manera:

```text
src/
├── assets/         # Recursos estáticos (imágenes, logotipos, iconos)
├── components/     # Componentes UI reutilizables (presentacionales)
│   ├── Button/     # Botones genéricos con estados de carga e interactividad
│   ├── Input/      # Inputs de formularios con validación integrada
│   ├── Sidebar/    # Barra de navegación lateral persistente
│   ├── Modal/      # Modales de confirmación o visualización de QR
│   ├── Spinner/    # Indicadores visuales de estados de carga
│   └── ErrorBoundary/ # Componente de captura de errores de renderizado
├── context/        # Estado global (AuthContext para persistencia de sesión JWT)
├── hooks/          # Lógica de negocio encapsulada y reutilizable (custom hooks)
├── services/       # Capa de comunicación con el backend (Axios centralizado)
└── views/          # Páginas principales (contenedores que controlan la lógica por rol)
    ├── admin/      # Vistas de administración
    ├── auth/       # Formulario de inicio de sesión y registro
    ├── driver/     # Búsqueda de cocheras en el mapa, reservas y billetera
    └── host/       # Panel de control del propietario, creación de cocheras y cobros
```

### 👥 Roles de Usuario y Características Clave

La plataforma restringe el acceso a las vistas mediante **rutas protegidas** según el rol del usuario:

#### 🚗 Conductor (DRIVER)
- **Mapa Interactivo con Leaflet (`MapSearch`):** Geolocalización y visualización de cocheras disponibles en tiempo real.
- **Mis Reservas (`Reservations`):** Gestión de flujos de check-in y check-out a través de simulación de códigos QR.
- **Billetera (`Wallet`):** Carga y visualización de saldo, junto con auditoría de transacciones.
- **Favoritos (`Favorites`):** Panel para guardar espacios frecuentes.

#### 🏠 Propietario (HOST)
- **Dashboard del Host:** Estadísticas de ingresos acumulados, cantidad de reservas activas y valoraciones.
- **Mis Cocheras (`ManageSpaces`):** Formularios detallados para registrar cocheras (con carga de imágenes mediante Cloudinary) y modificar sus estados.
- **Billetera de Ganancias:** Monitoreo y retiro de saldo acumulado.

#### 🛡️ Administrador (ADMIN)
- **Gestión de Usuarios (`UserManagement`):** Panel para visualizar usuarios y habilitar/deshabilitar sus accesos al sistema ante incidentes.

---

## 🔌 Integración con la API y Axios Centralizado

La comunicación con el backend está encapsulada en un cliente centralizado de **Axios** que implementa las directrices de la rúbrica:

* **Configuración Centralizada:** Ubicada en [api.ts](file:///c:/DBP/proyecto-1-parkshare/frontend-parkshare/src/services/api.ts) con una constante `API_BASE_URL` configurable.
* **Interceptor de Petición (Request Interceptor):** Captura automáticamente el token JWT de `localStorage` y lo añade a la cabecera `Authorization: Bearer <token>` de forma transparente para todas las solicitudes.
* **Interceptor de Respuesta (Response Interceptor):** Maneja errores globales. Si el servidor responde con un código `401 Unauthorized`, intercepta el error, realiza una petición asíncrona a `/auth/refresh-token` enviando el `refreshToken`, actualiza el token en local y reintenta la solicitud fallida originalmente. Si falla la renovación, limpia el almacenamiento local y fuerza la redirección al login.
* **Prevención de fugas de memoria (Request Cancellation):** Se utiliza `AbortController` en peticiones asíncronas de búsquedas y consultas que cambian dinámicamente con la navegación del usuario.

---

## 🚦 Routing, Navegación y Carga Asíncrona (Rubric 3.3)

* **React Router v6/v7:** El sistema utiliza rutas dinámicas que capturan parámetros e identificadores únicos (ej: `/reservations/:id` o `/spaces/edit/:id`).
* **Protección de Rutas:** El componente wrapper `<PrivateRoute>` evalúa el rol del usuario autenticado contra los permisos requeridos para renderizar la vista o redirigir al login.
* **Carga Perezosa (Lazy Loading):** Los componentes de vistas pesadas (como el Dashboard, el Mapa de Leaflet y los historiales transaccionales) se cargan utilizando `React.lazy` y se envuelven en un `<Suspense>` que muestra un esqueleto o spinner visual mientras se descarga el chunk correspondiente, optimizando el rendimiento de carga inicial de la aplicación.
* **Control de Rutas 404:** Manejo amigable de rutas no registradas para impedir errores y brindar una navegación fluida al usuario final.

---

## ⚠️ Manejo de Errores, Estados de Carga y Validaciones (Rubric 3.4)

* **Manejo de Errores por Pantalla:** Bloques `try-catch` estructurados en todas las llamadas de servicios que muestran mensajes amigables y específicos en el idioma del usuario, en lugar de excepciones crudas del sistema.
* **Error Boundaries:** Envoltura en componentes reactivos de React para evitar que un fallo inesperado de renderizado (por ejemplo, en el mapa de Leaflet) rompa toda la aplicación, mostrando un banner estilizado de contingencia.
* **Prevención de Doble-Submit:** Todos los botones de confirmación de formularios de pago y reservas se deshabilitan instantáneamente (`disabled={loading}`) al hacer clic, mostrando un spinner integrado para evitar peticiones duplicadas accidentales.
* **Validaciones Client-Side:** Validación de campos obligatorios, correos, contraseñas seguras y precios en tiempo real antes de enviar las solicitudes HTTP a la API.

---

## 📄 Paginación (Rubric 4.4)

La aplicación web integra paginación física del lado del servidor en las vistas de **Historial de Transacciones de Billetera** e **Historial de Reservas**:
* **Uso de Query Params:** El número de página y cantidad de elementos por página se controlan dinámicamente en los parámetros URL (ej: `?page=0&size=10`), permitiendo guardar o compartir el estado de la vista.
* **Control del Límite de Resultados:** La interfaz muestra información clara como *"Mostrando 1-10 de 50 resultados"* y proporciona selectores interactivos para cambiar el tamaño de página (`10, 25, 50, 100`).
* **Control de Navegación:** Botones habilitados/deshabilitados de "Anterior" y "Siguiente" según los metadatos `last` y `first` devueltos en el JSON paginado del backend.

---

## 🛠️ Instalación y Uso Local

Sigue estos pasos para configurar y ejecutar la aplicación de forma local:

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno:**
   Crea un archivo `.env` en la raíz de este directorio con la URL del backend:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   ```

3. **Iniciar Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. **Compilar para Producción:**
   ```bash
   npm run build
   ```

---

## 🗺️ Guía Técnica de Pruebas (Flujo Completo)

Para evaluar y comprobar la robustez y consistencia transaccional del frontend en conjunto con el backend, realice el siguiente recorrido de prueba:

1. **Flujo de Registro y Carga de Saldo (DRIVER):**
   * Regístrese como conductor (`DRIVER`).
   * Acceda al módulo de "Billetera", valide que el saldo inicial es `$0.00`. Realice una recarga de saldo virtual de `$100.00`. Verifique que se genera un registro en el historial de transacciones.
2. **Registro de Espacio (HOST):**
   * Inicie sesión como anfitrión (`HOST`).
   * Diríjase a "Registrar Cochera", ingrese datos reales (título, precio por hora, dirección, ubicación física aproximada) y suba una foto. La aplicación la enviará a Cloudinary.
3. **Reserva y Simulación QR (DRIVER y HOST en tiempo real):**
   * Como `DRIVER`, navegue en la pestaña de búsqueda. Localice el espacio recién creado del `HOST` en el mapa interactivo.
   * Seleccione la cochera y confirme la reserva. El espacio cambiará su estado a `RESERVED`.
   * En "Reservas", visualice el UUID generado y presione "Simular Check-in".
   * **Actualización en Tiempo Real:** Mientras el conductor realiza el ingreso físico simulado, compruebe que en el panel del `HOST` (abierto en otro navegador) el espacio cambia instantáneamente a estado `OCCUPIED` (Ocupado).
   * Tras unos minutos, realice el "Simular Check-out". La aplicación web calculará automáticamente el cobro proporcional, lo descontará de la billetera del `DRIVER`, lo sumará a la cuenta del `HOST`, y liberará la cochera a estado `AVAILABLE`.
4. **Auditoría y Cierre:**
   * Valide en el panel de ganancias del `HOST` el desglose financiero: fecha, hora de entrada, hora de salida, la duración exacta en minutos del estacionamiento y el ID de reserva asociado para auditoría completa.
