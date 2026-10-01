# Agente de WhatsApp para pollería en Chincha

Proyecto base en TypeScript, Express, Bootstrap y PostgreSQL para un agente conversacional que toma pedidos por WhatsApp y responde en formato JSON.

## Stack

- TypeScript
- Node.js + Express
- PostgreSQL
- Bootstrap para la UI
- JSON como contrato entre el agente, el backend y la base de datos

## Estructura principal

- `src/server.ts`: servidor Express
- `src/routes/whatsapp.ts`: endpoints de webhook y simulación
- `src/services/agentService.ts`: lógica del agente y clasificación de mensajes
- `src/config/db.ts`: conexión con PostgreSQL
- `src/db/schema.sql`: esquema inicial de la base de datos
- `public/index.html`: simulador web para probar mensajes

## Requisitos rápidos

1. Tener PostgreSQL corriendo.
2. Crear la base de datos `chincha_polleria`.
3. Configurar `.env` igual a `.env.example`.
4. Ejecutar las migraciones desde `src/db/schema.sql`.
5. Levantar el proyecto.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chincha_polleria
NODE_ENV=development
```

## Comandos

```bash
npm install
npx tsc --noEmit
npm run dev
```

Si quieres un arranque directo con TS en caliente:

```bash
npx tsx watch src/server.ts
```

## Caso de negocio

### 1. Diagrama de flujo del agente

El cliente manda un mensaje por WhatsApp. El backend recibe el JSON, el agente identifica la intención, consulta la base de datos si corresponde, responde al cliente y, si la situación requiere revisión humana, deriva a un operador.

Flujo resumido:

1. Cliente escribe en WhatsApp.
2. WhatsApp entrega el mensaje al backend en formato JSON.
3. El backend valida el payload.
4. El agente decide si necesita consultar la BD o solo responde con lógica fija.
5. Si la consulta es necesaria, lee la información de productos, horarios o zonas.
6. Genera la respuesta en texto natural.
7. Envía la respuesta al cliente.
8. Si hay reclamo o conflicto, deriva a humano.

### 2. ¿Consulta la base de datos?

- Mensaje 1: "Hola, a qué hora cierran?" -> Sí, consulta horarios. Tabla: `store_config`.
- Mensaje 2: "Quiero 1 pollo entero con papas y una gaseosa de litro, delivery" -> Sí, consulta productos para validar stock y precio. Tabla: `products`.
- Mensaje 3: "Cuánto demora a Parcona?" -> Sí, consulta zona de entrega. Tabla: `delivery_zones`.
- Mensaje 4: "Ya pagué por Yape, ahí te mando la captura" -> Puede consultar `payments` y `orders` para validar pago y actualizar estado. Si la captura aún no se confirma, requiere revisión humana.
- Mensaje 5: "Mi pedido llegó frío, quiero mi dinero" -> Sí, necesita consultar `orders`, `payments` y probablemente derivar a humano. Debe guardar el reclamo y cambiar estado a revisión.

### 3. Qué hace el backend

- Recibe JSON desde WhatsApp o desde la simulación web.
- Valida el formato del mensaje.
- Identifica la intención del cliente.
- Consulta la base de datos si el caso lo requiere.
- Envía la respuesta al cliente mediante WhatsApp o un canal interno.
- Guarda pedidos, pagos y reclamos en tablas de PostgreSQL.

### 4. Tipo de agente recomendado

Se recomienda un agente conversacional que además puede consultar y usar el sistema de la empresa.

¿Por qué?:
- El negocio necesita tomar pedidos reales, consultar horarios y tiempos de entrega.
- El agente no solo conversa; debe consultar productos, pagos y reclamos.
- Esto permite un flujo de atención útil, no solo un chatbot fijo.

### 5. ¿Hay que entrenarlo?

Sí, pero no como un chatbot estático. Se debe entrenar con datos y reglas de la empresa: horarios, productos, precios, zonas de entrega, políticas de pago y escalamiento a humano.

Se puede hacer de varias formas:

- usando un modelo LLM con contexto del negocio,
- descartando respuestas inventadas,
- validando cada acción con la base de datos,
- utilizando ejemplos reales de mensajes y respuestas.

Se necesitarían:

- catálogo de productos
- precios
- horarios de atención
- zonas de entrega y tiempos
- política de Yape y devoluciones
- tipos de reclamos frecuentes

### 6. ¿Cómo lo pruebas?

Primero se debe probar simulando mensajes en formato JSON. Eso permite:

- validar lógica sin depender de WhatsApp en vivo,
- revisar respuestas del agente y errores del backend,
- construir pruebas automatizadas.

Luego, una vez estable, se conecta a WhatsApp.

Ventajas del JSON simulado:
- rápido
- reproducible
- barato
- fácil de testear

Riesgos:
- no refleja 100% el comportamiento real del canal

Ventajas de WhatsApp directo:
- prueba end-to-end real
- se observa el flujo productivo

Riesgos:
- más costoso
- más frágil si falla integración o hay mensajes duplicados

### 7. ¿Cuándo pasa a un humano?

Debe pasar a un humano cuando:

- hay un reclamo por comida fría o devolución de dinero,
- el cliente niega el pago,
- existe un error de entrega o un pedido incompleto,
- el agente no está seguro del pedido,
- se detecta un conflicto de pago o factura,
- hay insultos, amenazas o situaciones delicadas.

Esto porque esas situaciones requieren criterio humano, empatía y manejo de excepciones.

## GitHub

Puedes inicializar un repositorio Git localmente con:

```bash
git init
git add .
git commit -m "Inicial: infraestructura del agente de WhatsApp"
```

Y luego agregar tu remoto:

```bash
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

Si quieres, este mismo proyecto puede adaptarse a una versión más completa con integraciones reales a WhatsApp Business API y PostgreSQL en producción.
