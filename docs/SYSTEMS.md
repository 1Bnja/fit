# Sistemas funcionales

## Autenticacion y sesion

**Herramientas:** Supabase Auth, `@supabase/ssr`, Next.js Proxy, Server Actions y cookies HTTP.

**Funcionalidades:**

- Registro con nombre, apellido, nombre de usuario, correo y contraseña.
- Inicio de sesion por correo y contraseña.
- Mensaje especifico cuando Supabase limita el envio de correos de registro.
- Soporte para proyectos que exigen confirmacion de correo: si no hay sesion, se informa al usuario.
- Cierre de sesion desde el encabezado.
- Renovacion de cookies de sesion desde `proxy.ts`.
- Redireccion automatica segun sesion y onboarding.

Al crear un usuario, los metadatos de registro alimentan `profiles` mediante el trigger SQL `on_auth_user_created`.

## Onboarding

**Herramientas:** React `useActionState`, Server Action y Supabase Auth metadata.

**Funcionalidades:**

- Solicita peso en kg y estatura en cm.
- Actualiza `profiles.onboarding_completo`.
- Duplica el indicador en `user_metadata.onboarding_completo` para evitar una consulta SQL en cada paso por Proxy.
- Impide entrar a la aplicacion hasta completar el formulario.

La metadata del JWT y la columna de perfil deben mantenerse sincronizadas. Actualmente la accion escribe ambas de forma secuencial.

## Perfil y avatares

**Herramientas:** Server Components, Server Actions, Supabase Storage y URL publica de objetos.

**Funcionalidades:**

- Visualiza correo, nombre, apellido, username, peso y estatura.
- Edita datos personales; `username` es unico en base de datos.
- Acepta PNG, JPEG y WebP de hasta 10 MB.
- Muestra una previsualizacion local antes de subir.
- Guarda un unico objeto en `avatars/{user_id}/avatar` mediante `upsert`.
- Agrega una marca de version a la URL publica para invalidar cache.
- Usa iniciales y un color determinista cuando no hay foto.

La validacion de tamaño se hace en cliente y el bucket tambien impone 10 MB y tipos MIME permitidos.

## Inicio y agenda semanal

**Herramientas:** Server Component, fecha local del servidor y consultas relacionales Supabase.

**Funcionalidades:**

- Saludo con el nombre del usuario.
- Resumen de peso y estatura actuales.
- Lista de rutinas asignadas al dia de la semana actual.
- Acceso directo al editor de cada rutina del dia.

El dia se calcula con `new Date().getDay()` durante el render del servidor. Por ello depende de la zona horaria del entorno de despliegue, no necesariamente de la del usuario.

## Rutinas

**Herramientas:** Server Components, Server Actions, `useTransition`, RLS y relaciones PostgreSQL.

**Funcionalidades:**

- Listar rutinas propias por fecha de creacion descendente.
- Crear una rutina con nombre y abrir inmediatamente su editor.
- Eliminar una rutina con confirmacion; los hijos se eliminan por cascada.
- Asignar cualquier combinacion de domingo a sabado.
- Agregar uno o varios ejercicios del catalogo.
- Crear un ejercicio personalizado dentro de una categoria.
- Quitar ejercicios de una rutina sin borrar su historial de cargas.
- Mantener el orden de insercion mediante `rutina_ejercicios.orden`.

**No implementado actualmente:** renombrar, duplicar o reordenar rutinas/ejercicios; plantillas; objetivos de series/repeticiones; temporizador; notas; estado de rutina completada.

## Catalogo de ejercicios

**Herramientas:** `data/exercises.json`, TypeScript y recursos PNG.

**Funcionalidades:**

- 19 ejercicios predefinidos: pecho (3), espalda (4), brazos (8) y piernas (4).
- Cuatro categorias tipadas en `lib/categorias.ts`.
- Iconos musculares en `public/icons/categorias/` con fallback a Reicon.
- Ejercicios personalizados persistidos por usuario.

