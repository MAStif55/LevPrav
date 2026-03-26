import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// --- 1. Load Environment Variables from .env.local ---
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.warn("No .env.local found. Relying on process.env.");
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                process.env[key] = value;
            }
        });
        console.log("Loaded .env.local");
    } catch (e) {
        console.error("Failed to load .env.local", e);
    }
}

loadEnv();

// --- 2. Firebase Configuration ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log("Initializing Firebase with project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 3. Mock Data (embedded to avoid alias/import issues) ---

const MATERIALS = [
    {
        id: "paper_matte",
        label: { en: "Matte Paper", ru: "Матовая бумага" },
        priceMultiplier: 1.0,
        description: { en: "Best for journals", ru: "Идеально для дневников" },
    },
    {
        id: "vinyl_glossy",
        label: { en: "Glossy Vinyl", ru: "Глянцевый винил" },
        priceMultiplier: 1.3,
        description: { en: "Waterproof & durable", ru: "Водостойкий и прочный" },
    },
    {
        id: "vinyl_transparent",
        label: { en: "Transparent Vinyl", ru: "Прозрачный винил" },
        priceMultiplier: 1.4,
        description: { en: "For glass & tech", ru: "Для стекла и техники" },
    },
];

const COATINGS = [
    {
        id: "none",
        label: { en: "None", ru: "Без покрытия" },
        priceAddon: 0,
    },
    {
        id: "holographic",
        label: { en: "Holographic", ru: "Голография" },
        priceAddon: 50,
    },
    {
        id: "glitter",
        label: { en: "Glitter", ru: "Блёстки" },
        priceAddon: 60,
    },
];

const FORMATS = [
    {
        id: "a5",
        label: "A5",
        width: 148,
        height: 210,
        basePriceModifier: 1.0,
    },
    {
        id: "a4",
        label: "A4",
        width: 210,
        height: 297,
        basePriceModifier: 1.8,
    },
];

const STICKER_PACKS = [
    {
        id: "pack_cyber_cats",
        type: "sticker_pack",
        slug: "cyber-cats",
        title: { en: "Cyber Cats", ru: "Кибер-Коты" },
        description: { en: "Neon-lit felines from the future.", ru: "Неоновые коты из будущего." },
        basePrice: 350,
        images: ["/pack-cyber.png"],
        artist: "AlexNeo",
    },
    {
        id: "pack_forest_spirits",
        type: "sticker_pack",
        slug: "forest-spirits",
        title: { en: "Forest Spirits", ru: "Духи Леса" },
        description: { en: "Mystical creatures hiding in the moss.", ru: "Мистические существа, прячущиеся во мху." },
        basePrice: 300,
        images: ["/pack-forest.png"],
        artist: "GreenLeaf",
    },
    {
        id: "pack_retro_vapour",
        type: "sticker_pack",
        slug: "retro-vapour",
        title: { en: "Retro Vapour", ru: "Ретро Вейпор" },
        description: { en: "Aesthetic statues and windows 95 errors.", ru: "Эстетичные статуи и ошибки Windows 95." },
        basePrice: 320,
        images: ["/pack-retro.png"],
        artist: "VapeGod",
    },
    {
        id: "pack_space_explorers",
        type: "sticker_pack",
        slug: "space-explorers",
        title: { en: "Space Explorers", ru: "Исследователи Космоса" },
        description: { en: "Cute astronauts and distant planets.", ru: "Милые астронавты и далекие планеты." },
        basePrice: 380,
        images: ["/pack-space.png"],
        artist: "StarWalker",
    },
    {
        id: "pack_dino_park",
        type: "sticker_pack",
        slug: "dino-park",
        title: { en: "Dino Park", ru: "Парк Динозавров" },
        description: { en: "Roaring fun with prehistoric friends.", ru: "Веселье с доисторическими друзьями." },
        basePrice: 340,
        images: ["/pack-dino.png"],
        artist: "PaleoArt",
    },
    {
        id: "pack_pixel_lives",
        type: "sticker_pack",
        slug: "pixel-lives",
        title: { en: "Pixel Lives", ru: "Пиксельная Жизнь" },
        description: { en: "8-bit characters in a modern world.", ru: "8-битные персонажи в современном мире." },
        basePrice: 300,
        images: ["/pack-pixel.png"],
        artist: "BitMaster",
    },
];

// --- 4. Seeding Logic ---
async function seed() {
    try {
        const productsCol = collection(db, 'products');
        const optionsCol = collection(db, 'calculator_options');

        console.log("Seeding Products...");
        for (const pack of STICKER_PACKS) {
            console.log(`  Writing ${pack.id}...`);
            await setDoc(doc(productsCol, pack.id), pack);
        }

        console.log("Seeding Options...");
        console.log("  Writing materials...");
        await setDoc(doc(optionsCol, 'materials'), { items: MATERIALS });

        console.log("  Writing coatings...");
        await setDoc(doc(optionsCol, 'coatings'), { items: COATINGS });

        console.log("  Writing formats...");
        await setDoc(doc(optionsCol, 'formats'), { items: FORMATS });

        console.log("✅ Seeding Complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
}

seed();
