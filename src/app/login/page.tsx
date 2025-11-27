'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Loader2, LogIn, Lock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Username dan password harus diisi');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Selamat datang, ${data.user.name}!`);

                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === 'ADMIN') {
                        router.push('/admin');
                    } else {
                        router.push('/loket');
                    }
                }, 500);
            } else {
                toast.error(data.error || 'Login gagal');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (user: string, pass: string) => {
        setUsername(user);
        setPassword(pass);
        toast.info(`Kredensial ${user} telah diisi`);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Beranda</span>
                    </Link>
                    <div className="flex justify-center items-center gap-4 mt-4 mb-2">
                        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
                        <ThemeToggle />
                        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
                    </div>
                </div>

                {/* Login Card */}
                <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900">
                    <CardHeader className="space-y-1 text-center pb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white dark:text-gray-900" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Login
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            Masuk ke sistem antrian digital
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">
                                    Username
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Masukkan username"
                                        disabled={loading}
                                        className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Masukkan password"
                                        disabled={loading}
                                        className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 h-11"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Login
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer Note */}
                <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
                    Sistem Antrian Digital - Dinas Perhubungan
                </p>
            </div>
        </div>
    );
}
