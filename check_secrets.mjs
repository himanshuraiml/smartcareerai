import fs from 'fs';
import path from 'path';

const services = [
    'services/auth-service',
    'services/api-gateway',
    'services/billing-service',
    'services/admin-service'
];

const root = process.cwd();

services.forEach(service => {
    const envPath = path.join(root, service, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^JWT_SECRET=(.*)$/m);
        if (match) {
            console.log(`[${service}] JWT_SECRET found. Length: ${match[1].trim().length}. Value ends with: ...${match[1].trim().slice(-10)}`);
        } else {
            console.log(`[${service}] JWT_SECRET NOT FOUND in .env`);
        }
    } else {
        console.log(`[${service}] .env file NOT FOUND at ${envPath}`);
    }
});
