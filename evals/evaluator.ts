export interface EvalTicketMessage {
  id: string;
  text: string;
}

export interface SummaryCandidate {
  status: 'ok' | 'insufficient_information';
  summary?: string;
  sourceIds?: string[];
}

export interface EvalResult {
  passed: boolean;
  reasons: string[];
}

export function evaluateSummary(
  ticketMessages: EvalTicketMessage[],
  candidate: SummaryCandidate
): EvalResult {
  const reasons: string[] = [];

  if (candidate.status === 'insufficient_information') {
    if (candidate.summary || (candidate.sourceIds && candidate.sourceIds.length > 0)) {
      reasons.push('insufficient_information payload must not include summary text or sourceIds');
    }
    return { passed: reasons.length === 0, reasons };
  }

  // 1. Source attribution check
  const messageMap = new Map(ticketMessages.map((m) => [m.id, m.text]));
  const sourceIds = candidate.sourceIds ?? [];

  if (sourceIds.length === 0) {
    reasons.push('Missing sourceIds: at least one valid ticket message must be cited');
  }

  const invalidIds = sourceIds.filter((id) => !messageMap.has(id));
  if (invalidIds.length > 0) {
    reasons.push(`Cross-ticket or unknown sourceIds cited: ${invalidIds.join(', ')}`);
  }

  // 2. Financial & entity grounding check (prevents hallucinated refund amounts/PNRs)
  const summaryText = candidate.summary ?? '';
  if (!summaryText.trim()) {
    reasons.push('Summary text is empty for status=ok');
  }

  const citedCorpus = sourceIds
    .map((id) => messageMap.get(id) ?? '')
    .join(' ')
    .toLowerCase();

  const currencyMatches = summaryText.match(/(?:inr|₹)\s?[\d,]+(?:\.\d+)?/gi) ?? [];
  for (const amount of currencyMatches) {
    const normalized = amount.toLowerCase().replace(/\s+/g, ' ');
    if (!citedCorpus.includes(normalized)) {
      reasons.push(`Ungrounded monetary figure in summary: "${amount}" not found in cited messages`);
    }
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}
