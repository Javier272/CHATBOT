export const testUser = {
  id: 1,
  name: 'Álvaro Solano',
  email: 'alvaro@test.com',
  token: 'fake-jwt-token-for-e2e-tests',
};

export const otherUser = {
  id: 2,
  name: 'Javier',
  email: 'javier@test.com',
};

const initialTasks = () => [
  {
    id: 101,
    userId: testUser.id,
    userName: testUser.name,
    title: 'Preparar pruebas automáticas',
    description: 'Crear pruebas E2E reales con Playwright',
    status: 'pending',
    priority: 5,
    dueDate: '2026-06-05',
    hoursEstimate: 4,
    realHours: 0,
    sprint: 4,
  },
  {
    id: 102,
    userId: testUser.id,
    userName: testUser.name,
    title: 'Documentar release',
    description: 'Completar evidencias del sprint',
    status: 'completed',
    priority: 3,
    dueDate: '2026-06-04',
    hoursEstimate: 2,
    realHours: 3,
    sprint: 4,
  },
  {
    id: 201,
    userId: otherUser.id,
    userName: otherUser.name,
    title: 'Revisar despliegue OCI',
    description: 'Validar ambiente de nube',
    status: 'pending',
    priority: 3,
    dueDate: '2026-06-06',
    hoursEstimate: 5,
    realHours: 0,
    sprint: 4,
  },
];

const json = (body, status = 200, extraHeaders = {}) => ({
  status,
  headers: { 'Content-Type': 'application/json', ...extraHeaders },
  body: JSON.stringify(body),
});

const getBearerToken = (request) => request.headers()['authorization'] || '';

export async function mockApi(page) {
  let tasks = initialTasks();
  let nextTaskId = 300;

  await page.route('**/users/login', async (route) => {
    const body = route.request().postDataJSON();

    if (body.email === testUser.email && body.password === 'Password123') {
      await route.fulfill(json({
        token: testUser.token,
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      }));
      return;
    }

    await route.fulfill({
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Credenciales incorrectas.',
    });
  });

  await page.route('**/users/me', async (route) => {
    if (getBearerToken(route.request()).includes(testUser.token)) {
      await route.fulfill(json({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      }));
      return;
    }

    await route.fulfill(json('No autenticado', 401));
  });

  await page.route('**/users', async (route) => {
    await route.fulfill(json([
      { id: testUser.id, name: testUser.name, email: testUser.email },
      { id: otherUser.id, name: otherUser.name, email: otherUser.email },
    ]));
  });

  await page.route('**/tasks', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      await route.fulfill(json(tasks.filter((task) => task.isDeleted !== 1)));
      return;
    }

    if (method === 'POST') {
      const body = request.postDataJSON();
      const createdTask = {
        id: nextTaskId++,
        userName: body.userId === testUser.id ? testUser.name : otherUser.name,
        realHours: 0,
        ...body,
      };

      tasks.unshift(createdTask);
      await route.fulfill(json(createdTask, 200, { location: String(createdTask.id) }));
      return;
    }

    await route.fallback();
  });

  await page.route(/.*\/tasks\/\d+$/, async (route) => {
    const request = route.request();
    const id = Number(request.url().split('/').pop());

    if (request.method() === 'PUT') {
      const body = request.postDataJSON();
      const updatedTask = {
        ...body,
        userName: body.userId === testUser.id ? testUser.name : otherUser.name,
      };

      tasks = tasks.map((task) => (task.id === id ? updatedTask : task));
      await route.fulfill(json(updatedTask));
      return;
    }

    if (request.method() === 'DELETE') {
      tasks = tasks.map((task) => (task.id === id ? { ...task, isDeleted: 1 } : task));
      await route.fulfill(json(true));
      return;
    }

    if (request.method() === 'GET') {
      const task = tasks.find((item) => item.id === id && item.isDeleted !== 1);
      await route.fulfill(task ? json(task) : json({}, 404));
      return;
    }

    await route.fallback();
  });

  await page.route('**/ai/prioritize/user/**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Prioriza primero la tarea de pruebas automáticas por su urgencia y prioridad alta.',
    });
  });
}