/**
 * Sequential service starter for Render free tier (512MB RAM)
 * Gateway starts immediately, others start with staggered delays.
 *
 * Memory budget (512MB total):
 *   api-gateway:        50MB
 *   auth-service:       60MB
 *   patient-service:    80MB  (+ emr + billing)
 *   appointment-service:80MB  (+ notifications + socket.io)
 *   doctor-service:     80MB  (+ inventory + reports)
 *   OS + node overhead: ~150MB
 *   Total: ~500MB
 *
 *   ai-service excluded from production (too heavy for free tier)
 */
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure uploads directories exist for all services
const services_with_uploads = ['doctor-service', 'appointment-service', 'patient-service', 'auth-service'];
for (const svc of services_with_uploads) {
  try {
    mkdirSync(join(__dirname, svc, 'uploads'), { recursive: true });
  } catch {}
}

const gateway = { name: 'api-gateway', mem: 50, color: '\x1b[36m', keepPort: true };

const services = [
  { name: 'auth-service',        mem: 100, color: '\x1b[35m', delay: 2000,  port: { AUTH_PORT: '5001',  PORT: '5001'  } },
  { name: 'patient-service',     mem: 150, color: '\x1b[34m', delay: 4000,  port: { PATIENT_PORT: '5002', PORT: '5002' } },
  { name: 'appointment-service', mem: 150, color: '\x1b[32m', delay: 6000,  port: { APPT_PORT: '5003',  PORT: '5003'  } },
  { name: 'doctor-service',      mem: 150, color: '\x1b[37m', delay: 8000,  port: { DOCTOR_PORT: '5010', PORT: '5010' } },
];

const RESET = '\x1b[0m';

function startService(svc) {
  const cwd = join(__dirname, svc.name);

  // For the api-gateway: keep Render's PORT so it binds to the public port.
  // For all other services: strip Render's PORT and inject their own fixed port,
  // otherwise PORT=10000 leaks in and overrides their intended port.
  let childEnv;
  if (svc.keepPort) {
    childEnv = { ...process.env, ...(svc.port || {}) };
  } else {
    const { PORT: _ignored, ...parentEnv } = process.env;
    childEnv = { ...parentEnv, ...(svc.port || {}) };
  }

  const proc = spawn('node', [`--max-old-space-size=${svc.mem}`, 'server.js'], {
    cwd,
    stdio: 'pipe',
    env: childEnv
  });

  proc.stdout.on('data', (d) => process.stdout.write(`${svc.color}[${svc.name}]${RESET} ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`${svc.color}[${svc.name}]${RESET} ${d}`));
  proc.on('exit', (code) => {
    console.log(`${svc.color}[${svc.name}]${RESET} exited with code ${code}`);
    // Auto-restart on crash after 5s
    if (code !== 0) {
      console.log(`${svc.color}[${svc.name}]${RESET} Restarting in 5s...`);
      setTimeout(() => startService(svc), 5000);
    }
  });

  return proc;
}

console.log('Starting api-gateway immediately...');
startService(gateway);

for (const svc of services) {
  setTimeout(() => {
    console.log(`Starting ${svc.name}...`);
    startService(svc);
  }, svc.delay);
}

console.log('Startup sequence initiated. Services starting in background...');
