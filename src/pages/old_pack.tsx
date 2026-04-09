import { useEffect, useState } from "react";
import Head from 'next/head';
import { useRouter } from "next/router";
import { PackDetailsClient } from "@/components/packs/PackDetailsClient";
import { ProductRepository } from "@/lib/data";
import { StickerPack } from "@/types/product";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function PackPage() {
    const router = useRouter();
    const { id } = router.query;
    const [pack, setPack] = useState<StickerPack | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!router.isReady) return;

        if (!id || typeof id !== 'string') {
            setLoading(false);
            return;
        }

        const loadPack = async () => {
            const data = await ProductRepository.getById(id);
            setPack(data);
            setLoading(false);
        };
        loadPack();
    }, [id, router.isReady]);

    if (loading) {
        return (
            <PublicLayout>
                <div className="min-h-screen pt-20 text-center">Loading...</div>
            </PublicLayout>
        );
    }

    if (!id || !pack) {
        return (
            <PublicLayout>
                <Head>
                    <title>Product Not Found | ЛевПрав</title>
                </Head>
                <div className="min-h-screen pt-20 text-center">Product not found.</div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head>
                <title>{pack.title.ru} | ЛевПрав</title>
            </Head>
            <PackDetailsClient pack={pack} />
        </PublicLayout>
    );
}
