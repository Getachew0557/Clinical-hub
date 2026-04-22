const fs = require('fs');
const path = require('path');

const correctUrls = {
  'AUTH_SERVICE_URL': 'http://localhost:5001/api/auth',
  'PATIENT_SERVICE_URL': 'http://localhost:5002/api/patients',
  'EMR_SERVICE_URL': 'http://localhost:5002/api/emr',
  'BILLING_SERVICE_URL': 'http://localhost:5002/api/billing',
  'APPOINTMENT_SERVICE_URL': 'http://localhost:5003/api/appointments',
  'NOTIFICATION_SERVICE_URL': 'http://localhost:5003/api/notifications',
  'DOCTOR_SERVICE_URL': 'http://localhost:5010/api/doctors',
  'INVENTORY_SERVICE_URL': 'http://localhost:5010/api/inventory',
  'REPORT_SERVICE_URL': 'http://localhost:5010/api/reports',
  'AI_SERVICE_URL': 'http://localhost:5009/api/ai',
};

const services = [
  'auth-service',
  'patient-service',
  'appointment-service',
  'doctor-service',
  'ai-service'
];

services.forEach(service => {
  const envPath = path.join(__dirname, service, '.env');
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // Update existing URLs
    for (const [key, val] of Object.entries(correctUrls)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
    }
    
    fs.writeFileSync(envPath, content);
    console.log(`Updated .env in ${service}`);
  } else {
    console.warn(`Could not find .env in ${service}`);
  }
});
