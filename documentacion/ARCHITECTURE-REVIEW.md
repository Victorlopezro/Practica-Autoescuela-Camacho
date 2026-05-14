# Architecture Review — Frontend

**Proyecto:** Practica-Autoescuela-Camacho  
**Scope:** `/frontend/src/`  
**Fecha:** 2026-05-14  
**Revisor:** Architecture Guardian  

---

## Resumen Ejecutivo

La estructura base del frontend es solida y sigue buenas convenciones de Next.js App Router con separacion por roles. Sin embargo, hay **2 hallazgos BLOQUEANTES** que comprometen la arquitectura, **5 IMPORTANTES** que generaran deuda tecnica a corto plazo, y **4 SUGERENCIAS** de mejora.

---

## 1. Estructura de Carpetas

### 1.1 Organizacion General — SUGERENCIA

La estructura actual es:

```
src/
  app/           ← Paginas y layouts (Next.js App Router)
  components/
    layouts/     ← Navbar, MobileNav, Card
    ui/          ← Button
  hooks/         ← VACIO
  stores/        ← VACIO
  services/
    mocks/       ← Mock data + servicios simulados
  lib/
    constants/   ← Rutas, branding, enumeraciones
    utils.ts     ← cn() utility
  types/
    index.ts     ← Todos los tipos del dominio
  stories/       ← Storybook boilerplate
```

**Hallazgo:** `hooks/` y `stores/` existen pero estan vacios. No es un problema hoy, pero son **dead directories** que generan confusion.

**Recomendacion:** Eliminar `hooks/` y `stores/` hasta que se necesiten, o agregar un `.gitkeep` con un README breve explicando su proposito.

---

### 1.2 Ubicacion de `Card` — IMPORTANTE

`Card` y `CardHeader` viven en `components/layouts/` pero NO son componentes de layout. Son **componentes UI genericos** (contenedores reutilizables) y se usan en absolutamente TODAS las paginas.

**Evidencia:** Cada una de las 22 paginas importa `Card` o `CardHeader` desde `@/components/layouts/Card`.

**Problema:** Mezcla responsabilidades. La carpeta `layouts/` deberia contener solo componentes estructurales (Navbar, Sidebar, MobileNav). `Card` es un contenedor UI.

**Recomendacion:** Mover `Card.tsx` a `components/ui/`.

```diff
- import { Card } from '@/components/layouts/Card';
+ import { Card } from '@/components/ui/Card';
```

---

### 1.3 Ausencia de `components/features/` — SUGERENCIA

No existe `components/features/`. No es critico en este estado porque las paginas aun son pequenas y autocontenidas. Pero a medida que crezca la logica de negocio, va a hacer falta un lugar para componentes compuestos (ej: `BookingCard`, `StudentProgressBar`, `TeacherScheduleTable`).

**Recomendacion:** Crear `components/features/` cuando el primer componente compuesto se necesite. No antes.

---

## 2. Routing

### 2.1 Coherencia de Rutas — OK

Las rutas son perfectamente consistentes con lo especificado:

| Rol | Rutas implementadas |
|-----|---------------------|
| `/login` | Unica pagina publica |
| `/student/*` | dashboard, calendar, bookings, history, profile, payments, progress |
| `/teacher/*` | dashboard, calendar, schedule, students, incidents, profile |
| `/admin/*` | dashboard, students, teachers, vehicles, schedules, payments, analytics, settings |

**No hay discrepancias** entre el sistema de archivos y las rutas definidas en `ROUTES` para las rutas implementadas.

---

### 2.2 Rutas Muertas en `ROUTES` — SUGERENCIA

El objeto `ROUTES` en `lib/constants/index.ts` define rutas que NO tienen pagina implementada:

```typescript
auth: {
  register: '/register',          // ❌ No existe app/register/
  forgotPassword: '/forgot-password',  // ❌ No existe app/forgot-password/
}
```

**Recomendacion:** Eliminar las rutas no implementadas o crear las paginas correspondientes. Las rutas muertas son misleading para desarrolladores nuevos.

