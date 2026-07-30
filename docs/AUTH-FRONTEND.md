# Frontend de login y registro

## Estado

- Estado: implementado.
- Fecha de actualización: 22 de julio de 2026.
- Rutas: `/login` y `/registro`.
- Alcance: presentación e interacción de los formularios de autenticación.

## Objetivo del cambio

El login y el registro se rediseñaron como una experiencia visual unificada y orientada al dominio fitness. Ambas vistas usan una composición oscura, una fotografía de equipamiento como fondo y la identidad morada existente de Fit.

La lógica de autenticación, Supabase y las Server Actions no fueron reemplazadas. Los formularios siguen enviando sus datos a las acciones `login` y `registro` de `app/actions/auth.ts` mediante `useActionState`.

## Sistema visual

Las vistas utilizan las variables globales definidas en `app/globals.css`:

| Uso | Variable | Color |
| --- | --- | --- |
| Fondo principal | `--background` | `#0A0A0A` |
| Superficie de campos | `--surface` | `#111113` |
| Superficie interactiva | `--surface-2` | `#1A1A1D` |
| Bordes | `--border` | `#262629` |
| Texto principal | `--foreground` | `#F2F2F3` |
| Texto secundario | `--muted` | `#8A8A90` |
| Acción principal | `--accent` | `#6C5CE7` |
| Texto sobre acento | `--accent-foreground` | `#FFFFFF` |
| Errores | `--danger` | `#EF4444` |

La composición compartida contiene:

- Fondo fotográfico a pantalla completa con una capa oscura para garantizar contraste.
- Contenedor central con ancho máximo de `28rem` (`max-w-md`).
- Logo cuadrado de `80px`, recortado al centro mediante `next/image`.
- Nombre `Fit` y lema `Entrena. Registra. Progresa.`.
- Campos oscuros de `48px` de alto, iconografía y foco morado.
- Botón primario morado con indicador de carga.
- Espaciado compatible con las áreas seguras de una PWA móvil.

## Recursos visuales

| Recurso | Ubicación | Uso |
| --- | --- | --- |
| Fondo de autenticación | `public/images/login-gym.jpg` | Fondo de login y registro |
| Logo de autenticación | `public/images/login-logo.png` | Encabezado de login y registro |

Los recursos se importan de forma estática y se renderizan con `next/image`. El fondo usa `fill`, `object-cover` y una posición responsive para cubrir el viewport sin alterar la proporción de la imagen.

## Login

Archivo principal: `app/(auth)/login/page.tsx`.

### Contenido

- Título `Inicia sesión`.
- Mensaje `Continúa con tus rutinas y registros.`.
- Campo de correo electrónico.
- Campo de contraseña con control para mostrar u ocultar el valor.
- Botón `Ingresar`.
- Enlace hacia `/registro`.

### Integración

El formulario conserva los nombres `email` y `password` esperados por la Server Action `login`. Durante el envío, el botón queda deshabilitado y muestra un icono de carga. Los errores devueltos por la acción se presentan con `role="alert"`.

## Registro

Archivo principal: `app/(auth)/registro/page.tsx`.

### Contenido

- Título `Crea tu cuenta`.
- Mensaje `Empieza a registrar tus entrenamientos.`.
- Campos de nombre y apellido en una fila de dos columnas.
- Campo de nombre de usuario.
- Campo de correo electrónico.
- Campo de contraseña con mínimo de seis caracteres y control de visibilidad.
- Botón `Crear cuenta`.
- Enlace hacia `/login`.

### Integración

El formulario conserva los nombres `nombre`, `apellido`, `username`, `email` y `password` esperados por la Server Action `registro`. Los metadatos de perfil siguen enviándose a Supabase durante `signUp`.

Los errores se presentan con `role="alert"`. Cuando Supabase exige confirmación por correo, el mensaje informativo se presenta con `role="status"`. Durante el envío, el botón queda deshabilitado y muestra el estado `Creando cuenta`.

## Responsive y PWA

- Se usa `100dvh` para responder a los cambios de altura del navegador móvil.
- El contenido respeta `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.
- El login permanece centrado verticalmente.
- El registro permite desplazamiento vertical cuando la altura disponible no contiene todos los campos.
- Nombre y apellido permanecen en dos columnas con anchos estables y campos que pueden reducirse sin desbordar.
- El fondo usa un recorte específico en móvil y se centra desde el breakpoint `sm`.

## Accesibilidad

- Todos los campos tienen etiquetas visibles.
- Los controles decorativos se excluyen del árbol accesible.
- Los botones de visibilidad comunican su estado con `aria-label` y `aria-pressed`.
- Se definieron valores `autocomplete` apropiados para inicio de sesión y registro.
- Los enlaces y controles incluyen estilos de foco visibles.
- El texto mantiene contraste sobre una capa oscura independiente de la fotografía.

## Archivos afectados

| Archivo | Responsabilidad |
| --- | --- |
| `app/(auth)/layout.tsx` | Contenedor raíz neutro para las vistas de autenticación |
| `app/(auth)/login/page.tsx` | Interfaz y estados del login |
| `app/(auth)/registro/layout.tsx` | Contenedor neutro específico de registro |
| `app/(auth)/registro/page.tsx` | Interfaz y estados del registro |
| `public/images/login-gym.jpg` | Fondo compartido |
| `public/images/login-logo.png` | Logo compartido |

## Validación realizada

- `npm run typecheck`: aprobado.
- `npm run build`: aprobado con Next.js 16.2.10.
- `npm run lint`: sin errores; permanecen tres advertencias preexistentes fuera de autenticación.
- Verificación visual con Playwright en `390x844`, `375x667` y `1440x900`.
