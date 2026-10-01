import { query } from '../config/db';
import { AgentResponse, IncomingWhatsappMessage, MessageIntent } from '../types/whatsapp';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const readStoreHours = async (): Promise<{ opening: string; closing: string }> => {
  try {
    const result = await query<{ value: { opening: string; closing: string } }>(
      "SELECT value FROM store_config WHERE key = 'store_hours' LIMIT 1"
    );

    if (result.rows.length > 0) {
      return result.rows[0].value;
    }
  } catch (error) {
    console.warn('No se pudo consultar store_config, usando fallback:', error);
  }

  return { opening: '11:00', closing: '22:00' };
};

const readDeliveryTime = async (zoneName: string): Promise<string> => {
  try {
    const result = await query<{ value: Record<string, unknown> }>(
      "SELECT value FROM delivery_zones WHERE zone_name = $1 LIMIT 1",
      [zoneName]
    );

    if (result.rows.length > 0) {
      const value = result.rows[0].value as { minutes: number };
      return `${value.minutes} minutos`;
    }
  } catch (error) {
    console.warn('No se pudo consultar delivery_zones, usando fallback:', error);
  }

  return '35 minutos';
};

const readProduct = async (productName: string): Promise<{ id: number; name: string; unit_price: number } | null> => {
  try {
    const result = await query<{ id: number; name: string; unit_price: number }>(
      "SELECT id, name, unit_price FROM products WHERE lower(name) LIKE $1 LIMIT 1",
      [`%${productName.toLowerCase()}%`]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.warn('No se pudo consultar productos, usando fallback:', error);
  }

  return null;
};

const detectIntent = (text: string): MessageIntent => {
  if (/(hora|abren|cierra|cierran|cerrar|horario)/.test(text)) return 'hours';
  if (/(pollo|papas|gaseosa|pedido|delivery|orden|agregar)/.test(text)) return 'order';
  if (/(parcona|demora|tiempo|llega|entrega)/.test(text)) return 'delivery_time';
  if (/(yape|pago|pague|captura|banco)/.test(text)) return 'payment';
  if (/(frio|fria|dinero|reembolso|devuel|molesto|queja)/.test(text)) return 'complaint';
  return 'unknown';
};

export async function processIncomingMessage(
  message: IncomingWhatsappMessage
): Promise<AgentResponse> {
  const text = normalize(message.text ?? '');
  const intent = detectIntent(text);

  if (!text) {
    return {
      ok: false,
      intent: 'unknown',
      reply: 'No recibí un mensaje válido. Escríbeme el pedido o la consulta que necesitas.',
      source: 'static',
      needsHuman: false,
    };
  }

  if (intent === 'hours') {
    const storeHours = await readStoreHours();
    return {
      ok: true,
      intent: 'hours',
      reply: `Nosotros atendemos de ${storeHours.opening} a ${storeHours.closing}. Si quieres, también puedo tomar tu pedido ahora mismo.`,
      source: 'db',
      needsHuman: false,
      data: { storeHours },
    };
  }

  if (intent === 'order') {
    const productMatches = [
      'pollo',
      'papas',
      'gaseosa',
      'pollo entero',
      'entero',
    ]
      .map((keyword) => ({ keyword, product: readProduct(keyword) }))
      .filter((item) => item.product !== null);

    const draftItems = await Promise.all(
      productMatches.map(async (item) => {
        const product = await item.product;
        return product ? { productId: product.id, product: product.name, unitPrice: product.unit_price } : null;
      })
    );

    const validItems = draftItems.filter(Boolean) as Array<{
      productId: number;
      product: string;
      unitPrice: number;
    }>;

    if (validItems.length > 0) {
      const total = validItems.reduce((sum, item) => sum + item.unitPrice, 0);
      return {
        ok: true,
        intent: 'order',
        reply: `He tomado tu pedido preliminar: ${validItems
          .map((item) => item.product)
          .join(', ')}. El monto estimado es S/. ${total}. ¿Deseas confirmar delivery y pago?`,
        source: 'db',
        needsHuman: false,
        data: { items: validItems, total },
      };
    }

    return {
      ok: true,
      intent: 'order',
      reply: 'Puedo ayudarte a tomar el pedido. Mándame el producto y la cantidad, por ejemplo: “1 pollo entero con papas y una gaseosa de litro”.',
      source: 'static',
      needsHuman: false,
    };
  }

  if (intent === 'delivery_time') {
    const zoneTime = await readDeliveryTime('Parcona');
    return {
      ok: true,
      intent: 'delivery_time',
      reply: `La entrega a Parcona demora aproximadamente ${zoneTime}.`,
      source: 'db',
      needsHuman: false,
      data: { zone: 'Parcona', minutes: zoneTime },
    };
  }

  if (intent === 'payment') {
    return {
      ok: true,
      intent: 'payment',
      reply: 'Gracias por confirmar el pago. Si ya pagaste por Yape, envía la captura por WhatsApp y te lo validamos enseguida.',
      source: 'static',
      needsHuman: false,
    };
  }

  if (intent === 'complaint') {
    return {
      ok: true,
      intent: 'complaint',
      reply: 'Lamentamos lo ocurrido. Voy a derivar tu caso a un humano para revisar la devolución o reclamo.',
      source: 'human',
      needsHuman: true,
    };
  }

  return {
    ok: true,
    intent: 'unknown',
    reply: 'Puedo ayudarte con horarios, pedidos y delivery. Escríbeme por ejemplo: “Quiero un pollo entero con papas” o “¿Cuánto tarda a Parcona?”.',
    source: 'static',
    needsHuman: false,
  };
}
