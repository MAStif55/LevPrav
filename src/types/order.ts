// ─── Contact Preferences ─────────────────────────────────────────────────────

export type ContactMethod = 'telegram' | 'max' | 'phone_call' | 'sms' | 'email';

export interface ContactPreferences {
    methods: ContactMethod[];
    telegramHandle?: string; // Required if methods includes 'telegram', must start with @
    maxId?: string;          // Required if methods includes 'max'
}

// ─── Order Item ──────────────────────────────────────────────────────────────

export interface OrderItem {
    productId: string;       // References products collection (aliased from packId)
    productTitle: string;    // Snapshot — Russian title at order time
    quantity: number;        // Min 1
    price: number;           // Calculated price including variation modifiers
    configuration?: Record<string, string>; // Key-value option selections
    selectedVariations?: Array<{ groupId: string; optionId: string; label: string }>;
    // Legacy aliases for backward compatibility
    packId?: string;
    packTitle?: string;
    materialId?: string;
    coatingId?: string;
    formatId?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface Order {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    address: string;
    telegram?: string;                      // Legacy field
    contactPreferences?: ContactPreferences; // New multi-method contact system
    items: OrderItem[];
    total: number;
    giftDiscount?: number;                  // Server-calculated gift discount
    status: 'pending' | 'completed' | 'cancelled' | 'archived';
    paymentMethod?: 'card' | 'bank_transfer';
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'awaiting_transfer';
    paymentId?: string;                     // YooKassa payment ID
    paymentUrl?: string;                    // YooKassa redirect URL
    paidAt?: number;                        // Timestamp on payment confirmation
    notes?: string;                         // Manager notes (admin only)
    customerNotes?: string;                 // Customer notes, max 1000 chars
    attachments?: string[];                 // Uploaded image URLs
    notificationStatus?: {
        telegramError?: string;
        emailError?: string;
        paymentError?: string;
    };
    createdAt: number;                      // Date.now() timestamp
}
