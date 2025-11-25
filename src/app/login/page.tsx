'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login gagal');
            }

            const data = await response.json();

            // Redirect based on role
            if (data.user.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/loket');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-8">
            <Card className="p-8 max-w-md w-full bg-white">
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800">
                            Login Petugas
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Sistem Antrian Dinas Perhubungan
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Masukkan username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full gap-2"
                        >
                            {isLoading ? (
                                'Memproses...'
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Login
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-gray-600">
                        <p>Demo Credentials:</p>
                        <p className="font-mono text-xs mt-1">
                            admin / admin123 atau petugas1 / petugas123
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
