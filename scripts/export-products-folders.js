/**
 * Export Products with Images
 * 
 * Creates a folder for each product containing:
 * - info.txt with all product details
 * - Downloaded image files
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Get output directory from command line argument
const outputDir = process.argv[2];
if (!outputDir) {
    console.error('❌ Error: Output directory not specified');
    process.exit(1);
}

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: service-account.json not found');
    process.exit(1);
}

if (!admin.apps.length) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'levprav-art.firebasestorage.app'
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Download image from URL
function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(destPath);

        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                downloadImage(response.headers.location, destPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

// Download from Firebase Storage path
async function downloadStorageFile(storagePath, destPath) {
    try {
        const file = bucket.file(storagePath);
        await file.download({ destination: destPath });
        return true;
    } catch (error) {
        return false;
    }
}

// Create a safe folder name from product title
function safeFolderName(title, id) {
    const name = title || id;
    return name
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
        .replace(/\s+/g, '_')          // Spaces to underscores
        .substring(0, 50);             // Limit length
}

async function exportProducts() {
    console.log('');
    console.log('📁 Products Export with Images');
    console.log('===============================');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Fetch products
    const snapshot = await db.collection('products').get();
    const products = [];

    snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`  Found ${products.length} products`);
    console.log('');

    let productCount = 0;
    let imageCount = 0;

    for (const product of products) {
        productCount++;
        const folderName = safeFolderName(product.title?.ru || product.title?.en, product.id);
        const productDir = path.join(outputDir, `${productCount.toString().padStart(2, '0')}_${folderName}`);

        // Create product folder
        if (!fs.existsSync(productDir)) {
            fs.mkdirSync(productDir, { recursive: true });
        }

        console.log(`  [${productCount}/${products.length}] ${folderName}`);

        // Create info.txt with product details
        const info = `
═══════════════════════════════════════════════════════════
PRODUCT INFO
═══════════════════════════════════════════════════════════

ID:          ${product.id}
Slug:        ${product.slug || '-'}
Type:        ${product.type || 'sticker_pack'}

───────────────────────────────────────────────────────────
TITLE
───────────────────────────────────────────────────────────
English:     ${product.title?.en || '-'}
Russian:     ${product.title?.ru || '-'}

───────────────────────────────────────────────────────────
DESCRIPTION
───────────────────────────────────────────────────────────
English:     ${product.description?.en || '-'}
Russian:     ${product.description?.ru || '-'}

───────────────────────────────────────────────────────────
PRICING
───────────────────────────────────────────────────────────
Base Price:  ${product.basePrice || 0} ₽

───────────────────────────────────────────────────────────
OTHER
───────────────────────────────────────────────────────────
Artist:      ${product.artist || '-'}
Category:    ${product.category || '-'}
Tags:        ${(product.tags || []).join(', ') || '-'}

───────────────────────────────────────────────────────────
IMAGES (${(product.images || []).length} files)
───────────────────────────────────────────────────────────
${(product.images || []).map((img, i) => `Image ${i + 1}: ${img}`).join('\n') || 'No images'}

═══════════════════════════════════════════════════════════
`;

        fs.writeFileSync(path.join(productDir, 'info.txt'), info, 'utf-8');

        // Download images
        const images = product.images || [];
        for (let i = 0; i < images.length; i++) {
            const imgUrl = images[i];
            const ext = imgUrl.includes('.webp') ? 'webp' :
                imgUrl.includes('.png') ? 'png' :
                    imgUrl.includes('.jpg') || imgUrl.includes('.jpeg') ? 'jpg' : 'webp';
            const imgName = `image_${i + 1}.${ext}`;
            const imgPath = path.join(productDir, imgName);

            try {
                if (imgUrl.startsWith('http')) {
                    // Download from URL
                    await downloadImage(imgUrl, imgPath);
                    console.log(`        ✅ ${imgName}`);
                    imageCount++;
                } else if (imgUrl.startsWith('/')) {
                    // Local path in public folder - copy it
                    const localPath = path.join(process.cwd(), 'public', imgUrl);
                    if (fs.existsSync(localPath)) {
                        fs.copyFileSync(localPath, imgPath);
                        console.log(`        ✅ ${imgName} (local)`);
                        imageCount++;
                    } else {
                        console.log(`        ⚠️ ${imgName} (not found locally)`);
                    }
                }
            } catch (error) {
                console.log(`        ❌ ${imgName}: ${error.message}`);
            }
        }
    }

    console.log('');
    console.log(`📊 Exported: ${productCount} products, ${imageCount} images`);
    console.log(`📁 Location: ${outputDir}`);
    console.log('');

    process.exit(0);
}

exportProducts().catch(error => {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
});
