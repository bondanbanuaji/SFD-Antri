'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { toast } from 'sonner';
import {
    LogOut,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Activity,
    TrendingUp,
    AlertCircle,
} from 'lucide-react';
import { ConnectionStatus } from '@/components/connection-status';
import { ThemeToggle } from '@/components/theme-toggle';

interface RealtimeStats {
    summary: {
        totalToday: number;
        waitingToday: number;
        calledToday: number;
        completedToday: number;
        skippedToday: number;
        umumToday: number;
        barangToday: number;
        avgWaitTime: number;
    };
    lokets: Array<{
        id: number;
        name: string;
        status: string;
        currentQueue: any;
        completedToday: number;
    }>;
    recentQueues: Array<any>;
    timestamp: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [stats, setStats] = useState<RealtimeStats | null>(null);
    const [loading, setLoading] = useState(true);

    const socketOptions = useMemo(() => ({ room: 'admin', userData: { role: 'ADMIN' } }), []);
    const { socket, isConnected } = useSocket(socketOptions);

    // Auto-logout on 1 minute inactivity
    useAutoLogout({
        timeoutMs: 60000, // 1 minute
        onLogout: () => {
            toast.warning('Anda telah logout karena tidak aktif selama 1 menit');
        }
    });

    // Fetch real-time stats
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats/realtime');
            if (!res.ok) {
                if (res.status === 401) {
                    toast.error('Sesi berakhir, silakan login kembali');
                    router.push('/login');
                    return;
                }
                throw new Error('Failed to fetch stats');
            }
            const data = await res.json();
            setStats(data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Gagal memuat statistik');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchStats();
        // Refresh every 5 seconds
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Listen to Socket.io updates for real-time sync
    useEffect(() => {
        if (!socket) return;

        const handleQueueUpdate = () => {
            fetchStats(); // Refetch stats on queue updates
        };

        socket.on('queue:new', handleQueueUpdate);
        socket.on('queue:called', handleQueueUpdate);
        socket.on('queue:completed', handleQueueUpdate);
        socket.on('queue:skipped', handleQueueUpdate);

        return () => {
            socket.off('queue:new', handleQueueUpdate);
            socket.off('queue:called', handleQueueUpdate);
            socket.off('queue:completed', handleQueueUpdate);
            socket.off('queue:skipped', handleQueueUpdate);
        };
    }, [socket]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            toast.success('Logout berhasil');
            router.push('/login');
        } catch (error) {
            toast.error('Gagal logout');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-gray-600 dark:text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Antrian Hari Ini',
            value: stats?.summary.totalToday || 0,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
            title: 'Menunggu',
            value: stats?.summary.waitingToday || 0,
            icon: Clock,
            color: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        },
        {
            title: 'Selesai',
            value: stats?.summary.completedToday || 0,
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-950/30',
        },
        {
            title: 'Dibatalkan',
            value: stats?.summary.skippedToday || 0,
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-950/30',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Admin Dashboard
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Real-time monitoring & statistics
                            </p>
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

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card) => (
                        <Card key={card.title} className="border-2 border-gray-200 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${card.bg}`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {card.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Service Type Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-2 border-gray-200 dark:border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100">
                                Angkutan Umum
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                                {stats?.summary.umumToday || 0}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">antrian hari ini</p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-gray-200 dark:border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100">
                                Angkutan Barang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                                {stats?.summary.barangToday || 0}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">antrian hari ini</p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-gray-200 dark:border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Rata-rata Waktu Tunggu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                {stats?.summary.avgWaitTime || 0}
                                <span className="text-2xl ml-2">min</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">per antrian</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Loket Status */}
                <Card className="border-2 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Status Loket Real-time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {stats?.lokets.map((loket) => (
                                <div
                                    key={loket.id}
                                    className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{loket.name}</h3>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${loket.status === 'OPEN'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                        >
                                            {loket.status === 'OPEN' ? 'Buka' : 'Tutup'}
                                        </span>
                                    </div>

                                    {loket.currentQueue ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Sedang melayani:</p>
                                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                {loket.currentQueue.code}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-500 text-center py-4">
                                            Tidak ada antrian
                                        </p>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Selesai hari ini:{' '}
                                            <span className="font-bold text-gray-900 dark:text-gray-100">
                                                {loket.completedToday}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Queues */}
                <Card className="border-2 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Antrian Terbaru
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Nomor
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Jenis
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Loket
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Waktu
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recentQueues.map((queue) => (
                                        <tr
                                            key={queue.id}
                                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                                        >
                                            <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-gray-100">
                                                {queue.code}
                                            </td>
                                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                                {queue.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${queue.status === 'WAITING'
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                                                        : queue.status === 'CALLED'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                                            : queue.status === 'COMPLETED'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                                        }`}
                                                >
                                                    {queue.status === 'WAITING'
                                                        ? 'Menunggu'
                                                        : queue.status === 'CALLED'
                                                            ? 'Dipanggil'
                                                            : queue.status === 'COMPLETED'
                                                                ? 'Selesai'
                                                                : 'Dibatalkan'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                                {queue.loket?.name || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(queue.createdAt).toLocaleTimeString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Update Indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span>
                        {isConnected ? 'Live updates aktif' : 'Connecting...'}
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">
                        • Last update: {stats?.timestamp ? new Date(stats.timestamp).toLocaleTimeString('id-ID') : '-'}
                    </span>
                </div>
            </main>
        </div>
    );
}
