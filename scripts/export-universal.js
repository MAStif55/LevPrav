/**
 * Universal Database Export Script
 * 
 * Exports Firestore data in multiple universally compatible formats:
 * - JSON (standard format, works with any system)
 * - CSV (works with Excel, PostgreSQL, MySQL, etc.)
 * - SQL (ready-to-import for PostgreSQL/MySQL)
 * - NDJSON (Newline Delimited JSON - great for MongoDB, BigQuery)
 * 
 * Usage: node scripts/export-universal.js <output-dir>
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get output directory from command line argument
const outputDir = process.argv[2];
if (!outputDir) {
    console.error('❌ Error: Output directory not specified');
    console.error('Usage: node scripts/export-universal.js <output-dir>');
    process.exit(1);
}

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: service-account.json not found in project root');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'levprav-art.firebasestorage.app'
});

const db = admin.firestore();

// Helper: Escape SQL string
function escapeSql(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return `'${String(value).replace(/'/g, "''")}'`;
}

// Helper: Escape CSV field
function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Helper: Flatten nested object for CSV
function flattenObject(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
            // Check if it's a Firestore Timestamp
            if (obj[key]._seconds !== undefined) {
                result[newKey] = new Date(obj[key]._seconds * 1000).toISOString();
            } else {
                Object.assign(result, flattenObject(obj[key], newKey));
            }
        } else if (Array.isArray(obj[key])) {
            result[newKey] = JSON.stringify(obj[key]);
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

// Export to JSON (Firestore-style with document IDs)
function exportToJson(data, collectionName) {
    const outputPath = path.join(outputDir, 'json', `${collectionName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`    ✅ JSON: ${collectionName}.json`);
}

// Export to NDJSON (Newline Delimited JSON - MongoDB compatible)
function exportToNdjson(data, collectionName) {
    const outputPath = path.join(outputDir, 'ndjson', `${collectionName}.ndjson`);
    const lines = Object.entries(data).map(([id, doc]) =>
        JSON.stringify({ _id: id, ...doc })
    );
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    console.log(`    ✅ NDJSON: ${collectionName}.ndjson (MongoDB/BigQuery compatible)`);
}

// Export to CSV (Excel/PostgreSQL/MySQL compatible)
function exportToCsv(data, collectionName) {
    const docs = Object.entries(data).map(([id, doc]) => ({
        id,
        ...flattenObject(doc)
    }));

    if (docs.length === 0) {
        console.log(`    ⏭️  CSV: Skipped (no documents)`);
        return;
    }

    // Get all unique keys
    const allKeys = new Set();
    docs.forEach(doc => Object.keys(doc).forEach(key => allKeys.add(key)));
    const headers = Array.from(allKeys);

    // Create CSV content
    const csvLines = [
        headers.join(','), // Header row
        ...docs.map(doc =>
            headers.map(header => escapeCsv(doc[header])).join(',')
        )
    ];

    const outputPath = path.join(outputDir, 'csv', `${collectionName}.csv`);
    fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
    console.log(`    ✅ CSV: ${collectionName}.csv (Excel/PostgreSQL/MySQL)`);
}

// Export to SQL (PostgreSQL/MySQL compatible INSERT statements)
function exportToSql(data, collectionName) {
    const docs = Object.entries(data);

    if (docs.length === 0) {
        console.log(`    ⏭️  SQL: Skipped (no documents)`);
        return;
    }

    // Flatten first document to get column structure
    const firstDoc = flattenObject(docs[0][1]);
    const columns = ['id', ...Object.keys(firstDoc)];

    // Generate CREATE TABLE statement
    let sql = `-- ${collectionName} table\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;
    sql += `-- For PostgreSQL:\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${collectionName} (\n`;
    sql += `  id VARCHAR(255) PRIMARY KEY,\n`;
    sql += columns.slice(1).map(col => `  ${col.replace(/[^a-zA-Z0-9_]/g, '_')} TEXT`).join(',\n');
    sql += `\n);\n\n`;

    // Generate INSERT statements
    sql += `-- INSERT statements:\n`;
    for (const [id, doc] of docs) {
        const flatDoc = { id, ...flattenObject(doc) };
        const values = columns.map(col => escapeSql(flatDoc[col]));
        sql += `INSERT INTO ${collectionName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    }

    const outputPath = path.join(outputDir, 'sql', `${collectionName}.sql`);
    fs.writeFileSync(outputPath, sql, 'utf-8');
    console.log(`    ✅ SQL: ${collectionName}.sql (PostgreSQL/MySQL ready)`);
}

// Export a single collection in all formats
async function exportCollection(collectionName) {
    console.log(`\n  📁 Exporting ${collectionName}...`);

    const snapshot = await db.collection(collectionName).get();
    const data = {};

    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });

    console.log(`     Found ${snapshot.size} documents`);

    exportToJson(data, collectionName);
    exportToNdjson(data, collectionName);
    exportToCsv(data, collectionName);
    exportToSql(data, collectionName);

    return snapshot.size;
}

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🌐 Universal Database Export');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('  Output formats:');
    console.log('  • JSON     → Any system, Firebase restore');
    console.log('  • NDJSON   → MongoDB, BigQuery, data pipelines');
    console.log('  • CSV      → Excel, PostgreSQL, MySQL, Supabase');
    console.log('  • SQL      → PostgreSQL, MySQL (ready to import)');

    // Create output directories
    ['json', 'ndjson', 'csv', 'sql'].forEach(format => {
        const dir = path.join(outputDir, format);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    const collections = ['products', 'orders', 'calculator_options', 'config'];
    let totalDocuments = 0;

    for (const collection of collections) {
        try {
            const count = await exportCollection(collection);
            totalDocuments += count;
        } catch (error) {
            if (error.code === 5) {
                console.log(`\n  📁 ${collection}: Collection not found (skipped)`);
            } else {
                console.error(`\n  ❌ ${collection}: ${error.message}`);
            }
        }
    }

    // Create migration guide
    const migrationGuide = `
# Database Migration Guide
=========================

Generated: ${new Date().toISOString()}
Total Documents: ${totalDocuments}

## Available Formats

### 1. JSON (json/*.json)
   - Use for: Firebase restore, Supabase, any Node.js app
   - Format: { "documentId": { ...data } }

### 2. NDJSON (ndjson/*.ndjson)  
   - Use for: MongoDB (mongoimport), BigQuery, data pipelines
   - Format: One JSON object per line with _id field
   - Import to MongoDB: mongoimport --db mydb --collection products --file products.ndjson

### 3. CSV (csv/*.csv)
   - Use for: Excel, Google Sheets, PostgreSQL COPY, MySQL LOAD DATA
   - Format: Standard CSV with headers
   - Nested objects are flattened (e.g., title_en, title_ru)
   - Arrays are JSON-stringified
   - PostgreSQL: COPY products FROM 'products.csv' WITH CSV HEADER;

### 4. SQL (sql/*.sql)
   - Use for: PostgreSQL, MySQL direct import
   - Contains: CREATE TABLE + INSERT statements
   - Import: psql -d mydb -f products.sql

## Recommended Migration Paths

### To Supabase (PostgreSQL):
1. Create tables using sql/*.sql schema
2. Import data using CSV or SQL files
3. Update your app's database client code

### To MongoDB:
1. Use ndjson files with mongoimport
2. Update your app to use MongoDB driver

### To MySQL:
1. Run sql/*.sql files
2. Or use CSV with LOAD DATA INFILE

### To another Firebase project:
1. Use json/*.json files
2. Write import script using Firebase Admin SDK
`;

    fs.writeFileSync(path.join(outputDir, 'MIGRATION_GUIDE.md'), migrationGuide, 'utf-8');

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Export Complete!`);
    console.log(`  📊 ${totalDocuments} total documents exported`);
    console.log(`  📁 Location: ${outputDir}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    process.exit(0);
}

main().catch(error => {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
});
