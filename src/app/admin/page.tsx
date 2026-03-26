'use client';

import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import Link from "next/link";
import { Package, Calculator, ShoppingCart, Rocket, Loader2 } from "lucide-react";

export default function AdminDashboard() {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const [deploying, setDeploying] = useState(false);

    const handleDeploy = async () => {
        if (!user) return;
        if (!confirm(locale === 'ru' ? 'Запустить обновление сайта на сервере?' : 'Trigger a live production deployment?')) return;
        
        setDeploying(true);
        try {
            const token = await user.getIdToken();
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://europe-west1-levprav-art.cloudfunctions.net';
            
            const response = await fetch(`${baseUrl}/triggerDeploy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok && data.success) {
                alert(locale === 'ru' ? 'Обновление запущено! 🚀 Проверьте вкладку Actions в GitHub.' : 'Deployment triggered! Check progress on GitHub Actions.');
            } else {
                throw new Error(data.error || 'Deploy failed');
            }
        } catch (error: any) {
            console.error("Deploy error:", error);
            alert(locale === 'ru' ? `Ошибка: ${error.message}` : `Error: ${error.message}`);
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-graphite mb-6">{t('admin.welcome')}</h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-lg shadow-sm border">
                <div>
                    <p className="text-gray-600">{t('admin.logged_in_as')} <span className="font-mono text-sm">{user?.email}</span></p>
                    <p className="mt-2 text-gray-500">{t('admin.select_module')}</p>
                </div>
                
                <div className="mt-4 md:mt-0">
                    <button
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="flex items-center space-x-2 bg-graphite text-white px-6 py-3 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {deploying ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
                        <span className="font-bold">{deploying ? (locale === 'ru' ? 'Запуск...' : 'Deploying...') : (locale === 'ru' ? '🚀 Обновить сайт' : '🚀 Launch Deploy')}</span>
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-right">CI/CD Pipeline</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Link href="/admin/products" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md hover:border-primary transition-all group">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Package className="text-primary" size={24} />
                        </div>
                        <h3 className="font-bold text-lg">{t('admin.manage_products')}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{t('admin.manage_products_desc')}</p>
                </Link>

                <Link href="/admin/calculator" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md hover:border-primary transition-all group">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Calculator className="text-primary" size={24} />
                        </div>
                        <h3 className="font-bold text-lg">{t('admin.calculator_settings')}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{t('admin.calculator_settings_desc')}</p>
                </Link>

                <Link href="/admin/orders" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md hover:border-primary transition-all group">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <ShoppingCart className="text-primary" size={24} />
                        </div>
                        <h3 className="font-bold text-lg">{t('admin.view_orders')}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{t('admin.view_orders_desc')}</p>
                </Link>
            </div>
        </div>
    );
}
