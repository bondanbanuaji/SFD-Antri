'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { useTTS } from '@/hooks/useTTS';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { toast } from 'sonner';
import {
    Phone,
    RotateCcw,
    CheckCircle,
    XCircle,
    LogOut,
    Loader2,
    User,
    Clock,
    AlertCircle,
    Bell,
    TrendingUp,
} from 'lucide-react';
import { ConnectionStatus } from '@/components/connection-status';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';

interface Queue {
    id: number;
    code: string;
    number: number;
    type: string;
    status: string;
    createdAt: string;
}

export default function LoketPage() {
    const router = useRouter();
    const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
    const [waitingQueues, setWaitingQueues] = useState<Queue[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loketInfo, setLoketInfo] = useState<any>(null);
    const [stats, setStats] = useState({ completedToday: 0, avgWaitTime: 0 });

    const socketOptions = useMemo(() => ({ room: 'loket' }), []);
    const { socket, isConnected } = useSocket(socketOptions);
    const { speak } = useTTS();

    // Auto-logout on 1 minute inactivity
    useAutoLogout({
        timeoutMs: 60000, // 1 minute
        onLogout: () => {
            toast.warning('Anda telah logout karena tidak aktif selama 1 menit');
        }
    });

    // Fetch user info and loket info from auth
    useEffect(() => {
        fetchUserAndLoket();
    }, []);

    const fetchUserAndLoket = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                toast.error('Sesi berakhir, silakan login kembali');
                router.push('/login');
                return;
            }
            const data = await res.json();
            console.log('User data:', data);
            setUserInfo(data.user);
            setLoketInfo(data.loket);

            if (!data.loket) {
                console.warn('User tidak memiliki loket yang di-assign');
                toast.error('Akun Anda belum di-assign ke loket. Hubungi administrator.');
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            toast.error('Gagal mengambil informasi user');
        }
    };

    // Fetch waiting queues
    const fetchWaitingQueues = async () => {
        try {
            console.log('🔄 [Loket] Fetching waiting queues...');
            const res = await fetch('/api/queue');
            if (res.ok) {
                const data = await res.json();
                const queues = data.success ? data.data : data;
                const queueList = Array.isArray(queues) ? queues : [];
                console.log('✅ [Loket] Fetched', queueList.length, 'waiting queues');
                setWaitingQueues(queueList);
            }
        } catch (error) {
            console.error('❌ [Loket] Error fetching queues:', error);
        }
    };

    // Initial fetch and reduced polling interval (socket handles most updates)
    useEffect(() => {
        fetchWaitingQueues();
        const interval = setInterval(fetchWaitingQueues, 10000);
        return () => clearInterval(interval);
    }, []);

    // Socket.io listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleQueueNew = (queue: any) => {
            console.log('📢 [Loket] New queue:', queue.code);
            setWaitingQueues(prev => [...prev, queue]);
        };

        const handleQueueUpdated = () => {
            fetchWaitingQueues();
        };

        const handleQueueCalled = (queue: any) => {
            setWaitingQueues(prev => prev.filter(q => q.id !== queue.id));
        };

        const handleQueueCompleted = (queue: any) => {
            if (currentQueue?.id === queue.id) {
                setCurrentQueue(null);
            }
        };

        const handleQueueSkipped = (queue: any) => {
            if (currentQueue?.id === queue.id) {
                setCurrentQueue(null);
            }
        };

        socket.on('queue:new', handleQueueNew);
        socket.on('queue:updated', handleQueueUpdated);
        socket.on('queue:called', handleQueueCalled);
        socket.on('queue:completed', handleQueueCompleted);
        socket.on('queue:skipped', handleQueueSkipped);

        return () => {
            socket.off('queue:new', handleQueueNew);
            socket.off('queue:updated', handleQueueUpdated);
            socket.off('queue:called', handleQueueCalled);
            socket.off('queue:completed', handleQueueCompleted);
            socket.off('queue:skipped', handleQueueSkipped);
        };
    }, [socket, isConnected, currentQueue]);

    const callNextQueue = async () => {
        if (waitingQueues.length === 0) {
            toast.error('Tidak ada antrian yang menunggu');
            return;
        }

        if (!loketInfo?.id) {
            toast.error('Informasi loket tidak ditemukan');
            return;
        }

        setIsProcessing(true);
        const nextQueue = waitingQueues[0];

        try {
            const res = await fetch(`/api/queue/${nextQueue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'call',
                    loketId: loketInfo.id
                }),
            });

            if (res.ok) {
                setCurrentQueue(nextQueue);
                await fetchWaitingQueues();

                const text = `Memanggil nomor antrian ${nextQueue.code}`;
                speak(text);
                toast.success(text);
            } else {
                const error = await res.json();
                toast.error(error.error?.message || error.error || 'Gagal memanggil antrian');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setIsProcessing(false);
        }
    };

    const recallQueue = async () => {
        if (!currentQueue) {
            toast.error('Tidak ada antrian yang sedang dilayani');
            return;
        }

        if (!loketInfo) {
            toast.error('Informasi loket tidak ditemukan');
            return;
        }

        try {
            if (socket && isConnected) {
                const recallData = {
                    id: currentQueue.id,
                    code: currentQueue.code,
                    type: currentQueue.type,
                    status: 'CALLED',
                    loketId: loketInfo.id,
                    loket: {
                        id: loketInfo.id,
                        name: loketInfo.name,
                    },
                };

                socket.emit('queue:recall', recallData);

                const text = `Memanggil ulang nomor antrian ${currentQueue.code}`;
                speak(text);
                toast.info(text);
            } else {
                toast.error('Koneksi socket tidak tersedia, silakan refresh halaman');
            }
        } catch (error) {
            toast.error('Gagal memanggil ulang');
        }
    };

    const completeQueue = async () => {
        if (!currentQueue) {
            toast.error('Tidak ada antrian yang sedang dilayani');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/queue/${currentQueue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
            });

            if (res.ok) {
                toast.success(`Antrian ${currentQueue.code} selesai dilayani`, { icon: '✅' });
                setCurrentQueue(null);
                await fetchWaitingQueues();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Gagal menyelesaikan antrian');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsProcessing(false);
        }
    };

    const skipQueue = async () => {
        if (!currentQueue) {
            toast.error('Tidak ada antrian yang sedang dilayani');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/queue/${currentQueue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'skip' }),
            });

            if (res.ok) {
                toast.warning(`Antrian ${currentQueue.code} dibatalkan`);
                setCurrentQueue(null);
                await fetchWaitingQueues();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Gagal membatalkan antrian');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            toast.success('Logout berhasil');
            router.push('/login');
        } catch (error) {
            toast.error('Gagal logout');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Header - Improved with gradient */}
            <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-blue-700/50 dark:border-gray-800 sticky top-0 z-50 shadow-lg">
                <div className="container mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-black text-white drop-shadow-md"
                            >
                                Dashboard Loket
                            </motion.h1>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-4 mt-2"
                            >
                                {loketInfo && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                        <span className="text-sm font-bold text-white">{loketInfo.name}</span>
                                    </div>
                                )}
                                {userInfo && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                                        <User className="w-4 h-4 text-blue-100" />
                                        <span className="text-sm text-blue-100">{userInfo.name}</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        <div className="flex items-center gap-4">
                            <ConnectionStatus />
                            <ThemeToggle />
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Current Queue & Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-white/80 mb-1">Selesai Hari Ini</p>
                                                <p className="text-4xl font-black text-white">{stats.completedToday}</p>
                                            </div>
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <CheckCircle className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-white/80 mb-1">Rata-rata Waktu</p>
                                                <p className="text-4xl font-black text-white">{stats.avgWaitTime}<span className="text-xl ml-1">min</span></p>
                                            </div>
                                            <div className="p-3 bg-white/20 rounded-2xl">
                                                <TrendingUp className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Current Serving - Enhanced */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-6">
                                    <CardTitle className="text-white flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <span className="text-2xl font-black">Sedang Dilayani</span>
                                    </CardTitle>
                                </div>
                                <CardContent className="p-8">
                                    <AnimatePresence mode="wait">
                                        {currentQueue ? (
                                            <motion.div
                                                key={currentQueue.code}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 200 }}
                                                className="text-center space-y-8"
                                            >
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-3xl blur-2xl" />
                                                    <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-3xl p-12 border-4 border-green-300 dark:border-green-800 shadow-xl">
                                                        <motion.div
                                                            animate={{ scale: [1, 1.02, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        >
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-widest font-bold">
                                                                Nomor Antrian
                                                            </p>
                                                            <p className="text-8xl font-black bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                                                                {currentQueue.code}
                                                            </p>
                                                            <div className="mt-6">
                                                                <span className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-base font-bold shadow-lg">
                                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                                    {currentQueue.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang'}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                {/* Enhanced Action Buttons */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <Button
                                                        onClick={recallQueue}
                                                        variant="outline"
                                                        disabled={isProcessing}
                                                        size="lg"
                                                        className="h-16 gap-2 border-2 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 font-bold"
                                                    >
                                                        <Bell className="w-5 h-5" />
                                                        <span>Panggil<br />Ulang</span>
                                                    </Button>

                                                    <Button
                                                        onClick={completeQueue}
                                                        disabled={isProcessing}
                                                        size="lg"
                                                        className="h-16 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-5 h-5" />
                                                        )}
                                                        <span>Selesai</span>
                                                    </Button>

                                                    <Button
                                                        onClick={skipQueue}
                                                        variant="outline"
                                                        disabled={isProcessing}
                                                        size="lg"
                                                        className="h-16 gap-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-bold"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        <span>Batal</span>
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-center py-20 text-gray-400 dark:text-gray-600"
                                            >
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                >
                                                    <AlertCircle className="w-20 h-20 mx-auto mb-6" />
                                                </motion.div>
                                                <p className="text-2xl font-bold mb-2">Tidak ada antrian yang sedang dilayani</p>
                                                <p className="text-lg">Klik "Panggil Berikutnya" untuk mulai melayani</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Call Next Button - Enhanced */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: currentQueue || waitingQueues.length === 0 ? 1 : 1.02 }}
                            whileTap={{ scale: currentQueue || waitingQueues.length === 0 ? 1 : 0.98 }}
                        >
                            <Button
                                onClick={callNextQueue}
                                disabled={isProcessing || waitingQueues.length === 0 || currentQueue !== null}
                                size="lg"
                                className="w-full gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 hover:from-blue-700 hover:via-blue-800 hover:to-emerald-700 text-white h-20 text-xl font-black shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-7 h-7 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-7 h-7" />
                                        Panggil Berikutnya
                                        {waitingQueues.length > 0 && (
                                            <span className="ml-2 px-4 py-1 bg-white/30 rounded-full text-lg font-black">
                                                {waitingQueues.length}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </div>

                    {/* Right Column - Waiting Queue - Enhanced */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="border-0 shadow-2xl sticky top-28 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
                                <CardTitle className="text-white flex items-center justify-between">
                                    <span className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <span className="text-2xl font-black">Antrian Menunggu</span>
                                    </span>
                                    <motion.span
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full text-xl font-black"
                                    >
                                        {waitingQueues.length}
                                    </motion.span>
                                </CardTitle>
                            </div>
                            <CardContent className="p-4 max-h-[700px] overflow-y-auto">
                                {waitingQueues.length > 0 ? (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {waitingQueues.map((queue, index) => (
                                                <motion.div
                                                    key={queue.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`p-5 rounded-xl border-2 transition-all shadow-md hover:shadow-lg ${index === 0
                                                            ? 'border-blue-400 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50'
                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`font-mono text-3xl font-black ${index === 0
                                                                    ? 'text-blue-600 dark:text-blue-400'
                                                                    : 'text-gray-900 dark:text-gray-100'
                                                                }`}>
                                                                {queue.code}
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                                                                {queue.type === 'UMUM' ? '🚌 Angkutan Umum' : '📦 Angkutan Barang'}
                                                            </p>
                                                        </div>
                                                        {index === 0 && (
                                                            <motion.span
                                                                animate={{ scale: [1, 1.1, 1] }}
                                                                transition={{ duration: 1, repeat: Infinity }}
                                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded-full font-black shadow-lg"
                                                            >
                                                                Berikutnya
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                                        <motion.div
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Clock className="w-16 h-16 mx-auto mb-4" />
                                        </motion.div>
                                        <p className="text-lg font-semibold">Tidak ada antrian menunggu</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
