'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

interface StoreSettings {
    name: string;
    tagline: string;
    contactEmail: string;
    telegramHandle: string;
    currency: string;
    logoUrl: string;
}

const defaultSettings: StoreSettings = {
    name: 'ЛевПрав',
    tagline: 'Арт-студия',
    contactEmail: '',
    telegramHandle: '',
    currency: '₽',
    logoUrl: '',
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { locale } = useTranslation();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const docRef = doc(db, 'config', 'store');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings({ ...defaultSettings, ...docSnap.data() as StoreSettings });
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'config', 'store'), settings);
            alert(locale === 'ru' ? 'Настройки сохранены!' : 'Settings saved!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert(locale === 'ru' ? 'Ошибка сохранения' : 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return <div className="text-center py-12">{locale === 'ru' ? 'Загрузка...' : 'Loading...'}</div>;
    }

    return (
        <div>
            <Breadcrumbs />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-graphite">
                    {locale === 'ru' ? 'Настройки магазина' : 'Store Settings'}
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>{locale === 'ru' ? 'Сохранить' : 'Save'}</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'Название магазина' : 'Store Name'}
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={settings.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'Слоган' : 'Tagline'}
                        </label>
                        <input
                            type="text"
                            name="tagline"
                            value={settings.tagline}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'Email для связи' : 'Contact Email'}
                        </label>
                        <input
                            type="email"
                            name="contactEmail"
                            value={settings.contactEmail}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="shop@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telegram
                        </label>
                        <input
                            type="text"
                            name="telegramHandle"
                            value={settings.telegramHandle}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="@username"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'Символ валюты' : 'Currency Symbol'}
                        </label>
                        <input
                            type="text"
                            name="currency"
                            value={settings.currency}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="₽"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'ru' ? 'URL логотипа' : 'Logo URL'}
                        </label>
                        <input
                            type="text"
                            name="logoUrl"
                            value={settings.logoUrl}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                {settings.logoUrl && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'ru' ? 'Предпросмотр логотипа' : 'Logo Preview'}
                        </label>
                        <img
                            src={settings.logoUrl}
                            alt="Logo"
                            className="h-16 object-contain bg-gray-50 p-2 rounded-lg"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
