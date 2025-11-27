'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { useTTS } from '@/hooks/useTTS';
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
} from 'lucide-react';
import { ConnectionStatus } from '@/components/connection-status';
import { ThemeToggle } from '@/components/theme-toggle';

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

    const socketOptions = useMemo(() => ({ room: 'loket' }), []);
    const { socket, isConnected } = useSocket(socketOptions);
    const { speak } = useTTS();

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
        // Reduced interval from 3s to 10s (socket.io handles realtime updates)
        const interval = setInterval(fetchWaitingQueues, 10000);
        return () => clearInterval(interval);
    }, []);

    // Socket.io listeners - optimized to reduce unnecessary fetches
    useEffect(() => {
        if (!socket || !isConnected) {
            console.log('⚠️ [Loket] Socket not ready');
            return;
        }

        console.log('🎫 [Loket] Setting up event listeners, room: loket');

        const handleQueueNew = (queue: any) => {
            console.log('📢 [Loket] New queue:', queue.code);
            // Optimistically add to waiting queues
            setWaitingQueues(prev => [...prev, queue]);
        };

        const handleQueueUpdated = () => {
            console.log('📢 [Loket] Queue updated');
            fetchWaitingQueues();
        };

        const handleQueueCalled = (queue: any) => {
            console.log('📢 [Loket] Queue called:', queue.code);
            // Remove from waiting queues immediately
            setWaitingQueues(prev => prev.filter(q => q.id !== queue.id));
        };

        const handleQueueCompleted = (queue: any) => {
            console.log('📢 [Loket] Queue completed:', queue.code);
            // Clear current queue if it matches
            if (currentQueue?.id === queue.id) {
                setCurrentQueue(null);
            }
        };

        const handleQueueSkipped = (queue: any) => {
            console.log('📢 [Loket] Queue skipped:', queue.code);
            // Clear current queue if it matches
            if (currentQueue?.id === queue.id) {
                setCurrentQueue(null);
            }
        };

        socket.on('queue:new', handleQueueNew);
        socket.on('queue:updated', handleQueueUpdated);
        socket.on('queue:called', handleQueueCalled);
        socket.on('queue:completed', handleQueueCompleted);
        socket.on('queue:skipped', handleQueueSkipped);

        console.log('✅ [Loket] All event listeners registered');

        return () => {
            console.log('🧹 [Loket] Cleaning up event listeners');
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
            console.log('🔁 [Loket] Recalling queue:', currentQueue.code);
            
            // Emit recall event via Socket.io with complete data
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

                console.log('   - Emitting queue:recall with data:', recallData);
                socket.emit('queue:recall', recallData);

                const text = `Memanggil ulang nomor antrian ${currentQueue.code}`;
                speak(text);
                toast.info(text);
                
                console.log('✅ [Loket] Recall emitted successfully');
            } else {
                console.error('❌ [Loket] Socket not connected, cannot recall');
                toast.error('Koneksi socket tidak tersedia, silakan refresh halaman');
            }
        } catch (error) {
            console.error('❌ [Loket] Recall error:', error);
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
            console.log('✅ [Loket] Completing queue:', currentQueue.code);
            
            const res = await fetch(`/api/queue/${currentQueue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('   - API response:', data);
                console.log('   - Clearing currentQueue state');
                
                toast.success(`Antrian ${currentQueue.code} selesai dilayani`, {
                    icon: '✅',
                });
                
                // Clear current queue immediately
                setCurrentQueue(null);
                
                // Refresh waiting queues
                await fetchWaitingQueues();
                
                console.log('   ✓ Queue completed successfully');
            } else {
                const error = await res.json();
                console.error('   ❌ Failed to complete queue:', error);
                toast.error(error.error || 'Gagal menyelesaikan antrian');
            }
        } catch (error) {
            console.error('❌ [Loket] Error completing queue:', error);
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
            console.log('⏭️ [Loket] Skipping queue:', currentQueue.code);
            
            const res = await fetch(`/api/queue/${currentQueue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'skip' }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('   - API response:', data);
                console.log('   - Clearing currentQueue state');
                
                toast.warning(`Antrian ${currentQueue.code} dibatalkan`);
                
                // Clear current queue immediately
                setCurrentQueue(null);
                
                // Refresh waiting queues
                await fetchWaitingQueues();
                
                console.log('   ✓ Queue skipped successfully');
            } else {
                const error = await res.json();
                console.error('   ❌ Failed to skip queue:', error);
                toast.error(error.error || 'Gagal membatalkan antrian');
            }
        } catch (error) {
            console.error('❌ [Loket] Error skipping queue:', error);
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
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Dashboard Loket
                            </h1>
                            <div className="flex items-center gap-4 mt-1">
                                {loketInfo && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">{loketInfo.name}</span>
                                    </p>
                                )}
                                {userInfo && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <User className="w-4 h-4" />
                                        <span>{userInfo.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <ConnectionStatus />
                            <ThemeToggle />
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="gap-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Current Queue */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current Serving */}
                        <Card className="border-2 border-gray-200 dark:border-gray-800">
                            <CardHeader className="bg-gray-50 dark:bg-gray-900/50">
                                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Sedang Dilayani
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                {currentQueue ? (
                                    <div className="text-center space-y-6">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-12 border-4 border-green-200 dark:border-green-800">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                                Nomor Antrian
                                            </p>
                                            <p className="text-7xl font-black text-green-600 dark:text-green-400">
                                                {currentQueue.code}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                                                {currentQueue.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang'}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <Button
                                                onClick={recallQueue}
                                                variant="outline"
                                                disabled={isProcessing}
                                                className="gap-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Panggil Ulang
                                            </Button>

                                            <Button
                                                onClick={completeQueue}
                                                disabled={isProcessing}
                                                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Selesai
                                            </Button>

                                            <Button
                                                onClick={skipQueue}
                                                variant="outline"
                                                disabled={isProcessing}
                                                className="gap-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-gray-500 dark:text-gray-500">
                                        <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg">Tidak ada antrian yang sedang dilayani</p>
                                        <p className="text-sm mt-2">Klik "Panggil Berikutnya" untuk mulai melayani</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Call Next Button */}
                        <Button
                            onClick={callNextQueue}
                            disabled={isProcessing || waitingQueues.length === 0 || currentQueue !== null}
                            size="lg"
                            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-16 text-lg"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Phone className="w-6 h-6" />
                                    Panggil Berikutnya
                                    {waitingQueues.length > 0 && (
                                        <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">
                                            {waitingQueues.length}
                                        </span>
                                    )}
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right Column - Waiting Queue */}
                    <div>
                        <Card className="border-2 border-gray-200 dark:border-gray-800 sticky top-24">
                            <CardHeader className="bg-gray-50 dark:bg-gray-900/50">
                                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Antrian Menunggu
                                    </span>
                                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-bold">
                                        {waitingQueues.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                                {waitingQueues.length > 0 ? (
                                    <div className="space-y-2">
                                        {waitingQueues.map((queue, index) => (
                                            <div
                                                key={queue.id}
                                                className={`p-4 rounded-lg border-2 transition-all ${index === 0
                                                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`font-mono text-2xl font-bold ${index === 0
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-900 dark:text-gray-100'
                                                            }`}>
                                                            {queue.code}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {queue.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang'}
                                                        </p>
                                                    </div>
                                                    {index === 0 && (
                                                        <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                                            Berikutnya
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>Tidak ada antrian menunggu</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
