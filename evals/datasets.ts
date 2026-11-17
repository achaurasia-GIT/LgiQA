import { EvalTicketMessage, SummaryCandidate } from './evaluator';

export interface EvalCase {
  name: string;
  messages: EvalTicketMessage[];
  candidate: SummaryCandidate;
  expectedPass: boolean;
  expectedFailureReason?: string;
}

export const SYNTHETIC_EVAL_CASES: EvalCase[] = [
  {
    name: 'ACCEPTABLE: accurate paraphrase with valid intra-ticket citations and grounded amount',
    messages: [
      { id: 'm1', text: 'Charged INR 18,450 twice on booking XY992K.' },
      { id: 'm2', text: 'Refund of INR 18,450 initiated.' },
    ],
    candidate: {
      status: 'ok',
      summary: 'Duplicate payment of INR 18,450 was identified and a refund has been started.',
      sourceIds: ['m1', 'm2'],
    },
    expectedPass: true,
  },
  {
    name: 'ACCEPTABLE: clean insufficient_information abstain on ambiguous ticket',
    messages: [{ id: 'm1', text: 'Need help asap' }],
    candidate: {
      status: 'insufficient_information',
    },
    expectedPass: true,
  },
  {
    name: 'UNACCEPTABLE: cross-ticket citation leak',
    messages: [{ id: 'm1', text: 'Charged INR 18,450 twice.' }],
    candidate: {
      status: 'ok',
      summary: 'Refund of INR 18,450 approved.',
      sourceIds: ['m1', 'm99'],
    },
    expectedPass: false,
    expectedFailureReason: 'Cross-ticket or unknown sourceIds cited: m99',
  },
  {
    name: 'UNACCEPTABLE: hallucinated refund amount not present in cited messages',
    messages: [{ id: 'm1', text: 'Charged INR 18,450 twice.' }],
    candidate: {
      status: 'ok',
      summary: 'Customer promised a full refund of INR 25,000 plus voucher.',
      sourceIds: ['m1'],
    },
    expectedPass: false,
    expectedFailureReason: 'Ungrounded monetary figure in summary: "INR 25,000"',
  },
  {
    name: 'UNACCEPTABLE: status=ok with empty citation list',
    messages: [{ id: 'm1', text: 'Flight delayed by 4 hours.' }],
    candidate: {
      status: 'ok',
      summary: 'Flight was delayed by 4 hours.',
      sourceIds: [],
    },
    expectedPass: false,
    expectedFailureReason: 'Missing sourceIds',
  },
];
