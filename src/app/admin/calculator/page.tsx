'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCalculatorOptions, updateCalculatorOption } from '@/lib/firestore-utils';
import { MaterialOption, CoatingOption, FormatOption } from '@/types/product';
import { Save, Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Link from 'next/link';

export default function AdminCalculatorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [coatings, setCoatings] = useState<CoatingOption[]>([]);
    const [formats, setFormats] = useState<FormatOption[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ type: string; index: number } | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const { t, locale } = useTranslation();

    // Track original data to detect changes
    const originalData = useRef<{
        materials: MaterialOption[];
        coatings: CoatingOption[];
        formats: FormatOption[];
    } | null>(null);

    // Check if there are unsaved changes
    const hasUnsavedChanges = (): boolean => {
        if (!originalData.current) return false;
        return (
            JSON.stringify(materials) !== JSON.stringify(originalData.current.materials) ||
            JSON.stringify(coatings) !== JSON.stringify(originalData.current.coatings) ||
            JSON.stringify(formats) !== JSON.stringify(originalData.current.formats)
        );
    };

    useEffect(() => {
        loadOptions();
    }, []);

    const loadOptions = async () => {
        try {
            const data = await getCalculatorOptions();
            setMaterials(data.materials);
            setCoatings(data.coatings);
            setFormats(data.formats);
            // Store original data for comparison
            originalData.current = {
                materials: JSON.parse(JSON.stringify(data.materials)),
                coatings: JSON.parse(JSON.stringify(data.coatings)),
                formats: JSON.parse(JSON.stringify(data.formats)),
            };
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateCalculatorOption('materials', materials),
                updateCalculatorOption('coatings', coatings),
                updateCalculatorOption('formats', formats),
            ]);
            // Update original data after successful save
            originalData.current = {
                materials: JSON.parse(JSON.stringify(materials)),
                coatings: JSON.parse(JSON.stringify(coatings)),
                formats: JSON.parse(JSON.stringify(formats)),
            };
            alert(locale === 'ru' ? 'Все изменения сохранены!' : 'All changes saved!');
        } catch (error) {
            console.error(error);
            alert(t('admin.save_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (type: 'materials' | 'coatings' | 'formats') => {
        setSaving(true);
        try {
            if (type === 'materials') {
                await updateCalculatorOption('materials', materials);
                if (originalData.current) {
                    originalData.current.materials = JSON.parse(JSON.stringify(materials));
                }
            }
            if (type === 'coatings') {
                await updateCalculatorOption('coatings', coatings);
                if (originalData.current) {
                    originalData.current.coatings = JSON.parse(JSON.stringify(coatings));
                }
            }
            if (type === 'formats') {
                await updateCalculatorOption('formats', formats);
                if (originalData.current) {
                    originalData.current.formats = JSON.parse(JSON.stringify(formats));
                }
            }
            alert(t('admin.saved_success'));
        } catch (error) {
            console.error(error);
            alert(t('admin.save_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleNavigateBack = () => {
        if (hasUnsavedChanges()) {
            setPendingNavigation('/admin');
            setShowExitConfirmation(true);
        } else {
            router.push('/admin');
        }
    };

    const handleConfirmExit = () => {
        setShowExitConfirmation(false);
        if (pendingNavigation) {
            router.push(pendingNavigation);
        }
    };

    const handleSaveAndExit = async () => {
        await handleSaveAll();
        setShowExitConfirmation(false);
        if (pendingNavigation) {
            router.push(pendingNavigation);
        }
    };

    const updateItem = (list: any[], setList: any, index: number, field: string, value: any) => {
        const newList = [...list];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            newList[index] = {
                ...newList[index],
                [parent]: { ...newList[index][parent], [child]: value }
            };
        } else {
            newList[index] = { ...newList[index], [field]: value };
        }
        setList(newList);
    };

    const addMaterial = () => {
        setMaterials(prev => [...prev, {
            id: `material_${Date.now()}`,
            label: { en: 'New Material', ru: 'Новый материал' },
            priceMultiplier: 1.0
        }]);
    };

    const addCoating = () => {
        setCoatings(prev => [...prev, {
            id: `coating_${Date.now()}`,
            label: { en: 'New Coating', ru: 'Новое покрытие' },
            priceAddon: 0
        }]);
    };

    const addFormat = () => {
        setFormats(prev => [...prev, {
            id: `format_${Date.now()}`,
            label: 'New',
            width: 100,
            height: 100,
            basePriceModifier: 1.0
        }]);
    };

    const removeItem = () => {
        if (!deleteModal) return;
        const { type, index } = deleteModal;
        if (type === 'materials') {
            setMaterials(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'coatings') {
            setCoatings(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'formats') {
            setFormats(prev => prev.filter((_, i) => i !== index));
        }
        setDeleteModal(null);
    };

    if (loading) return <div className="text-center py-12">{t('admin.loading_options')}</div>;

    const isDirty = hasUnsavedChanges();

    return (
        <div className="space-y-8 pb-12">
            <Breadcrumbs />

            {/* Header with Back Button and Global Save */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={handleNavigateBack}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-graphite">{t('admin.calculator_page_title')}</h1>
                    {isDirty && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                            {locale === 'ru' ? 'Есть несохраненные изменения' : 'Unsaved changes'}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={saving || !isDirty}
                    className="flex items-center space-x-2 bg-[#E67E22] text-white px-6 py-2 rounded-lg hover:bg-[#D35400] transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>{saving ? (locale === 'ru' ? 'Сохранение...' : 'Saving...') : (isDirty ? (locale === 'ru' ? 'Сохранить всё' : 'Save All') : (locale === 'ru' ? 'Сохранено' : 'Saved'))}</span>
                </button>
            </div>

            {/* Materials Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('admin.materials')}</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={addMaterial}
                            className="flex items-center space-x-1 text-primary hover:bg-primary/10 px-3 py-1 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> <span>{locale === 'ru' ? 'Добавить' : 'Add'}</span>
                        </button>
                        <button
                            onClick={() => handleSave('materials')}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                        >
                            <Save size={18} /> <span>{t('admin.save_materials')}</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {materials.map((mat, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded bg-gray-50 items-end">
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.id')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={mat.id} onChange={(e) => updateItem(materials, setMaterials, idx, 'id', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.label_en')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={mat.label.en} onChange={(e) => updateItem(materials, setMaterials, idx, 'label.en', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.label_ru')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={mat.label.ru} onChange={(e) => updateItem(materials, setMaterials, idx, 'label.ru', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.price_multiplier')}</label>
                                <input type="number" step="0.1" className="w-full text-sm p-2 border rounded" value={mat.priceMultiplier} onChange={(e) => updateItem(materials, setMaterials, idx, 'priceMultiplier', Number(e.target.value))} />
                            </div>
                            <button
                                onClick={() => setDeleteModal({ type: 'materials', index: idx })}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg justify-self-end"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Coatings Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('admin.coatings')}</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={addCoating}
                            className="flex items-center space-x-1 text-primary hover:bg-primary/10 px-3 py-1 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> <span>{locale === 'ru' ? 'Добавить' : 'Add'}</span>
                        </button>
                        <button
                            onClick={() => handleSave('coatings')}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                        >
                            <Save size={18} /> <span>{t('admin.save_coatings')}</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {coatings.map((coat, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded bg-gray-50 items-end">
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.id')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={coat.id} onChange={(e) => updateItem(coatings, setCoatings, idx, 'id', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.label_en')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={coat.label.en} onChange={(e) => updateItem(coatings, setCoatings, idx, 'label.en', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.label_ru')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={coat.label.ru} onChange={(e) => updateItem(coatings, setCoatings, idx, 'label.ru', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.price_addon')}</label>
                                <input type="number" className="w-full text-sm p-2 border rounded" value={coat.priceAddon} onChange={(e) => updateItem(coatings, setCoatings, idx, 'priceAddon', Number(e.target.value))} />
                            </div>
                            <button
                                onClick={() => setDeleteModal({ type: 'coatings', index: idx })}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg justify-self-end"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Formats Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('admin.formats')}</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={addFormat}
                            className="flex items-center space-x-1 text-primary hover:bg-primary/10 px-3 py-1 rounded-lg transition-colors"
                        >
                            <Plus size={18} /> <span>{locale === 'ru' ? 'Добавить' : 'Add'}</span>
                        </button>
                        <button
                            onClick={() => handleSave('formats')}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                        >
                            <Save size={18} /> <span>{t('admin.save_formats')}</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {formats.map((fmt, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded bg-gray-50 items-end">
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.id')}</label>
                                <input className="w-full text-sm p-2 border rounded" value={fmt.id} onChange={(e) => updateItem(formats, setFormats, idx, 'id', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Label</label>
                                <input className="w-full text-sm p-2 border rounded" value={fmt.label} onChange={(e) => updateItem(formats, setFormats, idx, 'label', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.width_mm')}</label>
                                <input type="number" className="w-full text-sm p-2 border rounded" value={fmt.width} onChange={(e) => updateItem(formats, setFormats, idx, 'width', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.height_mm')}</label>
                                <input type="number" className="w-full text-sm p-2 border rounded" value={fmt.height} onChange={(e) => updateItem(formats, setFormats, idx, 'height', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('admin.base_modifier')}</label>
                                <input type="number" step="0.1" className="w-full text-sm p-2 border rounded" value={fmt.basePriceModifier} onChange={(e) => updateItem(formats, setFormats, idx, 'basePriceModifier', Number(e.target.value))} />
                            </div>
                            <button
                                onClick={() => setDeleteModal({ type: 'formats', index: idx })}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg justify-self-end"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom Save Bar */}
            <div className="sticky bottom-4 flex justify-end">
                <button
                    onClick={handleSaveAll}
                    disabled={saving || !isDirty}
                    className="flex items-center space-x-2 bg-[#E67E22] text-white px-8 py-3 rounded-lg hover:bg-[#D35400] transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>{saving ? (locale === 'ru' ? 'Сохранение...' : 'Saving...') : (isDirty ? (locale === 'ru' ? 'Сохранить все изменения' : 'Save All Changes') : (locale === 'ru' ? 'Сохранено' : 'Saved'))}</span>
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteModal}
                title={locale === 'ru' ? 'Удалить опцию?' : 'Delete Option?'}
                message={locale === 'ru' ? 'Это действие нельзя отменить. Не забудьте сохранить после удаления.' : 'This cannot be undone. Remember to save after deleting.'}
                confirmLabel={locale === 'ru' ? 'Удалить' : 'Delete'}
                cancelLabel={locale === 'ru' ? 'Отмена' : 'Cancel'}
                variant="danger"
                onConfirm={removeItem}
                onCancel={() => setDeleteModal(null)}
            />

            {/* Exit Confirmation Modal */}
            <ConfirmModal
                isOpen={showExitConfirmation}
                title={locale === 'ru' ? 'Несохраненные изменения' : 'Unsaved Changes'}
                message={locale === 'ru' ? 'У вас есть несохраненные изменения. Что вы хотите сделать?' : 'You have unsaved changes. What would you like to do?'}
                confirmLabel={locale === 'ru' ? 'Уйти без сохранения' : 'Discard Changes'}
                cancelLabel={locale === 'ru' ? 'Отмена' : 'Cancel'}
                saveLabel={locale === 'ru' ? 'Сохранить и выйти' : 'Save & Exit'}
                variant="warning"
                onConfirm={handleConfirmExit}
                onCancel={() => {
                    setShowExitConfirmation(false);
                    setPendingNavigation(null);
                }}
                onSave={handleSaveAndExit}
            />
        </div>
    );
}