---

## 3. Layouts

### 3.1 Layout por Rol — OK

Cada rol tiene su propio `layout.tsx` dentro de su segmento de ruta:

- `student/layout.tsx`
- `teacher/layout.tsx`
- `admin/layout.tsx`

Esto es exactamente lo que Next.js App Router recomienda y permite extender cada rol con headers, sidebars, o navegacion especifica.

---

### 3.2 Layouts Practicamente Identicos — IMPORTANTE

Los 3 layouts (`student`, `teacher`, `admin`) son **copia exacta** con solo 2 valores diferentes:

| Archivo | `userName` | `userRole` |
|---------|-----------|------------|
| `student/layout.tsx` | `"Juan"` | `"student"` |
| `teacher/layout.tsx` | `"Carlos"` | `"teacher"` |
| `admin/layout.tsx` | `"Admin"` | `"admin"` |

```typescript
// student/layout.tsx
<Navbar userName="Juan" userRole="student" />
<MobileNav role="student" />

// teacher/layout.tsx
<Navbar userName="Carlos" userRole="teacher" />
<MobileNav role="teacher" />

// admin/layout.tsx
<Navbar userName="Admin" userRole="admin" />
<MobileNav role="admin" />
```

**Problema:** Violacion de DRY. Cualquier cambio en la estructura del layout (ej: agregar un sidebar) requiere modificar 3 archivos identicos.

**Ademas:** `userName` esta hardcodeado. Cuando se implemente autenticacion real, los 3 layouts van a tener que modificarse.

**Recomendacion:** Centralizar en un solo layout parametrizado. Usar un unico `dashboard-layout.tsx` en un grupo de rutas compartido.

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth(); // cuando exista
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Navbar userName={user?.name} userRole={user?.role} />
      <main className="pb-20">{children}</main>
      <MobileNav role={user?.role} />
    </div>
  );
}
```

Y reestructurar las rutas como:

```
app/
  (dashboard)/
    layout.tsx       ← layout unico
    student/...
    teacher/...
    admin/...
```

---

## 4. Analisis de Imports y Boundaries

### 4.1 Violaciones de Boundaries — NO HAY

Se revisaron TODOS los imports de TODOS los archivos en `app/`, `services/`, `components/`. **No existe ninguna violacion de boundaries.**

- Ninguna pagina de admin importa de `@/app/student/` o `@/app/teacher/`
- Ninguna pagina de teacher importa de `@/app/admin/` o `@/app/student/`
- Ninguna pagina de student importa de `@/app/teacher/` o `@/app/admin/`

Todas las paginas solo importan de:
- `@/components/layouts/` (componentes permitidos)
- `@/lib/constants/` (constantes permitidas)
- `@/lib/utils` (utilidades permitidas)

**Esto es correcto.** Las capas respetan sus limites.

---

### 4.2 La Capa de Servicios NO se Usa — BLOQUEANTE

Existe toda una infraestructura de servicios mock:

```
services/mocks/
  index.ts              ← mockStudents, mockTeachers, mockBookings...
  studentService.ts     ← getProfile, getBookings, getPayments, createBooking...
  teacherService.ts     ← getProfile, getDailySchedule, getStudents, createIncident...
```

Pero **NINGUNA pagina los importa**. El grep confirma cero imports desde `@/services/`.

Cada pagina define sus propios datos hardcodeados inline:

```typescript
// student/dashboard/page.tsx
const quickStats = [
  { label: 'Clases restantes', value: '15', color: '#00628c' },
  ...
];
const upcomingClasses = [
  { date: '15 may', time: '10:00', teacher: 'Carlos', status: 'Confirmada' },
  ...
];
```

**Impacto:** Si manana se conecta a una API real, HAY QUE REESCRIBIR CADA PAGINA. La capa de servicios esta completamente desacoplada de las paginas.

**Recomendacion:** Migrar todas las paginas a usar `studentService`, `teacherService` (y crear `adminService`). Incluso para mock data, usar el servicio. Asi cuando llegue la API real, solo cambia la implementacion del servicio, no las paginas.

```typescript
// Antes (hoy):
export default function StudentDashboard() {
  const upcomingClasses = [ ...hardcoded... ];
  return <div>...</div>;
}

