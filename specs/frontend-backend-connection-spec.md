# Delta Spec: Frontend-Backend Connection

## Purpose
Define the API client, auth flow, data contracts, and service adapter layer connecting all 27 Next.js pages to the NestJS backend. This is a NEW domain — no previous spec exists.

---

## 1. API Client

### REQ-API-001: Axios Instance with Config
The system MUST create a shared Axios instance configured with `baseURL` from `NEXT_PUBLIC_API_URL` (default `http://localhost:3000/v1`), `withCredentials: true`, and `Content-Type: application/json`.

#### Scenario: Instance created with correct defaults
- GIVEN the frontend app starts
- WHEN the Axios instance is initialized
- THEN it MUST use the configured `baseURL`
- AND it MUST include `withCredentials: true`

### REQ-API-002: Request Interceptor — JWT Attachment
The Axios instance MUST attach the access token from AuthContext as a `Bearer` header on every authenticated request. Requests to `/auth/login`, `/auth/refresh`, and `/auth/logout` MUST be excluded.

#### Scenario: Access token attached
- GIVEN the user has a valid access token stored in AuthContext
- WHEN any non-auth request is made
- THEN the `Authorization: Bearer <token>` header MUST be present

#### Scenario: No token on auth endpoints
- GIVEN no access token is stored
- WHEN `POST /auth/login` is called
- THEN no `Authorization` header MUST be sent

### REQ-API-003: Response Interceptor — 401 Refresh & Retry
On a 401 response, the interceptor MUST attempt a single refresh via `POST /auth/refresh` using the stored refresh token. If successful, it MUST retry the original request. If the refresh itself fails (401 or network error), it MUST clear all tokens and redirect to `/login`. Concurrent 401s MUST be queued — only one refresh call at a time.

#### Scenario: Token expired — refresh succeeds
- GIVEN the user's access token is expired
- WHEN any API call returns 401
- THEN the interceptor MUST call `POST /auth/refresh`
- AND on success, retry the original request with the new access token
- AND the user MUST NOT see any error

#### Scenario: Token expired — refresh fails
- GIVEN both access and refresh tokens are expired
- WHEN the interceptor attempts to refresh
- THEN on failure, tokens MUST be cleared
- AND the user MUST be redirected to `/login`

#### Scenario: Parallel 401s
- GIVEN two API calls both return 401 simultaneously
- WHEN the interceptor processes them
- THEN only ONE refresh call MUST be made
- AND both original requests MUST be retried after refresh

### REQ-API-004: CORS Configuration
The backend `CORS_ORIGIN` MUST include `http://localhost:3001` (Next.js dev server). The environment variable `CORS_ORIGIN` MUST support comma-separated origins.

#### Scenario: Next.js origin allowed
- GIVEN the backend starts with `CORS_ORIGIN=http://localhost:3001`
- WHEN the frontend at `:3001` makes a request
- THEN the response MUST include `Access-Control-Allow-Origin: http://localhost:3001`

---

## 2. Auth Flow

### REQ-AUTH-001: Login Flow
`POST /v1/auth/login` with `{ username, password }` MUST return `{ accessToken, refreshToken }`. On success, the system MUST decode the JWT to extract `sub`, `username`, and `role`, store both tokens, and redirect to `/{role}/dashboard`.

#### Scenario: Valid credentials
- GIVEN valid username and password
- WHEN the user submits the login form
- THEN `POST /v1/auth/login` is called
- AND tokens are stored in memory + localStorage
- AND the user is redirected to `/{role}/dashboard`

#### Scenario: Invalid credentials
- GIVEN invalid username or password
- WHEN login is submitted
- THEN the API returns 401
- AND an error message "Credenciales inválidas" is shown
- AND no redirection occurs

### REQ-AUTH-002: AuthProvider Context
The system MUST provide an `AuthProvider` React Context that exposes: `user` (decoded JWT payload + profile), `login(username, password)`, `logout()`, `isLoading`, `isAuthenticated`. On mount, it MUST attempt to restore the session from stored tokens.

