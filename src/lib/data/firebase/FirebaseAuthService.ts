import { auth } from '../../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { IAuthService } from '../interfaces';

export class FirebaseAuthService implements IAuthService {
    onAuthStateChanged(callback: (user: any | null) => void): () => void {
        if (!auth) {
            console.error("Auth instance is missing. Firebase initialization failed?");
            callback(null);
            return () => {};
        }
        return onAuthStateChanged(auth, callback);
    }

    async signIn(email: string, pass: string): Promise<void> {
        await signInWithEmailAndPassword(auth, email, pass);
    }

    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
    }
}
