import { chromium } from 'playwright';
import type { BrowserContext } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load env variables
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

async function run() {
  console.log(`[E2E Orchestrator] Starting test runner...`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('[E2E Orchestrator] Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch workflows from Supabase
  console.log(`[E2E Orchestrator] Fetching workflows from Supabase...`);
  const { data: workflows, error } = await supabase
    .from('e2e_workflows')
    .select('*');

  if (error) {
    console.error(`[E2E Orchestrator] Failed to fetch workflows: ${error.message}`);
    process.exit(1);
  }

  if (!workflows || workflows.length === 0) {
    console.log(`[E2E Orchestrator] No workflows found in e2e_workflows table.`);
    process.exit(0);
  }

  console.log(`[E2E Orchestrator] Found ${workflows.length} workflow(s) to execute.`);

  // 2. Setup Playwright & Automa Extension
  const extensionPath = process.env.AUTOMA_EXTENSION_PATH
    ? path.resolve(process.env.AUTOMA_EXTENSION_PATH)
    : fs.existsSync(path.resolve(__dirname, './extension'))
    ? path.resolve(__dirname, './extension')
    : path.resolve(__dirname, '../../../platform/automa/build');
  if (!fs.existsSync(extensionPath)) {
    console.error(`[E2E Orchestrator] Error: Automa build directory not found at: ${extensionPath}. Did you build the extension?`);
    process.exit(1);
  }

  console.log(`[E2E Orchestrator] Launching Chromium with Automa Extension from: ${extensionPath}`);
  const userDataDir = path.resolve(__dirname, '../.playwright-profile');
  const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });

  // Get extension ID from service worker url
  console.log(`[E2E Orchestrator] Waiting for Automa service worker to register...`);
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    try {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
    } catch (e) {
      // Fallback if still not found but maybe loaded
      console.warn('[E2E Orchestrator] Service worker event timeout, trying to find from active workers.');
      serviceWorker = context.serviceWorkers()[0];
      if (!serviceWorker) {
        throw new Error('Automa Extension service worker not registered.');
      }
    }
  }
  const extensionId = serviceWorker.url().split('/')[2];
  console.log(`[E2E Orchestrator] Automa Extension ID: ${extensionId}`);

  // 3. Open extension popup page to have access to chrome.storage.local
  const extPage = await context.newPage();
  const extUrl = `chrome-extension://${extensionId}/popup.html`;
  await extPage.goto(extUrl);
  console.log(`[E2E Orchestrator] Opened Automa context page: ${extUrl}`);

  for (const wf of workflows) {
    console.log(`[E2E Orchestrator] Registering workflow: "${wf.name}"`);
    const workflowId = wf.id;

    // Inject workflow into Automa IndexedDB / storage
    await extPage.evaluate(
      (args) => {
        return new Promise<void>((resolve) => {
          const chrome = (window as any).chrome;
          const detail = {
            type: 'add-workflow',
            data: {
              workflow: {
                id: args.id,
                name: args.name,
                drawflow: args.workflow_data.drawflow || args.workflow_data,
                settings: args.workflow_data.settings || { notification: false },
                trigger: args.workflow_data.trigger || {},
              },
            },
          };

          // Dispatch event to content script / extension service
          window.dispatchEvent(new CustomEvent('__automa-ext__', { detail }));

          // Listen for confirmation
          chrome.storage.onChanged.addListener(function listener(changes: any) {
            if (changes.workflows) {
              chrome.storage.onChanged.removeListener(listener);
              resolve();
            }
          });

          // Fallback resolve after 1s
          setTimeout(resolve, 1000);
        });
      },
      { id: workflowId, name: wf.name, workflow_data: wf.workflow_data }
    );

    console.log(`[E2E Orchestrator] Triggering workflow: "${wf.name}" (${workflowId})`);

    // Trigger execution
    await extPage.evaluate(
      (args) => {
        const detail = {
          id: args.id,
          data: {},
        };
        window.dispatchEvent(new CustomEvent('automa:execute-workflow', { detail }));
      },
      { id: workflowId }
    );

    // Wait for the workflow to complete (when active states array is empty)
    console.log(`[E2E Orchestrator] Waiting for workflow execution to complete...`);
    let completed = false;
    const timeout = 60000; // 60s timeout
    const startTime = Date.now();

    // Small delay to let execution register
    await new Promise((resolve) => setTimeout(resolve, 2000));

    while (!completed) {
      if (Date.now() - startTime > timeout) {
        console.error(`[E2E Orchestrator] Timeout waiting for workflow execution.`);
        break;
      }

      const activeStates = await extPage.evaluate(() => {
        return new Promise<any[]>((resolve) => {
          const chrome = (window as any).chrome;
          chrome.storage.local.get('workflowStates', (data: any) => {
            resolve(data.workflowStates || []);
          });
        });
      });

      const activeForCurrent = activeStates.filter((state) => state.workflowId === workflowId);
      if (activeForCurrent.length === 0) {
        completed = true;
        console.log(`[E2E Orchestrator] Workflow "${wf.name}" completed successfully.`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.log(`[E2E Orchestrator] All E2E workflows completed. Closing browser...`);
  await context.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[E2E Orchestrator] Unexpected error:', err);
  process.exit(1);
});
