'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId') ?? null;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Success Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
                    {/* Success Icon */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold font-heading text-graphite mb-4">
                        {t('checkout.success_title')}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-6 text-lg">
                        {t('checkout.success_message')}
                    </p>

                    {/* Order ID */}
                    {orderId && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-8">
                            <p className="text-sm text-gray-500 mb-1">{t('checkout.order_number')}</p>
                            <p className="text-xl font-bold font-mono text-graphite tracking-wider">
                                #{orderId.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-gradient-to-r from-lion-amber-start/10 to-lion-amber-end/10 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
                        <Package className="w-6 h-6 text-lion-amber-start flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                            {t('checkout.success_info')}
                        </p>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/packs"
                        className="inline-flex items-center justify-center gap-2 w-full bg-graphite text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg active:scale-[0.98]"
                    >
                        {t('checkout.continue_shopping')}
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
