const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const SA_FILE = 'levprav-art-firebase-adminsdk-fbsvc-9b36661e3b.json';
const ENV_FILE = '.env.local';
const TEMP_B64_FILE = '.temp_b64.txt';

async function main() {
    console.log('Starting secrets sync...');

    // 1. Convert SA to base64
    if (fs.existsSync(SA_FILE)) {
        console.log(`Found ${SA_FILE}, converting to base64...`);
        const saContent = fs.readFileSync(SA_FILE, 'utf8');
        const minified = JSON.stringify(JSON.parse(saContent));
        const base64 = Buffer.from(minified).toString('base64');
        fs.writeFileSync(TEMP_B64_FILE, base64);

        console.log('Uploading FIREBASE_SERVICE_ACCOUNT_BASE64...');
        execSync(`gh secret set FIREBASE_SERVICE_ACCOUNT_BASE64 < ${TEMP_B64_FILE}`, { stdio: 'inherit' });
        
        fs.unlinkSync(TEMP_B64_FILE);
    } else {
        console.log(`WARNING: ${SA_FILE} not found.`);
    }

    // 2. Set Backup Archive Password
    console.log('Setting BACKUP_ARCHIVE_PASSWORD...');
    execSync('gh secret set BACKUP_ARCHIVE_PASSWORD -b "MAStif55vova"', { stdio: 'inherit' });

    // 3. Sync .env.local
    if (fs.existsSync(ENV_FILE)) {
        console.log(`Reading ${ENV_FILE}...`);
        const envContent = fs.readFileSync(ENV_FILE, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                    const key = trimmed.substring(0, eqIndex).trim();
                    const value = trimmed.substring(eqIndex + 1).trim();
                    
                    if (key) {
                        console.log(`Setting secret: ${key}`);
                        execSync(`gh secret set ${key} -b "${value}"`, { stdio: 'inherit' });
                    }
                }
            }
        }
    } else {
        console.log(`WARNING: ${ENV_FILE} not found.`);
    }

    console.log('Secrets sync completed successfully!');
}

main().catch(console.error);