#### Scenario: Session restored from stored tokens
- GIVEN valid tokens exist in localStorage
- WHEN AuthProvider mounts
- THEN `isAuthenticated` MUST be `true`
- AND the user object MUST be populated from the decoded JWT

#### Scenario: No stored tokens
- GIVEN no tokens exist in storage
- WHEN AuthProvider mounts
- THEN `isAuthenticated` MUST be `false`
- AND `isLoading` MUST transition from `true` to `false`

### REQ-AUTH-003: Protected Routes
Pages under `/(authenticated)/` MUST be wrapped in a guard that checks `isAuthenticated`. If not authenticated, redirect to `/login`.

#### Scenario: Unauthenticated access
- GIVEN the user is not authenticated
- WHEN they navigate to `/student/dashboard`
- THEN they MUST be redirected to `/login`
- AND the target URL MUST be preserved as a redirect parameter

#### Scenario: Authenticated access
- GIVEN the user is authenticated
- WHEN they navigate to `/student/dashboard`
- THEN the page MUST render normally

### REQ-AUTH-004: Logout
`POST /v1/auth/logout` with `{ refreshToken }` MUST revoke the token on the server. On success (or network failure), the system MUST clear all local tokens and redirect to `/login`.

#### Scenario: Successful logout
- GIVEN the user is authenticated
- WHEN they click "Cerrar sesión"
- THEN `POST /v1/auth/logout` is called
- AND tokens are cleared
- AND the user is redirected to `/login`

#### Scenario: Network error during logout
- GIVEN the user is authenticated
- WHEN logout is called and the server is unreachable
- THEN tokens are still cleared locally
- AND the user is redirected to `/login`

---

## 3. Data Contracts — Frontend ↔ Backend Mapping

### REQ-DATA-001: User Profile Fields Migration (Backend)
The Prisma `User` model MUST gain four additive columns: `name VARCHAR`, `lastName VARCHAR`, `email VARCHAR UNIQUE`, `phone VARCHAR?`. The `POST /v1/auth/login` and `POST /v1/auth/refresh` responses MUST include these fields alongside the tokens.

#### Scenario: Login returns profile fields
- GIVEN a user with `name: "Juan"`, `lastName: "Pérez"`, `email: "juan@test.com"`
- WHEN login succeeds
- THEN the response MUST include `accessToken`, `refreshToken`, AND `user: { id, name, lastName, email, role }`

### REQ-DATA-002: Frontend Adapter Layer
Service adapters (`src/services/adapters/api/`) MUST map backend snake_case DTOs to frontend camelCase types. The adapter pattern MUST use a `mapXxx` pure function for each entity.

#### Scenario: Student DTO mapped
- GIVEN backend returns `{ id, user_id, remaining_classes, created_at }`
- WHEN passed through `mapStudentDto(dto)`
- THEN it returns `{ id, userId, remainingClasses, createdAt }`

### REQ-DATA-003: Endpoint → Type Mapping
Every page MUST use the correct endpoint as specified below. Pages without a corresponding backend endpoint (marked "mock") MUST use the mock adapter.

| Page | Endpoint | Frontend Type | Backend Source |
|------|----------|---------------|----------------|
| Login | `POST /v1/auth/login` | User (from JWT + profile) | `LoginHandler` |
| Student Dashboard | `GET /v1/students/:id` + mock progress | Student | `Student` model + mock |
| Student Bookings | `GET /v1/reservations?studentId=:id` | Booking[] | `Reservation` model |
| Student Payments | mock | Payment[] | Mock only |
| Student Profile | `GET /v1/users/:id` (with new fields) | User | `User` model |
| Teacher Dashboard | `GET /v1/teachers/:id/stats` + `GET /v1/reservations?teacherId=:id` | Teacher + Booking[] | Teacher stats + Reservation |
| Teacher Schedule | `GET /v1/reservations?teacherId=:id&status=confirmed` | Booking[] | Reservation model |
| Teacher Students | mock (aggregation from bookings) | Student[] | Mock — no backend endpoint |
| Admin Dashboard | `GET /v1/users?role=student` + `GET /v1/teachers` + `GET /v1/vehicles` | Aggregated counts | Users + Teachers + Vehicles |
| Admin Students | `GET /v1/users?role=student` + `GET /v1/students/:id` per student | Student[] | Users filter + individual fetch |
| Admin Teachers | `GET /v1/teachers` | Teacher[] | Teacher model |
| Admin Vehicles | `GET /v1/vehicles` | Vehicle[] | Vehicle model |
| Admin Schedules | mock | Schedule[] | Mock only |
| Admin Payments | mock | Payment[] | Mock only |

