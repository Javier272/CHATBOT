import { test, expect } from '@playwright/test';

const API_BASE = 'http://163.192.143.182';

const mockUsers = [
  { id: 1, name: 'Diego' },
  { id: 2, name: 'Sofia' },
  { id: 3, name: 'Jose' },
];

const baseTasks = [
  {
    id: 101,
    userId: 1,
    title: 'Design login flow',
    description: 'Create and validate the login experience.',
    status: 'pending',
    completed: false,
    started: false,
    priority: 5,
    dueDate: '2026-06-12',
    category: null,
    teamId: null,
    isDeleted: 0,
  },
  {
    id: 102,
    userId: 1,
    title: 'Connect analytics dashboard',
    description: 'Review the personal analytics page.',
    status: 'in_progress',
    completed: false,
    started: true,
    priority: 3,
    dueDate: '2026-06-13',
    category: null,
    teamId: null,
    isDeleted: 0,
  },
  {
    id: 103,
    userId: 1,
    title: 'Write testing report',
    description: 'Document the E2E testing process.',
    status: 'completed',
    completed: true,
    started: false,
    priority: 1,
    dueDate: '2026-06-14',
    category: null,
    teamId: null,
    isDeleted: 0,
  },
  {
    id: 201,
    userId: 2,
    title: 'Prepare team presentation',
    description: 'Create evidence for the team demo.',
    status: 'completed',
    completed: true,
    started: false,
    priority: 5,
    dueDate: '2026-06-15',
    category: null,
    teamId: null,
    isDeleted: 0,
  },
  {
    id: 202,
    userId: 2,
    title: 'Review backlog',
    description: 'Check pending work for the sprint.',
    status: 'pending',
    completed: false,
    started: false,
    priority: 3,
    dueDate: '2026-06-16',
    category: null,
    teamId: null,
    isDeleted: 0,
  },
];

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

function cloneTasks() {
  return JSON.parse(JSON.stringify(baseTasks));
}

async function fulfillJson(route, data, status = 200) {
  await route.fulfill({
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

async function mockApi(page) {
  let tasks = cloneTasks();
  const calls = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const requestUrl = request.url();

    if (!requestUrl.startsWith(API_BASE)) {
      await route.continue();
      return;
    }

    const url = new URL(requestUrl);
    const method = request.method();

    calls.push({
      method,
      path: url.pathname,
    });

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: '',
      });
      return;
    }

    if (url.pathname === '/users' && method === 'GET') {
      await fulfillJson(route, mockUsers);
      return;
    }

    if (url.pathname === '/tasks' && method === 'GET') {
      await fulfillJson(route, tasks);
      return;
    }

    if (url.pathname === '/tasks' && method === 'POST') {
      const incomingTask = JSON.parse(request.postData() || '{}');
      const nextId = Math.max(...tasks.map((task) => task.id)) + 1;

      const createdTask = {
        id: nextId,
        ...incomingTask,
        completed: incomingTask.status === 'completed',
        started: incomingTask.status === 'in_progress',
      };

      tasks.push(createdTask);

      await fulfillJson(route, createdTask, 201);
      return;
    }

    if (url.pathname.startsWith('/tasks/') && method === 'PUT') {
      const id = Number(url.pathname.split('/').pop());
      const updatedTask = JSON.parse(request.postData() || '{}');

      const normalizedTask = {
        ...updatedTask,
        id,
        completed: updatedTask.status === 'completed',
        started: updatedTask.status === 'in_progress',
      };

      tasks = tasks.map((task) =>
        task.id === id ? { ...task, ...normalizedTask } : task
      );

      await fulfillJson(route, normalizedTask);
      return;
    }

    if (url.pathname.startsWith('/tasks/') && method === 'DELETE') {
      const id = Number(url.pathname.split('/').pop());
      tasks = tasks.filter((task) => task.id !== id);

      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: '',
      });
      return;
    }

    await fulfillJson(route, { message: 'Mock endpoint not found' }, 404);
  });

  return {
    calls,
    getTasks: () => tasks,
  };
}

async function openApp(page) {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'OnTeamTasks' })).toBeVisible();
}

async function openLogin(page) {
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Select User' })).toBeVisible();
}

async function loginAsUser(page, userName = 'Diego') {
  await openLogin(page);

  const user = mockUsers.find((mockUser) => mockUser.name === userName);

  await page
    .getByRole('button', { name: `${user.name} (ID: ${user.id})` })
    .click();

  await expect(
    page.getByRole('button', { name: `User: ${user.name}` })
  ).toBeVisible();
}

function taskRow(page, title) {
  return page.locator('.task-row').filter({ hasText: title });
}

