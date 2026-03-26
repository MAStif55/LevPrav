import { z } from 'zod';

// Russian phone number regex: +7 or 8 followed by 10 digits
const phoneRegex = /^(\+7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

// ─── Contact Methods ─────────────────────────────────────────────────────────

const contactMethodEnum = z.enum(['telegram', 'max', 'phone_call', 'sms', 'email']);

const contactPreferencesSchema = z.object({
    methods: z.array(contactMethodEnum).min(1, { message: 'At least one contact method is required' }),
    telegramHandle: z.string().optional().refine(
        (val) => !val || val.startsWith('@'),
        { message: 'Telegram username should start with @' }
    ),
    maxId: z.string().optional(),
}).optional();

// ─── Base Checkout Schema ────────────────────────────────────────────────────

export const checkoutSchema = z.object({
    customerName: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters' })
        .max(100, { message: 'Name must be less than 100 characters' }),
    email: z
        .string()
        .email({ message: 'Please enter a valid email address' }),
    phone: z
        .string()
        .regex(phoneRegex, { message: 'Please enter a valid phone number (+7 or 8 format)' }),
    address: z
        .string()
        .min(10, { message: 'Address must be at least 10 characters' })
        .max(500, { message: 'Address must be less than 500 characters' }),
    telegram: z
        .string()
        .optional()
        .refine(
            (val) => !val || val.startsWith('@') || val.length === 0,
            { message: 'Telegram username should start with @' }
        ),
    paymentMethod: z
        .enum(['card', 'bank_transfer'], { message: 'Please select a payment method' }),
    customerNotes: z
        .string()
        .max(1000, { message: 'Notes must be less than 1000 characters' })
        .optional(),
    contactPreferences: contactPreferencesSchema,
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ─── Localized Checkout Schema ───────────────────────────────────────────────

export const getLocalizedSchema = (locale: 'en' | 'ru') => {
    const messages = {
        en: {
            nameMin: 'Name must be at least 2 characters',
            nameMax: 'Name must be less than 100 characters',
            emailInvalid: 'Please enter a valid email address',
            phoneInvalid: 'Please enter a valid phone number (+7 or 8 format)',
            addressMin: 'Address must be at least 10 characters',
            addressMax: 'Address must be less than 500 characters',
            telegramFormat: 'Telegram username should start with @',
            paymentRequired: 'Please select a payment method',
            notesMax: 'Notes must be less than 1000 characters',
            contactMethodsMin: 'At least one contact method is required',
        },
        ru: {
            nameMin: 'Имя должно содержать минимум 2 символа',
            nameMax: 'Имя должно быть менее 100 символов',
            emailInvalid: 'Введите корректный email адрес',
            phoneInvalid: 'Введите корректный номер телефона (+7 или 8)',
            addressMin: 'Адрес должен содержать минимум 10 символов',
            addressMax: 'Адрес должен быть менее 500 символов',
            telegramFormat: 'Telegram никнейм должен начинаться с @',
            paymentRequired: 'Выберите способ оплаты',
            notesMax: 'Комментарий должен быть менее 1000 символов',
            contactMethodsMin: 'Выберите хотя бы один способ связи',
        },
    };

    const m = messages[locale];

    const localizedContactPreferences = z.object({
        methods: z.array(contactMethodEnum).min(1, { message: m.contactMethodsMin }),
        telegramHandle: z.string().optional().refine(
            (val) => !val || val.startsWith('@'),
            { message: m.telegramFormat }
        ),
        maxId: z.string().optional(),
    }).optional();

    return z.object({
        customerName: z
            .string()
            .min(2, { message: m.nameMin })
            .max(100, { message: m.nameMax }),
        email: z
            .string()
            .email({ message: m.emailInvalid }),
        phone: z
            .string()
            .regex(phoneRegex, { message: m.phoneInvalid }),
        address: z
            .string()
            .min(10, { message: m.addressMin })
            .max(500, { message: m.addressMax }),
        telegram: z
            .string()
            .optional()
            .refine(
                (val) => !val || val.startsWith('@') || val.length === 0,
                { message: m.telegramFormat }
            ),
        paymentMethod: z
            .enum(['card', 'bank_transfer'], { message: m.paymentRequired }),
        customerNotes: z
            .string()
            .max(1000, { message: m.notesMax })
            .optional(),
        contactPreferences: localizedContactPreferences,
    });
};
