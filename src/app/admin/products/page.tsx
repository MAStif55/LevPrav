'use client';

import { useEffect, useState } from 'react';
import { ProductRepository } from '@/lib/data';
import { StickerPack } from '@/types/product';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { AddProductCard } from '@/components/admin/AddProductCard';

const CATEGORIES = [
    { id: 'animals', label: { en: 'Animals', ru: 'Животные' } },
    { id: 'abstract', label: { en: 'Abstract', ru: 'Абстракция' } },
    { id: 'retro', label: { en: 'Retro', ru: 'Ретро' } },
    { id: 'cute', label: { en: 'Cute', ru: 'Милые' } },
    { id: 'nature', label: { en: 'Nature', ru: 'Природа' } },
    { id: 'space', label: { en: 'Space', ru: 'Космос' } },
    { id: 'gaming', label: { en: 'Gaming', ru: 'Игры' } },
    { id: 'other', label: { en: 'Other', ru: 'Другое' } },
];

export default function AdminProductsPage() {
    const [products, setProducts] = useState<StickerPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const { t, locale } = useTranslation();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await ProductRepository.getAll();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = categoryFilter
        ? products.filter(p => p.category === categoryFilter)
        : products;

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await ProductRepository.delete(itemToDelete);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert(t('admin.delete_failed'));
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        try {
            for (const id of selectedIds) {
                await ProductRepository.delete(id);
            }
            setSelectedIds(new Set());
            fetchProducts();
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert(t('admin.delete_failed'));
        } finally {
            setBulkDeleteModalOpen(false);
        }
    };

    const handleDuplicate = async (product: StickerPack) => {
        try {
            const duplicate: StickerPack = {
                ...product,
                id: '', // Will be auto-generated
                slug: `${product.slug}-copy`,
                title: {
                    en: `${product.title.en} (Copy)`,
                    ru: `${product.title.ru} (Копия)`
                }
            };
            await ProductRepository.create(duplicate);
            fetchProducts();
        } catch (error) {
            console.error("Error duplicating:", error);
            alert("Failed to duplicate product");
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const getCategoryLabel = (id: string) => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? cat.label[locale as 'en' | 'ru'] : id;
    };

    return (
        <div>
            <Breadcrumbs />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-graphite">{t('admin.product_management')}</h1>
                <div className="flex space-x-2 w-full sm:w-auto">
                    <button
                        onClick={fetchProducts}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <Link
                        href="/admin/products/new"
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Plus size={20} />
                        <span className="sm:hidden md:inline">{t('admin.add_new_pack')}</span>
                    </Link>
                </div>
            </div>

            {/* Filters & Bulk Actions */}
            <div className="flex flex-wrap items-center gap-4 mb-6 sticky top-0 z-20 bg-gray-50 py-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="">{locale === 'ru' ? 'Все категории' : 'All Categories'}</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.label[locale as 'en' | 'ru']}
                        </option>
                    ))}
                </select>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleSelectAll}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0
                            ? (locale === 'ru' ? 'Снять выделение' : 'Deselect All')
                            : (locale === 'ru' ? 'Выбрать все' : 'Select All')}
                    </button>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg ml-auto sm:ml-0 animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-sm text-red-700 font-medium">
                            {selectedIds.size} {locale === 'ru' ? 'выбрано' : 'selected'}
                        </span>
                        <div className="h-4 w-px bg-red-200 mx-2"></div>
                        <button
                            onClick={() => setBulkDeleteModalOpen(true)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium transition-colors"
                        >
                            <Trash2 size={16} />
                            <span>{locale === 'ru' ? 'Удалить' : 'Delete'}</span>
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl h-[350px] animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {/* Add New Card - First Item */}
                    <AddProductCard />

                    {filteredProducts.map((product) => (
                        <AdminProductCard
                            key={product.id}
                            product={product}
                            locale={locale as 'en' | 'ru'}
                            selected={selectedIds.has(product.id)}
                            onToggleSelect={(id, e) => {
                                e.preventDefault(); // Stop navigation
                                toggleSelect(id);
                            }}
                            onDuplicate={(p, e) => {
                                e.preventDefault();
                                handleDuplicate(p);
                            }}
                            onDelete={(id, e) => {
                                e.preventDefault();
                                setItemToDelete(id);
                                setDeleteModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">{t('admin.no_products')}</p>
                    <button onClick={() => setCategoryFilter('')} className="text-primary hover:underline">
                        {locale === 'ru' ? 'Очистить фильтры' : 'Clear filters'}
                    </button>
                </div>
            )}

            {/* Single Delete Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                title={locale === 'ru' ? 'Удалить товар?' : 'Delete Product?'}
                message={locale === 'ru' ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
                confirmLabel={locale === 'ru' ? 'Удалить' : 'Delete'}
                cancelLabel={locale === 'ru' ? 'Отмена' : 'Cancel'}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={bulkDeleteModalOpen}
                title={locale === 'ru' ? `Удалить ${selectedIds.size} товаров?` : `Delete ${selectedIds.size} products?`}
                message={locale === 'ru' ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
                confirmLabel={locale === 'ru' ? 'Удалить все' : 'Delete All'}
                cancelLabel={locale === 'ru' ? 'Отмена' : 'Cancel'}
                variant="danger"
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteModalOpen(false)}
            />
        </div>
    );
}
