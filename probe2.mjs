import https from 'https';

function req(label, path, method='GET', body='') {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'clinical-hub.onrender.com',
      path, method,
      timeout: 20000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const r = https.request(opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const icon = res.statusCode < 500 ? '✅' : '❌';
        resolve(`${icon} [${res.statusCode}] ${label.padEnd(35)} | ${data.substring(0,120)}`);
      });
    });
    r.on('timeout', () => { r.destroy(); resolve(`⏱️ [TMO] ${label}`); });
    r.on('error',   e  => resolve(`❌ [ERR] ${label} | ${e.message}`));
    if (body) r.write(body);
    r.end();
  });
}

console.log('--- EMR & Billing route probes ---');
console.log(await req('GET /api/emr',                          '/api/emr'));
console.log(await req('GET /api/emr/patient/1',               '/api/emr/patient/1'));
console.log(await req('GET /api/billing',                      '/api/billing'));
console.log(await req('GET /api/billing/invoices',             '/api/billing/invoices'));
console.log(await req('GET /api/billing/invoices/1',           '/api/billing/invoices/1'));

console.log('\n--- Auth routes ---');
console.log(await req('GET /api/auth',                         '/api/auth'));
console.log(await req('POST /api/auth/login (empty)',          '/api/auth/login', 'POST', '{}'));
console.log(await req('GET /api/auth/users',                   '/api/auth/users'));
console.log(await req('GET /api/auth/profile',                 '/api/auth/profile'));

console.log('\n--- Appointments (504 expected) ---');
console.log(await req('GET /api/appointments',                 '/api/appointments'));
console.log(await req('GET /api/doctors',                      '/api/doctors'));
