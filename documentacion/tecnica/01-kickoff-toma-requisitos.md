# Documento de Kick Off y Toma de Requisitos

**Proyecto:** Digitalización e Integración de IA para Autoescuela  
**Fecha:** Mayo 2026  
**Duración:** 90 horas (3 semanas)

---

## 1. Contexto del Proyecto

• La empresa desea modernizar varios procesos internos y de atención al alumno mediante automatización e inteligencia artificial.  
• El alcance inicial planteado es amplio y cubre múltiples áreas operativas de la autoescuela.  
• Due to the limited time of 90 hours of internships, it will be necessary to prioritize functionalities and possibly divide the project into phases or POCs.

---

## 2. Funcionalidades Propuestas Inicialmente

1. **Predicción mediante IA** - Probabilidad de aprobado/suspenso  
2. **Reservas de clases prácticas** - Seguimiento del progreso del alumno  
3. **Agenda inteligente** - Organización de horarios  
4. **Comercial virtual 24/7** - WhatsApp  
5. **Automatización de WhatsApp** - Para exámenes  
6. **Automatización de facturación**  
7. **Teórica personalizada** - IA adaptativa  
8. **Mantenimiento de vehículos** - ITV, revisiones  
9. **Base de conocimiento** - Atención al cliente  
10. **Asistente de recepción** - Primera atención  

---

## 3. Priorización para 90 Horas

| Prioridad | Funcionalidad | Justificación |
|-----------|---------------|----------------|
| **ALTA** | Agenda + Reservas | Impacto directo en operativa diaria, MVP funcional |
| **ALTA** | WhatsApp para citas | Rápida automatización con alto valor operativo |
| **ALTA** | Seguimiento de progreso | Base necesaria para futuras funcionalidades de IA |
| **MEDIA** | IA Predicción | Depende de datos históricos disponibles |
| **MEDIA** | Teórica adaptativa | Requiere banco de preguntas y más tiempo |
| **MEDIA** | Facturación | Útil, posiblemente dependent de software externo |
| **BAJA** | Comercial virtual 24/7 | Mayor complejidad técnica y coste externo |
| **BAJA** | Base de conocimiento | Propuesta futura |
| **BAJA** | Mantenimiento vehículos | Menos crítico para MVP inicial |

---

## 4. Problemas y Riesgos Detectados

- ⚠️ **Scope**: El alcance inicial es demasiado amplio para 90 horas
- ⚠️ **Integraciones**: WhatsApp Business API, facturación, calendarios
- ⚠️ **Datos IA**: Depende de datos históricos suficientes y estructurados
- ⚠️ **Documentación**: Posible falta de procesos internos definidos
- ⚠️ **Legales**: RGPD y tratamiento de datos personales
- ⚠️ **Riesgo**: Intentar implementar demasiado sin cerrar MVP funcional

---

## 5. Información Necesaria de la Empresa

1. ¿Qué funcionalidad consideran más importante?
2. ¿Qué problema les genera más pérdidas de tiempo?
3. ¿Qué software utilizan actualmente?
4. ¿Existen bases de datos históricas de alumnos?
5. ¿Cómo gestionan las clases prácticas y horarios?
6. ¿Volumen aproximado de alumnos al mes?
7. ¿Cuántos vehículos e instructores tienen?
8. ¿Utilizan WhatsApp Business?
9. ¿POC funcional o sistema completo?
10. ¿Qué es imprescindible para finalizar las prácticas?
11. ¿Quién validará avances?
12. ¿Qué acceso técnico podrán proporcionar?

---

## 6. Propuesta Realista de MVP

**Componentes del MVP:**
- ✅ Gestión de reservas y agenda inteligente
- ✅ Seguimiento básico de progreso del alumno
- ✅ Automatización de mensajes de WhatsApp
- ✅ Dashboard simple con métricas de alumnos

**POC IA:** Solo si existen datos suficientes

---

## 7. Objetivos de la Reunión de Kick Off (30 min)

1. ✅ Validar prioridades reales del negocio
2. ✅ Definir alcance realista para 90 horas
3. ✅ Confirmar acceso a datos y herramientas
4. ✅ Identificar restricciones técnicas y legales
5. ✅ Definir entregables mínimos esperados
6. ✅ Establecer responsables y método de comunicación

