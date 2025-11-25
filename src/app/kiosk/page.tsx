'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bus, Package, Loader2 } from 'lucide-react';

export default function KioskPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentQueue, setCurrentQueue] = useState<{
        code: string;
        number: number;
    } | null>(null);

    const generateQueue = async (type: 'UMUM' | 'BARANG') => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });

            if (!response.ok) throw new Error('Failed to generate queue');

            const queue = await response.json();
            setCurrentQueue(queue);

            // Auto reset after 5 seconds
            setTimeout(() => {
                setCurrentQueue(null);
            }, 5000);
        } catch (error) {
            console.error('Error generating queue:', error);
            alert('Gagal mengambil nomor antrian');
        } finally {
            setIsGenerating(false);
        }
    };

    if (currentQueue) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-8">
                <Card className="p-12 max-w-2xl w-full text-center bg-white">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-800">
                            Nomor Antrian Anda
                        </h2>
                        <div className="bg-blue-50 rounded-2xl p-8 border-4 border-blue-200">
                            <p className="text-8xl font-black text-blue-600">
                                {currentQueue.code}
                            </p>
                        </div>
                        <p className="text-xl text-gray-600">
                            Silakan menunggu panggilan dari loket
                        </p>
                        <div className="pt-4">
                            <div className="animate-pulse text-gray-500">
                                Layar akan kembali dalam beberapa detik...
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                        Sistem Antrian
                    </h1>
                    <h2 className="text-3xl text-blue-100">
                        Dinas Perhubungan
                    </h2>
                    <p className="text-xl text-blue-50">
                        Silakan pilih jenis layanan yang Anda butuhkan
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="p-8 hover:shadow-2xl transition-all duration-300 bg-white">
                        <button
                            onClick={() => generateQueue('UMUM')}
                            disabled={isGenerating}
                            className="w-full space-y-6 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-xl"
                        >
                            <div className="flex justify-center">
                                <div className="bg-blue-100 p-8 rounded-full">
                                    <Bus className="w-24 h-24 text-blue-600" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-gray-800">
                                    Angkutan Umum
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Layanan untuk angkutan umum penumpang
                                </p>
                            </div>
                            {isGenerating && (
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                            )}
                        </button>
                    </Card>

                    <Card className="p-8 hover:shadow-2xl transition-all duration-300 bg-white">
                        <button
                            onClick={() => generateQueue('BARANG')}
                            disabled={isGenerating}
                            className="w-full space-y-6 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-xl"
                        >
                            <div className="flex justify-center">
                                <div className="bg-green-100 p-8 rounded-full">
                                    <Package className="w-24 h-24 text-green-600" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-gray-800">
                                    Angkutan Barang
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Layanan untuk angkutan barang
                                </p>
                            </div>
                            {isGenerating && (
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
                            )}
                        </button>
                    </Card>
                </div>

                <div className="text-center text-white/80 text-sm">
                    <p>Sentuh salah satu pilihan di atas untuk mengambil nomor antrian</p>
                </div>
            </div>
        </div>
    );
}
