import express from 'express';
import path from 'path';

export interface TicketMessage {
  id: string;
  author: 'customer' | 'agent';
  text: string;
}

export interface Ticket {
  id: string;
  subject: string;
  messages: TicketMessage[];
}

const TICKETS: Record<string, Ticket> = {
  'T-101': {
    id: 'T-101',
    subject: 'Duplicate charge on corporate flight booking',
    messages: [
      { id: 'm1', author: 'customer', text: 'I was charged INR 18,450 twice for booking PNR XY992K.' },
      { id: 'm2', author: 'agent', text: 'Checking payment gateway logs for PNR XY992K.' },
      { id: 'm3', author: 'agent', text: 'Confirmed duplicate auth hold. Refund of INR 18,450 initiated.' },
    ],
  },
  'T-102': {
    id: 'T-102',
    subject: 'Empty follow-up ticket',
    messages: [
      { id: 'm9', author: 'customer', text: 'Hello?' },
    ],
  },
  'T-202': {
    id: 'T-202',
    subject: 'GST invoice download failing',
    messages: [
      { id: 'm50', author: 'customer', text: 'Portal throws 500 error when downloading GST invoice.' },
    ],
  },
};

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/tickets/:ticketId', (req, res) => {
  const ticket = TICKETS[req.params.ticketId];
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  return res.json(ticket);
});

// Default local deterministic AI boundary (overridden in Playwright via page.route for edge cases)
app.post('/api/tickets/:ticketId/summary', (req, res) => {
  const ticket = TICKETS[req.params.ticketId];
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (ticket.id === 'T-102') {
    return res.status(200).json({ status: 'insufficient_information' });
  }

  return res.status(200).json({
    status: 'ok',
    summary: 'Customer reported duplicate INR 18,450 charge on PNR XY992K; refund initiated.',
    sourceIds: ['m1', 'm3'],
  });
});

app.post('/api/tickets/:ticketId/approve', (req, res) => {
  const { summary, sourceIds } = req.body as { summary?: string; sourceIds?: string[] };
  if (!summary || !Array.isArray(sourceIds) || sourceIds.length === 0) {
    return res.status(400).json({ error: 'Invalid approval payload' });
  }
  return res.status(200).json({ approved: true, ticketId: req.params.ticketId });
});

const PORT = Number(process.env.PORT || 4173);
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Support dashboard running on http://127.0.0.1:${PORT}`);
});
