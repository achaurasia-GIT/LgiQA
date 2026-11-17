import { test as base, Route } from '@playwright/test';
import { TicketWorkbenchPage } from '../pages/ticket.page';

export interface SummaryMockResponse {
  status: number;
  body: Record<string, unknown>;
}

type SupportFixtures = {
  workbench: TicketWorkbenchPage;
  mockSummaryEndpoint: (ticketId: string, responses: SummaryMockResponse[]) => Promise<void>;
};

export const test = base.extend<SupportFixtures>({
  workbench: async ({ page }, use) => {
    const workbench = new TicketWorkbenchPage(page);
    await use(workbench);
  },

  // Worker-isolated route interceptor: safe for full parallel execution
  mockSummaryEndpoint: async ({ page }, use) => {
    const registerMock = async (ticketId: string, responses: SummaryMockResponse[]) => {
      let callCount = 0;
      await page.route(`**/api/tickets/${ticketId}/summary`, async (route: Route) => {
        const current = responses[Math.min(callCount, responses.length - 1)];
        callCount += 1;
        await route.fulfill({
          status: current.status,
          contentType: 'application/json',
          body: JSON.stringify(current.body),
        });
      });
    };
    await use(registerMock);
  },
});

export { expect } from '@playwright/test';
