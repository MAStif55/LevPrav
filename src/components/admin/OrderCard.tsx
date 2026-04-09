'use client';

import { Order } from '@/types/order';
import { format } from 'date-fns';
import { Package, User, StickyNote, ChevronRight, ChevronLeft, Archive } from 'lucide-react';

interface OrderCardProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: Order['status']) => void;
    onNotesClick: (order: Order) => void;
    columnType: 'pending' | 'completed' | 'archived';
}

// Helper to safely convert timestamp to Date
const toDate = (timestamp: number | { seconds: number } | undefined): Date => {
    if (!timestamp) return new Date();
    if (typeof timestamp === 'number') return new Date(timestamp);
    if (typeof timestamp === 'object' && 'seconds' in timestamp) {
        return new Date(timestamp.seconds * 1000);
    }
    return new Date();
};

export function OrderCard({ order, onStatusChange, onNotesClick, columnType }: OrderCardProps) {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const moveActions = {
        pending: [
            { label: 'Выполнить', status: 'completed' as const, icon: ChevronRight },
            { label: 'В архив', status: 'archived' as const, icon: Archive },
        ],
        completed: [
            { label: 'Назад', status: 'pending' as const, icon: ChevronLeft },
            { label: 'В архив', status: 'archived' as const, icon: Archive },
        ],
        archived: [
            { label: 'Восстановить', status: 'pending' as const, icon: ChevronLeft },
        ],
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-graphite text-sm">
                        #{order.id.slice(-6).toUpperCase()}
                    </h4>
                    <p className="text-xs text-gray-400">
                        {format(toDate(order.createdAt as any), 'dd.MM.yy HH:mm')}
                    </p>
                </div>
                <button
                    onClick={() => onNotesClick(order)}
                    className={`p-1.5 rounded-lg transition-colors ${order.notes
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                    title={order.notes ? 'View notes' : 'Add note'}
                >
                    <StickyNote className="w-4 h-4" />
                </button>
            </div>

            {/* Customer */}
            <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 truncate">
                    {order.customerName}
                </span>
            </div>

            {/* Items & Total */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{itemCount} шт.</span>
                </div>
                <span className="font-bold text-forest-green">₽{order.total}</span>
            </div>

            {/* Notes Preview */}
            {order.notes && (
                <div className="bg-amber-50 rounded-lg p-2 mb-3 border border-amber-100">
                    <p className="text-xs text-amber-800 line-clamp-2">{order.notes}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {moveActions[columnType].map((action) => (
                    <button
                        key={action.status}
                        onClick={() => onStatusChange(order.id, action.status)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${action.status === 'completed'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : action.status === 'archived'
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                    >
                        <action.icon className="w-3.5 h-3.5" />
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
