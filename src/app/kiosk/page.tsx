'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Bus, Package, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/animated/FadeIn';
import { ScaleIn } from '@/components/animated/ScaleIn';
import { Pulse } from '@/components/animated/Pulse';
import { useNotifications } from '@/hooks/useNotifications';
import { useSocket } from '@/hooks/useSocket';
import { useTTS } from '@/hooks/useTTS';

export default function KioskPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentQueue, setCurrentQueue] = useState<{
        code: string;
        number: number;
        type: string;
    } | null>(null);
    const notifications = useNotifications();

    const socketOptions = useMemo(() => ({ room: 'kiosk' }), []);
    const { socket, isConnected } = useSocket(socketOptions);
    const { speak } = useTTS();

    const generateQueue = async (type: 'UMUM' | 'BARANG') => {
        speak('Sedang mencetak nomor antrian');
        setIsGenerating(true);
        setCurrentQueue(null);

        try {
            const response = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });

            if (!response.ok) throw new Error('Failed to generate queue');

            const result = await response.json();
            const queue = result.success ? result.data : result;

            setCurrentQueue({ ...queue, type });

            speak('Silakan ambil nomor antrian Anda');
            notifications.success('Nomor antrian berhasil diambil!', `Nomor Anda: ${queue.code}`);

            // Emit Socket.io event for real-time updates
            if (socket && socket.connected) {
                socket.emit('queue:created', {
                    ...queue,
                    type,
                    timestamp: new Date().toISOString(),
                });
                console.log('✅ Queue created event emitted:', queue.code);
            }

            // Auto reset after 5 seconds
            setTimeout(() => {
                setCurrentQueue(null);
            }, 5000);
        } catch (error) {
            console.error('Error generating queue:', error);
            notifications.error('Gagal mengambil nomor antrian', 'Silakan coba lagi');
        } finally {
            setIsGenerating(false);
        }
    };

    if (currentQueue) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 flex items-center justify-center p-8 relative overflow-hidden">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-white/30 rounded-full"
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                            }}
                            animate={{
                                y: [null, -100],
                                opacity: [0.3, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                <ScaleIn duration={0.5}>
                    <Card className="p-12 max-w-3xl w-full text-center bg-white/95 backdrop-blur-xl shadow-2xl border-0 relative overflow-hidden">
                        {/* Success checkmark animation */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="absolute top-8 right-8"
                        >
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </motion.div>

                        <FadeIn delay={0.2}>
                            <div className="space-y-8">
                                <div>
                                    <Sparkles className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                                    <h2 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Nomor Antrian Anda
                                    </h2>
                                </div>

                                <Pulse duration={1.5}>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-20 rounded-3xl blur-xl" />
                                        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 border-4 border-green-200 shadow-lg">
                                            <motion.p
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.3, type: 'spring' }}
                                                className="text-9xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                                            >
                                                {currentQueue.code}
                                            </motion.p>
                                        </div>
                                    </div>
                                </Pulse>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-4"
                                >
                                    <div className="inline-block px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-lg font-semibold shadow-lg">
                                        {currentQueue.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang'}
                                    </div>
                                    <p className="text-2xl text-gray-700 font-medium">
                                        Silakan menunggu panggilan dari loket
                                    </p>
                                    <p className="text-lg text-gray-500">
                                        Nomor Anda akan ditampilkan di layar display
                                    </p>
                                </motion.div>

                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="pt-4"
                                >
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        <span className="ml-2">Kembali ke halaman utama</span>
                                    </div>
                                </motion.div>
                            </div>
                        </FadeIn>
                    </Card>
                </ScaleIn>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-6xl w-full space-y-12 relative z-10">
                <FadeIn>
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-6xl md:text-7xl font-black text-white drop-shadow-2xl">
                                Sistem Antrian
                            </h1>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl text-blue-100 font-semibold"
                        >
                            Dinas Perhubungan
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl text-blue-50"
                        >
                            Silakan pilih jenis layanan yang Anda butuhkan
                        </motion.p>
                    </div>
                </FadeIn>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid md:grid-cols-2 gap-8 px-4"
                >
                    {/* Angkutan Umum */}
                    <motion.div
                        whileHover={{ scale: 1.05, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <Card className="relative overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl hover:shadow-green-500/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            <button
                                onClick={() => generateQueue('UMUM')}
                                disabled={isGenerating}
                                className="relative w-full p-12 space-y-8 focus:outline-none focus:ring-4 focus:ring-green-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <motion.div
                                    animate={{ rotate: isGenerating ? 360 : 0 }}
                                    transition={{ duration: 1, repeat: isGenerating ? Infinity : 0 }}
                                    className="flex justify-center"
                                >
                                    <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-10 rounded-3xl shadow-lg">
                                        {isGenerating ? (
                                            <Loader2 className="w-28 h-28 text-white animate-spin" />
                                        ) : (
                                            <Bus className="w-28 h-28 text-white" />
                                        )}
                                    </div>
                                </motion.div>
                                <div className="space-y-3">
                                    <h3 className="text-4xl font-black text-gray-800">
                                        Angkutan Umum
                                    </h3>
                                    <p className="text-xl text-gray-600">
                                        Layanan untuk angkutan umum penumpang
                                    </p>
                                </div>
                                {!isGenerating && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-green-600 font-semibold"
                                    >
                                        Sentuh untuk mengambil nomor
                                    </motion.div>
                                )}
                            </button>
                        </Card>
                    </motion.div>

                    {/* Angkutan Barang */}
                    <motion.div
                        whileHover={{ scale: 1.05, y: -10 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <Card className="relative overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl hover:shadow-green-500/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            <button
                                onClick={() => generateQueue('BARANG')}
                                disabled={isGenerating}
                                className="relative w-full p-12 space-y-8 focus:outline-none focus:ring-4 focus:ring-green-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <motion.div
                                    animate={{ rotate: isGenerating ? 360 : 0 }}
                                    transition={{ duration: 1, repeat: isGenerating ? Infinity : 0 }}
                                    className="flex justify-center"
                                >
                                    <div className="bg-gradient-to-br from-orange-400 to-yellow-500 p-10 rounded-3xl shadow-lg">
                                        {isGenerating ? (
                                            <Loader2 className="w-28 h-28 text-white animate-spin" />
                                        ) : (
                                            <Package className="w-28 h-28 text-white" />
                                        )}
                                    </div>
                                </motion.div>
                                <div className="space-y-3">
                                    <h3 className="text-4xl font-black text-gray-800">
                                        Angkutan Barang
                                    </h3>
                                    <p className="text-xl text-gray-600">
                                        Layanan untuk angkutan barang
                                    </p>
                                </div>
                                {!isGenerating && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-orange-600 font-semibold"
                                    >
                                        Sentuh untuk mengambil nomor
                                    </motion.div>
                                )}
                            </button>
                        </Card>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center"
                >
                    <p className="text-xl text-white/90 font-medium">
                        ✨ Sentuh salah satu pilihan di atas untuk mengambil nomor antrian ✨
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
