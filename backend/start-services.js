/**
 * Sequential service starter for Render free tier (512MB RAM)
 * Gateway starts immediately, others start with delays
 */
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Gateway starts first and immediately — Render needs to detect the port fast
const gateway = { name: 'api-gateway', color: '\x1b[36m' };

// Other services start after gateway is up, with small delays
const services = [
  { name: 'auth-service',        color: '\x1b[35m', delay: 2000  },
  { name: 'patient-service',     color: '\x1b[34m', delay: 4000  },
  { name: 'appointment-service', color: '\x1b[32m', delay: 6000  },
  { name: 'doctor-service',      color: '\x1b[37m', delay: 8000  },
  { name: 'notification-service',color: '\x1b[90m', delay: 10000 },
  { name: 'billing-service',     color: '\x1b[31m', delay: 12000 },
  { name: 'emr-service',         color: '\x1b[33m', delay: 14000 },
  { name: 'inventory-service',   color: '\x1b[94m', delay: 16000 },
  { name: 'report-service',      color: '\x1b[92m', delay: 18000 },
];

const RESET = '\x1b[0m';

function startService(svc) {
  const cwd = join(__dirname, svc.name);
  const proc = spawn('node', ['--max-old-space-size=45', 'server.js'], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env }
  });

  proc.stdout.on('data', (d) => process.stdout.write(`${svc.color}[${svc.name}]${RESET} ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`${svc.color}[${svc.name}]${RESET} ${d}`));
  proc.on('exit', (code) => console.log(`${svc.color}[${svc.name}]${RESET} exited with code ${code}`));

  return proc;
}

// Start gateway immediately
console.log('Starting api-gateway immediately...');
startService(gateway);

// Start remaining services with staggered delays
for (const svc of services) {
  setTimeout(() => {
    console.log(`Starting ${svc.name}...`);
    startService(svc);
  }, svc.delay);
}

console.log('Startup sequence initiated. Gateway is live, others starting in background...');