---

## 8. Diagramas del Proyecto

### 8.1 Diagrama de Contexto

```plantuml
@startuml contexto-proyecto
!theme plain
skinparam componentStyle uml2

actor "Alumno" as alumno
actor "Instructor" as instructor
actor "Administrador" as admin
actor "Dueño/Gerente" as gerente

package "Sistema Autoescuela" {
    [App IA] as appia
    [Agenda y Reservas] as agenda
    [WhatsApp Automatizado] as whatsapp
    [Facturación] as facturacion
    [Teórica IA] as teorica
    [Seguimiento Progreso] as progreso
    [Mantenimiento Vehículos] as mantenimiento
    [Base Conocimiento] as conocimiento
    [Comercial Virtual] as comercial
    [Asistente Recepción] as reception
}

cloud "Servicios Externos" {
    [WhatsApp Business API] as wabapi
    [API de Pagos] as pagos
    [Servicios IA] as ia
    [Calendario] as calendar
}

alumno --> agenda
alumno --> whatsapp
alumno --> progreso
alumno --> appia

instructor --> agenda
instructor --> progreso

admin --> facturacion
admin --> agenda
admin --> mantenimiento
admin --> conocimiento

gerente --> appia
gerente --> comercial

agenda --> calendar
whatsapp --> wabapi
facturacion --> pagos
appia --> ia
teorica --> ia

@enduml
```

### 8.2 Diagrama de Casos de Uso

```plantuml
@startuml funcionalidades
!theme plain
left to right direction

actor "Alumno" as A
actor "Instructor" as I
actor "Admin" as Ad

rectangle "Funcionalidades Autoescuela" {
    rectangle "Gestión Central" {
        usecase "Agenda Inteligente" as UC1
        usecase "Reservas Clases" as UC2
        usecase "Seguimiento Progreso" as UC3
    }
    
    rectangle "IA y Predicción" {
        usecase "Predicción Aprobado" as UC4
        usecase "Teórica Adaptativa" as UC5
    }
    
    rectangle "Automatización" {
        usecase "WhatsApp Citas" as UC6
        usecase "Comercial 24/7" as UC7
        usecase "Facturación Auto" as UC8
        usecase "Recordatorios" as UC9
    }
    
    rectangle "Soporte" {
        usecase "Base Conocimiento" as UC10
        usecase "Asistente Recepción" as UC11
    }
    
    rectangle "Mantenimiento" {
        usecase "Gestión Vehículos" as UC12
    }
}

A --> UC2
A --> UC6
A --> UC3
A --> UC4
A --> UC5
A --> UC7

I --> UC3
I --> UC1

Ad --> UC8
Ad --> UC9
Ad --> UC12
Ad --> UC10
Ad --> UC11
Ad --> UC1

@enduml
```

### 8.3 Diagrama de Priorización (Eisenhower)

```plantuml
@startuml priorizacion
!theme plain
skinparam rectangleBackgroundColor #E8F5E9
skinparam rectangleFontSize 14

rectangle "URGENTE + IMPORTANTE\n(HACER)" #FFCDD2 {
    rectangle "Agenda + Reservas" #FFEBEE
    rectangle "WhatsApp Citas" #FFEBEE
    rectangle "Seguimiento Progreso" #FFEBEE
}

rectangle "IMPORTANTE - URGENTE\n(PLANIFICAR)" #FFF9C4 {
    rectangle "IA Predicción" #FFFDE7
    rectangle "Teórica IA" #FFFDE7
    rectangle "Facturación Auto" #FFFDE7
}

rectangle "URGENTE - IMPORTANTE\n(DELEGAR)" #B3E5FC {
    rectangle "Comercial 24/7" #E1F5FE
    rectangle "Base Conocimiento" #E1F5FE
}

rectangle "NI URGENTE NI IMPORTANTE\n(ELIMINAR)" #E0E0E0 {
    rectangle "Mant. Vehículos" #F5F5F5
    rectangle "Asistente Recepción" #F5F5F5
}

@enduml
```

