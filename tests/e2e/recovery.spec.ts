import { test, expect } from '@playwright/test';

test('recovery preview, downstream tradeoff, atomic apply, persistence and safe undo', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Demo' }).click();
  await page.getByRole('button', { name: 'Explore recovery planner' }).click();
  await expect(
    page.getByRole('heading', { name: 'Delivery planner', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('proposed-capacity')).toContainText('6');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByLabel('Proposed due date')).toHaveValue('2026-10-30');
  await page.getByLabel('Employee to add or rebalance').selectOption('usr-6');
  await page.getByLabel('Allocation approach').selectOption('prj-6');
  await page.getByLabel('Proposed due date').fill('2026-10-30');
  await expect(page.getByTestId('proposed-gap')).toHaveText('0h gap');
  await expect(page.getByRole('status')).toContainText('loses capacity');
  await expect(
    page.getByRole('region', { name: 'Scenario impact table' }),
  ).toContainText('Partner onboarding');
  expect(
    await page.evaluate(() => localStorage.getItem('northstar-demo-v1')),
  ).toBeNull();
  await page
    .getByLabel('Decision rationale')
    .fill(
      'Protect the portal deadline and review the onboarding tradeoff with its owner.',
    );
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: 'docs/portfolio/screenshots/delivery-recovery-planner.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Review & apply plan' }).click();
  await expect(page.getByRole('dialog')).toContainText('1 lose capacity');
  await page.getByRole('button', { name: 'Confirm recovery plan' }).click();
  await expect(page.getByRole('status')).toContainText('Recovery plan applied');
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('northstar-demo-v1')!),
  );
  expect(saved.projects.find((p: { id: string }) => p.id === 'prj-1').due).toBe(
    '2026-10-30',
  );
  expect(
    saved.projects.find((p: { id: string }) => p.id === 'prj-6').assignees,
  ).not.toContain('usr-6');
  expect(saved.recoveryPlans).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel('Proposed due date')).toHaveValue('2026-10-30');
  await expect(page.locator('.decision-row')).toContainText(
    'Protect the portal deadline',
  );
  await page.getByRole('button', { name: 'Undo plan' }).click();
  await page.getByRole('button', { name: 'Confirm undo' }).click();
  await expect(page.getByLabel('Proposed due date')).toHaveValue('2026-10-20');
  await expect(page.locator('.decision-row')).toContainText('Undone');
  await page.getByLabel('Proposed due date').fill('2026-10-30');
  await page
    .getByLabel('Decision rationale')
    .fill('Extend the deadline after reviewing all shared assignments.');
  await page.getByRole('button', { name: 'Review & apply plan' }).click();
  await page.getByRole('button', { name: 'Confirm recovery plan' }).click();
  await page
    .locator('nav')
    .getByRole('button', { name: 'Projects', exact: true })
    .click();
  await page.getByLabel('Search projects').fill('Customer portal');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByLabel('Project name')
    .fill('Portal with a newer approved name');
  await page.getByRole('button', { name: 'Save project' }).click();
  await page
    .locator('nav')
    .getByRole('button', { name: 'Delivery planner', exact: true })
    .click();
  await page.getByRole('button', { name: 'Undo plan' }).click();
  await page.getByRole('button', { name: 'Confirm undo' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'newer edits' }),
  ).toContainText('newer edits');
  await page
    .locator('nav')
    .getByRole('button', { name: 'Roles & permissions', exact: true })
    .click();
  await page.getByLabel('Preview role').selectOption('Viewer');
  await page
    .locator('nav')
    .getByRole('button', { name: 'Delivery planner', exact: true })
    .click();
  await page.getByLabel('Proposed due date').fill('2026-11-02');
  await page
    .getByLabel('Decision rationale')
    .fill('Preview only while browsing as a viewer.');
  await expect(
    page.getByRole('button', { name: 'Review & apply plan' }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Undo plan' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('planner mobile, dark mode, date analysis and empty workload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Demo' }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .locator('nav')
    .getByRole('button', { name: 'Delivery planner', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Delivery watchlist' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel('Proposed due date').fill('2026-10-30');
  await page
    .getByLabel('Decision rationale')
    .fill('Compare a mobile recovery scenario before applying.');
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: 'docs/portfolio/screenshots/mobile-delivery-planner.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification' });
  if (await dismiss.count()) await dismiss.click();
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: 'docs/portfolio/screenshots/delivery-planner-dark.png',
    fullPage: true,
  });
  await page.getByLabel('Analysis date').fill('2026-11-02');
  await expect(page.getByTestId('proposed-capacity')).toHaveText('0h capacity');
  await page.getByText('How are these estimates calculated?').click();
  await expect(
    page.getByRole('heading', { name: 'Capacity without double-counting' }),
  ).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('northstar-demo-v1')!);
    s.projects = s.projects.map((p: object) => ({
      ...p,
      status: 'Completed',
      progress: 100,
    }));
    localStorage.setItem('northstar-demo-v1', JSON.stringify(s));
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'No scheduled work to plan' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open projects' }),
  ).toBeEnabled();
});