// Despues (recomendado):
export default function StudentDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  useEffect(() => {
    studentService.getUpcomingBookings('student-1').then(setBookings);
  }, []);
  return <div>...</div>;
}
```

---

### 4.3 `@/components/ui/button` NO se Usa — BLOQUEANTE

Existe un componente `Button` completo en `components/ui/button.tsx` que usa `@base-ui/react/button` con variantes, tamanos, etc.

Sin embargo, **ninguna pagina lo importa**. Todas usan `<button>` nativo con clases inline:

```typescript
// En TODAS las paginas:
<button className="bg-[#00628c] text-white px-4 py-2 rounded-lg text-sm font-medium">
```

**Impacto:** El componente Button existe pero no se usa. Cualquier cambio de diseno (color primario, border-radius, hover states) requiere buscar y reemplazar en 22 paginas.

**Recomendacion:** Reemplazar TODOS los `<button>` nativos por `<Button>` de `@/components/ui/`. Esto centraliza el diseno y permite variantes consistentes.

---

## 5. Separacion de Capas

### 5.1 Tipos Bien Definidos — OK

`types/index.ts` tiene un modelo de datos solido:

- Discriminated unions (`Student extends User`, `Teacher extends User`)
- Tipos literales (`LicenseType`, `BookingStatus`, `VehicleType`)
- `AdminPermission` como union de strings

**Buenas practicas:** Tipos inmutables, sin `any`, todo correctamente tipado.

---

### 5.2 Ausencia de Servicio Admin — IMPORTANTE

Existe `studentService.ts` y `teacherService.ts`, pero **no existe `adminService.ts`**. Si se quiere mantener la simetria de la arquitectura, admin tambien deberia tener su propio servicio con metodos como:

```typescript
export const adminService = {
  getStudents: async (): Promise<Student[]> => { ... },
  getTeachers: async (): Promise<Teacher[]> => { ... },
  getVehicles: async (): Promise<Vehicle[]> => { ... },
  getPayments: async (): Promise<Payment[]> => { ... },
  getAnalytics: async (): Promise<...> => { ... },
};
```

**Recomendacion:** Crear `services/mocks/adminService.ts` siguiendo el mismo patron que `studentService.ts` y `teacherService.ts`.

---

### 5.3 Todos los Componentes son 'use client' — IMPORTANTE

**TODAS** las 22 paginas tienen `'use client'` al inicio. Esto significa que **ningun componente puede ser un Server Component de React**, perdiendo:

- Renderizado en servidor (SEO, primera pintura mas rapida)
- Reduccion de JavaScript enviado al cliente
- Acceso directo a bases de datos o file system

**Justificacion posible:** Es un prototipo temprano y es mas rapido poner `'use client'`. Pero si esto escala a produccion, el bundle size va a ser innecesariamente grande.

**Recomendacion:** Identificar las paginas que no necesitan interactividad del cliente (estado, efectos, eventos) y convertirlas a Server Components. Por ejemplo, `student/payments/page.tsx` y `admin/analytics/page.tsx` son puramente presentacionales y podrian ser Server Components si reciben datos por props.

---

## 6. Escalabilidad

### 6.1 Sin Loading / Error / NotFound States — IMPORTANTE

Ningun segmento de ruta tiene:
- `loading.tsx` (estado de carga)
- `error.tsx` (manejo de errores)
- `not-found.tsx` (404 personalizado)

Cuando se conecten servicios reales (con latencia de red), la ausencia de `loading.tsx` va a resultar en pantallas en blanco durante las peticiones.

**Recomendacion:** Agregar al menos un `loading.tsx` generico en `app/` y en cada grupo de rutas (`student/`, `teacher/`, `admin/`).

```typescript
// app/student/loading.tsx
export default function StudentLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}
```

---

### 6.2 Sin Middleware de Autenticacion — IMPORTANTE

No hay `middleware.ts` en `frontend/src/`. Cualquier usuario puede navegar a `/admin/dashboard` directamente sin autenticacion.

**Impacto:** El login simulado en `login/page.tsx` hace `router.push('/student/dashboard')` pero no protege nada.

**Recomendacion:**

```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
```

---

### 6.3 El Modelo de Datos no Tiene `status` en Student — SUGERENCIA

El modelo `Student` no tiene un campo `status` (activo/inactivo), pero:

- La pagina `admin/students/page.tsx` renderiza un status "Activo" / "Inactivo" hardcodeado
- El `mockStudents` tampoco incluye status

```typescript
// En admin/students/page.tsx:
const students = [
  { name: 'Pedro Lopez', progress: 30, status: 'Inactivo' },
  ...
];
```

**Recomendacion:** Agregar `status: 'active' | 'inactive'` al tipo `Student` en `types/index.ts` y al `mockStudents`.

---

## 7. Resumen de Hallazgos

| # | Tipo | Severidad | Descripcion |
|---|------|-----------|-------------|
| 1 | **Servicios no utilizados** | BLOQUEANTE | `services/mocks/` existe pero ninguna pagina lo importa. Toda la data esta hardcodeada inline. |
| 2 | **Button component no utilizado** | BLOQUEANTE | `components/ui/button.tsx` existe pero todas las paginas usan `<button>` nativo con estilos inline. |
| 3 | **Layouts duplicados** | IMPORTANTE | 3 layouts identicos (student, teacher, admin). Cualquier cambio estructural requiere modificar 3 archivos. |
| 4 | **Todo es `'use client'`** | IMPORTANTE | 22/22 paginas son client components. Sin Server Components, se pierden beneficios de RSC. |
| 5 | **Sin loading/error boundaries** | IMPORTANTE | No hay `loading.tsx`, `error.tsx`, ni `not-found.tsx` en ningun segmento. |
| 6 | **Sin middleware de auth** | IMPORTANTE | No hay proteccion de rutas. Cualquier ruta es accesible sin autenticacion. |
| 7 | **Card en ubicacion incorrecta** | IMPORTANTE | `Card` esta en `layouts/` pero es un componente UI. Deberia estar en `ui/`. |
| 8 | **Falta adminService** | IMPORTANTE | Existe `studentService` y `teacherService` pero no `adminService`. Asimetria arquitectonica. |
| 9 | **Rutas muertas en ROUTES** | SUGERENCIA | `/register` y `/forgot-password` estan definidas pero no implementadas. |
| 10 | **`hooks/` y `stores/` vacios** | SUGERENCIA | Directorios existen pero estan vacios. Generan confusion. |
| 11 | **Student sin campo `status`** | SUGERENCIA | El tipo `Student` no tiene `status` pero las paginas lo renderizan. |
| 12 | **Falta `features/` directory** | SUGERENCIA | No existe `components/features/`. Se va a necesitar cuando crezca la logica compuesta. |

---

## 8. Roadmap de Accion Recomendado

### Fase 1 — Critico (inmediato)
1. Conectar las paginas a `studentService` y `teacherService` + crear `adminService`
2. Reemplazar `<button>` nativos por el componente `Button` de `ui/`
3. Agregar `middleware.ts` para proteger rutas

### Fase 2 — Deuda Tecnica (proximo sprint)
4. Centralizar layouts en un grupo de rutas `(dashboard)`
5. Mover `Card` de `layouts/` a `ui/`
6. Agregar `loading.tsx` en cada segmento de ruta
7. Agregar `status` al modelo `Student`

### Fase 3 — Optimizacion (futuro)
8. Convertir paginas estaticas a Server Components
9. Agregar `error.tsx` y `not-found.tsx`
10. Eliminar rutas muertas de `ROUTES`

---

*Reporte generado por Architecture Guardian. Ningun archivo fue modificado.*
