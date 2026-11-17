import { test, expect } from './fixtures/support.fixture';

test.describe('AI Ticket Summary Release Gate', () => {
  test('generates a valid summary with intra-ticket citations and allows agent approval', async ({
    workbench,
    mockSummaryEndpoint,
  }) => {
    await mockSummaryEndpoint('T-101', [
      {
        status: 200,
        body: {
          status: 'ok',
          summary: 'Duplicate charge of INR 18,450 confirmed and refund initiated.',
          sourceIds: ['m1', 'm3'],
        },
      },
    ]);

    await workbench.goto();
    await workbench.openTicket('T-101');
    await workbench.generateBtn.click();

    await expect(workbench.summaryOutput).toContainText('Duplicate charge of INR 18,450 confirmed');
    await expect(workbench.summaryOutput).toContainText('Sources: m1, m3');
    await expect(workbench.approveBtn).toBeEnabled();

    await workbench.approveBtn.click();
    await expect(workbench.approvalConfirmed).toBeVisible();
    await expect(workbench.approveBtn).toBeDisabled();
  });

  test('displays insufficient-information state and keeps approval disabled', async ({
    workbench,
    mockSummaryEndpoint,
  }) => {
    await mockSummaryEndpoint('T-102', [
      {
        status: 200,
        body: { status: 'insufficient_information' },
      },
    ]);

    await workbench.goto();
    await workbench.openTicket('T-102');
    await workbench.generateBtn.click();

    await expect(workbench.feedbackArea).toContainText('Insufficient information');
    await expect(workbench.approveBtn).toBeDisabled();
    await expect(workbench.retryBtn).toBeHidden();
  });

  test('handles 503 outage, keeps approval disabled, and recovers on retry', async ({
    workbench,
    mockSummaryEndpoint,
  }) => {
    await mockSummaryEndpoint('T-101', [
      { status: 503, body: { error: 'unavailable' } },
      {
        status: 200,
        body: {
          status: 'ok',
          summary: 'Refund of INR 18,450 processed for duplicate PNR XY992K charge.',
          sourceIds: ['m3'],
        },
      },
    ]);

    await workbench.goto();
    await workbench.openTicket('T-101');
    await workbench.generateBtn.click();

    // Outage state assertions
    await expect(workbench.feedbackArea).toContainText('Service unavailable (503)');
    await expect(workbench.retryBtn).toBeVisible();
    await expect(workbench.approveBtn).toBeDisabled();

    // Recovery on retry
    await workbench.retryBtn.click();
    await expect(workbench.summaryOutput).toContainText('Refund of INR 18,450 processed');
    await expect(workbench.retryBtn).toBeHidden();
    await expect(workbench.approveBtn).toBeEnabled();
  });

  test('blocks approval when summary has missing citations', async ({
    workbench,
    mockSummaryEndpoint,
  }) => {
    await mockSummaryEndpoint('T-101', [
      {
        status: 200,
        body: {
          status: 'ok',
          summary: 'Customer wants a refund.',
          sourceIds: [],
        },
      },
    ]);

    await workbench.goto();
    await workbench.openTicket('T-101');
    await workbench.generateBtn.click();

    await expect(workbench.feedbackArea).toContainText('Summary blocked');
    await expect(workbench.approveBtn).toBeDisabled();
  });

  test('blocks approval when summary cites cross-ticket message IDs', async ({
    workbench,
    mockSummaryEndpoint,
  }) => {
    const simulateBug = process.env.SIMULATE_CITATION_BUG === 'true';

    await mockSummaryEndpoint('T-101', [
      {
        status: 200,
        body: {
          status: 'ok',
          summary: 'GST invoice portal returned 500 error.',
          sourceIds: ['m50'], // m50 belongs to T-202, NOT T-101
        },
      },
    ]);

    await workbench.goto(simulateBug);
    await workbench.openTicket('T-101');
    await workbench.generateBtn.click();

    await expect(workbench.feedbackArea).toContainText('Summary blocked');
    await expect(workbench.approveBtn).toBeDisabled();
  });
});