Los ejercicios predefinidos no son filas de base de datos. Se guardan en cada rutina como identificador y nombre desnormalizados; esto conserva el texto historico aunque cambie el JSON.

## Registro de entrenamiento

**Herramientas:** Server Actions, PostgreSQL, `useTransition` y React local state.

**Funcionalidades:**

- Registrar peso positivo y repeticiones opcionales por ejercicio.
- Permitir multiples registros/series en un mismo dia.
- Mostrar el ultimo registro en la fila del ejercicio.
- Agrupar el historial visible por fecha y mostrar hasta cinco dias.
- Conservar el historial aunque el ejercicio salga de la rutina.

El historial se asocia a `user_id + ejercicio_id`, no al identificador de `rutina_ejercicios`. Un ejercicio con el mismo ID reutilizado en varias rutinas comparte progreso.

**No implementado actualmente:** editar o borrar registros, registrar RIR/RPE, duracion o descanso, y paginar el historial completo.

## Visualizacion de progreso

**Herramientas:** Recharts `LineChart`, `ResponsiveContainer` y formato `es-CL`.

**Funcionalidades:**

- Grafico desde dos registros disponibles.
- Maximo de 20 puntos recientes, presentados en orden cronologico.
- Eje de fecha dia/mes, eje de peso y tooltip con fecha, kg y repeticiones.
- Dominio vertical ajustado dos kg por debajo y por encima del rango observado.

El grafico representa cada registro individual; no agrega maximos, volumen ni promedios por sesion.

## Grupos de entrenamiento

**Herramientas:** Server Actions, RPC PostgreSQL `security definer`, RLS y Clipboard API.

**Funcionalidades:**

- Crear un grupo con codigo aleatorio de seis caracteres legibles.
- Incorporar automaticamente al creador mediante trigger.
- Unirse por codigo o enlace prellenado.
- Copiar una URL de invitacion al portapapeles.
- Listar los grupos en los que participa el usuario.
- Salir de un grupo.
- Mostrar miembros mediante avatares.
- Mostrar los 20 registros de actividad mas recientes.
- Comparar el ultimo peso por miembro para cada nombre de ejercicio.
- Mostrar rutinas y dias de todos los miembros.

La union no permite insertar directamente en `grupo_miembros`; debe pasar por `unirse_a_grupo(p_codigo)`. Las politicas de lectura solo permiten datos propios o de usuarios que compartan al menos un grupo.

La comparacion agrupa por `ejercicio_nombre`, no por ID. Dos ejercicios distintos con el mismo nombre se combinan, mientras variantes ortograficas quedan separadas.

**No implementado actualmente:** roles, administracion de miembros, eliminar/renombrar grupo, rotar codigo, propiedad transferible, comentarios, notificaciones y enlaces a rutinas ajenas.

## PWA y operacion offline

**Herramientas:** Web App Manifest, Service Worker y Cache API.

**Funcionalidades:**

- Manifest con nombre, icono SVG, modo `standalone` y entrada `/home`.
- Registro del service worker al montar la aplicacion.
- Estrategia network-first para todas las solicitudes `GET`.
- Fallback a una respuesta previamente cacheada cuando falla la red.
- Limpieza de caches anteriores al activar `fit-v1`.

La PWA no implementa cola offline de mutaciones, pagina offline dedicada, Background Sync ni prompts de instalacion. El cache puede contener respuestas autenticadas en el dispositivo; cerrar sesion en servidor no elimina explicitamente ese cache.

## Navegacion y experiencia visual

**Herramientas:** Tailwind CSS 4, Geist, Reicon y route groups.

**Funcionalidades:**

- Tema oscuro unico con tokens CSS para fondo, superficies, borde, texto, acento y peligro.
- Layout centrado y optimizado para movil.
- Barra inferior persistente: Home, Rutinas y Grupos.
- Acceso a perfil y logout desde el encabezado.
- Skeletons de carga en las rutas de datos principales.
- Controles accesibles con labels y `aria-label` en acciones iconograficas relevantes.

No se incluyen internacionalizacion, modo claro, preferencias de accesibilidad, telemetria ni analitica.
