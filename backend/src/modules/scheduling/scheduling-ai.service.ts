import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';

interface ValidationContext {
  teacherId: string;
  studentId: string;
  vehicleType: string;
  startTime: string;
  duration: number;
  doubleSession?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  reason: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface StructuredCondition {
  field: string;
  operator: 'eq' | 'neq' | 'lt' | 'gt' | 'in' | 'notIn';
  value: string | string[] | number;
}

export interface StructuredRule {
  conditions: StructuredCondition[];
  logic: 'AND' | 'OR';
  onMatch: 'allow' | 'block' | 'warn';
  confidence: 'high' | 'medium' | 'low';
  /**
   * Ámbito de aplicación de la regla.
   * Si no está o está vacío, la regla aplica a todos.
   */
  appliesTo?: {
    /** Nombres de profesores a los que aplica (opcional) */
    teachers?: string[];
    /** Tipos de licencia a los que aplica, ej: ['A2', 'B'] (opcional) */
    licenseTypes?: string[];
    /** Tipos de vehículo a los que aplica, ej: ['coche-manual', 'moto-pista'] (opcional) */
    vehicleTypes?: string[];
  };
}

export interface StructuredRuleSuccess {
  success: true;
  data: StructuredRule;
}

export interface StructuredRuleError {
  success: false;
  error: string;
}

export type StructuredRuleResult = StructuredRuleSuccess | StructuredRuleError;

export interface AiGenerationScheduleItem {
  teacher: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  track?: string | null;
}

export interface AiGenerationTranslationResult {
  schedule: AiGenerationScheduleItem[];
  action?: 'doubleBooking';
  error?: string;
}

@Injectable()
export class SchedulingAiService {
  private readonly logger = new Logger(SchedulingAiService.name);
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey =
      this.config.get<string>('OPENROUTER_API_KEY') ??
      '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';
  }

