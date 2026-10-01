import { Router } from 'express';
import { processIncomingMessage } from '../services/agentService';
import { WhatsAppWebhookBody } from '../types/whatsapp';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'whatsapp-agent', status: 'healthy' });
});

router.post('/webhook', async (req, res) => {
  const payload = req.body as WhatsAppWebhookBody;
  const incomingText = payload.text ?? payload.message?.text ?? '';

  const response = await processIncomingMessage({
    id: payload.message?.id ?? 'msg-demo',
    phone: payload.from ?? payload.customerPhone ?? '+51999999999',
    text: incomingText,
  });

  res.json({ ok: true, payload, response });
});

router.post('/simulate', async (req, res) => {
  const { messages } = req.body as {
    messages: Array<{ id?: string; phone?: string; text: string }>;
  };

  const results = await Promise.all(
    (messages ?? []).map(async (entry) => {
      const response = await processIncomingMessage({
        id: entry.id ?? 'simulated',
        phone: entry.phone ?? '+51999999999',
        text: entry.text,
      });

      return {
        input: entry,
        response,
      };
    })
  );

  res.json({ ok: true, results });
});

export default router;
