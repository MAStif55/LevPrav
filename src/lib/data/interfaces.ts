import { StickerPack, MaterialOption, FormatOption, CoatingOption } from '@/types/product';
import { Order } from '@/types/order';

export interface IProductRepository {
    getAll(): Promise<StickerPack[]>;
    getNewest(limit?: number): Promise<StickerPack[]>;
    getById(id: string): Promise<StickerPack | null>;
    create(product: Omit<StickerPack, 'id'>): Promise<string>;
    update(id: string, data: Partial<StickerPack>): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface IOrderRepository {
    create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string>;
    checkoutWithCloudFunction(cartItems: any[], customerInfo: any, total: number): Promise<any>;
    getById(orderId: string): Promise<Order | null>;
    getAll(): Promise<Order[]>;
    updateStatus(id: string, status: Order['status']): Promise<void>;
    updateNotes(id: string, notes: string): Promise<void>;
}

export interface ISettingsRepository {
    getSettings(): Promise<any>;
    updateSettings(settings: any): Promise<void>;
}

export interface ICalculatorRepository {
    getOptions(): Promise<{
        materials: MaterialOption[];
        coatings: CoatingOption[];
        formats: FormatOption[];
    }>;
    updateOption(type: 'materials' | 'coatings' | 'formats', items: any[]): Promise<void>;
}

export interface IStorageService {
    uploadFile(path: string, file: Blob, metadata?: any): Promise<string>;
}

export interface IAuthService {
    onAuthStateChanged(callback: (user: any | null) => void): () => void;
    signIn(email: string, pass: string): Promise<void>;
    signOut(): Promise<void>;
}
