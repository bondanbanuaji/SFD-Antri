'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatisticsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 border-b shadow-xl">
                <div className="container mx-auto px-6 py-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-white drop-shadow-lg"
                    >
                        Statistik & Analisis
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-cyan-100 mt-2 text-lg"
                    >
                        Analisis mendalam dan visualisasi data
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Activity, title: 'Real-time Analytics', color: 'from-blue-500 to-cyan-500' },
                        { icon: TrendingUp, title: 'Trend Analysis', color: 'from-green-500 to-emerald-500' },
                        { icon: BarChart3, title: 'Performance Metrics', color: 'from-purple-500 to-pink-500' },
                        { icon: PieChart, title: 'Distribution Charts', color: 'from-orange-500 to-red-500' },
                    ].map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className={`border-0 shadow-lg bg-gradient-to-br ${item.color}`}>
                                <CardContent className="p-8 text-center text-white">
                                    <item.icon className="w-16 h-16 mx-auto mb-4 opacity-80" />
                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12"
                >
                    <Card className="border-0 shadow-2xl">
                        <CardContent className="p-20 text-center">
                            <Activity className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                                Coming Soon
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400">
                                Fitur statistik mendalam sedang dalam pengembangan
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 mt-2">
                                Akan tersedia: Charts interaktif, heatmaps, predictive analytics, dan lebih banyak lagi
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