### 8.4 Diagrama de Riesgos

```plantuml
@startuml riesgos
!theme plain

skinparam entityBackgroundColor #FFECB3
skinparam noteBackgroundColor #E1F5FE

rectangle "Riesgos del Proyecto" {
    rectangle "Técnicos" as R1 #FFCDD2
    rectangle "Scope" as R2 #FFCDD2
    rectangle "Datos" as R3 #FFF9C4
    rectangle "Legales" as R4 #FFF9C4
    rectangle "Recursos" as R5 #B3E5FC
}

note as N1
  **R1 - Técnicos**
  - Integraciones externas
  - APIs de WhatsApp/Facturación
  - Configuración de calendarios
  
  **R2 - Scope**
  - Alcance muy amplio
  - MVP no definido claramente
  - Riesgo de sobredimensionar
end note

note as N2
  **R3 - Datos**
  - Falta de datos históricos
  - Calidad de datos insuficiente
  - IA sin entrenamiento
  
  **R4 - Legales**
  - RGPD y protección datos
  - Consentimientos alumn@s
end note

note as N3
  **R5 - Recursos**
  - Acceso técnico limitado
  - documentacion incompleta
  - Procesos no definidos
end note

@enduml
```

### 8.5 Diagrama de MVP Propuesto

```plantuml
@startuml mvp-propuesto
!theme plain
skinparam componentStyle uml2

package "MVP - Prácticas 90h" {
    component "Gestión de Reservas" as GR #C8E6C9
    component "Agenda Inteligente" as AI #C8E6C9
    component "Seguimiento Progreso" as SP #C8E6C9
    component "WhatsApp Automatizado" as WA #C8E6C9
    component "Dashboard Métricas" as DM #C8E6C9
    component "IA Predicción (POC)" as IA #FFF9C4
}

package "Futuras Fases" {
    component "Teórica Adaptativa" as TA #E0E0E0
    component "Facturación Auto" as FA #E0E0E0
    component "Comercial Virtual" as CV #E0E0E0
    component "Mantenimiento" as MT #E0E0E0
}

GR --> SP
GR --> AI
SP --> IA
GR --> WA
DM --> GR
DM --> SP
DM --> WA

note top of GR
  <b>Prioridad MVP:</b>
  1. Reservas y Agenda
  2. Seguimiento Progreso
  3. WhatsApp Automatizado
  4. Dashboard Básico
end note

note top of IA
  <b>POC IA:</b>
  Solo si hay datos históricos
end note

@enduml
```

### 8.6 Diagrama de Arquitectura

```plantuml
@startuml arquitectura
!theme plain
skinparam componentStyle uml2

skinparam rectangle {
    BackgroundColor #E3F2FD
    BorderColor #1976D2
}

skinparam database {
    BackgroundColor #FFF3E0
    BorderColor #E65100
}

skinparam cloud {
    BackgroundColor #F3E5F5
    BorderColor #7B1FA2
}

rectangle "Frontend" {
    [Web App] as web
    [Panel Admin] as admin
    [App Móvil] as app
}

rectangle "Backend - API" {
    [Auth Service] as auth
    [Reservas Service] as reservas
    [Alumnos Service] as alumnos
    [WhatsApp Service] as whatsapp
    [IA Service] as ia
    [Facturación Service] as fact
    [Notificaciones] as notif
}

database "Base de Datos" {
    [PostgreSQL] as db
}

cloud "Servicios Externos" {
    [WhatsApp API] as wapi
    [OpenAI/API IA] as openai
    [Stripe/Pagos] as stripe
    [Google Calendar] as gcal
}

web --> auth
app --> auth
admin --> auth

auth --> reservas
auth --> alumnos
auth --> whatsapp
auth --> ia
auth --> fact

reservas --> db
alumnos --> db
whatsapp --> db
fact --> db

whatsapp --> wapi
ia --> openai
fact --> stripe
reservas --> gcal

@enduml
```

### 8.7 Diagrama de Flujo de Kick Off

