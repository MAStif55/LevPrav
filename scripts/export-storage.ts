/**
 * Export Firebase Storage
 * 
 * This script downloads all files from Firebase Storage.
 * Requires a Firebase service account key file (service-account.json)
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Get output directory from command line argument
const outputDir = process.argv[2];
if (!outputDir) {
    console.error('❌ Error: Output directory not specified');
    console.error('Usage: npx ts-node scripts/export-storage.ts <output-dir>');
    process.exit(1);
}

// Initialize Firebase Admin (skip if already initialized)
const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: service-account.json not found in project root');
    console.error('');
    console.error('Please download your service account key from Firebase Console:');
    console.error('1. Go to https://console.firebase.google.com/');
    console.error('2. Select your project (levprav-art)');
    console.error('3. Go to Project Settings → Service Accounts');
    console.error('4. Click "Generate new private key"');
    console.error('5. Save the file as "service-account.json" in the project root');
    process.exit(1);
}

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'levprav-art.firebasestorage.app'
    });
}

const bucket = admin.storage().bucket();

async function downloadFile(file: any, outputDir: string): Promise<boolean> {
    try {
        const filePath = file.name;
        const destPath = path.join(outputDir, filePath);
        const destDir = path.dirname(destPath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Download file
        await file.download({ destination: destPath });
        console.log(`    ✅ ${filePath}`);
        return true;
    } catch (error: any) {
        console.error(`    ❌ Failed: ${file.name} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('');
    console.log('📦 Firebase Storage Export');
    console.log('==========================');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('  Listing files in storage bucket...');

    const [files] = await bucket.getFiles();

    if (files.length === 0) {
        console.log('  ⚠️  No files found in storage bucket');
        process.exit(0);
    }

    console.log(`  Found ${files.length} files to download`);
    console.log('');
    console.log('  Downloading:');

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        const success = await downloadFile(file, outputDir);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('');
    console.log(`📊 Total: ${successCount} downloaded, ${failCount} failed`);
    console.log('');

    process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
});
