import { test, expect } from '@playwright/test';
const shots = 'docs/portfolio/screenshots';
test('complete portfolio journey and actual desktop captures', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Enter Demo' })).toBeVisible();
  await page.screenshot({ path: `${shots}/demo-entry.png`, fullPage: true });
  await page.getByRole('button', { name: 'Enter Demo' }).click();
  await expect(page.getByTestId('metric-0')).toHaveText('15');
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `${shots}/dashboard-overview.png`,
    fullPage: true,
  });
  await page
    .locator('nav')
    .getByRole('button', { name: /Employees/ })
    .click();
  await page.getByRole('textbox', { name: 'Search users' }).fill('Avery');
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await page
    .getByRole('combobox', { name: 'Filter records' })
    .selectOption('Operations');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search users' }).fill('');
  await page
    .getByRole('combobox', { name: 'Filter records' })
    .selectOption('All');
  await page.getByRole('button', { name: 'Add employee', exact: true }).click();
  await page.getByLabel('Full name').fill('Demo Colleague');
  await page
    .getByLabel('Email address')
    .fill('demo.colleague@northstar.example');
  await page.getByRole('button', { name: 'Save employee' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('textbox', { name: 'Search users' })
    .fill('Demo Colleague');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Full name').fill('Demo Updated');
  await page.getByRole('button', { name: 'Save employee' }).click();
  await page
    .getByRole('textbox', { name: 'Search users' })
    .fill('Demo Updated');
  await expect(page.locator('tbody')).toContainText('Demo Updated');
  await page.reload();
  await page
    .getByRole('textbox', { name: 'Search users' })
    .fill('Demo Updated');
  await expect(page.locator('tbody')).toContainText('Demo Updated');
  await page.getByRole('textbox', { name: 'Search users' }).fill('');
  await page.screenshot({
    path: `${shots}/user-management.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search projects' })
    .fill('Customer portal');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('Completed');
  await page.getByRole('button', { name: 'Save project' }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.getByTestId('metric-0')).toHaveText('14');
  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await page.screenshot({
    path: `${shots}/project-management.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Analytics', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Report date range' })
    .selectOption('3');
  await expect(page.getByText('3 months')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report' }).click();
  expect((await download).suggestedFilename()).toBe(
    'northstar-sample-report.csv',
  );
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${shots}/analytics.png`, fullPage: true });
  await page
    .getByRole('button', { name: 'Roles & permissions', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Preview role' })
    .selectOption('Viewer');
  await page
    .locator('nav')
    .getByRole('button', { name: /Employees/ })
    .click();
  await expect(
    page.getByRole('button', { name: 'Add employee', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Roles & permissions', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Preview role' })
    .selectOption('Administrator');
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Workspace timeline' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mark all read' }).click();
  await page
    .locator('nav')
    .getByRole('button', { name: 'Settings', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: `${shots}/settings-dark.png`, fullPage: true });
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('light');
  await page.screenshot({ path: `${shots}/settings.png`, fullPage: true });
  await page
    .getByRole('button', { name: 'Reset Demo Data', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.getByTestId('metric-0')).toHaveText('15');
  await expect(page.getByTestId('metric-1')).toHaveText('36');
  for (const [moduleName, file] of [
    ['Overview', 'dashboard-overview'],
    ['Employees', 'user-management'],
    ['Projects', 'project-management'],
    ['Analytics', 'analytics'],
    ['Settings', 'settings'],
  ]) {
    await page
      .locator('nav')
      .getByRole('button', {
        name: moduleName === 'Employees' ? /Employees/ : moduleName,
        exact: moduleName !== 'Employees',
      })
      .click();
    const dismiss = page.getByRole('button', { name: 'Dismiss notification' });
    if (await dismiss.count()) await dismiss.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${shots}/${file}.png`, fullPage: true });
  }
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('dark');
  const darkToast = page.getByRole('button', { name: 'Dismiss notification' });
  if (await darkToast.count()) await darkToast.click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/settings-dark.png`, fullPage: true });
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('light');
  await page
    .locator('nav')
    .getByRole('button', { name: 'About this project', exact: true })
    .click();
  await expect(page.getByText('What you can try')).toBeVisible();
  await page.getByRole('button', { name: 'Exit demo' }).click();
  await expect(page.getByRole('button', { name: 'Enter Demo' })).toBeVisible();
  await page.getByRole('button', { name: 'Enter Demo' }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.getByTestId('metric-0')).toHaveText('15');
  expect(errors).toEqual([]);
});
test('fresh browser, corruption recovery and mobile navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Demo' }).click();
  await expect(page.getByTestId('metric-1')).toHaveText('36');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: 'docs/portfolio/screenshots/mobile-dashboard.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${shots}/mobile-dashboard.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Project directory' }),
  ).toBeVisible();
  await page.screenshot({
    path: `${shots}/mobile-projects.png`,
    fullPage: true,
  });
  await page.evaluate(() =>
    localStorage.setItem('northstar-demo-v1', 'broken'),
  );
  await page.reload();
  await expect(page.getByRole('status')).toContainText(
    'Original sample data restored',
  );
});

test('responsive modules and keyboard dialog behavior', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Demo' }).click();
  await page
    .locator('nav')
    .getByRole('button', { name: 'Employees', exact: true })
    .click();
  const add = page.getByRole('button', { name: 'Add employee', exact: true });
  await add.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(add).toBeFocused();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await page
    .locator('nav')
    .getByRole('button', { name: 'Projects', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Project directory' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const moduleName of [
      'Employees',
      'Roles & permissions',
      'Projects',
      'Delivery planner',
      'Analytics',
      'Activity',
      'Settings',
      'About this project',
    ]) {
      if (width === 390)
        await page.getByRole('button', { name: 'Open navigation' }).click();
      await page
        .locator('nav')
        .getByRole('button', { name: moduleName, exact: true })
        .click();
      await expect(page.locator('h1')).toHaveText(moduleName);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${moduleName} at ${width}px`,
      ).toBe(true);
    }
  }
});
