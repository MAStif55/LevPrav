/**
 * Export Products to CSV
 * 
 * Creates a CSV file with all product data for easy viewing in Excel/Google Sheets.
 * Includes: title, description, price, artist, images, etc.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get output directory from command line argument
const outputDir = process.argv[2];
if (!outputDir) {
    console.error('❌ Error: Output directory not specified');
    console.error('Usage: node scripts/export-products-csv.js <output-dir>');
    process.exit(1);
}

// Initialize Firebase Admin (skip if already initialized)
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

// Escape CSV field (handle commas, quotes, newlines)
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

async function exportProductsCSV() {
    console.log('');
    console.log('📊 Products CSV Export');
    console.log('======================');

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

    // CSV Headers
    const headers = [
        'ID',
        'Slug',
        'Title (EN)',
        'Title (RU)',
        'Description (EN)',
        'Description (RU)',
        'Base Price',
        'Artist',
        'Category',
        'Type',
        'Tags',
        'Image 1',
        'Image 2',
        'Image 3'
    ];

    // Build CSV content
    let csv = headers.join(',') + '\n';

    for (const product of products) {
        const row = [
            escapeCSV(product.id),
            escapeCSV(product.slug || ''),
            escapeCSV(product.title?.en || ''),
            escapeCSV(product.title?.ru || ''),
            escapeCSV(product.description?.en || ''),
            escapeCSV(product.description?.ru || ''),
            escapeCSV(product.basePrice || 0),
            escapeCSV(product.artist || ''),
            escapeCSV(product.category || ''),
            escapeCSV(product.type || 'sticker_pack'),
            escapeCSV((product.tags || []).join('; ')),
            escapeCSV(product.images?.[0] || ''),
            escapeCSV(product.images?.[1] || ''),
            escapeCSV(product.images?.[2] || '')
        ];
        csv += row.join(',') + '\n';
    }

    // Write CSV file
    const csvPath = path.join(outputDir, 'products.csv');
    fs.writeFileSync(csvPath, '\uFEFF' + csv, 'utf-8'); // BOM for Excel UTF-8 support

    console.log(`  ✅ Saved to: products.csv`);

    // Also export calculator options as separate CSVs
    await exportCalculatorOptions(outputDir);

    console.log('');
    console.log(`📊 CSV files saved to: ${outputDir}`);
    console.log('');

    process.exit(0);
}

async function exportCalculatorOptions(outputDir) {
    const optionsDoc = await db.collection('calculator_options').get();

    for (const doc of optionsDoc.docs) {
        const type = doc.id; // materials, coatings, formats
        const items = doc.data().items || [];

        if (items.length === 0) continue;

        let csv = '';
        let headers = [];

        if (type === 'materials') {
            headers = ['ID', 'Label (EN)', 'Label (RU)', 'Price Multiplier', 'Description (EN)', 'Description (RU)'];
            csv = headers.join(',') + '\n';
            for (const item of items) {
                csv += [
                    escapeCSV(item.id),
                    escapeCSV(item.label?.en || ''),
                    escapeCSV(item.label?.ru || ''),
                    escapeCSV(item.priceMultiplier || 1),
                    escapeCSV(item.description?.en || ''),
                    escapeCSV(item.description?.ru || '')
                ].join(',') + '\n';
            }
        } else if (type === 'coatings') {
            headers = ['ID', 'Label (EN)', 'Label (RU)', 'Price Addon'];
            csv = headers.join(',') + '\n';
            for (const item of items) {
                csv += [
                    escapeCSV(item.id),
                    escapeCSV(item.label?.en || ''),
                    escapeCSV(item.label?.ru || ''),
                    escapeCSV(item.priceAddon || 0)
                ].join(',') + '\n';
            }
        } else if (type === 'formats') {
            headers = ['ID', 'Label', 'Width (mm)', 'Height (mm)', 'Price Modifier'];
            csv = headers.join(',') + '\n';
            for (const item of items) {
                csv += [
                    escapeCSV(item.id),
                    escapeCSV(item.label || ''),
                    escapeCSV(item.width || 0),
                    escapeCSV(item.height || 0),
                    escapeCSV(item.basePriceModifier || 1)
                ].join(',') + '\n';
            }
        }

        const csvPath = path.join(outputDir, `${type}.csv`);
        fs.writeFileSync(csvPath, '\uFEFF' + csv, 'utf-8');
        console.log(`  ✅ Saved to: ${type}.csv`);
    }
}

exportProductsCSV().catch(error => {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
});
