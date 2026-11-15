import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5055;
const BASE_URL = `http://localhost:${PORT}/api`;
const tempDbPath = path.join(os.tmpdir(), `saathi_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.db`);
const serverEntry = path.resolve(__dirname, '../src/index.js');
const testSuiteScript = path.resolve(__dirname, 'test-suite.js');

console.log(`[IntegrationRunner] Starting self-contained test environment on port ${PORT}...`);
console.log(`[IntegrationRunner] Temp test database: ${tempDbPath}`);

const serverProcess = spawn(process.execPath, [serverEntry], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DB_PATH: tempDbPath,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-audit-suite-xyz-9876543210123456789',
  },
  stdio: 'pipe',
});

serverProcess.stdout.on('data', (d) => {
  // Uncomment for deep server debugging if needed:
  // process.stdout.write(`[Server stdout] ${d}`);
});

serverProcess.stderr.on('data', (d) => {
  // process.stderr.write(`[Server stderr] ${d}`);
});

function cleanup() {
  try {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
  } catch (err) {
    // Ignore error if process already exited
  }

  // Delete temp database and WAL/SHM companion files
  const filesToDelete = [tempDbPath, `${tempDbPath}-wal`, `${tempDbPath}-shm`];
  for (const f of filesToDelete) {
    try {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    } catch {
      // Ignore lock error on exit
    }
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(1);
});

// Wait for health endpoint
async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok') {
          return true;
        }
      }
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server failed to start and respond at ${BASE_URL}/health within ${timeoutMs}ms`);
}

async function main() {
  try {
    await waitForServer();
    console.log(`[IntegrationRunner] Server is ready at ${BASE_URL}. Executing test-suite.js...`);

    const testChild = spawn(process.execPath, [testSuiteScript], {
      env: {
        ...process.env,
        BASE_URL,
      },
      stdio: 'inherit',
    });

    testChild.on('close', (code) => {
      cleanup();
      process.exit(code || 0);
    });

    testChild.on('error', (err) => {
      console.error('[IntegrationRunner] Failed to run test-suite.js:', err);
      cleanup();
      process.exit(1);
    });
  } catch (err) {
    console.error('[IntegrationRunner] Setup failed:', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
