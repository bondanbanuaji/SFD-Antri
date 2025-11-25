'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';

interface QueueDisplay {
    code: string;
    loket?: {
        name: string;
    };
}

export default function DisplayPage() {
    const [currentCalls, setCurrentCalls] = useState<Record<number, QueueDisplay>>({});
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io({
            path: '/socket.io',
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            newSocket.emit('join', 'display');
        });

        newSocket.on('queue:called', (queue: any) => {
            if (queue.loketId) {
                setCurrentCalls((prev) => ({
                    ...prev,
                    [queue.loketId]: queue,
                }));

                // Play audio announcement
                playAnnouncement(queue.code, queue.loket?.name);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const playAnnouncement = (code: string, loketName?: string) => {
        // TODO: Implement professional audio announcement
        // For now, use browser TTS
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Nomor antrian ${code.replace('-', ' ')}. Silakan ke ${loketName || 'loket'}`
            );
            utterance.lang = 'id-ID';
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-bold text-white">
                        Sistem Antrian
                    </h1>
                    <h2 className="text-4xl text-blue-300">
                        Dinas Perhubungan
                    </h2>
                </div>

                {/* Loket Display Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((loketNum) => (
                        <Card
                            key={loketNum}
                            className="p-8 bg-white/10 backdrop-blur-lg border-white/20"
                        >
                            <div className="space-y-4">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-blue-300">
                                        LOKET {loketNum}
                                    </h3>
                                </div>
                                <div className="bg-white rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
                                    {currentCalls[loketNum] ? (
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500 mb-2">
                                                Sekarang Melayani
                                            </p>
                                            <p className="text-7xl font-black text-blue-600">
                                                {currentCalls[loketNum].code}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-4xl text-gray-300">-</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Running Text */}
                <div className="bg-yellow-500/20 border-y-4 border-yellow-500 py-4 overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap">
                        <span className="text-2xl text-yellow-400 font-semibold">
                            Selamat datang di Dinas Perhubungan • Mohon tunggu panggilan nomor antrian Anda • Terima kasih atas kunjungan Anda
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-white/60">
                    <p className="text-xl">
                        {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
        </div>
    );
}
