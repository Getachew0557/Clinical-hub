/**
 * Sequential service starter for Render free tier (512MB RAM)
 * Gateway starts immediately, others start with staggered delays.
 *
 * Memory budget (512MB total):
 *   api-gateway:        60MB
 *   auth-service:       60MB
 *   patient-service:    80MB  (+ emr + billing)
 *   appointment-service:80MB  (+ notifications + socket.io)
 *   doctor-service:     80MB  (+ inventory + reports)
 *   ai-service:         80MB
 *   OS overhead:        ~72MB
 */
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const gateway = { name: 'api-gateway',        mem: 60,  color: '\x1b[36m' };

const services = [
  { name: 'auth-service',        mem: 60,  color: '\x1b[35m', delay: 3000  },
  { name: 'patient-service',     mem: 80,  color: '\x1b[34m', delay: 8000  },
  { name: 'appointment-service', mem: 80,  color: '\x1b[32m', delay: 14000 },
  { name: 'doctor-service',      mem: 80,  color: '\x1b[37m', delay: 20000 },
  { name: 'ai-service',          mem: 80,  color: '\x1b[92m', delay: 26000 },
];

const RESET = '\x1b[0m';

function startService(svc) {
  const cwd = join(__dirname, svc.name);
  const proc = spawn('node', [`--max-old-space-size=${svc.mem}`, 'server.js'], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env }
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
