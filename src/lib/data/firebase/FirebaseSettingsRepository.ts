import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ISettingsRepository } from '../interfaces';

export class FirebaseSettingsRepository implements ISettingsRepository {
    async getSettings(): Promise<any> {
        const docRef = doc(db, 'config', 'store');
        const docSnap = await getDoc(docRef);
        return docSnap.data() || null;
    }
    
    async updateSettings(settings: any): Promise<void> {
        await setDoc(doc(db, 'config', 'store'), settings);
    }
}
