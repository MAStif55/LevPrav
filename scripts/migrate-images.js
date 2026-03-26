/**
 * Batch Image Migration Script
 *
 * Processes existing product images in Firebase Storage to generate
 * optimized WebP variants (_card: 600px and _thumb: 300px).
 *
 * Usage:
 *   node scripts/migrate-images.js
 *   node scripts/migrate-images.js --dry-run
 *   node scripts/migrate-images.js --product-id=PRODUCT_ID
 *
 * Requirements:
 *   npm install sharp firebase-admin
 *   Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.
 */

const admin = require('firebase-admin');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Config ──────────────────────────────────────────────────────────────────

const VARIANTS = [
    { suffix: '_card',  maxDim: 600,  quality: 82 },
    { suffix: '_thumb', maxDim: 300,  quality: 75 },
];

// ─── Parse CLI flags ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const productIdArg = args.find(a => a.startsWith('--product-id='));
const targetProductId = productIdArg ? productIdArg.split('=')[1] : null;

// ─── Initialize Firebase ─────────────────────────────────────────────────────

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.resolve(__dirname, '..', 'service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    storageBucket: 'levprav-art.firebasestorage.app',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Downloads an image from a URL and returns it as a Buffer.
 */
async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${url} (${response.status})`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Resizes and converts an image buffer to WebP using sharp.
 */
async function processImage(buffer, maxDim, quality) {
    return sharp(buffer)
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
}

/**
 * Uploads a buffer to Firebase Storage and returns a public URL.
 */
async function uploadToStorage(buffer, storagePath) {
    const file = bucket.file(storagePath);
    const token = uuidv4();

    await file.save(buffer, {
        metadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable',
            metadata: {
                firebaseStorageDownloadTokens: token,
            },
        },
    });

    // Construct the public download URL
    const encodedPath = encodeURIComponent(storagePath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

/**
 * Extracts the storage path from a Firebase Storage download URL.
 */
function extractStoragePath(url) {
    try {
        const match = url.match(/\/o\/(.+?)\?/);
        if (match) return decodeURIComponent(match[1]);
    } catch {}
    return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🖼️  Image Migration Script');
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    if (targetProductId) console.log(`   Target product: ${targetProductId}`);
    console.log('');

    // Fetch products
    let query = db.collection('products');
    if (targetProductId) {
        const doc = await db.collection('products').doc(targetProductId).get();
        if (!doc.exists) {
            console.error(`Product ${targetProductId} not found`);
            process.exit(1);
        }
        await processProduct(doc);
        return;
    }

    const snapshot = await query.get();
    console.log(`Found ${snapshot.size} products\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
        try {
            const result = await processProduct(doc);
            if (result === 'processed') processed++;
            else skipped++;
        } catch (err) {
            console.error(`  ❌ Error processing ${doc.id}:`, err.message);
            errors++;
        }
    }

    console.log('\n────────────────────────────────────');
    console.log(`✅ Processed: ${processed}`);
    console.log(`⏭️  Skipped (already migrated): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
}

async function processProduct(doc) {
    const data = doc.data();
    const title = data.title?.ru || data.title?.en || doc.id;
    const images = data.images || [];

    console.log(`📦 ${title} (${doc.id})`);

    let hasChanges = false;
    const updatedImages = [];

    for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // If it's already a structured ProductImage with variants, skip
        if (typeof img === 'object' && img.cardUrl && img.thumbUrl) {
            console.log(`  ✅ Image ${i + 1}: already has variants`);
            updatedImages.push(img);
            continue;
        }

        // Get the source URL
        const sourceUrl = typeof img === 'string' ? img : img.url;
        if (!sourceUrl) {
            console.log(`  ⚠️  Image ${i + 1}: no URL found, skipping`);
            updatedImages.push(img);
            continue;
        }

        console.log(`  🔄 Image ${i + 1}: generating variants...`);

        if (dryRun) {
            updatedImages.push(typeof img === 'object' ? img : { url: img });
            hasChanges = true;
            continue;
        }

        try {
            // Download the original
            const buffer = await downloadImage(sourceUrl);

            // Extract base storage path for naming variants
            const storagePath = extractStoragePath(sourceUrl);
            const basePath = storagePath
                ? storagePath.replace(/\.[^.]+$/, '')
                : `uploads/${Date.now()}_migrated_${i}`;

            // Generate and upload variants
            const result = typeof img === 'object' ? { ...img } : { url: sourceUrl };

            for (const variant of VARIANTS) {
                const variantBuffer = await processImage(buffer, variant.maxDim, variant.quality);
                const variantPath = `${basePath}${variant.suffix}.webp`;
                const variantUrl = await uploadToStorage(variantBuffer, variantPath);

                if (variant.suffix === '_card') result.cardUrl = variantUrl;
                if (variant.suffix === '_thumb') result.thumbUrl = variantUrl;

                console.log(`     ${variant.suffix}: ${(variantBuffer.length / 1024).toFixed(1)}KB`);
            }

            updatedImages.push(result);
            hasChanges = true;
        } catch (err) {
            console.error(`  ❌ Failed to process image ${i + 1}:`, err.message);
            updatedImages.push(img); // Keep original
        }
    }

    if (hasChanges && !dryRun) {
        await db.collection('products').doc(doc.id).update({ images: updatedImages });
        console.log(`  💾 Firestore updated`);
    }

    return hasChanges ? 'processed' : 'skipped';
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
