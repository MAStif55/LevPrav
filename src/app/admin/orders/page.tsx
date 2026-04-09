'use client';

import { useEffect, useState } from 'react';
import { OrderRepository } from '@/lib/data';
import { Order } from '@/types/order';
import { useTranslation } from '@/contexts/LanguageContext';
import { OrderCard } from '@/components/admin/OrderCard';
import { OrderNotesModal } from '@/components/admin/OrderNotesModal';
import { Clock, CheckCircle, Archive, Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [notesModalOrder, setNotesModalOrder] = useState<Order | null>(null);
    const { t } = useTranslation();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await OrderRepository.getAll();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id: string, newStatus: Order['status']) => {
        try {
            await OrderRepository.updateStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const updateNotes = async (id: string, notes: string) => {
        try {
            await OrderRepository.updateNotes(id, notes);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, notes } : o));
        } catch (error) {
            console.error("Error updating notes:", error);
            throw error;
        }
    };

    // Group orders by status
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const archivedOrders = orders.filter(o => o.status === 'archived' || o.status === 'cancelled');

    const columns = [
        {
            id: 'pending' as const,
            title: 'Ожидают',
            titleEn: 'Pending',
            icon: Clock,
            color: 'bg-amber-500',
            bgColor: 'bg-amber-50',
            orders: pendingOrders,
        },
        {
            id: 'completed' as const,
            title: 'Выполнены',
            titleEn: 'Completed',
            icon: CheckCircle,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            orders: completedOrders,
        },
        {
            id: 'archived' as const,
            title: 'Архив',
            titleEn: 'Archived',
            icon: Archive,
            color: 'bg-gray-500',
            bgColor: 'bg-gray-50',
            orders: archivedOrders,
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="h-full">
            <h1 className="text-2xl font-bold text-graphite mb-6">{t('admin.orders_page_title')}</h1>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {columns.map((column) => (
                    <div
                        key={column.id}
                        className={`${column.bgColor} rounded-2xl p-4 flex flex-col min-h-0`}
                    >
                        {/* Column Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`${column.color} p-2 rounded-lg`}>
                                <column.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-graphite">{column.title}</h2>
                                <p className="text-xs text-gray-500">
                                    {column.orders.length} {column.orders.length === 1 ? 'заказ' : 'заказов'}
                                </p>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {column.orders.length === 0 ? (
                                <div className="flex items-center justify-center h-32 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400">Нет заказов</p>
                                </div>
                            ) : (
                                column.orders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        columnType={column.id}
                                        onStatusChange={updateStatus}
                                        onNotesClick={setNotesModalOrder}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Notes Modal */}
            {notesModalOrder && (
                <OrderNotesModal
                    order={notesModalOrder}
                    isOpen={true}
                    onClose={() => setNotesModalOrder(null)}
                    onSave={updateNotes}
                />
            )}
        </div>
    );
}
