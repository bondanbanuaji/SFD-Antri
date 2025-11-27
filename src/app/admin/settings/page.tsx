'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Settings, Database, Bell, Shield, Palette, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="bg-gradient-to-r from-slate-700 via-gray-700 to-zinc-700 border-b shadow-xl">
                <div className="container mx-auto px-6 py-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-white drop-shadow-lg"
                    >
                        Pengaturan Sistem
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-300 mt-2 text-lg"
                    >
                        Konfigurasi dan preferensi aplikasi
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Database, title: 'Database Settings', desc: 'Konfigurasi koneksi database', color: 'from-blue-500 to-cyan-500' },
                        { icon: Bell, title: 'Notifications', desc: 'Pengaturan notifikasi sistem', color: 'from-yellow-500 to-orange-500' },
                        { icon: Shield, title: 'Security', desc: 'Keamanan dan autentikasi', color: 'from-red-500 to-pink-500' },
                        { icon: Palette, title: 'Appearance', desc: 'Tema dan tampilan', color: 'from-purple-500 to-indigo-500' },
                        { icon: Zap, title: 'Performance', desc: 'Optimisasi performa', color: 'from-green-500 to-emerald-500' },
                        { icon: Settings, title: 'General', desc: 'Pengaturan umum', color: 'from-gray-500 to-slate-500' },
                    ].map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                                <CardContent className="p-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                                        <item.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {item.desc}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12"
                >
                    <Card className="border-0 shadow-2xl">
                        <CardContent className="p-20 text-center">
                            <Settings className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                                Coming Soon
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400">
                                Halaman pengaturan sedang dalam pengembangan
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 mt-2">
                                Akan tersedia: Manajemen preferensi, konfigurasi sistem, dan banyak lagi
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
