'use client';

import Link from 'next/link';
import { Monitor, Smartphone, UserCircle, LayoutDashboard, ArrowRight, Zap, Clock, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME, APP_VERSION } from '@/constants';
import { FadeIn } from '@/components/animated/FadeIn';
import { SlideIn } from '@/components/animated/SlideIn';
import { Stagger, StaggerItem } from '@/components/animated/Stagger';
import { AnimatedCard } from '@/components/animated/AnimatedCard';
import { Pulse } from '@/components/animated/Pulse';

export default function HomePage() {
  const features = [
    {
      href: '/kiosk',
      icon: Smartphone,
      title: 'Kiosk',
      description: 'Ambil nomor antrian untuk layanan Angkutan Umum atau Angkutan Barang',
      color: 'from-green-500 to-emerald-500',
    },
    {
      href: '/display',
      icon: Monitor,
      title: 'Display',
      description: 'Layar tampilan publik untuk monitoring nomor antrian yang dipanggil',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      href: '/loket',
      icon: UserCircle,
      title: 'Loket',
      description: 'Dashboard petugas untuk mengelola dan memanggil antrian pelanggan',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      href: '/admin',
      icon: LayoutDashboard,
      title: 'Admin',
      description: 'Panel administrasi untuk laporan statistik dan manajemen sistem',
      color: 'from-red-500 to-orange-500',
    },
  ];

  const benefits = [
    { icon: Zap, title: 'Real-time', description: 'Update langsung tanpa refresh' },
    { icon: Clock, title: 'Efisien', description: 'Hemat waktu tunggu pelanggan' },
    { icon: Users, title: 'User-friendly', description: 'Interface mudah digunakan' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/20 dark:bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <FadeIn>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {APP_NAME}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dinas Perhubungan - v{APP_VERSION}</p>
              </div>
              <ThemeToggle />
            </div>
          </FadeIn>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-20">
          <SlideIn direction="down" delay={0.2}>
            <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Sistem Antrian Digital
            </h2>
          </SlideIn>
          
          <SlideIn direction="up" delay={0.4}>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Kelola antrian dengan lebih efisien menggunakan sistem digital modern dengan fitur real-time dan user-friendly
            </p>
          </SlideIn>

          {/* Benefits */}
          <Stagger delay={0.6} staggerDelay={0.1}>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
              {benefits.map((benefit, index) => (
                <StaggerItem key={index}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
                    <benefit.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{benefit.title}</span>
                    <span className="text-gray-600 dark:text-gray-400 hidden md:inline">- {benefit.description}</span>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>

        {/* Feature Cards */}
        <Stagger staggerDelay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <StaggerItem key={feature.href}>
                <Link href={feature.href}>
                  <AnimatedCard 
                    delay={0.1 * index}
                    className="group relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <CardHeader className="text-center relative z-10">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 transform group-hover:scale-110 transition-transform duration-300`}>
                        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl p-3 flex items-center justify-center">
                          <feature.icon className="w-full h-full text-gray-700 dark:text-gray-300" />
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2 text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </CardDescription>
                      <Button 
                        variant="ghost" 
                        className="mt-4 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950 group-hover:text-green-600 dark:group-hover:text-green-400"
                      >
                        Buka <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                      </Button>
                    </CardHeader>
                  </AnimatedCard>
                </Link>
              </StaggerItem>
            ))}
          </div>
        </Stagger>

        {/* Quick Access CTA */}
        <SlideIn direction="up" delay={0.8}>
          <Card className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 border-0 shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10" />
            <CardHeader className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-white">Akses Cepat untuk Petugas</CardTitle>
                  <CardDescription className="mt-1 text-green-100">
                    Login sebagai petugas atau admin untuk mengelola sistem
                  </CardDescription>
                </div>
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    Login Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        </SlideIn>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl mt-12">
        <div className="container mx-auto px-4 py-6">
          <FadeIn delay={1}>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              &copy; 2025 Dinas Perhubungan. All rights reserved.
            </p>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
}
