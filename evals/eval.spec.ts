import { test, expect } from '@playwright/test';
import { SYNTHETIC_EVAL_CASES } from './datasets';
import { evaluateSummary } from './evaluator';

test.describe('Deterministic Summary Quality & Safety Evals', () => {
  for (const tc of SYNTHETIC_EVAL_CASES) {
    test(tc.name, () => {
      const result = evaluateSummary(tc.messages, tc.candidate);
      expect(result.passed, `Reasons: ${result.reasons.join('; ')}`).toBe(tc.expectedPass);

      if (!tc.expectedPass && tc.expectedFailureReason) {
        expect(result.reasons.join(' | ')).toContain(tc.expectedFailureReason);
      }
    });
  }
});
