# Sistema de mascotas

El sistema usa un catálogo en Supabase y un único componente de interfaz. No existen
componentes ni condiciones especiales por especie: el nombre, la descripción, las fases
y las imágenes provienen de la base de datos.

## Mascotas iniciales

| Clave | Nombre | Recurso inicial |
| --- | --- | --- |
| `ovejita` | Ovejita | PNG público de Supabase Storage |
| `zorrito` | Zorrito | SVG local |
| `axolito` | Axolito | SVG local |
| `drakito` | Drakito | SVG local |

Las diferencias son visuales. Todas usan las mismas reglas de progreso para que ninguna
elección entregue una ventaja.

## Ocho fases

`plantilla_fases_mascota()` es la única fuente de los umbrales. El trigger
`crear_fases_mascota()` crea automáticamente estas ocho filas al insertar una mascota:

| Fase | XP requerido | Mínimo por estadística |
| ---: | ---: | ---: |
| 1 | 0 | 0 |
| 2 | 70 | 6 |
| 3 | 220 | 20 |
| 4 | 500 | 45 |
| 5 | 900 | 75 |
| 6 | 1400 | 110 |
| 7 | 2000 | 150 |
| 8 | 2700 | 200 |

La fase actual exige simultáneamente el XP y el mínimo de piernas, brazos, pecho,
abdomen y espalda. La barra hacia la siguiente fase muestra el menor porcentaje entre:

- el progreso de XP;
- el progreso de la estadística más atrasada.

Así, una estadística alta no compensa las demás.

## Imágenes y fallback

Cada fila de `mascota_fases` admite una `imagen_url`. Si una fase todavía no tiene
imagen, la aplicación usa la imagen más reciente disponible de una fase anterior. La
evolución continúa funcionando y el recurso puede agregarse después.

Al cambiar `imagen_url`, un trigger actualiza `updated_at`. Las URL remotas reciben esa
fecha como versión de caché; las rutas locales se conservan intactas. El service worker
usa estrategia de red primero para imágenes.

Si se sobrescribe un objeto de Storage conservando exactamente la misma URL, hay que
renovar su versión después de subirlo:

```sql
update public.mascota_fases as fase
set updated_at = now()
from public.mascotas as mascota
where fase.mascota_id = mascota.id
  and mascota.clave = 'ovejita'
  and fase.numero = 1;
```

Convención recomendada para recursos vectoriales locales:

```text
public/images/mascotas/{clave}/fase-{1..8}.svg
```

Los PNG o WebP pueden alojarse en Supabase Storage y guardarse como URL pública.

## Agregar una mascota

No se modifica Home, onboarding ni `Mascota.tsx`. Se inserta el catálogo:

```sql
insert into public.mascotas (clave, nombre, descripcion, orden, disponible)
values (
  'nueva_clave',
  'Nombre visible',
  'Descripción breve.',
  5,
  true
);
```

El trigger crea las ocho fases. Después sólo se asignan los recursos:

```sql
update public.mascota_fases as fase
set imagen_url = recursos.url
from (
  values
    (1, '/images/mascotas/nueva_clave/fase-1.svg'),
    (2, '/images/mascotas/nueva_clave/fase-2.svg'),
    (3, '/images/mascotas/nueva_clave/fase-3.svg'),
    (4, '/images/mascotas/nueva_clave/fase-4.svg'),
    (5, '/images/mascotas/nueva_clave/fase-5.svg'),
    (6, '/images/mascotas/nueva_clave/fase-6.svg'),
    (7, '/images/mascotas/nueva_clave/fase-7.svg'),
    (8, '/images/mascotas/nueva_clave/fase-8.svg')
) as recursos(numero, url)
where fase.mascota_id = (
  select id from public.mascotas where clave = 'nueva_clave'
)
and fase.numero = recursos.numero;
```

Una mascota puede prepararse con `disponible = false` y publicarse cuando sus recursos
estén listos.

## Selección y seguridad

- El onboarding guarda datos físicos y mascota en una única RPC transaccional.
- `seleccionar_mascota()` permite cambiarla después sin perder el progreso individual.
- El índice parcial garantiza como máximo una mascota seleccionada por usuario.
- Las recompensas se rechazan si no existe una mascota seleccionada.
- RLS permite leer el catálogo y limita el progreso al propietario.

## Aplicación sobre una base existente

Antes de migrar, esta consulta debe devolver cero filas:

```sql
select mascota_id, numero
from public.mascota_fases
where numero not between 1 and 8;
```

Ejecutar una sola vez:

```text
supabase/migrations/202607290001_mascotas_8_fases.sql
```

Conviene hacerlo sin registros de series ni altas de usuarios simultáneas, porque los
cambios de tablas y triggers toman bloqueos hasta finalizar la transacción.

No se debe volver a ejecutar `supabase/schema.sql` completo en una base existente; ese
archivo es el bootstrap canónico y contiene políticas históricas que no son todas
recreables de forma idempotente.
