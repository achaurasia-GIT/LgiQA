import { Locator, Page, expect } from '@playwright/test';

export class TicketWorkbenchPage {
  readonly page: Page;
  readonly ticketSelect: Locator;
  readonly openTicketBtn: Locator;
  readonly generateBtn: Locator;
  readonly retryBtn: Locator;
  readonly approveBtn: Locator;
  readonly feedbackArea: Locator;
  readonly summaryOutput: Locator;
  readonly approvalConfirmed: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ticketSelect = page.locator('#ticket-select');
    this.openTicketBtn = page.locator('#load-ticket');
    this.generateBtn = page.locator('#generate-btn');
    this.retryBtn = page.locator('#retry-btn');
    this.approveBtn = page.locator('#approve-btn');
    this.feedbackArea = page.locator('#feedback-area');
    this.summaryOutput = page.getByTestId('summary-output');
    this.approvalConfirmed = page.getByTestId('approval-confirmed');
  }

  async goto(simulateBug = false) {
    const query = simulateBug ? '?bug=1' : '';
    await this.page.goto(`/${query}`);
  }

  async openTicket(ticketId: string) {
    await this.ticketSelect.selectOption(ticketId);
    await this.openTicketBtn.click();
    await expect(this.page.locator('#ticket-title')).toContainText(ticketId);
  }
}
