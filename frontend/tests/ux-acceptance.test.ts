import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const employee = {
  email: 'employee1@company.example',
  password: 'facilityflow-employee',
  role: 'Employee'
};
const administrator = {
  email: 'admin1@facilityflow.demo',
  password: 'facilityflow-admin',
  role: 'Facility Administrator'
};

async function signIn(page: Page, account: typeof employee) {
  await page.goto('/');
  await page.locator('#login-role').selectOption(account.role);
  await page.locator('#login-email').fill(account.email);
  await page.locator('#login-password').fill(account.password);
  await page.getByRole('button', { name: 'Open issue desk' }).click();
  }

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
}

test.describe('FacilityFlow browser UX', () => {
  test('employee can report and inspect a read-only issue', async ({ page }) => {
    await signIn(page, employee);

    await expect(page.getByText('Employee workspace' , { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Good morning,/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Report an issue/ })).toBeVisible();

    await page.getByRole('button', { name: /Report an issue/ }).click();
    await expect(page.getByRole('heading', { name: "Tell us what's happening." })).toBeVisible();
    await page.locator('#issue-description').fill('Playwright test report for the employee workspace');
    await page.locator('#issue-category').selectOption('Electrical');
    await page.locator('#issue-priority').selectOption('High');
    await page.getByRole('button', { name: /Send report/ }).click();

    await expect(page.getByRole('status')).toContainText('Your issue is on its way.');
    await expect(page.getByText('Playwright test report for the employee workspace').first()).toBeVisible();
    await expect(page.getByText('This report is read-only after submission.')).toBeVisible();
    await expect(page.getByText('Administrator controls')).toHaveCount(0);
  });

  test('administrator can search the queue and progressively reveal controls', async ({ page }) => {
    await signIn(page, administrator);

    await expect(page.getByText('Facility Administrator workspace')).toBeVisible();
    await expect(page.getByRole('heading', { name: "Good morning. Here's what needs your attention." })).toBeVisible();
    await expect(page.getByText('Operational queue')).toBeVisible();
    await expect(page.locator('#issue-search')).toBeVisible();
    await expect(page.locator('[data-filter="Open"]')).toBeVisible();

    await page.locator('#issue-search').fill('Electrical');
    await expect(page.locator('.record-count')).toContainText('shown');
    await page.locator('[data-issue]').first().click();
    await expect(page.getByText('Administrator controls')).toBeVisible();
    await expect(page.locator('#admin-form')).toBeHidden();
    await page.getByText('Administrator controls').click();
    await expect(page.locator('#admin-form')).toBeVisible();
  });

  test('both workspaces have no horizontal overflow and support keyboard focus', async ({ page }) => {
    await signIn(page, employee);
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: /Report an issue/ }).focus();
    await expect(page.getByRole('button', { name: /Report an issue/ })).toBeFocused();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await signIn(page, administrator);
    await expectNoHorizontalOverflow(page);
    await page.locator('#issue-search').focus();
    await expect(page.locator('#issue-search')).toBeFocused();
  });

  test('meets the automated accessibility checks and reduced-motion contract', async ({ page }) => {
    await signIn(page, employee);
    const accessibilityScan = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScan.violations).toEqual([]);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedMotion = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(reducedMotion).toBe('auto');
  });
});
