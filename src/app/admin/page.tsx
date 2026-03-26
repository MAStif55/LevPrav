'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import Link from "next/link";
import { Package, Calculator, ShoppingCart } from "lucide-react";

export default function AdminDashboard() {
    const { user } = useAuth();
    const { t } = useTranslation();

    return (
        <div>
            <h1 className="text-3xl font-bold text-graphite mb-6">{t('admin.welcome')}</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600">{t('admin.logged_in_as')} <span className="font-mono text-sm">{user?.email}</span></p>
                <p className="mt-2 text-gray-500">{t('admin.select_module')}</p>
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
