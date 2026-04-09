import { db } from '../../firebase';
import { doc, getDoc, getDocs, Timestamp, collection, addDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import { Order } from '@/types/order';
import { IOrderRepository } from '../interfaces';

export class FirebaseOrderRepository implements IOrderRepository {
    private ordersCol = collection(db, 'orders');
    private API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://europe-west1-levprav-art.cloudfunctions.net';

    // The creation logic proxies to the Cloud Function, but the interface requires Omit<Order> param.
    // In order-service it uses CartItem and CheckoutFormData. 
    // We update this wrapper to conform to the IOrderRepository exactly, or provide the exact args it needs.
    // Wait, the IOrderRepository interface asks for an Order. But in order-service.ts it calls fetch to cloud functions.
    // Let's implement the `create` to mimic the original `firestore-utils` createOrder (which didn't use CF).
    // Ah, `order-service.ts` had a specialized createOrder that called CF, and `firestore-utils` had one that called `addDoc`.
    // I will implement both, or implement the `addDoc` version to satisfy the interface, 
    // and keep the CF call inside a dedicated `createOrderViaCF` if needed, but let's stick to the interface first.
    
    async create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string> {
        const docRef = await addDoc(this.ordersCol, {
            ...order,
            status: 'pending',
            createdAt: Date.now()
        });
        return docRef.id;
    }

    // A specific method to support the Cloud Function approach for Cart Checkout
    async checkoutWithCloudFunction(
        cartItems: any[],
        customerInfo: any,
        total: number
    ): Promise<any> {
        try {
            const apiItems = cartItems.map((item) => ({
                productId: item.packId,
                productTitle: typeof item.packTitle === 'object'
                    ? (item.packTitle.ru || item.packTitle.en || '')
                    : String(item.packTitle || ''),
                quantity: item.quantity,
                price: item.price,
                configuration: item.configuration || null,
            }));

            const response = await fetch(`${this.API_BASE_URL}/createOrder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: apiItems,
                    customerName: customerInfo.customerName,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    address: customerInfo.address,
                    telegram: customerInfo.telegram || null,
                    paymentMethod: customerInfo.paymentMethod,
                    customerNotes: customerInfo.customerNotes || null,
                    contactPreferences: customerInfo.contactPreferences || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('createOrder API error:', data);
                return { success: false, error: data.error || 'Order creation failed' };
            }

            return { success: true, orderId: data.orderId, paymentUrl: data.paymentUrl || undefined };
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async getById(orderId: string): Promise<Order | null> {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) return null;

            const data = orderSnap.data();
            return {
                id: orderSnap.id,
                ...data,
                // Crucial fix: Serialize timestamp for Next.js boundary
                createdAt: data.createdAt instanceof Timestamp 
                    ? data.createdAt.toMillis() 
                    : data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            } as Order;
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }

    async getAll(): Promise<Order[]> {
        const q = query(this.ordersCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof Timestamp 
                ? data.createdAt.toMillis() 
                : data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            } as Order;
        });
    }

    async updateStatus(id: string, status: Order['status']): Promise<void> {
        await updateDoc(doc(db, 'orders', id), { status });
    }

    async updateNotes(id: string, notes: string): Promise<void> {
        await updateDoc(doc(db, 'orders', id), { notes });
    }
}
