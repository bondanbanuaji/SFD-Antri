'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, Check, X, RefreshCw, LogOut } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Queue {
    id: number;
    code: string;
    type: string;
    status: string;
    number: number;
    createdAt: string;
}

export default function LoketPage() {
    const router = useRouter();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [waitingQueues, setWaitingQueues] = useState<Queue[]>([]);
    const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loketInfo, setLoketInfo] = useState({ id: 1, name: 'Loket 1' }); // TODO: Get from auth

    useEffect(() => {
        // TODO: Check authentication
        fetchWaitingQueues();

        const newSocket = io({
            path: '/socket.io',
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            newSocket.emit('join', 'loket');
            newSocket.emit('join', `loket-${loketInfo.id}`);
        });

        newSocket.on('queue:new', () => {
            fetchWaitingQueues();
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [loketInfo.id]);

    const fetchWaitingQueues = async () => {
        try {
            const response = await fetch('/api/queue');
            if (response.ok) {
                const queues = await response.json();
                setWaitingQueues(queues);
            }
        } catch (error) {
            console.error('Error fetching queues:', error);
        }
    };

    const callNextQueue = async () => {
        if (waitingQueues.length === 0) return;

        setIsProcessing(true);
        const nextQueue = waitingQueues[0];

        try {
            const response = await fetch(`/api/queue/${nextQueue.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'call',
                    loketId: loketInfo.id,
                }),
            });

            if (response.ok) {
                const updatedQueue = await response.json();
                setCurrentQueue(updatedQueue);
                fetchWaitingQueues();
            }
        } catch (error) {
            console.error('Error calling queue:', error);
            alert('Gagal memanggil antrian');
        } finally {
            setIsProcessing(false);
        }
    };

    const recallQueue = async () => {
        if (!currentQueue) return;

        // Re-emit the call event
        socket?.emit('queue:called', currentQueue);

        // Play audio announcement locally
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Nomor antrian ${currentQueue.code.replace('-', ' ')}. Silakan ke ${loketInfo.name}`
            );
            utterance.lang = 'id-ID';
            window.speechSynthesis.speak(utterance);
        }
    };

    const completeQueue = async () => {
        if (!currentQueue) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/queue/${currentQueue.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
            });

            if (response.ok) {
                setCurrentQueue(null);
            }
        } catch (error) {
            console.error('Error completing queue:', error);
            alert('Gagal menyelesaikan antrian');
        } finally {
            setIsProcessing(false);
        }
    };

    const skipQueue = async () => {
        if (!currentQueue) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/queue/${currentQueue.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'skip' }),
            });

            if (response.ok) {
                setCurrentQueue(null);
            }
        } catch (error) {
            console.error('Error skipping queue:', error);
            alert('Gagal membatalkan antrian');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">
                            {loketInfo.name}
                        </h1>
                        <p className="text-gray-600">Dashboard Petugas</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/login')}
                        className="gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>

                {/* Current Queue */}
                <Card className="p-8 bg-white">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-700">
                            Sedang Dilayani
                        </h2>
                        {currentQueue ? (
                            <>
                                <div className="bg-blue-50 rounded-2xl p-12 border-4 border-blue-200">
                                    <p className="text-9xl font-black text-blue-600">
                                        {currentQueue.code}
                                    </p>
                                    <p className="text-xl text-gray-600 mt-4">
                                        {currentQueue.type === 'UMUM' ? 'Angkutan Umum' : 'Angkutan Barang'}
                                    </p>
                                </div>
                                <div className="flex gap-4 justify-center pt-4">
                                    <Button
                                        onClick={recallQueue}
                                        variant="outline"
                                        size="lg"
                                        className="gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Panggil Ulang
                                    </Button>
                                    <Button
                                        onClick={completeQueue}
                                        disabled={isProcessing}
                                        size="lg"
                                        className="gap-2 bg-green-600 hover:bg-green-700"
                                    >
                                        <Check className="w-5 h-5" />
                                        Selesai
                                    </Button>
                                    <Button
                                        onClick={skipQueue}
                                        disabled={isProcessing}
                                        variant="destructive"
                                        size="lg"
                                        className="gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Batal/Skip
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="py-12">
                                <p className="text-6xl text-gray-300">-</p>
                                <p className="text-gray-500 mt-4">Tidak ada antrian yang sedang dilayani</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Waiting Queue */}
                <Card className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-700">
                            Antrian Menunggu ({waitingQueues.length})
                        </h2>
                        <Button
                            onClick={callNextQueue}
                            disabled={isProcessing || waitingQueues.length === 0 || currentQueue !== null}
                            size="lg"
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Phone className="w-5 h-5" />
                            Panggil Berikutnya
                        </Button>
                    </div>

                    {waitingQueues.length > 0 ? (
                        <div className="grid grid-cols-5 gap-4">
                            {waitingQueues.slice(0, 10).map((queue, index) => (
                                <div
                                    key={queue.id}
                                    className={`p-4 rounded-lg text-center ${index === 0
                                            ? 'bg-blue-100 border-2 border-blue-400'
                                            : 'bg-gray-100'
                                        }`}
                                >
                                    <p className="text-3xl font-bold text-gray-800">
                                        {queue.code}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {queue.type === 'UMUM' ? 'Umum' : 'Barang'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Tidak ada antrian menunggu
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
