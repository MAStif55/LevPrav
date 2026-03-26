import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import {
    StickerPack,
    MaterialOption,
    CoatingOption,
    FormatOption
} from '@/types/product';
import { Order } from '@/types/order';
import { MATERIALS, COATINGS, FORMATS, STICKER_PACKS } from '@/data/mock-products';

// Collection References
export const productsCol = collection(db, 'products');
export const ordersCol = collection(db, 'orders');
export const optionsCol = collection(db, 'calculator_options');

// --- Product Helper Functions ---

export async function getAllProducts(): Promise<StickerPack[]> {
    // Sort by createdAt descending (newest first), fallback to no order for products without createdAt
    const q = query(productsCol, orderBy('createdAt', 'desc'));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StickerPack));
    } catch {
        // Fallback if index doesn't exist yet or some products don't have createdAt
        const snapshot = await getDocs(productsCol);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StickerPack));
        // Sort in memory by createdAt (newest first), put items without createdAt at the end
        return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
}

export async function getNewestProducts(limit: number = 4): Promise<StickerPack[]> {
    const products = await getAllProducts();
    return products.slice(0, limit);
}

export async function getProductById(id: string): Promise<StickerPack | null> {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as StickerPack;
    }
    return null;
}

export async function createProduct(product: Omit<StickerPack, 'id'>) {
    // Add createdAt timestamp when creating new products
    const productWithTimestamp = {
        ...product,
        createdAt: Date.now()
    };
    const docRef = await addDoc(productsCol, productWithTimestamp);
    return docRef.id;
}

export async function updateProduct(id: string, data: Partial<StickerPack>) {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, data);
}

export async function deleteProduct(id: string) {
    await deleteDoc(doc(db, 'products', id));
}

// --- Order Helper Functions ---

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>) {
    const docRef = await addDoc(ordersCol, {
        ...order,
        status: 'pending',
        createdAt: Date.now()
    });
    return docRef.id;
}

// --- Calculator Configuration Helper Functions ---

export async function getCalculatorOptions() {
    const materialsSnap = await getDoc(doc(optionsCol, 'materials'));
    const coatingsSnap = await getDoc(doc(optionsCol, 'coatings'));
    const formatsSnap = await getDoc(doc(optionsCol, 'formats'));

    return {
        materials: (materialsSnap.data()?.items || []) as MaterialOption[],
        coatings: (coatingsSnap.data()?.items || []) as CoatingOption[],
        formats: (formatsSnap.data()?.items || []) as FormatOption[],
    };
}

export async function updateCalculatorOption(type: 'materials' | 'coatings' | 'formats', items: any[]) {
    await setDoc(doc(optionsCol, type), { items });
}

// --- Seeding Function (One-time use) ---

const withTimeout = <T>(promise: Promise<T>, ms: number, opName: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Operation '${opName}' timed out after ${ms}ms`)), ms)
        )
    ]);
};

export async function seedDatabase() {
    console.log("Starting Seed...");
    if (!db) throw new Error("Firestore instance (db) is undefined. Check firebase.ts initialization.");

    try {
        // Simple connectivity check
        console.log("Checking Firestore connection...");
        await withTimeout(getDoc(doc(productsCol, 'test_connectivity')), 5000, 'Connectivity Check');
        console.log("Connection verified.");

        // Seed Products
        for (const pack of STICKER_PACKS) {
            console.log(`Seeding Product: ${pack.id}...`);
            try {
                await withTimeout(
                    setDoc(doc(productsCol, pack.id), { ...pack }),
                    10000,
                    `Set Product ${pack.id}`
                );
                console.log(`Seeded Product: ${pack.id} SUCCESS`);
            } catch (pErr: any) {
                console.error(`Failed to seed product ${pack.id}:`, pErr);
                throw pErr; // Stop seeding if one fails, or continue? Let's stop to see error.
            }
        }

        // Seed Options
        console.log("Seeding Materials...");
        await withTimeout(setDoc(doc(optionsCol, 'materials'), { items: MATERIALS }), 10000, 'Set Materials');

        console.log("Seeding Coatings...");
        await withTimeout(setDoc(doc(optionsCol, 'coatings'), { items: COATINGS }), 10000, 'Set Coatings');

        console.log("Seeding Formats...");
        await withTimeout(setDoc(doc(optionsCol, 'formats'), { items: FORMATS }), 10000, 'Set Formats');

        console.log("Seed Complete!");
    } catch (error) {
        console.error("Error during seeding flow:", error);
        throw error;
    }
}