  async validateSlot(context: ValidationContext): Promise<ValidationResult> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://autoescuela-camacho.app',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Eres un validador de scheduling para autoescuela. 
Debes validar si un slot horario es válido según estas reglas:

1. Duración estándar: 45 min (coche-manual, coche-automatico), 30 min (moto-pista), 45 min (moto-circulacion)
2. Doble sesión: moto-pista → 60 min, moto-circulacion y coche → 90 min. Solo permitida si el profesor tiene doubleSession=true
3. Un profesor no puede tener dos alumnos al mismo tiempo
4. No debe haber solapamiento entre reservas existentes
5. Excepciones puntuales (días festivos, disponibilidad especial) deben respetarse
6. El horario laboral típico es 8:00-20:00

Responde SOLO en JSON:
{ "valid": boolean, "reason": "string", "riskLevel": "none|low|medium|high" }

Donde:
- valid: true si el slot es válido
- reason: explicación breve en español
- riskLevel: riesgo de conflicto (none = sin problemas, low = poco riesgo, medium = posible conflicto, high = alto riesgo)`,
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 200,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`AI validation failed: ${response.status} ${text}`);
        // Fallback: accept the slot but flag as medium risk
        return {
          valid: true,
          reason: 'No se pudo validar con IA — aceptado con precaución',
          riskLevel: 'medium',
        };
      }

      const data = await response.json();
      const content = String(data.choices?.[0]?.message?.content ?? '');

      try {
        // Clean markdown code fences if present
        const cleaned = content
          .replace(/```json?\s*/gi, '')
          .replace(/```/g, '')
          .trim();
        return JSON.parse(cleaned) as ValidationResult;
      } catch {
        this.logger.warn(`Failed to parse AI response: ${content}`);
        return {
          valid: true,
          reason: 'Respuesta de IA no válida — aceptado con precaución',
          riskLevel: 'medium',
        };
      }
    } catch (error) {
      this.logger.error(`AI validation error: ${error}`);
      return {
        valid: true,
        reason: 'Error de conexión con IA — aceptado con precaución',
        riskLevel: 'medium',
      };
    }
  }

  private buildPrompt(context: ValidationContext): string {
    return `Valida el siguiente slot:

- Profesor ID: ${context.teacherId}
- Alumno ID: ${context.studentId}
- Tipo de vehículo: ${context.vehicleType}
- Inicio: ${context.startTime}
- Duración: ${context.duration} minutos
- Doble sesión: ${context.doubleSession ? 'sí' : 'no'}

¿Es un slot válido? Responde SOLO en JSON.`;
  }

  async translateRule(naturalLanguage: string): Promise<StructuredRuleResult> {
    const systemPrompt = `Eres un traductor de reglas de scheduling para autoescuela. Conviertes texto en español a una estructura JSON de reglas de disponibilidad. Responde SOLO con el JSON.

Formato de salida:
{
  "conditions": [
    { "field": "student.licenseType", "operator": "eq", "value": "A2" },
    { "field": "time", "operator": "lt", "value": "08:00" }
  ],
  "logic": "AND",
  "onMatch": "block",
  "confidence": "high"
}

INTERPRETACION DE TERMINOS (IMPORTANTE):
- "vacaciones", "festivos", "no disponible", "no dar clases", "no trabajar", "descanso", "puente", "cerrado", "dias libres" -> BLOQUEAR (onMatch: "block") en esas fechas, porque el profesor no esta disponible
- "tener cuidado", "evitar", "mejor no", "precaucion" -> ADVERTIR (onMatch: "warn") sin bloquear
- "permitir", "se puede", "excepcion", "si hay clase" -> PERMITIR (onMatch: "allow")
- El ano actual es 2026

Campos permitidos para "field": student.licenseType, student.remainingClasses, teacher.doubleSession, vehicleType, time, duration, dayOfWeek, date, overlap

IMPORTANTE — Diferencia entre dayOfWeek y date:
- dayOfWeek: DÍA DE LA SEMANA (0=Domingo, 1=Lunes, ..., 6=Sábado). Se usa con operadores numéricos: eq, neq, lt, gt, in. El VALOR debe ser un NÚMERO (ej: 0, 1, 5) o array de números para "in".
  ✅ Ejemplo correcto: { "field": "dayOfWeek", "operator": "in", "value": [0, 6] } (findes de semana)
  ❌ Ejemplo INCORRECTO: { "field": "dayOfWeek", "operator": "eq", "value": "2026-06-03" }
- date: FECHA ESPECÍFICA en formato ISO "YYYY-MM-DD". Se usa para días festivos, puentes, fechas concretas.
  ✅ Ejemplo correcto: { "field": "date", "operator": "eq", "value": "2026-06-03" }
  ✅ Ejemplo correcto: { "field": "date", "operator": "gte", "value": "2026-06-03" } (desde una fecha)
  ✅ Ejemplo correcto: { "field": "date", "operator": "lte", "value": "2026-06-05" } (hasta una fecha)

Operadores permitidos: eq, neq, lt, gt, in, notIn

Donde "in" y "notIn" reciben un array de valores, los demás reciben un string o número.

IMPORTANTE — Rangos horarios con time + in/notIn:
- Para expresar franjas horarias USA el operador "in" o "notIn" con valores en formato "HH:MM-HH:MM":
  ✅ "Solo se puede dar clase en horario de mañana 9-14 y tarde 16-20"
     → { "field": "time", "operator": "notIn", "value": ["09:00-14:00", "16:00-20:00"] }, logic: "any", onMatch: "block"
     (Explicación: si la hora NO está en 9-14 NI en 16-20 → bloquea)
  ✅ "Permitir clases solo por la mañana hasta las 14:00"
     → { "field": "time", "operator": "notIn", "value": ["00:00-14:00"] }, logic: "any", onMatch: "block"
     (Explicación: si la hora NO está entre 00:00 y 14:00 → bloquea)
  ❌ NO uses múltiples condiciones con gte/lt para franjas horarias, usa in/notIn con rangos.

ÁMBITO DE APLICACIÓN (appliesTo — opcional):
El campo "appliesTo" define a quién aplica la regla. Puede contener:
- teachers: array de NOMBRES de profesores (ej: ["Juan Pérez", "María López"])
- licenseTypes: array de tipos de carnet (ej: ["A2", "B", "AM", "A1", "B-automatico"])
- vehicleTypes: array de tipos de vehículo (ej: ["coche-manual", "coche-automatico", "moto-pista", "moto-circulacion"])

REGLAS PARA appliesTo:
1. Si el texto NO menciona profesores, tipos de carnet, o vehículos específicos → OMITE appliesTo (aplica a todos)
2. Si menciona profesores → incluye teachers con los nombres completos
3. Si menciona tipos de carnet (ej: "carnet A2", "permiso B", "alumnos del B", "los de la A2") → incluye licenseTypes
4. Si menciona tipos de vehículo (ej: "motos", "coches manuales", "automáticos") → incluye vehicleTypes
5. Valores válidos para licenseTypes: AM, A1, A2, B, B-automatico
6. Valores válidos para vehicleTypes: coche-manual, coche-automatico, moto-pista, moto-circulacion

Ejemplos:
- "No hay clases el 3 de junio" → SIN appliesTo, condiciones: date eq 2026-06-03, onMatch: block
- "Juan y Luis no dan clases el 3 de junio" → { "appliesTo": { "teachers": ["Juan Pérez", "Luis López"] } }, condiciones: date eq 2026-06-03, onMatch: block
- "Los profesores Juan y Luis tienen vacaciones del 2 al 10 de junio" → { "appliesTo": { "teachers": ["Juan Pérez", "Luis López"] } }, condiciones: date gte 2026-06-02 AND date lte 2026-06-10, onMatch: block
- "Los sabados no hay clases" → SIN appliesTo, condiciones: dayOfWeek eq 6, onMatch: block (6=Sabado)
- "Los domingos y sabados cerrado" → SIN appliesTo, condiciones: dayOfWeek in [0, 6], onMatch: block
- "Los alumnos del carnet A2 no pueden reservar los sábados" → { "appliesTo": { "licenseTypes": ["A2"] } }
- "Las motos no pueden dar clases dobles" → { "appliesTo": { "vehicleTypes": ["moto-pista", "moto-circulacion"] } }
- "María no da clases de coche automático" → { "appliesTo": { "teachers": ["María López"], "vehicleTypes": ["coche-automatico"] } }
- "Los del carnet B automático solo con profesores con experiencia" → { "appliesTo": { "licenseTypes": ["B-automatico"] } }

IMPORTANTE: usa el nombre COMPLETO del profesor (nombre y apellido) cuando sea posible. Si el texto solo menciona el nombre de pila (ej: "juan"), usa ese nombre solo.`;

    const userPrompt = `Traduce la siguiente regla a JSON estructurado:\n\n${naturalLanguage}`;

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://autoescuela-camacho.app',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`AI translation failed: ${response.status} ${text}`);
        return {
          success: false,
          error: `Error del servicio de IA: ${response.status}`,
        };
      }

      const data = await response.json();
      const content = String(data.choices?.[0]?.message?.content ?? '');

      const cleaned = content
        .replace(/```json?\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned) as StructuredRule;

      // Basic structure validation
      if (!Array.isArray(parsed.conditions)) {
        return {
          success: false,
          error: 'La respuesta de IA no contiene un array de conditions válido',
        };
      }

      return { success: true, data: parsed };
    } catch (error) {
      this.logger.error(`AI translation error: ${error}`);
      return {
        success: false,
        error: 'Error al traducir la regla con IA. Inténtalo de nuevo.',
      };
    }
  }

  // ──────────────────────────────────────────────
  //  Generation Rule Translation (NL → schedule data)
  // ──────────────────────────────────────────────

  async translateGenerationRule(
    naturalLanguage: string,
    teacherNames?: string[],
  ): Promise<AiGenerationTranslationResult> {
    const teacherList = teacherNames?.length
      ? `\nProfesores disponibles: [${teacherNames.map((n) => `"${n}"`).join(', ')}]\n\nSi el texto dice "todos los profesores", "todo el mundo", "toda la plantilla", "todos", u otra expresión que indique que aplica a TODOS los profesores, genera items para CADA UNO de los profesores disponibles listados arriba.`
      : '';

    const systemPrompt = `Eres un asistente que extrae información de horarios de profesores de autoescuela a partir de texto en lenguaje natural.

Extrae los siguientes datos y devuelve SOLO un JSON válido sin markdown ni explicaciones:

{
  "schedule": [
    {
      "teacher": "Nombre completo del profesor",
      "daysOfWeek": [1,2,3,4,5],  // 0=domingo, 1=lunes... 6=sábado
      "startTime": "08:00",
      "endTime": "15:00",
      "track": "pista"  // opcional: "pista", "circulacion", null si no se especifica
    }
  ],
  "action": "doubleBooking"  // SOLO si el texto menciona "doble sesión", "clases dobles", "double", "clases de 90 min". Si NO menciona nada de esto, NO incluyas el campo action.
}

Reglas:
- Si el texto menciona "lunes a viernes" o "entre semana", usa [1,2,3,4,5]
- Si menciona "finde" o "fin de semana", usa [0,6]
- Si menciona días específicos, usa solo esos días
- Si no se especifican días, asume lunes a viernes [1,2,3,4,5]
- track es opcional: si menciona "pista", "circuito", "maniobras" → "pista"; si menciona "circulación", "calle" → "circulacion"
- Si el texto menciona "todos los tracks" o no especifica, track debe ser null
- startTime y endTime en formato HH:mm (24h)
- Resuelve nombres de profesores completos: si el texto dice "Luis", devuelve "Luis López"; si dice "Mario", "Mario García"; etc.${teacherList}
- action: SOLO incluye "doubleBooking" si el texto menciona EXPLÍCITAMENTE "doble sesión", "clases dobles", "sesión doble", "doble". Si el texto solo habla del horario normal del profesor, NO incluyas action.
- Si no puedes determinar algún campo obligatorio, devuelve error en "error" con descripción`;

    const userPrompt = `Texto del usuario: "${naturalLanguage}"`;

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://autoescuela-camacho.app',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(
          `AI generation translation failed: ${response.status} ${text}`,
        );
        return {
          schedule: [],
          error: `Error del servicio de IA: ${response.status}`,
        };
      }

      const data = await response.json();
      const content = String(data.choices?.[0]?.message?.content ?? '');

      const cleaned = content
        .replace(/```json?\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned) as AiGenerationTranslationResult;

      // Basic structure validation
      if (!Array.isArray(parsed.schedule)) {
        return {
          schedule: [],
          error: 'La respuesta de IA no contiene un array schedule válido',
        };
      }

      // Validate each item
      for (const item of parsed.schedule) {
        if (!item.teacher || !Array.isArray(item.daysOfWeek) || !item.startTime || !item.endTime) {
          return {
            schedule: [],
            error: 'La respuesta de IA contiene campos incompletos',
          };
        }
      }

      return parsed;
    } catch (error) {
      this.logger.error(`AI generation translation error: ${error}`);
      return {
        schedule: [],
        error: 'Error al traducir la regla de generación con IA. Inténtalo de nuevo.',
      };
    }
  }
}
