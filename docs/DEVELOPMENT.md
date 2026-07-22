# Desarrollo y operaciones

## Requisitos

- Node.js compatible con Next.js 16.
- npm y el `package-lock.json` del repositorio.
- Un proyecto Supabase con Auth, PostgreSQL y Storage.
- Variables de entorno publicas de Supabase.

## Configuracion local

```bash
npm install
npm run dev
```

La aplicacion queda disponible normalmente en `http://localhost:3000`.

Variables requeridas en `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

No se deben documentar ni versionar valores reales. `.gitignore` excluye `.env*`, excepto `.env.local.example`; ese archivo figura eliminado en el arbol de trabajo actual y no fue restaurado durante este levantamiento.

## Provisionamiento de Supabase

1. Crear o seleccionar un proyecto Supabase.
2. Ejecutar `supabase/schema.sql` en una base compatible.
3. Verificar que se crearon tablas, indices, politicas RLS, funciones y triggers.
4. Verificar el bucket publico `avatars` y sus politicas.
5. Configurar URL y anon key en `.env.local`.
6. Configurar en Supabase Auth las URLs de sitio y redireccion del entorno.

El repositorio incluye `.mcp.json` con un servidor MCP de Supabase asociado al proyecto de desarrollo. Es una herramienta de administracion para agentes; la aplicacion en ejecucion no depende de MCP.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Build de produccion y validacion TypeScript |
| `npm run start` | Servir el build de produccion |
| `npm run lint` | Ejecutar ESLint |

No hay scripts de test, migracion, seed, format, typecheck independiente ni generacion de tipos Supabase.

## Estado de verificacion

Comprobado el 22 de julio de 2026:

- `npm run build`: correcto con Next.js `16.2.10` y Turbopack.
- TypeScript durante el build: correcto.
- `npm run lint`: sin errores y con tres warnings.

Warnings actuales:

| Archivo | Motivo |
| --- | --- |
| `components/RutinaEditor.tsx` | Dos expresiones ternarias usadas solo por sus efectos |
| `public/sw.js` | Parametro `event` no utilizado en el handler `install` |

No existen pruebas automatizadas unitarias, de integracion ni end-to-end. El build demuestra compilacion, pero no valida flujos reales contra Supabase.

## Validacion manual recomendada

1. Registrar un usuario con y sin confirmacion de correo habilitada.
2. Confirmar los redirects de login, onboarding y home.
3. Editar perfil y subir fotos validas, demasiado grandes y de tipo rechazado.
4. Crear una rutina, asignar dias y agregar ejercicios predefinidos/custom.
5. Registrar varias series el mismo dia y revisar lista y grafico.
6. Eliminar y volver a agregar un ejercicio para comprobar que conserva historial.
7. Crear dos usuarios y un grupo; unirse por codigo y por enlace.
8. Verificar visibilidad compartida y aislamiento entre usuarios sin grupo comun.
9. Salir del grupo y confirmar que se pierde acceso a datos compartidos.
10. Instalar la PWA, navegar online y comprobar el fallback offline.

## Despliegue

La salida usa funcionalidades de servidor de Next.js: Server Components dinamicos, Server Actions, Proxy y cookies. Requiere un runtime que soporte `next start` o una plataforma compatible como Vercel; no es una exportacion estatica.

Antes de desplegar:

- Configurar las dos variables de entorno.
- Aplicar el esquema a la instancia Supabase objetivo.
- Ajustar las URLs permitidas en Supabase Auth.
- Ejecutar `npm run lint` y `npm run build`.
- Probar autenticacion y RLS con al menos dos cuentas.
- Revisar la politica de cache del service worker para datos autenticados.

## Convenciones de trabajo

- Leer `AGENTS.md` antes de cambios.
- Consultar la guia relevante en `node_modules/next/dist/docs/` antes de escribir codigo Next.js.
- Mantener lecturas en Server Components y mutaciones en Server Actions salvo una necesidad clara de Route Handler.
- Tratar cada Server Action como un endpoint publico: validar entrada, autenticar y autorizar.
- Conservar RLS al agregar tablas o consultas compartidas.
- Actualizar `supabase/schema.sql` y esta documentacion cuando cambie el modelo.
- Actualizar `data/exercises.json`, categorias, iconos y tipos en conjunto.

## Deuda tecnica y riesgos conocidos

| Area | Estado / riesgo |
| --- | --- |
| Pruebas | No hay cobertura automatizada |
| Migraciones | Solo existe un esquema acumulado; no hay historial ni rollback |
| Errores | Varias acciones silencian errores de Supabase |
| Validacion | Es manual y parcial; no hay esquema compartido como Zod |
| Tipos DB | Consultas Supabase sin tipos generados |
| Observabilidad | No hay logs estructurados, tracking de errores, metricas ni analitica |
| PWA | Cachea todos los GET, incluidos contenidos autenticados, y no limpia cache al cerrar sesion |
| Zona horaria | La rutina de hoy usa la hora del servidor |
| Datos | Sin paginacion general; el panel de grupo limita progreso a 300 registros |
| UX de errores | No hay boundaries de error propios y varias mutaciones no muestran fallo |
| Accesibilidad | No consta auditoria automatizada o manual |

## Archivos que normalmente cambian juntos

| Cambio | Archivos relacionados |
| --- | --- |
| Nueva ruta protegida | `app/`, `proxy.ts`, navegacion y loading/error states |
| Nueva mutacion | `app/actions/`, componente consumidor, RLS y revalidacion |
| Nueva entidad | `supabase/schema.sql`, tipos locales, consultas y documentacion |
| Nueva categoria | `lib/categorias.ts`, `data/exercises.json`, `CategoriaGrid` e icono PNG |
| Cambio de perfil | SQL, trigger de alta, formulario, accion y vistas de grupo |
| Cambio PWA | `public/manifest.json`, `public/sw.js`, iconos y `app/sw-register.tsx` |
