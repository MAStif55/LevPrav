import { db } from './firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { CartItem } from '@/store/cart-store';
import { Order } from '@/types/order';
import { CheckoutFormData } from './checkout-schema';

// ─── API Configuration ───────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://europe-west1-levprav-art.cloudfunctions.net';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateOrderResult {
    success: boolean;
    orderId?: string;
    paymentUrl?: string; // Present when paymentMethod === 'card'
    error?: string;
}

// ─── Create Order (via Cloud Function) ───────────────────────────────────────

/**
 * Creates a new order by calling the createOrder Cloud Function.
 * The CF handles: validation, total calculation, gift discount, YooKassa payment,
 * Telegram/Email notifications, and error logging.
 */
export async function createOrder(
    cartItems: CartItem[],
    customerInfo: CheckoutFormData,
    total: number
): Promise<CreateOrderResult> {
    try {
        // Transform cart items for the API — fix productTitle serialization
        // Cart holds packTitle as { en: string; ru: string }, we flatten to plain string
        const apiItems = cartItems.map((item) => ({
            productId: item.packId,
            productTitle: typeof item.packTitle === 'object'
                ? (item.packTitle.ru || item.packTitle.en || '')
                : String(item.packTitle || ''),
            quantity: item.quantity,
            price: item.price,
            configuration: item.configuration || null,
        }));

        const response = await fetch(`${API_BASE_URL}/createOrder`, {
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
            return {
                success: false,
                error: data.error || 'Order creation failed',
            };
        }

        return {
            success: true,
            orderId: data.orderId,
            paymentUrl: data.paymentUrl || undefined,
        };
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ─── Get Order by ID ─────────────────────────────────────────────────────────

/**
 * Fetches an order by ID from Firestore (client-side read).
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return null;
        }

        const data = orderSnap.data();
        return {
            id: orderSnap.id,
            customerName: data.customerName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            telegram: data.telegram,
            contactPreferences: data.contactPreferences,
            items: data.items,
            total: data.total,
            giftDiscount: data.giftDiscount,
            status: data.status,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            paymentId: data.paymentId,
            paymentUrl: data.paymentUrl,
            paidAt: data.paidAt,
            notes: data.notes,
            customerNotes: data.customerNotes,
            notificationStatus: data.notificationStatus,
            createdAt:
                data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : data.createdAt,
        } as Order;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}
