'use client';

import { useState } from 'react';
import { Order } from '@/types/order';
import { X, Save, StickyNote } from 'lucide-react';

interface OrderNotesModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSave: (orderId: string, notes: string) => Promise<void>;
}

export function OrderNotesModal({ order, isOpen, onClose, onSave }: OrderNotesModalProps) {
    const [notes, setNotes] = useState(order.notes || '');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(order.id, notes);
            onClose();
        } catch (error) {
            console.error('Failed to save notes:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-graphite flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-amber-500" />
                        Заметки к заказу #{order.id.slice(-6).toUpperCase()}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">
                        <strong>{order.customerName}</strong> • ₽{order.total}
                    </p>
                </div>

                {/* Notes Input */}
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Добавьте заметку для этого заказа..."
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />

                <p className="text-xs text-gray-400 mt-2 mb-4">
                    Заметки видны только в админ-панели
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </>
    );
}
