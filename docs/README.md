# Documentacion del proyecto Fit

Esta carpeta describe el estado implementado del repositorio. La documentacion se obtuvo del codigo, el esquema SQL y la configuracion presentes en la rama `feat/Cambios-de-peso` el 22 de julio de 2026.

## Resumen

Fit es una PWA movil para organizar rutinas de gimnasio, registrar peso y repeticiones por ejercicio, visualizar el progreso y compartir actividad con grupos privados. La aplicacion usa Next.js App Router como frontend y capa de servidor, y Supabase para autenticacion, PostgreSQL, Row Level Security (RLS) y almacenamiento de avatares.

No existe un backend HTTP separado: las paginas leen Supabase desde Server Components y las mutaciones se ejecutan mediante Server Actions. La autorizacion final de los datos reside principalmente en las politicas RLS de PostgreSQL.

## Mapa de documentacion

| Documento | Contenido |
| --- | --- |
| [Arquitectura](./ARCHITECTURE.md) | Capas, flujos, rutas, componentes y decisiones de Next.js 16 |
| [Sistemas funcionales](./SYSTEMS.md) | Funcionalidades de autenticacion, perfil, rutinas, progreso, grupos y PWA |
| [Datos y seguridad](./DATA-AND-SECURITY.md) | Modelo relacional, RLS, funciones SQL, triggers y Storage |
| [Desarrollo y operaciones](./DEVELOPMENT.md) | Herramientas, configuracion local, scripts, despliegue y estado de calidad |

## Capacidades actuales

- Registro, inicio y cierre de sesion con Supabase Auth.
- Onboarding obligatorio con peso y estatura.
- Perfil editable con nombre de usuario unico y avatar.
- Creacion y eliminacion de rutinas; asignacion semanal de dias.
- Catalogo de 19 ejercicios en cuatro categorias y ejercicios personalizados.
- Registro de multiples series con peso y repeticiones.
- Historial diario y grafico de progreso por ejercicio.
- Grupos privados con codigo de invitacion, actividad, comparacion y rutinas compartidas.
- Instalacion como PWA y cache de solicitudes `GET` mediante service worker.

## Estructura principal

```text
app/                  Rutas, layouts, loading states y Server Actions
components/           Componentes de interfaz y flujos interactivos
data/                  Catalogo estatico de ejercicios
lib/                   Clientes Supabase y utilidades de dominio
public/                Manifest, service worker, iconos y recursos PWA
supabase/schema.sql    Esquema completo, RLS, funciones y triggers
proxy.ts               Sesion, proteccion de rutas y gate de onboarding
```

## Fuente de verdad

- Comportamiento de aplicacion: `app/`, `components/` y `lib/`.
- Persistencia y autorizacion: `supabase/schema.sql`.
- Dependencias y comandos: `package.json` y `package-lock.json`.
- Convenciones del framework: `node_modules/next/dist/docs/`, obligatorio antes de cambiar codigo Next.js en este repositorio.

Cuando la documentacion y el codigo difieran, el codigo y el esquema desplegado son la fuente de verdad. El archivo SQL representa el esquema esperado, pero el repositorio no contiene un historial de migraciones que pruebe el estado exacto de una instancia remota.
# Documentación del proyecto

Este directorio centraliza la documentación técnica y de producto de Fit.

## Interfaz

- [Login y registro](./AUTH-FRONTEND.md): rediseño visual, comportamiento responsive, estados e integración con autenticación.
