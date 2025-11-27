'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    FileText,
    Download,
    FileSpreadsheet,
    Calendar,
    Loader2,
    TrendingUp,
    Users,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface ReportData {
    period: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalQueues: number;
        umumQueues: number;
        barangQueues: number;
        completedQueues: number;
        skippedQueues: number;
        waitingQueues: number;
        calledQueues: number;
        avgWaitTime: number;
        avgServiceTime: number;
        completionRate: number;
    };
    byLoket: Array<{
        loketName: string;
        total: number;
        completed: number;
        skipped: number;
    }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
    queues: Array<any>;
}

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const presetRanges = [
        { label: 'Hari Ini', getValue: () => ({ start: new Date(), end: new Date() }) },
        {
            label: 'Kemarin',
            getValue: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }),
        },
        {
            label: '7 Hari Terakhir',
            getValue: () => ({ start: subDays(new Date(), 6), end: new Date() }),
        },
        {
            label: '30 Hari Terakhir',
            getValue: () => ({ start: subDays(new Date(), 29), end: new Date() }),
        },
        {
            label: 'Bulan Ini',
            getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
        },
        {
            label: 'Bulan Lalu',
            getValue: () => {
                const lastMonth = subDays(startOfMonth(new Date()), 1);
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
            },
        },
        {
            label: 'Tahun Ini',
            getValue: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }),
        },
    ];

    const handlePresetClick = (getValue: () => { start: Date; end: Date }) => {
        const { start, end } = getValue();
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
            });

            const res = await fetch(`/api/reports/export?${params}`);
            const data = await res.json();

            if (data.success) {
                setReportData(data.data);
                toast.success('Data laporan berhasil dimuat');
            } else {
                toast.error('Gagal memuat data laporan');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        if (!reportData) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN SISTEM ANTRIAN', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Dinas Perhubungan', 105, 28, { align: 'center' });
        
        // Period
        doc.setFontSize(10);
        const periodText = `Periode: ${format(new Date(reportData.period.startDate), 'dd MMM yyyy')} - ${format(new Date(reportData.period.endDate), 'dd MMM yyyy')}`;
        doc.text(periodText, 105, 35, { align: 'center' });

        // Summary Statistics
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN STATISTIK', 14, 50);

        const summaryData = [
            ['Total Antrian', reportData.summary.totalQueues.toString()],
            ['Angkutan Umum', reportData.summary.umumQueues.toString()],
            ['Angkutan Barang', reportData.summary.barangQueues.toString()],
            ['Selesai Dilayani', reportData.summary.completedQueues.toString()],
            ['Dibatalkan', reportData.summary.skippedQueues.toString()],
            ['Rata-rata Waktu Tunggu', `${reportData.summary.avgWaitTime} menit`],
            ['Rata-rata Waktu Layanan', `${reportData.summary.avgServiceTime} menit`],
            ['Tingkat Penyelesaian', `${reportData.summary.completionRate}%`],
        ];

        autoTable(doc, {
            startY: 55,
            head: [['Metrik', 'Nilai']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Performance by Loket
        if (reportData.byLoket.length > 0) {
            const finalY = (doc as any).lastAutoTable.finalY || 55;
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('KINERJA PER LOKET', 14, finalY + 15);

            const loketData = reportData.byLoket.map((loket) => [
                loket.loketName,
                loket.total.toString(),
                loket.completed.toString(),
                loket.skipped.toString(),
                `${Math.round((loket.completed / loket.total) * 100)}%`,
            ]);

            autoTable(doc, {
                startY: finalY + 20,
                head: [['Loket', 'Total', 'Selesai', 'Batal', 'Tingkat Selesai']],
                body: loketData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Halaman ${i} dari ${pageCount}`,
                105,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
            doc.text(
                `Dicetak: ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }

        // Save
        const filename = `Laporan_Antrian_${format(new Date(reportData.period.startDate), 'ddMMyyyy')}-${format(new Date(reportData.period.endDate), 'ddMMyyyy')}.pdf`;
        doc.save(filename);
        
        toast.success('Laporan PDF berhasil diunduh');
    };

    const exportExcel = () => {
        if (!reportData) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Summary
        const summaryData = [
            ['LAPORAN SISTEM ANTRIAN'],
            ['Dinas Perhubungan'],
            [],
            ['Periode', `${format(new Date(reportData.period.startDate), 'dd MMM yyyy')} - ${format(new Date(reportData.period.endDate), 'dd MMM yyyy')}`],
            [],
            ['RINGKASAN STATISTIK'],
            ['Metrik', 'Nilai'],
            ['Total Antrian', reportData.summary.totalQueues],
            ['Angkutan Umum', reportData.summary.umumQueues],
            ['Angkutan Barang', reportData.summary.barangQueues],
            ['Selesai Dilayani', reportData.summary.completedQueues],
            ['Dibatalkan', reportData.summary.skippedQueues],
            ['Menunggu', reportData.summary.waitingQueues],
            ['Dipanggil', reportData.summary.calledQueues],
            ['Rata-rata Waktu Tunggu', `${reportData.summary.avgWaitTime} menit`],
            ['Rata-rata Waktu Layanan', `${reportData.summary.avgServiceTime} menit`],
            ['Tingkat Penyelesaian', `${reportData.summary.completionRate}%`],
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

        // Sheet 2: By Loket
        if (reportData.byLoket.length > 0) {
            const loketData = [
                ['KINERJA PER LOKET'],
                [],
                ['Loket', 'Total', 'Selesai', 'Batal', 'Tingkat Selesai'],
                ...reportData.byLoket.map((loket) => [
                    loket.loketName,
                    loket.total,
                    loket.completed,
                    loket.skipped,
                    `${Math.round((loket.completed / loket.total) * 100)}%`,
                ]),
            ];

            const wsLoket = XLSX.utils.aoa_to_sheet(loketData);
            XLSX.utils.book_append_sheet(wb, wsLoket, 'Per Loket');
        }

        // Sheet 3: Detailed Queue List
        const queueData = [
            ['DAFTAR ANTRIAN DETAIL'],
            [],
            ['Kode', 'Jenis', 'Status', 'Loket', 'Dibuat', 'Dipanggil', 'Selesai'],
            ...reportData.queues.map((q) => [
                q.code,
                q.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang',
                q.status,
                q.loket,
                q.createdAt ? format(new Date(q.createdAt), 'dd/MM/yyyy HH:mm') : '-',
                q.calledAt ? format(new Date(q.calledAt), 'dd/MM/yyyy HH:mm') : '-',
                q.finishedAt ? format(new Date(q.finishedAt), 'dd/MM/yyyy HH:mm') : '-',
            ]),
        ];

        const wsQueues = XLSX.utils.aoa_to_sheet(queueData);
        XLSX.utils.book_append_sheet(wb, wsQueues, 'Detail Antrian');

        // Sheet 4: Hourly Distribution
        const hourlyData = [
            ['DISTRIBUSI PER JAM'],
            [],
            ['Jam', 'Jumlah Antrian'],
            ...reportData.hourlyDistribution
                .filter((h) => h.count > 0)
                .map((h) => [`${h.hour}:00`, h.count]),
        ];

        const wsHourly = XLSX.utils.aoa_to_sheet(hourlyData);
        XLSX.utils.book_append_sheet(wb, wsHourly, 'Per Jam');

        // Save file
        const filename = `Laporan_Antrian_${format(new Date(reportData.period.startDate), 'ddMMyyyy')}-${format(new Date(reportData.period.endDate), 'ddMMyyyy')}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        toast.success('Laporan Excel berhasil diunduh');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 border-b border-purple-700/50 shadow-xl">
                <div className="container mx-auto px-6 py-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-white drop-shadow-lg"
                    >
                        Laporan & Export
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-purple-100 mt-2 text-lg"
                    >
                        Generate dan export laporan dalam format PDF atau Excel
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 space-y-8">
                {/* Date Range Selection */}
                <Card className="border-0 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b">
                        <CardTitle className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Calendar className="w-6 h-6" />
                            Pilih Periode Laporan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Preset Buttons */}
                        <div>
                            <Label className="text-base font-bold mb-3 block">Periode Cepat:</Label>
                            <div className="flex flex-wrap gap-3">
                                {presetRanges.map((preset) => (
                                    <Button
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset.getValue)}
                                        variant="outline"
                                        size="sm"
                                        className="font-semibold"
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="text-base font-bold">
                                    Tanggal Mulai
                                </Label>
                                <input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full h-12 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate" className="text-base font-bold">
                                    Tanggal Akhir
                                </Label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full h-12 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg"
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    onClick={fetchReportData}
                                    disabled={loading}
                                    size="lg"
                                    className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Memuat...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-5 h-5" />
                                            Generate Laporan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Preview */}
                {reportData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Export Buttons */}
                        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-cyan-600">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-white">
                                        <h3 className="text-2xl font-black mb-1">Export Laporan</h3>
                                        <p className="text-blue-100">Pilih format untuk mengunduh laporan</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button
                                            onClick={exportPDF}
                                            size="lg"
                                            className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg"
                                        >
                                            <Download className="w-5 h-5" />
                                            Export PDF
                                        </Button>
                                        <Button
                                            onClick={exportExcel}
                                            size="lg"
                                            className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg"
                                        >
                                            <FileSpreadsheet className="w-5 h-5" />
                                            Export Excel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white/80 mb-1">Total Antrian</p>
                                            <p className="text-4xl font-black text-white">
                                                {reportData.summary.totalQueues}
                                            </p>
                                        </div>
                                        <Users className="w-12 h-12 text-white/30" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white/80 mb-1">Selesai</p>
                                            <p className="text-4xl font-black text-white">
                                                {reportData.summary.completedQueues}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-12 h-12 text-white/30" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white/80 mb-1">Dibatalkan</p>
                                            <p className="text-4xl font-black text-white">
                                                {reportData.summary.skippedQueues}
                                            </p>
                                        </div>
                                        <XCircle className="w-12 h-12 text-white/30" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white/80 mb-1">Avg. Tunggu</p>
                                            <p className="text-4xl font-black text-white">
                                                {reportData.summary.avgWaitTime}
                                                <span className="text-xl ml-1">min</span>
                                            </p>
                                        </div>
                                        <Clock className="w-12 h-12 text-white/30" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* By Service Type */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b">
                                    <CardTitle className="text-xl font-bold">Per Jenis Layanan</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">🚌 Angkutan Umum</span>
                                            <span className="text-2xl font-black text-blue-600">
                                                {reportData.summary.umumQueues}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">📦 Angkutan Barang</span>
                                            <span className="text-2xl font-black text-orange-600">
                                                {reportData.summary.barangQueues}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Completion Rate */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 border-b">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Tingkat Penyelesaian
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className="text-7xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                            {reportData.summary.completionRate}%
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 mt-4">
                                            {reportData.summary.completedQueues} dari{' '}
                                            {reportData.summary.totalQueues} antrian selesai dilayani
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* By Loket */}
                        {reportData.byLoket.length > 0 && (
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b">
                                    <CardTitle className="text-xl font-bold">Kinerja Per Loket</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-100 dark:bg-gray-800 border-b">
                                                <tr>
                                                    <th className="text-left py-3 px-4 font-bold">Loket</th>
                                                    <th className="text-right py-3 px-4 font-bold">Total</th>
                                                    <th className="text-right py-3 px-4 font-bold">Selesai</th>
                                                    <th className="text-right py-3 px-4 font-bold">Batal</th>
                                                    <th className="text-right py-3 px-4 font-bold">Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.byLoket.map((loket) => (
                                                    <tr key={loket.loketName} className="border-b">
                                                        <td className="py-3 px-4 font-semibold">{loket.loketName}</td>
                                                        <td className="py-3 px-4 text-right font-bold">
                                                            {loket.total}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-green-600 font-bold">
                                                            {loket.completed}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-red-600 font-bold">
                                                            {loket.skipped}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-black">
                                                            {Math.round((loket.completed / loket.total) * 100)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
