'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, notFound } from "next/navigation";
import { PackDetailsClient } from "@/components/packs/PackDetailsClient";
import { ProductRepository } from "@/lib/data";
import { StickerPack } from "@/types/product";

function PackDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams?.get('id');
    const [pack, setPack] = useState<StickerPack | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        const loadPack = async () => {
            const data = await ProductRepository.getById(id);
            setPack(data);
            setLoading(false);
        };
        loadPack();
    }, [id]);

    if (loading) return <div className="min-h-screen pt-20 text-center">Loading...</div>;
    if (!id || (!loading && !pack)) return <div className="min-h-screen pt-20 text-center">Product not found.</div>;

    return <PackDetailsClient pack={pack!} />;
}

export default function PackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-20 text-center">Loading...</div>}>
            <PackDetailsContent />
        </Suspense>
    );
}
