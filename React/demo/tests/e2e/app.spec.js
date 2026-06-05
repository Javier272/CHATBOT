import { expect, test } from '@playwright/test';
import { mockApi, testUser } from './helpers/mockApi';

async function openLogin(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /account\s+login/i }).click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
}

async function login(page) {
  await openLogin(page);
  await page.getByPlaceholder('Enter your email...').fill(testUser.email);
  await page.getByPlaceholder('Enter your password...').fill('Password123');
  await page.getByRole('button', { name: /^login$/i }).click();

  await expect(page.getByText('Connected')).toBeVisible();
  await expect(page.locator('.login-user')).toContainText(testUser.name);
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('login correcto guarda sesión y muestra el usuario conectado', async ({ page }) => {
  await login(page);

  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe(testUser.token);
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
});

test('login inválido muestra error y no deja sesión guardada', async ({ page }) => {
  await openLogin(page);

  await page.getByPlaceholder('Enter your email...').fill(testUser.email);
  await page.getByPlaceholder('Enter your password...').fill('wrong-password');
  await page.getByRole('button', { name: /^login$/i }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('crea una tarea y la muestra dentro de las tareas del usuario', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: /add task/i }).click();

  await page.getByPlaceholder('Task Title').fill('Test E2E creación real');
  await page.getByPlaceholder('Description').fill('Tarea creada desde Playwright para validar el flujo completo.');
  await page.getByPlaceholder('Estimated Hours').fill('6');

  await page.locator('select').first().selectOption(String(testUser.id));
  await page.locator('input[type=number]').nth(1).fill('5');
  await page.locator('input[type=date]').fill('2026-06-07');
  await page.locator('select').nth(1).selectOption('High');

  await page.getByRole('button', { name: /save task/i }).click();

  const createdTaskRow = page.locator('.task-row', { hasText: 'Test E2E creación real' });

  await expect(createdTaskRow).toBeVisible();
  await expect(createdTaskRow).toContainText('6h');
  await expect(createdTaskRow).toContainText('2026-06-07');
  await expect(createdTaskRow).toContainText('High');
});

test('edita una tarea existente y conserva el cambio en la tabla', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: /individual/i }).click();
  await page.getByRole('button', { name: /my pending tasks/i }).click();

  await page
    .locator('.task-row', { hasText: 'Preparar pruebas automáticas' })
    .getByRole('button', { name: /details/i })
    .click();

  await page.getByRole('button', { name: /edit/i }).click();

  const editMode = page.locator('.task-details .edit-mode');

  await editMode.locator('input').nth(0).fill('Preparar pruebas E2E actualizadas');
  await editMode.locator('input[type="number"]').first().fill('8');

  await editMode.locator('.btn-save').click();

  const updatedTaskRow = page.locator('.task-row', { hasText: 'Preparar pruebas E2E actualizadas' });

  await expect(updatedTaskRow).toBeVisible();
  await expect(updatedTaskRow).toContainText('8h');
});

test('cambia una tarea de pendiente a completada registrando horas reales', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: /individual/i }).click();
  await page.getByRole('button', { name: /my pending tasks/i }).click();

  page.once('dialog', async (dialog) => {
    await dialog.accept('5');
  });

  await page
    .locator('.task-row', { hasText: 'Preparar pruebas automáticas' })
    .getByRole('button', { name: /done/i })
    .click();

  await expect(page.getByText('Preparar pruebas automáticas')).not.toBeVisible();

  await page.getByRole('button', { name: /my completed tasks/i }).click();
  await expect(page.getByText('Preparar pruebas automáticas')).toBeVisible();
});

test('elimina una tarea después de confirmar la acción', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: /individual/i }).click();
  await page.getByRole('button', { name: /my pending tasks/i }).click();

  await page
    .locator('.task-row', { hasText: 'Preparar pruebas automáticas' })
    .getByRole('button', { name: /details/i })
    .click();

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.getByRole('button', { name: /delete task/i }).click();

  await expect(page.getByText('Preparar pruebas automáticas')).not.toBeVisible();
});