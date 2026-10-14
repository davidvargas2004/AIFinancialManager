# Security review: asesor financiero con IA

## Resumen ejecutivo

Se revisó el flujo de preguntas al asesor financiero, las propuestas de ingresos y
gastos, el aislamiento por `usuarioId` y el transporte del contexto hacia Gemini.
La persistencia de movimientos permanece exclusivamente en el backend y requiere
una confirmación explícita.

## Hallazgos y correcciones

| Severidad | Hallazgo | Corrección | Estado |
|---|---|---|---|
| Alta | El cliente podía enviar los datos completos de una operación para intentar registrarla. | Las propuestas se guardan server-side con token aleatorio, usuario, expiración de 5 minutos y consumo único. La confirmación solo acepta el token. | Corregido |
| Alta | Era posible reutilizar una confirmación o intentar usarla desde otro usuario. | El token se elimina al consumirlo y se valida contra el `usuarioId` autenticado. | Corregido |
| Alta | La pregunta se interpolaba dentro de delimitadores que podían cerrarse con prompt injection. | La pregunta y el contexto se envían dentro de un objeto JSON serializado como datos no confiables. | Corregido |
| Media | Descripciones libres podían llevar UUIDs, correos o números de cuenta al proveedor. | Se aplica redacción recursiva al contexto antes de serializarlo, además de la redacción de respuestas. | Corregido |
| Alta | El modelo podía sugerir escritura automática mediante herramientas/function calling. | Gemini solo devuelve una propuesta; no se configuran herramientas de escritura y el servidor registra únicamente tras confirmación. | Corregido |
| Media | Preguntas vacías, con controles o mayores que el textarea podían llegar al servicio. | Validación backend alineada con `maxlength=2000`, sanitización Unicode y rechazo antes de IA/Prisma. | Corregido |

## Pruebas ejecutadas

```text
cd backend && npm test
12 tests passed

cd backend && node --check src/modules/aiTools/aiService.js
cd backend && node --check src/services/aiServices.js
git diff --check

cd frontend/ai-finacial-manager && npm run lint
Passed with 3 pre-existing warnings

cd frontend/ai-finacial-manager && npm run build
Build succeeded
```

La suite cubre límites del textarea, detección de movimientos, confirmación de
ingresos y gastos, replay, uso de token por otro usuario y confirmaciones
arbitrarias. Las pruebas no contactan Gemini real ni una base de datos real.

## Riesgos residuales

- El almacén de propuestas es memoria local del proceso. En despliegues con varias
  instancias debe reemplazarse por Redis o una tabla persistente con expiración y
  consumo atómico.
- La seguridad del aislamiento depende de que el middleware establezca
  correctamente `req.usuarioId`; ninguna ruta debe aceptar un `usuarioId` enviado
  por el cliente.
- Los logs de infraestructura deben seguir evitando preguntas completas,
  tokens y datos financieros.
