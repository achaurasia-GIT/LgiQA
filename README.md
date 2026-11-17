# qa_exercise — AI Ticket Summary Release Gate

Automated Playwright + TypeScript release gate and deterministic evaluation suite for an AI-assisted support ticket summary workflow.

## Setup Instructions

```bash
cd qa_exercise
npm install
npx playwright install chromium


Run the full passing release gate (UI + Evals in parallel):
npm run test:gate

Run only UI/contract tests or only deterministic evals:
npm run test:e2e
npm run test:eval

Observe an intentional regression failure:
npm run test:regression
npx playwright show-report
