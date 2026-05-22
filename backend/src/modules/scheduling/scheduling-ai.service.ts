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
  /** Nombres de profesores a los que aplica esta regla (opcional — si no está, aplica a todos) */
  appliesTo?: { teachers: string[] };
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

1. Duración estándar: 45 min (coche) o 30 min (moto pista) o 45 min (moto circulación)
2. Doble sesión (90 min): solo permitida si el profesor tiene doubleSession=true
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
          reason:
            'No se pudo validar con IA — aceptado con precaución',
          riskLevel: 'medium',
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      try {
        // Clean markdown code fences if present
        const cleaned = content
          .replace(/```json?\s*/gi, '')
          .replace(/```/g, '')
          .trim();
        return JSON.parse(cleaned);
      } catch {
        this.logger.warn(`Failed to parse AI response: ${content}`);
        return {
          valid: true,
          reason:
            'Respuesta de IA no válida — aceptado con precaución',
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

Donde "in" recibe un array de valores, los demás reciben un string o número.

RESTRICCIÓN A PROFESORES ESPECÍFICOS (opcional):
Si el texto menciona profesores concretos (ej: "juan y luis", "los profesores juan y luis", "juan perez"), incluye el campo "appliesTo" con un array de NOMBRE COMPLETO de los profesores. Si no menciona profesores, OMITE el campo appliesTo.

Ejemplos:
- "No hay clases el 3 de junio" → NO incluir appliesTo (aplica a todos)
- "Juan y Luis no dan clases el 3 de junio" → { "appliesTo": { "teachers": ["Juan Pérez", "Luis López"] } }
- "El profesor Juan Pérez no trabaja los domingos" → { "appliesTo": { "teachers": ["Juan Pérez"] } }

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
      const content = data.choices?.[0]?.message?.content ?? '';

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
}
