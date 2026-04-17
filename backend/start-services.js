/**
 * Sequential service starter for Render free tier (512MB RAM)
 * Starts services with delays to avoid OOM during startup
 */
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const services = [
  { name: 'api-gateway',        color: '\x1b[36m' },  // cyan
  { name: 'auth-service',       color: '\x1b[35m' },  // magenta
  { name: 'patient-service',    color: '\x1b[34m' },  // blue
  { name: 'appointment-service',color: '\x1b[32m' },  // green
  { name: 'doctor-service',     color: '\x1b[37m' },  // white
  { name: 'notification-service',color: '\x1b[90m' }, // gray
  { name: 'billing-service',    color: '\x1b[31m' },  // red
  { name: 'emr-service',        color: '\x1b[33m' },  // yellow
  { name: 'inventory-service',  color: '\x1b[94m' },  // bright blue
  { name: 'report-service',     color: '\x1b[92m' },  // bright green
];

const RESET = '\x1b[0m';
const DELAY_MS = 3000; // 3 seconds between each service start

function startService(svc) {
  const cwd = join(__dirname, svc.name);
  const proc = spawn('node', ['--max-old-space-size=45', 'server.js'], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env }
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${svc.color}[${svc.name}]${RESET} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${svc.color}[${svc.name}]${RESET} ${data}`);
  });

  proc.on('exit', (code) => {
    console.log(`${svc.color}[${svc.name}]${RESET} exited with code ${code}`);
  });

  return proc;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Starting ${services.length} services with ${DELAY_MS}ms delay between each...`);

  for (const svc of services) {
    console.log(`Starting ${svc.name}...`);
    startService(svc);
    await sleep(DELAY_MS);
  }

  console.log('All services started.');
}

main();
