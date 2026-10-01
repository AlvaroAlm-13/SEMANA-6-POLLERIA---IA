export type MessageIntent =
  | 'hours'
  | 'order'
  | 'delivery_time'
  | 'payment'
  | 'complaint'
  | 'unknown';

export interface IncomingWhatsappMessage {
  id?: string;
  phone?: string;
  text: string;
  type?: 'text';
}

export interface WhatsAppWebhookBody {
  from?: string;
  customerPhone?: string;
  customerName?: string;
  message?: IncomingWhatsappMessage;
  text?: string;
}

export interface AgentResponse {
  ok: boolean;
  intent: MessageIntent;
  reply: string;
  source: 'db' | 'static' | 'human';
  needsHuman: boolean;
  data?: Record<string, unknown>;
}
