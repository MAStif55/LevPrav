/**
 * Export Firestore Data
 * 
 * This script exports all Firestore collections to JSON files.
 * Requires a Firebase service account key file (service-account.json)
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Get output directory from command line argument
const outputDir = process.argv[2];
if (!outputDir) {
    console.error('❌ Error: Output directory not specified');
    console.error('Usage: npx ts-node scripts/export-firestore.ts <output-dir>');
    process.exit(1);
}

// Initialize Firebase Admin
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

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'levprav-art.firebasestorage.app'
});

const db = admin.firestore();

// Collections to export
const COLLECTIONS = ['products', 'orders', 'calculator_options'];

async function exportCollection(collectionName: string): Promise<number> {
    console.log(`  Exporting ${collectionName}...`);

    const snapshot = await db.collection(collectionName).get();
    const data: Record<string, any> = {};

    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });

    const outputPath = path.join(outputDir, `${collectionName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`    ✅ ${snapshot.size} documents → ${collectionName}.json`);
    return snapshot.size;
}

async function main() {
    console.log('');
    console.log('🔥 Firestore Export');
    console.log('===================');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let totalDocuments = 0;

    for (const collection of COLLECTIONS) {
        try {
            const count = await exportCollection(collection);
            totalDocuments += count;
        } catch (error: any) {
            console.error(`    ❌ Failed to export ${collection}: ${error.message}`);
        }
    }

    console.log('');
    console.log(`📊 Total: ${totalDocuments} documents exported`);
    console.log('');

    process.exit(0);
}

main().catch(error => {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
});