```plantuml
@startuml kickoff-flujo
!theme plain

(*) --> "Inicio Reunión\n(5 min)" 
--> "Presentación del\nproyecto y objetivos"

note right
  - Presentar propuesta inicial
  - Explicar limitaciones (90h)
end note

--> "Presentación\nempresa\n(10 min)"

note right
  - Conocer estructura actual
  - Identificar problemas principales
  - Volumen de alumn@s/mes
  - Software actual
end note

--> "Definir alcance\nrealista\n(10 min)"

note right
  - Priorizar funcionalidades
  - Definir MVP
  - Acordar entregables
end note

--> "Resolver dudas\ntécnicas\n(5 min)"

note right
  - Acceso a datos
  - APIs disponibles
  - Restricciones legales
end note

--> "Definir próximos\npasos\n(5 min)"

note right
  - Asignar responsable
  - Canal de comunicación
  - Fechas de seguimiento
end note

--> "Documentar\nacuerdos"
--> (*)

@enduml
```

### 8.8 Diagrama de Entidades (Base de Datos)

```plantuml
@startuml entidades
!theme plain

hide circle
skinparam entityBackgroundColor #E8F5E9
skinparam attributeFontSize 11

entity "Alumno" as alumno {
    *id : PK
    *nombre : string
    *apellidos : string
    *email : string
    *telefono : string
    *dni : string
    fecha_alta : date
    estado : enum
    --
    instructor_id : FK
}

entity "Instructor" as instructor {
    *id : PK
    *nombre : string
    *apellidos : string
    *email : string
    *telefono : string
    --
    vehiculos : list
}

entity "Vehiculo" as vehiculo {
    *id : PK
    *matricula : string
    modelo : string
    marca : string
    tipo : enum
    proxima_itv : date
    proxima_revision : date
    --
    instructor_id : FK
}

entity "Clase_Practica" as clase {
    *id : PK
    *fecha_hora : datetime
    duracion : int
    estado : enum
    --
    alumno_id : FK
    instructor_id : FK
    vehiculo_id : FK
}

entity "Reserva" as reserva {
    *id : PK
    *fecha : datetime
    estado : enum
    tipo : enum
    --
    alumno_id : FK
    instructor_id : FK
    clase_id : FK
}

entity "Progreso" as progreso {
    *id : PK
    *fecha : date
    habilidades : json
    errores : json
    comentarios : text
    probabilidad_aprobado : float
    --
    clase_id : FK
    instructor_id : FK
}

entity "Examen" as examen {
    *id : PK
    *fecha : date
    tipo : enum
    lugar : string
    resultado : enum
    --
    alumno_id : FK
}

alumno ||--o{ clase
alumno ||--o{ reserva
alumno ||--o{ progreso
alumno ||--o{ examen

instructor ||--o{ clase
instructor ||--o{ reserva
instructor ||--o{ progreso

vehiculo ||--o{ clase

reserva }o--|| clase
clase ||--o{ progreso

@enduml
```

---

## 9. Conclusión

El proyecto tiene potencial para evolucionar hacia una plataforma integral para autoescuelas, pero para prácticas limitadas en tiempo es recomendable priorizar:

1. ✅ Automatización operativa (reservas, agenda, WhatsApp)
2. ✅ Gestión de alumnos
3. ✅ Seguimiento de progreso
4. 🔄 IA predictiva como POC (solo si hay datos)

Los sistemas avanzados de IA o asistentes virtuales complejos pueden dejarse para fases futuras.

---

## Archivos Generados

- `diagrama-contexto.puml` - Diagrama de contexto
- `diagrama-funcionalidades.puml` - Casos de uso
- `diagrama-priorizacion.puml` - Matriz Eisenhower
- `diagrama-riesgos.puml` - Riesgos identificados
- `diagrama-mvp.puml` - MVP propuesto
- `diagrama-arquitectura.puml` - Arquitectura del sistema
- `diagrama-kickoff.puml` - Flujo de reunión
- `diagrama-entidades.puml` - Modelo de datos
- `01-kickoff-toma-requisitos.md` - Este documento

**Para visualizar los diagramas:** Copia el código PlantUML en https://plantuml.com/plantuml

**Para generar imágenes localmente:** Instala Graphviz y ejecuta:
```bash
java -jar plantuml.jar -tpng *.puml
```