test.describe('Suite 1 - Authentication and user selection', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('shows an error when the selected user ID does not exist', async ({ page }) => {
    await openLogin(page);

    await page.getByPlaceholder('Enter your user ID...').fill('999');
    await page.getByRole('button', { name: 'Enter' }).click();

    await expect(page.getByText('User not found')).toBeVisible();

    await test.info().attach('invalid-login-state', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  test('allows a valid user to sign in from the user list', async ({ page }) => {
    await loginAsUser(page, 'Diego');

    await expect(page.getByText('Design login flow')).toBeVisible();
    await expect(page.getByText('Connect analytics dashboard')).toBeVisible();
    await expect(page.getByText('Prepare team presentation')).not.toBeVisible();
  });

  for (const user of [
    { id: 1, name: 'Diego' },
    { id: 2, name: 'Sofia' },
  ]) {
    test(`allows ${user.name} to sign in by ID`, async ({ page }) => {
      await openLogin(page);

      await page.getByPlaceholder('Enter your user ID...').fill(String(user.id));
      await page.getByRole('button', { name: 'Enter' }).click();

      await expect(
        page.getByRole('button', { name: `User: ${user.name}` })
      ).toBeVisible();
    });
  }
});

test.describe('Suite 2 - Task lifecycle flows', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await loginAsUser(page, 'Diego');
  });

  test('shows only the signed-in user tasks and displays task details', async ({ page }) => {
    await expect(taskRow(page, 'Design login flow')).toBeVisible();
    await expect(taskRow(page, 'Write testing report')).toBeVisible();

    await expect(page.getByText('Prepare team presentation')).not.toBeVisible();

    await taskRow(page, 'Design login flow')
      .getByRole('button', { name: 'Details' })
      .click();

    const details = page.locator('.task-details').filter({
      hasText: 'Design login flow',
    });

    await expect(details).toContainText('Pending');
    await expect(details).toContainText('Create and validate the login experience.');
  });

  test('marks a pending task as in progress', async ({ page }) => {
    const row = taskRow(page, 'Design login flow');

    await row.getByRole('button', { name: 'Start' }).click();

    await expect(row.getByRole('button', { name: 'In Progress' })).toBeVisible();

    await row.getByRole('button', { name: 'Details' }).click();

    const details = page.locator('.task-details').filter({
      hasText: 'Design login flow',
    });

    await expect(details).toContainText('In Progress');
  });

  test('marks an assigned task as completed', async ({ page }) => {
    const row = taskRow(page, 'Connect analytics dashboard');

    await row.getByRole('button', { name: 'Complete' }).click();

    await expect(row.getByRole('button', { name: '✔' })).toBeVisible();

    await row.getByRole('button', { name: 'Details' }).click();

    const details = page.locator('.task-details').filter({
      hasText: 'Connect analytics dashboard',
    });

    await expect(details).toContainText('Done');
  });

  test('creates a complete task and then deletes it', async ({ page }) => {
    test.slow();

    await page.getByRole('button', { name: 'Team' }).click();
    await page.getByRole('button', { name: 'Add Task +' }).click();

    await expect(page.getByRole('heading', { name: 'Add New Task' })).toBeVisible();

    await page.getByPlaceholder('Task Title').fill('Prepare final demo evidence');
    await page
      .getByPlaceholder('Description')
      .fill('Record the Playwright test execution and collect the HTML report.');
    await page.locator('input[type="date"]').fill('2026-06-30');
    await page.locator('select').selectOption({ label: 'High' });

    await page.getByRole('button', { name: 'Save Task' }).click();

    const createdRow = taskRow(page, 'Prepare final demo evidence');

    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('High');

    await createdRow.getByRole('button', { name: 'Details' }).click();

    const details = page.locator('.task-details').filter({
      hasText: 'Prepare final demo evidence',
    });

    await expect(details).toContainText('Record the Playwright test execution');

    await details.getByRole('button', { name: 'X' }).click();

    await expect(taskRow(page, 'Prepare final demo evidence')).toHaveCount(0);
  });
});

test.describe('Suite 3 - Analytics and team views', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await loginAsUser(page, 'Diego');
  });

  test('shows the individual analytics summary for the signed-in user', async ({ page }) => {
    await page.getByRole('button', { name: 'My Analytics' }).click();

    await expect(page.getByRole('heading', { name: 'Tasks Overview' })).toBeVisible();
    await expect(page.getByText('Completed: 1')).toBeVisible();
    await expect(page.getByText('Started: 1')).toBeVisible();
    await expect(page.getByText('Pending: 1')).toBeVisible();
  });

  test('shows the team analytics summary grouped by user', async ({ page }) => {
    await page.getByRole('button', { name: 'Team' }).click();
    await page.getByRole('button', { name: 'Tasks Analysis' }).click();

    await expect(page.getByRole('heading', { name: 'Total Tasks by User' })).toBeVisible();

    await expect(page.getByText('User 1')).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible();

    await expect(page.getByText('User 2')).toBeVisible();
    await expect(page.getByText('1 / 2')).toBeVisible();
  });

  test('keeps the API fully mocked during the E2E flow', async ({ page }) => {
    const api = await mockApi(page);

    await page.goto('/');
    await loginAsUser(page, 'Sofia');

    await expect(page.getByRole('button', { name: 'User: Sofia' })).toBeVisible();
    await expect(taskRow(page, 'Prepare team presentation')).toBeVisible();

    const calledEndpoints = api.calls.map((call) => `${call.method} ${call.path}`);

    expect(calledEndpoints).toContain('GET /tasks');
    expect(calledEndpoints).toContain('GET /users');
  });
});