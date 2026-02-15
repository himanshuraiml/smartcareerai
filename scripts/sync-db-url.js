const fs = require('fs');
const path = require('path');

const sourceEnvPath = path.join(__dirname, '..', 'packages', 'database', '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');
const servicesDir = path.join(__dirname, '..', 'services');

if (!fs.existsSync(sourceEnvPath)) {
    console.error('Source .env file (packages/database/.env) not found!');
    process.exit(1);
}

const sourceEnv = fs.readFileSync(sourceEnvPath, 'utf8');
const dbUrlMatch = sourceEnv.match(/^DATABASE_URL=(.*)$/m);

if (!dbUrlMatch) {
    console.error('Could not find DATABASE_URL in source .env');
    process.exit(1);
}

const newDbUrl = dbUrlMatch[1].trim();
console.log('Found Supabase URL, syncing to root and services...');

// Sync to root .env
if (fs.existsSync(rootEnvPath)) {
    let rootContent = fs.readFileSync(rootEnvPath, 'utf8');
    if (rootContent.match(/^DATABASE_URL=/m)) {
        const currentRootUrl = rootContent.match(/^DATABASE_URL=(.*)$/m)[1].trim();
        if (currentRootUrl !== newDbUrl) {
            rootContent = rootContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${newDbUrl}`);
            fs.writeFileSync(rootEnvPath, rootContent);
            console.log('✅ Updated root .env');
        } else {
            console.log('- root .env already up to date');
        }
    } else {
        rootContent += `\nDATABASE_URL=${newDbUrl}\n`;
        fs.writeFileSync(rootEnvPath, rootContent);
        console.log('✅ Added DATABASE_URL to root .env');
    }
}

if (!fs.existsSync(servicesDir)) {
    console.error('Services directory not found!');
    process.exit(1);
}

const services = fs.readdirSync(servicesDir);

services.forEach(service => {
    const serviceEnvPath = path.join(servicesDir, service, '.env');
    if (fs.existsSync(serviceEnvPath)) {
        let content = fs.readFileSync(serviceEnvPath, 'utf8');
        // Check if DATABASE_URL exists and needs updating
        if (content.match(/^DATABASE_URL=/m)) {
            const currentUrlMatch = content.match(/^DATABASE_URL=(.*)$/m);
            if (currentUrlMatch && currentUrlMatch[1].trim() !== newDbUrl) {
                content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${newDbUrl}`);
                fs.writeFileSync(serviceEnvPath, content);
                console.log(`✅ Updated ${service}/.env`);
            } else {
                console.log(`- ${service}/.env already up to date`);
            }
        } else {
            // Append if missing
            content += `\nDATABASE_URL=${newDbUrl}\n`;
            fs.writeFileSync(serviceEnvPath, content);
            console.log(`✅ Added DATABASE_URL to ${service}/.env`);
        }
    } else {
        console.log(`⚠️ Skiping ${service} (no .env file found)`);
    }
});
