// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Ejecuta los archivos de prueba de forma controlada para evitar problemas con estado compartido.
  fullyParallel: false,

  // Falla si accidentalmente dejamos test.only antes de entregar.
  forbidOnly: !!process.env.CI,

  // Reintentos solo en ambiente CI.
  retries: process.env.CI ? 2 : 0,

  // En CI se usa un solo worker para mayor estabilidad.
  workers: process.env.CI ? 1 : undefined,

  // Genera reporte HTML después de correr las pruebas.
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    // URL base de la app levantada con Vite.
    baseURL: 'http://localhost:5173',

    // Evidencia automática para la entrega.
    // screenshot: 'on' guarda captura por cada prueba.
    // video: 'on' guarda video por cada prueba.
    screenshot: 'on',
    video: 'on',

    // Trace se guarda solo cuando hay retry, para no generar demasiados archivos.
    trace: 'on-first-retry',

    // Viewport de escritorio para simular uso normal del sistema.
    viewport: { width: 1440, height: 900 },

    // Evita que una prueba se quede colgada demasiado tiempo.
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  // Para esta entrega usamos Chromium como navegador principal.
  // Es más rápido, estable y suficiente para demostrar las suites E2E.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Playwright puede reutilizar el servidor si ya está abierto.
  // Si no está abierto, intenta levantarlo con npm run dev.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});