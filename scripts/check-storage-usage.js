/**
 * Check Firebase Storage Usage
 * This script calculates the total size of all files in the storage bucket
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '..', 'levprav-art-firebase-adminsdk-fbsvc-9b36661e3b.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        storageBucket: 'levprav-art.firebasestorage.app'
    });
} catch (error) {
    // If already initialized, use existing instance
    if (error.code !== 'app/duplicate-app') {
        throw error;
    }
}

const bucket = admin.storage().bucket();

async function calculateStorageUsage() {
    console.log('🔍 Calculating Firebase Storage usage for: levprav-art.firebasestorage.app\n');

    let totalSize = 0;
    let fileCount = 0;
    const folderSizes = {};

    try {
        const [files] = await bucket.getFiles();

        for (const file of files) {
            const [metadata] = await file.getMetadata();
            const size = parseInt(metadata.size, 10) || 0;
            totalSize += size;
            fileCount++;

            // Track size by top-level folder
            const folder = file.name.split('/')[0] || 'root';
            folderSizes[folder] = (folderSizes[folder] || 0) + size;
        }

        // Format sizes
        const formatSize = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        console.log('═══════════════════════════════════════════════════════');
        console.log('                  STORAGE USAGE SUMMARY                 ');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`\n📦 Total Files: ${fileCount}`);
        console.log(`💾 Total Size:  ${formatSize(totalSize)}`);
        console.log(`📊 Raw Bytes:   ${totalSize.toLocaleString()} bytes`);

        console.log('\n───────────────────────────────────────────────────────');
        console.log('                  BREAKDOWN BY FOLDER                   ');
        console.log('───────────────────────────────────────────────────────');

        const sortedFolders = Object.entries(folderSizes).sort((a, b) => b[1] - a[1]);
        for (const [folder, size] of sortedFolders) {
            const percentage = ((size / totalSize) * 100).toFixed(1);
            console.log(`  📁 ${folder.padEnd(20)} ${formatSize(size).padStart(10)}  (${percentage}%)`);
        }

        // Quota info (Blaze plan)
        console.log('\n───────────────────────────────────────────────────────');
        console.log('                    QUOTA INFORMATION                   ');
        console.log('───────────────────────────────────────────────────────');
        const freeQuota = 5 * 1024 * 1024 * 1024; // 5 GB
        const usedPercentage = ((totalSize / freeQuota) * 100).toFixed(2);
        console.log(`  🆓 Free Tier:     5 GB`);
        console.log(`  📈 Used:          ${usedPercentage}% of free tier`);
        console.log(`  💰 Blaze Plan:    Unlimited (pay-as-you-go after 5 GB)`);
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error calculating storage usage:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

calculateStorageUsage();