---

## 4. Service Interface Contracts

### REQ-SVC-001: AuthService Interface
```typescript
interface IAuthService {
  login(username: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }>;
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
}
```

#### Scenario: Mock fallback
- GIVEN `NEXT_PUBLIC_USE_MOCKS=true`
- WHEN `login` is called with any credentials
- THEN the mock adapter returns `{ accessToken: "mock-...", refreshToken: "mock-...", user: getCurrentUser(role) }`
- AND a simulated 300ms delay occurs

### REQ-SVC-002: StudentService Interface
```typescript
interface IStudentService {
  getProfile(studentId: string): Promise<Student | null>;
  getBookings(studentId: string): Promise<Booking[]>;
  getUpcomingBookings(studentId: string): Promise<Booking[]>;
  getPayments(studentId: string): Promise<Payment[]>;        // mock only
  cancelBooking(bookingId: string): Promise<void>;
}
```

#### Scenario: Profile fetched from API
- GIVEN a valid student ID and `NEXT_PUBLIC_USE_MOCKS=false`
- WHEN `getProfile(id)` is called
- THEN it calls `GET /v1/students/:id` and maps the DTO to the Student UI type

#### Scenario: API fails with 401
- GIVEN the access token is expired
- WHEN any student API call returns 401
- THEN the Axios interceptor handles the refresh
- AND the caller receives the successful retried response

### REQ-SVC-003: TeacherService Interface
```typescript
interface ITeacherService {
  getProfile(teacherId: string): Promise<Teacher | null>;
  getDailySchedule(teacherId: string, date: Date): Promise<Booking[]>;
  getWeeklySchedule(teacherId: string, startDate: Date): Promise<Booking[]>;
  getStudents(teacherId: string): Promise<Student[]>;       // mock only
  createIncident(incident: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident>;
  updateAvailability(teacherId: string, availability: TeacherAvailability[]): Promise<void>; // mock only
}
```

### REQ-SVC-004: VehicleService Interface
```typescript
interface IVehicleService {
  getAll(params?: { page?: number; type?: string; status?: string }): Promise<{ data: Vehicle[]; total: number }>;
  getById(id: string): Promise<Vehicle | null>;
  create(dto: CreateVehicleDto): Promise<Vehicle>;
  update(id: string, dto: UpdateVehicleDto): Promise<Vehicle>;
  delete(id: string): Promise<void>;
  getIncidents(vehicleId: string): Promise<Incident[]>;
  logIncident(vehicleId: string, dto: LogIncidentDto): Promise<Incident>;
}
```

### REQ-SVC-005: ReservationService Interface
```typescript
interface IReservationService {
  getAll(params: { studentId?: string; teacherId?: string; status?: string; page?: number }): Promise<{ data: Booking[]; total: number }>;
  getById(id: string): Promise<Booking | null>;
  create(dto: CreateReservationDto): Promise<Booking>;
  confirm(id: string): Promise<void>;
  cancel(id: string): Promise<void>;
  complete(id: string): Promise<void>;
  getAvailability(date: string, teacherId: string, duration?: number): Promise<{ slots: TimeSlot[] }>;
}
```

### REQ-SVC-006: PaymentService Interface
The existing `paymentService` in `src/services/payments/mockPaymentService.ts` MUST remain as-is. No backend endpoint exists for payment history. Backend payments module (`POST /v1/payments/create-session`, `POST /v1/payments/webhook`) is out of scope for this change.

#### Scenario: Payment history uses mock
- GIVEN any role user navigates to payment history
- WHEN `getPaymentHistory(userId)` is called
- THEN it MUST use the existing mock service
- AND return mock transaction data

---

## 5. Feature Flag & Migration Path

