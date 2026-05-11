**Problemas técnicos y operativos adicionales realistas**

**1. Falta de datos estructurados (probablemente el mayor problema)**

Esto afecta especialmente a:

- IA predictiva. 
- Teórica adaptativa. 
- Estadísticas de alumnos. 
- Automatizaciones inteligentes. 

**Problema real**

Muchas autoescuelas tienen:

- Excel desordenados. 
- Datos incompletos. 
- Información en papel. 
- Sistemas antiguos. 
- Datos duplicados. 
- Falta de histórico. 

**Consecuencia**

La IA no puede “inventar” patrones si no hay datos suficientes.

**Qué decir**

“La IA depende mucho de la calidad y cantidad de datos históricos disponibles.”

-----
**2. Integración con software existente**

**Posible problema**

La empresa puede usar:

- software cerrado, 
- antiguo, 
- sin API, 
- o directamente no tener sistema digital. 

**Riesgo**

No podrás integrar automáticamente:

- reservas, 
- facturación, 
- alumnos, 
- horarios, 
- pagos. 

**Consecuencia**

Tendrías que:

- rehacer procesos manualmente, 
- importar/exportar CSV, 
- o crear sistemas paralelos. 
-----
**3. Hosting / despliegue / servidor**

Muchas veces esto no se contempla.

**Problema**

Aunque uses software open source:

- alguien tiene que alojarlo, 
- mantenerlo, 
- actualizarlo, 
- y hacer copias de seguridad. 

**Posibles costes ocultos**

Aunque el software sea gratis:

- VPS/servidor cloud. 
- dominio. 
- SSL. 
- backups. 
- almacenamiento. 

**Realidad**

Open source ≠ gratis en producción.

-----
**4. Modelos IA locales y hardware**

**Problema importante**

Si quieren:

- chatbot, 
- IA adaptativa, 
- análisis inteligente, 
- respuestas automáticas, 

entonces necesitas:

- modelos IA, 
- inferencia, 
- recursos hardware. 

**Problema realista**

Modelos open source:

- consumen RAM, 
- GPU, 
- CPU, 
- almacenamiento. 

**Consecuencia**

En local puede ir lento o ser inviable.

**Alternativa**

APIs externas:

- OpenAI, 
- Claude, 
- Gemini, 
- etc. 

Pero entonces:

- ya no es completamente gratuito. 
-----
**5. WhatsApp: problema técnico + legal**

Además del coste, hay más problemas.

**Problema importante**

Meta no quiere automatización “no oficial”.

**Riesgos**

Herramientas no oficiales pueden:

- romperse, 
- bloquear números, 
- incumplir términos. 

**Consecuencia**

Si quieres algo estable:

- probablemente necesiten API oficial. 

Y eso:

- cuesta dinero, 
- requiere validación, 
- y mantenimiento. 
-----
**6. RGPD y protección de datos**

Muy importante.

**Están manejando:**

- nombres, 
- teléfonos, 
- exámenes, 
- progreso, 
- pagos, 
- posiblemente datos sensibles. 

**Problema**

Si haces:

- IA, 
- automatizaciones, 
- almacenamiento cloud, 
- WhatsApp, 

hay implicaciones legales.

**Riesgos**

- consentimiento. 
- almacenamiento inseguro. 
- accesos sin control. 
- datos en servicios externos. 
-----
**7. Tiempo real vs realidad de 90 horas**

Muy importante que lo entiendan.

**Problema**

La lista inicial parece un producto SaaS completo.

No un proyecto corto de prácticas.

**Riesgo**

Intentar hacer:

- chatbot, 
- IA, 
- facturación, 
- reservas, 
- WhatsApp, 
- agenda, 
- CRM, 
- mantenimiento, 
- teórica adaptativa 

en 90h probablemente termine en:

- muchas demos incompletas, 
- nada terminado del todo. 
-----
**8. Mantenimiento futuro**

Pregunta muy importante.

**Problema**

Después de las prácticas:

- ¿quién mantendrá el sistema? 
- ¿quién arreglará errores? 
- ¿quién actualizará dependencias? 

**Especialmente problemático con:**

- IA. 
- APIs externas. 
- automatizaciones. 
- WhatsApp. 
-----
**9. Calidad de automatización**

**Problema**

Automatizar mal puede:

- enviar mensajes erróneos, 
- duplicar avisos, 
- generar citas incorrectas. 

**Consecuencia**

Necesitas:

- validaciones, 
- logs, 
- control manual, 
- pruebas. 

Eso consume tiempo.

-----
**10. Dependencia de terceros**

Aunque uses open source, muchas cosas dependen de terceros.

**Ejemplos**

**WhatsApp**

Depende de Meta.

**Emails**

Depende de SMTP/proveedores.

**Hosting**

Depende del servidor.

**IA externa**

Depende de APIs.

-----
**11. OCR/documentos (si aparece después)**

Muchas empresas luego quieren:

- subir PDFs, 
- carnets, 
- documentos, 
- contratos. 

**Problema**

OCR open source existe:

- Tesseract, 
- OCRmyPDF, 

pero:

- no siempre funciona bien, 
- necesita limpieza, 
- consume tiempo. 
-----
**12. Seguridad**

**Riesgo real**

Si haces:

- login, 
- panel de alumnos, 
- WhatsApp, 
- datos personales, 

entonces necesitas:

- autenticación, 
- permisos, 
- cifrado, 
- backups. 

**Problema**

La seguridad consume mucho tiempo aunque uses frameworks modernos.

-----
**13. Complejidad de agenda inteligente**

La palabra “inteligente” puede crecer muchísimo.

**Pregunta clave**

¿Solo quieren:

- calendario y reservas? 

¿O quieren:

- optimización automática? 
- evitar huecos? 
- asignación automática de profesores? 
- rutas? 

Porque eso cambia totalmente el proyecto.

-----
**14. Calidad del banco de tests**

Para IA adaptativa necesitas:

- preguntas clasificadas. 
- categorías. 
- dificultad. 
- métricas. 

**Problema real**

Muchas veces:

- no está organizado, 
- o directamente no existe digitalizado. 
-----
**Recomendación realista para ti**

**Lo más viable técnicamente**

**MVP realista**

- Agenda y reservas. 
- Gestión básica alumnos. 
- Recordatorios automáticos. 
- Dashboard simple. 
- Base preparada para IA futura. 
-----
**Lo que probablemente NO deberías comprometerte a hacer completo en 90h**

- Comercial IA 24/7 serio. 
- IA predictiva avanzada. 
- Sistema teórico adaptativo completo. 
- CRM completo. 
- Automatización total WhatsApp. 
- Facturación profesional completa.

