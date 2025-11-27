'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    className?: string;
}

export function AdminSidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        {
            title: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard,
            description: 'Monitoring real-time',
        },
        {
            title: 'Kelola Akun',
            href: '/admin/users',
            icon: Users,
            description: 'CRUD User & Operator',
        },
        {
            title: 'Laporan',
            href: '/admin/reports',
            icon: FileText,
            description: 'Export PDF & Excel',
        },
        {
            title: 'Statistik',
            href: '/admin/statistics',
            icon: Activity,
            description: 'Analisis mendalam',
        },
        {
            title: 'Pengaturan',
            href: '/admin/settings',
            icon: Settings,
            description: 'Konfigurasi sistem',
        },
    ];

    return (
        <motion.div
            initial={{ width: 280 }}
            animate={{ width: isCollapsed ? 80 : 280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
                'relative h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 flex flex-col',
                className
            )}
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                Admin Panel
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">SFD Antri System</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex justify-center"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                                <span className="text-white font-black text-lg">A</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer group relative overflow-hidden',
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                )}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-4 w-full">
                                    <Icon className={cn('w-6 h-6 flex-shrink-0', isActive && 'animate-pulse')} />
                                    
                                    <AnimatePresence mode="wait">
                                        {!isCollapsed && (
                                            <motion.div
                                                key="text"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-1"
                                            >
                                                <p className="font-bold text-sm">{item.title}</p>
                                                <p className="text-xs opacity-70">{item.description}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Toggle Button */}
            <div className="p-4 border-t border-gray-700">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-semibold">Collapse</span>
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}
