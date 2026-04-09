import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IStorageService } from '../interfaces';

export class FirebaseStorageService implements IStorageService {
    async uploadFile(path: string, file: Blob, metadata?: any): Promise<string> {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file, metadata);
        return getDownloadURL(storageRef);
    }
}
