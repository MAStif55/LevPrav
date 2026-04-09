'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { getLocalizedSchema, CheckoutFormData } from '@/lib/checkout-schema';
import { OrderRepository } from '@/lib/data';
import { formatCurrency } from '@/utils/currency';
import { ShoppingBag, Loader2, ArrowLeft, User, Mail, Phone, MapPin, Send } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const { t, locale } = useTranslation();
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
    const [mounted, setMounted] = useState(false);

    const schema = getLocalizedSchema(locale as 'en' | 'ru');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            customerName: '',
            email: '',
            phone: '',
            address: '',
            telegram: '',
            paymentMethod: 'bank_transfer',
            customerNotes: '',
        },
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect to catalog if cart is empty (but not after order submission)
    useEffect(() => {
        if (mounted && items.length === 0 && !isOrderSubmitted) {
            router.push('/packs');
        }
    }, [mounted, items.length, isOrderSubmitted, router]);

    const onSubmit = async (data: CheckoutFormData) => {
        setIsSubmitting(true);

        try {
            const result = await OrderRepository.checkoutWithCloudFunction(items, data, getTotalPrice());

            if (result.success && result.orderId) {
                setIsOrderSubmitted(true); // Prevent redirect to catalog
                clearCart();

                // If card payment, redirect to YooKassa payment page
                if (result.paymentUrl) {
                    window.location.href = result.paymentUrl;
                } else {
                    router.push(`/checkout/success?orderId=${result.orderId}`);
                }
            } else {
                alert(locale === 'ru' ? 'Ошибка при создании заказа' : 'Error creating order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert(locale === 'ru' ? 'Произошла ошибка' : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (items.length === 0) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <Link
                    href="/packs"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-graphite transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('checkout.back_to_catalog')}
                </Link>

                {/* Header */}
                <h1 className="text-3xl md:text-4xl font-bold font-heading text-graphite mb-8 flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8" />
                    {t('checkout.title')}
                </h1>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Customer Info Card */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                                <h2 className="text-xl font-bold text-graphite mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    {t('checkout.customer_info')}
                                </h2>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('checkout.name')} *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('customerName')}
                                                type="text"
                                                placeholder={t('checkout.name_placeholder')}
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-lion-amber-start/30 text-graphite ${errors.customerName
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:border-lion-amber-start focus:bg-white'
                                                    }`}
                                            />
                                        </div>
                                        {errors.customerName && (
                                            <p className="mt-2 text-sm text-red-500">{errors.customerName.message}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('checkout.email')} *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('email')}
                                                type="email"
                                                placeholder={t('checkout.email_placeholder')}
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-lion-amber-start/30 text-graphite ${errors.email
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:border-lion-amber-start focus:bg-white'
                                                    }`}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('checkout.phone')} *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('phone')}
                                                type="tel"
                                                placeholder="+7 (999) 123-45-67"
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-lion-amber-start/30 text-graphite ${errors.phone
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:border-lion-amber-start focus:bg-white'
                                                    }`}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="mt-2 text-sm text-red-500">{errors.phone.message}</p>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('checkout.address')} *
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                            <textarea
                                                {...register('address')}
                                                rows={3}
                                                placeholder={t('checkout.address_placeholder')}
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-lion-amber-start/30 resize-none text-graphite ${errors.address
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:border-lion-amber-start focus:bg-white'
                                                    }`}
                                            />
                                        </div>
                                        {errors.address && (
                                            <p className="mt-2 text-sm text-red-500">{errors.address.message}</p>
                                        )}
                                    </div>

                                    {/* Telegram (Optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('checkout.telegram')}
                                            <span className="text-gray-400 font-normal ml-2">({t('checkout.optional')})</span>
                                        </label>
                                        <div className="relative">
                                            <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('telegram')}
                                                type="text"
                                                placeholder="@username"
                                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-lion-amber-start/30 text-graphite ${errors.telegram
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:border-lion-amber-start focus:bg-white'
                                                    }`}
                                            />
                                        </div>
                                        {errors.telegram && (
                                            <p className="mt-2 text-sm text-red-500">{errors.telegram.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button (Mobile) */}
                            <div className="lg:hidden">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-lion-amber-start to-lion-amber-end text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('checkout.processing')}
                                        </>
                                    ) : (
                                        t('checkout.submit_order')
                                    )}
                                </button>
                            </div>

                            {/* Payment Method & Notes — hidden fields registered for validation */}
                            <input type="hidden" {...register('paymentMethod')} />
                            <input type="hidden" {...register('customerNotes')} />
                        </form>
                    </div>

                    {/* Order Summary Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 sticky top-8">
                            <h2 className="text-xl font-bold text-graphite mb-6">
                                {t('checkout.order_summary')}
                            </h2>

                            {/* Items List */}
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                            {item.packImage && (
                                                <img
                                                    src={item.packImage}
                                                    alt={item.packTitle[locale]}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-graphite text-sm truncate">
                                                {item.packTitle[locale]}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                x{item.quantity}
                                            </p>
                                            <p className="text-sm font-bold text-forest-green mt-1">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('checkout.total')}</span>
                                    <span className="text-2xl font-bold text-graphite">
                                        {formatCurrency(getTotalPrice())}
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button (Desktop) */}
                            <div className="hidden lg:block">
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-lion-amber-start to-lion-amber-end text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('checkout.processing')}
                                        </>
                                    ) : (
                                        t('checkout.submit_order')
                                    )}
                                </button>
                            </div>

                            {/* Security Note */}
                            <p className="text-xs text-gray-400 text-center mt-4">
                                {t('checkout.secure_note')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
