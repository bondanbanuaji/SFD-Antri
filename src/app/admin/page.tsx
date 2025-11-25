'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BarChart3, Users, FileText, Download } from 'lucide-react';

export default function AdminPage() {
    const [stats, setStats] = useState<any>(null);
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const fetchStats = async () => {
        try {
            const response = await fetch(
                `/api/stats?startDate=${startDate}&endDate=${endDate}`
            );
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes} menit ${secs} detik`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600">Laporan & Manajemen Sistem Antrian</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </Button>
                </div>

                {/* Date Filter */}
                <Card className="p-6 bg-white">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Label>Tanggal Mulai</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Tanggal Akhir</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchStats} className="gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Tampilkan Laporan
                        </Button>
                    </div>
                </Card>

                {stats && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid md:grid-cols-4 gap-6">
                            <Card className="p-6 bg-white">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm">Total Antrian</span>
                                    </div>
                                    <p className="text-4xl font-bold text-blue-600">
                                        {stats.total}
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-6 bg-white">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Angkutan Umum</p>
                                    <p className="text-4xl font-bold text-green-600">
                                        {stats.byType.UMUM}
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-6 bg-white">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Angkutan Barang</p>
                                    <p className="text-4xl font-bold text-purple-600">
                                        {stats.byType.BARANG}
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-6 bg-white">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Rata-rata Waktu Tunggu</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {formatTime(stats.averageWaitTime)}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* Detailed Stats */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-6 bg-white">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Status Antrian
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                                        <span className="text-gray-700">Selesai</span>
                                        <span className="font-bold text-green-600">
                                            {stats.byStatus.COMPLETED}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                                        <span className="text-gray-700">Dibatalkan</span>
                                        <span className="font-bold text-red-600">
                                            {stats.byStatus.SKIPPED}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                                        <span className="text-gray-700">Menunggu</span>
                                        <span className="font-bold text-yellow-600">
                                            {stats.byStatus.WAITING}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                                        <span className="text-gray-700">Dipanggil</span>
                                        <span className="font-bold text-blue-600">
                                            {stats.byStatus.CALLED}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-white">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Performa Loket
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(stats.byLoket).map(([loketId, count]) => (
                                        <div
                                            key={loketId}
                                            className="flex justify-between items-center p-3 bg-blue-50 rounded"
                                        >
                                            <span className="text-gray-700">Loket {loketId}</span>
                                            <span className="font-bold text-blue-600">{count as number}</span>
                                        </div>
                                    ))}
                                    {Object.keys(stats.byLoket).length === 0 && (
                                        <p className="text-gray-500 text-center py-4">
                                            Belum ada data
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {/* User Management Section */}
                <Card className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-semibold text-gray-800">
                            Manajemen Petugas
                        </h3>
                        <Button className="gap-2">
                            <Users className="w-4 h-4" />
                            Tambah Petugas
                        </Button>
                    </div>
                    <div className="text-center py-8 text-gray-500">
                        Fitur manajemen petugas akan segera ditambahkan
                    </div>
                </Card>
            </div>
        </div>
    );
}
