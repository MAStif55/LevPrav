'use client';

import { useAuth } from "@/contexts/AuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    Calculator,
    ShoppingCart,
    LogOut,
    Settings
} from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTranslation } from "@/contexts/LanguageContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    useEffect(() => {
        if (!loading && !user && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gray-100">{t('admin.loading') || 'Loading...'}</div>;
    }

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (!user) {
        return null;
    }

    const navItems = [
        { href: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard },
        { href: '/admin/products', label: t('admin.products'), icon: Package },
        { href: '/admin/calculator', label: t('admin.calculator'), icon: Calculator },
        { href: '/admin/orders', label: t('admin.orders'), icon: ShoppingCart },
        { href: '/admin/settings', label: t('admin.settings') || 'Settings', icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-graphite">{t('admin.title')}</h2>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={() => logout()}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>{t('admin.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </AuthProvider>
        </ErrorBoundary>
    );
}