### REQ-FLAG-001: NEXT_PUBLIC_USE_MOCKS
A `NEXT_PUBLIC_USE_MOCKS` environment variable MUST control which adapter each page uses. When `true` (default), all services use mock adapters. When `false`, services switch to API adapters.

#### Scenario: Mock mode
- GIVEN `NEXT_PUBLIC_USE_MOCKS=true`
- WHEN any page loads data
- THEN it uses the existing mock implementation with delay()

#### Scenario: API mode
- GIVEN `NEXT_PUBLIC_USE_MOCKS=false`
- WHEN a page loads data for an endpoint that exists
- THEN it calls the real backend via the Axios client
- WHEN a page loads data for an endpoint that does NOT exist (mock-only)
- THEN it falls back to the mock adapter and logs a warning

### REQ-FLAG-002: Page Group Migration Order
The system SHALL support switching adapters per page group independently. The recommended migration order is:

1. Auth (login/logout/refresh) — no page changes needed, only AuthProvider
2. Student pages — dashboard, bookings, profile
3. Teacher pages — dashboard, schedule
4. Admin pages — students, teachers, vehicles
5. Remaining pages (payments, schedules, incidents) — stay on mock

#### Scenario: Partial migration
- GIVEN auth and student adapters are set to API mode
- AND teacher and admin adapters are set to mock mode
- WHEN a student views dashboard, data comes from the API
- WHEN an admin views students, data comes from the mock
- THEN both experiences work correctly without interference

---

## 6. Error & Loading States

### REQ-ERR-001: Per-Page Loading State
Every page that fetches data MUST show a loading indicator (skeleton or spinner) while the request is in flight. The indicator MUST appear within 200ms of the request starting.

#### Scenario: Dashboard loading
- GIVEN the student dashboard page mounts
- WHEN `getProfile` is called
- THEN a skeleton placeholder MUST render
- AND it MUST be replaced with real data when the response arrives

### REQ-ERR-002: Per-Page Error State
Every page that fetches data MUST handle network errors gracefully — show an inline error message with a "Reintentar" button. The original loading state MUST be restored on retry.

#### Scenario: Network failure
- GIVEN the API is unreachable
- WHEN a page attempts to fetch data
- THEN an error message "Error de conexión" is displayed
- AND a "Reintentar" button calls `fetchData` again

#### Scenario: Empty data
- GIVEN the API returns an empty array
- WHEN a list page renders (e.g., bookings)
- THEN a "No hay elementos" empty state is displayed
- AND a call-to-action button is shown if applicable

### REQ-ERR-003: Global Error Boundary
The system SHOULD wrap the authenticated layout in a React Error Boundary that catches rendering errors and shows a fallback UI with "Recargar página" button.

#### Scenario: Render crash
- GIVEN a component throws during render
- WHEN the error boundary catches it
- THEN a fallback UI is shown with an error message
- AND the user can click "Recargar página" to reload

---

## 7. Token Storage

### REQ-TOKEN-001: Access Token — In-Memory
The access token MUST be stored in React state (AuthContext) only — never in localStorage or sessionStorage. This prevents XSS token theft.

#### Scenario: Page refresh
- GIVEN the user is authenticated with tokens in memory
- WHEN the page is refreshed
- THEN the refresh token from localStorage is exchanged for a new access token
- AND the user remains authenticated without visible delay

### REQ-TOKEN-002: Refresh Token — localStorage
The refresh token MUST be stored in `localStorage` under the key `ac_refresh_token`. It MUST be cleared on logout.

#### Scenario: Token persistence
- GIVEN the user logs in
- THEN the refresh token is written to localStorage
- WHEN the user closes and reopens the browser
- THEN AuthProvider reads the refresh token and attempts to get a new access token

### REQ-TOKEN-003: Token Expiry Check
Before each API call, the system SHOULD check if the access token is within 60 seconds of expiry. If so, proactively refresh it rather than waiting for a 401.

#### Scenario: Proactive refresh
- GIVEN the access token expires in 30 seconds
- WHEN any API call is about to be made
- THEN the interceptor proactively calls `/auth/refresh`
- AND the original request is made with the new token
