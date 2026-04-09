import { db } from '../../firebase';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { StickerPack } from '@/types/product';
import { IProductRepository } from '../interfaces';

export class FirebaseProductRepository implements IProductRepository {
    private productsCol = collection(db, 'products');

    async getAll(): Promise<StickerPack[]> {
        const q = query(this.productsCol, orderBy('createdAt', 'desc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Serialize timestamp for Next.js boundary
                    createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
                } as StickerPack;
            });
        } catch {
            const snapshot = await getDocs(this.productsCol);
            const products = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
                 } as StickerPack;
            });
            return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
    }

    async getNewest(limitArg: number = 4): Promise<StickerPack[]> {
        const products = await this.getAll();
        return products.slice(0, limitArg);
    }

    async getById(id: string): Promise<StickerPack | null> {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
            } as StickerPack;
        }
        return null;
    }

    async create(product: Omit<StickerPack, 'id'>): Promise<string> {
        const productWithTimestamp = {
            ...product,
            createdAt: Date.now()
        };
        const docRef = await addDoc(this.productsCol, productWithTimestamp);
        return docRef.id;
    }

    async update(id: string, data: Partial<StickerPack>): Promise<void> {
        const docRef = doc(db, 'products', id);
        await updateDoc(docRef, data);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'products', id));
    }
}
