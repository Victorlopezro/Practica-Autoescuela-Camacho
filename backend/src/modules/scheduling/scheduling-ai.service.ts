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
}
