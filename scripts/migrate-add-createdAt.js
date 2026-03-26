/**
 * Migration: Add createdAt to existing products
 * 
 * This script adds a createdAt timestamp to all products that don't have one.
 * Products are assigned timestamps based on their order to preserve relative ordering.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: service-account.json not found');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrate() {
    console.log('');
    console.log('🔄 Migration: Adding createdAt to products');
    console.log('==========================================');

    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        data: doc.data(),
        index
    }));

    console.log(`  Found ${products.length} products`);

    // Count products without createdAt
    const needsMigration = products.filter(p => !p.data.createdAt);
    console.log(`  Products needing migration: ${needsMigration.length}`);

    if (needsMigration.length === 0) {
        console.log('  ✅ All products already have createdAt');
        process.exit(0);
    }

    console.log('');
    console.log('  Migrating...');

    // Base timestamp: Jan 1, 2025 midnight
    const baseTimestamp = new Date('2025-01-01T00:00:00Z').getTime();
    const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    for (const product of needsMigration) {
        // Assign timestamps with 1-day gaps to preserve ordering
        const createdAt = baseTimestamp + (product.index * oneDay);

        await db.collection('products').doc(product.id).update({
            createdAt: createdAt
        });

        console.log(`    ✅ ${product.id} → ${new Date(createdAt).toISOString().split('T')[0]}`);
    }

    console.log('');
    console.log(`📊 Migrated ${needsMigration.length} products`);
    console.log('');
    console.log('✅ Migration complete!');
    console.log('   New products created via admin will now appear first in "New Arrivals"');
    console.log('');

    process.exit(0);
}

migrate().catch(error => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
});
