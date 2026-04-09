'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StickerPack } from '@/types/product';
import { ProductRepository } from '@/lib/data';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from './ImageUpload';
import VideoUpload from './VideoUpload';
import { useTranslation } from '@/contexts/LanguageContext';
import ConfirmModal from '@/components/admin/ConfirmModal';

// Predefined categories
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

interface ProductFormProps {
    initialData?: StickerPack | null;
    isEditMode?: boolean;
}

export default function ProductForm({ initialData, isEditMode = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { t, locale } = useTranslation();
    const [isDirty, setIsDirty] = useState(false);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);

    const [formData, setFormData] = useState<Partial<StickerPack>>(
        initialData || {
            type: 'sticker_pack',
            title: { en: '', ru: '' },
            description: { en: '', ru: '' },
            slug: '',
            basePrice: 0,
            images: [],
            artist: '',
            category: '',
            tags: [],
            videoPreviewUrl: '',
            videoUrl: '',
        }
    );

    const [tagsInput, setTagsInput] = useState((initialData?.tags || []).join(', '));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setIsDirty(true);
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsDirty(true);
        setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsDirty(true);
        setTagsInput(e.target.value);
        const tags = e.target.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        setFormData(prev => ({ ...prev, tags }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode && initialData?.id) {
                await ProductRepository.update(initialData.id, formData);
            } else {
                await ProductRepository.create(formData as StickerPack);
            }
            router.push('/admin/products');
            router.refresh();
        } catch (error) {
            console.error("Error saving product:", error);
            alert(t('admin.save_error') || "Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={() => isDirty ? setShowExitConfirmation(true) : router.push('/admin/products')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-graphite">
                        {isEditMode ? t('admin.edit_product') : t('admin.create_product')} <span className="text-sm font-normal text-primary ml-2">(v2.0 Beta)</span>
                    </h1>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>{loading ? t('admin.loading') : t('admin.save')}</span>
                </button>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="cyber-cats"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.base_price')} (₽)</label>
                        <input
                            type="number"
                            name="basePrice"
                            value={formData.basePrice}
                            onChange={handlePriceChange}
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'Категория' : 'Category'}
                        </label>
                        <select
                            name="category"
                            value={formData.category || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            <option value="">{locale === 'ru' ? '— Выберите —' : '— Select —'}</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label[locale as 'en' | 'ru']}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'ru' ? 'Теги (через запятую)' : 'Tags (comma-separated)'}
                    </label>
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={handleTagsChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="new, popular, sale"
                    />
                    {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* English Content */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">English Content</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                            <input
                                type="text"
                                name="title.en"
                                value={formData.title?.en}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                            <textarea
                                name="description.en"
                                value={formData.description?.en}
                                onChange={handleChange}
                                required
                                rows={3}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Russian Content */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Русский контент</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU)</label>
                            <input
                                type="text"
                                name="title.ru"
                                value={formData.title?.ru}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание (RU)</label>
                            <textarea
                                name="description.ru"
                                value={formData.description?.ru}
                                onChange={handleChange}
                                required
                                rows={3}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Images & Artist */}
                <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'ru' ? 'Изображения товара' : 'Product Images'}
                        </label>
                        <ImageUpload
                            value={formData.images || []}
                            onChange={(urls) => {
                                setIsDirty(true);
                                setFormData(prev => ({ ...prev, images: urls }));
                            }}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'ru' ? 'Live Photo (Опционально)' : 'Live Photo (Optional)'}
                        </label>
                        <VideoUpload
                            videoUrl={formData.videoUrl}
                            videoPreviewUrl={formData.videoPreviewUrl}
                            onChange={(urls) => {
                                setIsDirty(true);
                                setFormData(prev => ({
                                    ...prev,
                                    videoUrl: urls.videoUrl,
                                    videoPreviewUrl: urls.videoPreviewUrl,
                                }));
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'Имя художника (необязательно)' : 'Artist Name (Optional)'}
                        </label>
                        <input
                            type="text"
                            name="artist"
                            value={formData.artist || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !isDirty}
                    className="flex items-center space-x-2 bg-[#E67E22] text-white px-8 py-3 rounded-lg hover:bg-[#D35400] transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>{loading ? t('admin.loading') : (isDirty ? t('admin.save_changes') : t('admin.saved'))}</span>
                </button>
            </div>

            <ConfirmModal
                isOpen={showExitConfirmation}
                title={locale === 'ru' ? 'Несохраненные изменения' : 'Unsaved Changes'}
                message={locale === 'ru' ? 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?' : 'You have unsaved changes. Are you sure you want to leave?'}
                confirmLabel={locale === 'ru' ? 'Уйти без сохранения' : 'Discard Changes'}
                cancelLabel={locale === 'ru' ? 'Продолжить редактирование' : 'Keep Editing'}
                saveLabel={locale === 'ru' ? 'Сохранить и выйти' : 'Save & Exit'}
                variant="danger"
                onConfirm={() => router.push('/admin/products')}
                onCancel={() => setShowExitConfirmation(false)}
                onSave={async () => {
                    await handleSubmit({ preventDefault: () => { } } as React.FormEvent);
                    setShowExitConfirmation(false);
                }}
            />
        </form>
    );
}
