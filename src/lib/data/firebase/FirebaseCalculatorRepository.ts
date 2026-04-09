import { db } from '../../firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { MaterialOption, CoatingOption, FormatOption } from '@/types/product';
import { ICalculatorRepository } from '../interfaces';
import { MATERIALS, COATINGS, FORMATS, STICKER_PACKS } from '@/data/mock-products';
import { setDoc as fsSetDoc, getDoc as fsGetDoc } from 'firebase/firestore';

export class FirebaseCalculatorRepository implements ICalculatorRepository {
    private optionsCol = collection(db, 'calculator_options');
    private productsCol = collection(db, 'products');

    async getOptions(): Promise<{ materials: MaterialOption[], coatings: CoatingOption[], formats: FormatOption[] }> {
        const materialsSnap = await getDoc(doc(this.optionsCol, 'materials'));
        const coatingsSnap = await getDoc(doc(this.optionsCol, 'coatings'));
        const formatsSnap = await getDoc(doc(this.optionsCol, 'formats'));

        return {
            materials: (materialsSnap.data()?.items || []) as MaterialOption[],
            coatings: (coatingsSnap.data()?.items || []) as CoatingOption[],
            formats: (formatsSnap.data()?.items || []) as FormatOption[],
        };
    }

    async updateOption(type: 'materials' | 'coatings' | 'formats', items: any[]): Promise<void> {
        await setDoc(doc(this.optionsCol, type), { items });
    }

    // Moved from firestore-utils - one time seeding logic
    async seedDatabase(): Promise<void> {
        console.log("Starting Seed...");
        if (!db) throw new Error("Firestore instance (db) is undefined. Check firebase.ts initialization.");

        const withTimeout = <T>(promise: Promise<T>, ms: number, opName: string): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<T>((_, reject) =>
                    setTimeout(() => reject(new Error(`Operation '${opName}' timed out after ${ms}ms`)), ms)
                )
            ]);
        };

        try {
            console.log("Checking Firestore connection...");
            await withTimeout(fsGetDoc(doc(this.productsCol, 'test_connectivity')), 5000, 'Connectivity Check');
            console.log("Connection verified.");

            for (const pack of STICKER_PACKS) {
                console.log(`Seeding Product: ${pack.id}...`);
                try {
                    await withTimeout(
                        fsSetDoc(doc(this.productsCol, pack.id), { ...pack, createdAt: Date.now() }),
                        10000,
                        `Set Product ${pack.id}`
                    );
                    console.log(`Seeded Product: ${pack.id} SUCCESS`);
                } catch (pErr: any) {
                    console.error(`Failed to seed product ${pack.id}:`, pErr);
                    throw pErr;
                }
            }

            console.log("Seeding Materials...");
            await withTimeout(fsSetDoc(doc(this.optionsCol, 'materials'), { items: MATERIALS }), 10000, 'Set Materials');

            console.log("Seeding Coatings...");
            await withTimeout(fsSetDoc(doc(this.optionsCol, 'coatings'), { items: COATINGS }), 10000, 'Set Coatings');

            console.log("Seeding Formats...");
            await withTimeout(fsSetDoc(doc(this.optionsCol, 'formats'), { items: FORMATS }), 10000, 'Set Formats');

            console.log("Seed Complete!");
        } catch (error) {
            console.error("Error during seeding flow:", error);
            throw error;
        }
    }
}
