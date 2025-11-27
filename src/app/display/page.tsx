'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Radio, Volume2, Calendar, Bell } from 'lucide-react';

// --- TYPES ---

interface Loket {
    id: number;
    name: string;
    status: string;
}

interface QueueItem {
    id: number;
    code: string;
    type: string;
    loketId: number;
    loket: Loket;
    calledAt?: Date;
    isRecall?: boolean;
    lastRecallAt?: Date;
    transportCode?: string;
    passengerName?: string;
    passengerRoute?: string;
}

interface Notification {
    id: string;
    code: string;
    loketName: string;
    type: 'called' | 'recall' | 'completed' | 'skipped';
}

interface DisplayData {
    counterNumber: number | null;
    transportCode: string | null;
    queueNumber: string | null;
    passengerData: {
        name: string;
        route: string;
    } | null;
    isActive: boolean;
    timestamp: Date | null;
}

// --- COMPONENT ---

export default function DisplayPage() {
    // State
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const [lokets, setLokets] = useState<Loket[]>([]);
    const [activeQueues, setActiveQueues] = useState<Record<number, QueueItem>>({});

    const [displayData, setDisplayData] = useState<DisplayData>({
        counterNumber: null,
        transportCode: null,
        queueNumber: null,
        passengerData: null,
        isActive: false,
        timestamp: null
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // --- DATA FETCHING ---

    const fetchInitialData = useCallback(async () => {
        try {
            console.log('🔄 [DISPLAY] Fetching initial data...');

            // 1. Fetch Lokets
            const loketRes = await fetch('/api/loket');
            const loketData = await loketRes.json();

            if (loketData.success) {
                setLokets(loketData.data);
                console.log(`✅ [DISPLAY] Loaded ${loketData.data.length} lokets`);
            }

            // 2. Fetch Current Queues
            const queueRes = await fetch('/api/queue/current');
            const queueData = await queueRes.json();

            if (queueData.success && Array.isArray(queueData.data)) {
                const queues: Record<number, QueueItem> = {};
                queueData.data.forEach((q: any) => {
                    if (q.loketId && q.status === 'CALLED') {
                        queues[q.loketId] = {
                            id: q.id,
                            code: q.code,
                            type: q.type,
                            loketId: q.loketId,
                            loket: q.loket || { id: q.loketId, name: `Loket ${q.loketId}`, status: 'OPEN' },
                            calledAt: q.calledAt ? new Date(q.calledAt) : undefined,
                            isRecall: false, // Initial load assumes not a recall unless tracked elsewhere
                            transportCode: q.transportCode,
                            passengerName: q.passengerName,
                            passengerRoute: q.passengerRoute,
                        };
                    }
                });
                setActiveQueues(queues);
                console.log(`✅ [DISPLAY] Loaded ${Object.keys(queues).length} active queues`);
            }

        } catch (error) {
            console.error('❌ [DISPLAY] Failed to fetch initial data:', error);
        }
    }, []);

    // --- SOCKET HANDLERS ---

    useEffect(() => {
        console.log('🚀 [DISPLAY] Initializing socket...');

        const newSocket = io({
            path: '/socket.io',
            transports: ['websocket', 'polling'], // Prefer websocket
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        newSocket.on('connect', () => {
            console.log('✅ [DISPLAY] Connected:', newSocket.id);
            console.log('   - Transport:', newSocket.io.engine.transport.name);
            setIsConnected(true);
            newSocket.emit('join', 'display');
            fetchInitialData(); // Re-sync on connect
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ [DISPLAY] Connection Error:', err.message);
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ [DISPLAY] Disconnected:', reason);
            setIsConnected(false);
        });

        // Event: Queue Called
        newSocket.on('queue:called', (data: any) => {
            console.log('📢 [EVENT] Queue Called - FULL DATA:', JSON.stringify(data, null, 2));
            console.log('   - data.loketId (RAW):', data.loketId, 'type:', typeof data.loketId);
            console.log('   - data.id:', data.id);
            console.log('   - data.code:', data.code);

            if (!data.loketId) {
                console.error('❌ No loketId in queue:called event!');
                return;
            }

            const loketId = Number(data.loketId);
            console.log('   - loketId (PARSED):', loketId, 'type:', typeof loketId);

            const loketName = data.loket?.name || `Loket ${loketId}`;
            const now = new Date();

            // 1. Update Active Queues (Grid)
            setActiveQueues(prev => ({
                ...prev,
                [loketId]: {
                    id: data.id,
                    code: data.code,
                    type: data.type,
                    loketId: loketId,
                    loket: data.loket || { id: loketId, name: loketName, status: 'OPEN' },
                    calledAt: now,
                    isRecall: false,
                    transportCode: data.transportCode,
                    passengerName: data.passengerName,
                    passengerRoute: data.passengerRoute,
                }
            }));

            // 2. Trigger Focused Display
            console.log('   - Setting displayData.counterNumber to:', loketId);
            setDisplayData({
                counterNumber: loketId,
                transportCode: data.transportCode || '-',
                queueNumber: data.code,
                passengerData: (data.passengerName || data.passengerRoute) ? {
                    name: data.passengerName || '-',
                    route: data.passengerRoute || '-'
                } : null,
                isActive: true,
                timestamp: now
            });

            // 3. Audio & Notification
            playAudio(data.code, loketName);
            showNotification(data.code, loketName, 'called');

            // Auto-clear focus after 10s
            setTimeout(() => {
                setDisplayData(prev => {
                    // Only clear if it's still the same event (timestamp check)
                    if (prev.timestamp === now) {
                        return { ...prev, isActive: false };
                    }
                    return prev;
                });
            }, 5000);
        });

        // Event: Queue Recall
        newSocket.on('queue:recall', (data: any) => {
            console.log('🔁 [EVENT] Queue Recall:', data);
            if (!data.loketId) return;

            const loketId = Number(data.loketId);
            const loketName = data.loket?.name || `Loket ${loketId}`;
            const now = new Date();

            // 1. Update Active Queues (Grid) - Mark as Recall
            setActiveQueues(prev => {
                const existing = prev[loketId];
                return {
                    ...prev,
                    [loketId]: {
                        ...existing, // Keep existing data
                        id: data.id,
                        code: data.code,
                        loketId: loketId,
                        loket: data.loket || { id: loketId, name: loketName, status: 'OPEN' },
                        isRecall: true,
                        lastRecallAt: now,
                        // Ensure transport data persists if available in event, otherwise keep existing
                        transportCode: data.transportCode || existing?.transportCode,
                        passengerName: data.passengerName || existing?.passengerName,
                        passengerRoute: data.passengerRoute || existing?.passengerRoute,
                    }
                };
            });

            // 2. Trigger Focused Display (Recall also triggers focus)
            setDisplayData({
                counterNumber: loketId,
                transportCode: data.transportCode || activeQueues[loketId]?.transportCode || '-',
                queueNumber: data.code,
                passengerData: (data.passengerName || data.passengerRoute) ? {
                    name: data.passengerName || '-',
                    route: data.passengerRoute || '-'
                } : (activeQueues[loketId]?.passengerName || activeQueues[loketId]?.passengerRoute) ? {
                    name: activeQueues[loketId]?.passengerName || '-',
                    route: activeQueues[loketId]?.passengerRoute || '-'
                } : null,
                isActive: true,
                timestamp: now
            });

            // 3. Audio & Notification
            playAudio(data.code, loketName, true);
            showNotification(data.code, loketName, 'recall');

            // Auto-clear focus after 10s
            setTimeout(() => {
                setDisplayData(prev => {
                    if (prev.timestamp === now) {
                        return { ...prev, isActive: false };
                    }
                    return prev;
                });
            }, 5000);
        });

        // Event: Queue Completed
        newSocket.on('queue:completed', (data: any) => {
            console.log('✅ [EVENT] Queue Completed:', data);
            if (!data.loketId) return;

            const loketName = data.loket?.name || `Loket ${data.loketId}`;

            // Remove from Active Queues
            setActiveQueues(prev => {
                const newState = { ...prev };
                delete newState[data.loketId];
                return newState;
            });

            showNotification(data.code, loketName, 'completed');
        });

        // Event: Queue Skipped
        newSocket.on('queue:skipped', (data: any) => {
            console.log('⏭️ [EVENT] Queue Skipped:', data);
            if (!data.loketId) return;

            const loketName = data.loket?.name || `Loket ${data.loketId}`;

            // Remove from Active Queues
            setActiveQueues(prev => {
                const newState = { ...prev };
                delete newState[data.loketId];
                return newState;
            });

            showNotification(data.code, loketName, 'skipped');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [fetchInitialData]); // Dependency on fetchInitialData is safe as it's useCallback'd

    // --- UTILS & EFFECTS ---

    // Clock
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Audio / TTS Setup
    useEffect(() => {
        if ('speechSynthesis' in window) {
            const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Enable Audio Interaction
    useEffect(() => {
        const enableAudio = () => {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            setAudioEnabled(true);
        };
        ['click', 'touchstart', 'keydown'].forEach(e => document.addEventListener(e, enableAudio, { once: true }));
    }, []);

    // --- HELPER FUNCTIONS ---

    const showNotification = (code: string, loketName: string, type: Notification['type']) => {
        const id = `${code}-${Date.now()}`;
        setNotifications(prev => [...prev, { id, code, loketName, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    };

    const playAudio = (code: string, loketName: string, isRecall = false) => {
        if (!audioEnabled) return;

        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playBeep = (time: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = isRecall ? 1000 : 800;
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
                osc.start(time);
                osc.stop(time + 0.3);
            };

            playBeep(ctx.currentTime);
            if (isRecall) playBeep(ctx.currentTime + 0.4);

            if ('speechSynthesis' in window) {
                setTimeout(() => {
                    window.speechSynthesis.cancel();
                    const text = isRecall
                        ? `Panggilan ulang. Nomor antrian ${code.replace('-', ' ')}. Silakan segera ke ${loketName}`
                        : `Nomor antrian ${code.replace('-', ' ')}. Silakan ke ${loketName}`;

                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'id-ID';

                    // Try to find Indonesian voice
                    const idVoice = voices.find(v => v.lang.includes('id'));
                    if (idVoice) utterance.voice = idVoice;

                    window.speechSynthesis.speak(utterance);
                }, isRecall ? 1000 : 600);
            }
        } catch (e) {
            console.error('Audio error:', e);
        }
    };

    const formatTimeAgo = (date: Date | undefined) => {
        if (!date) return '';
        const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (diff < 60) return `${diff} detik lalu`;
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        return `${Math.floor(diff / 3600)} jam lalu`;
    };

    const getLoketColor = (id: number) => {
        const colors = [
            { from: 'from-blue-500', to: 'to-cyan-500', accent: 'bg-blue-500', glow: 'shadow-blue-500/50' },
            { from: 'from-emerald-500', to: 'to-green-500', accent: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
            { from: 'from-violet-500', to: 'to-purple-500', accent: 'bg-violet-500', glow: 'shadow-violet-500/50' },
            { from: 'from-orange-500', to: 'to-amber-500', accent: 'bg-orange-500', glow: 'shadow-orange-500/50' },
            { from: 'from-pink-500', to: 'to-rose-500', accent: 'bg-pink-500', glow: 'shadow-pink-500/50' },
        ];
        return colors[(id - 1) % colors.length];
    };

    // --- RENDER ---

    // Calculate grid columns based on loket count
    const getGridCols = () => {
        const count = lokets.length;
        if (count <= 1) return 'grid-cols-1';
        if (count <= 2) return 'grid-cols-2';
        if (count <= 3) return 'grid-cols-3';
        if (count <= 4) return 'grid-cols-2 lg:grid-cols-4'; // 2x2 on smaller, 4x1 on large
        if (count <= 6) return 'grid-cols-3';
        return 'grid-cols-4';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden flex flex-col">

            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />

            {/* AUDIO PROMPT */}
            {!audioEnabled && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
                    <div className="bg-yellow-500 text-black px-6 py-3 rounded-full font-bold shadow-lg animate-bounce cursor-pointer">
                        Klik Layar Untuk Mengaktifkan Suara
                    </div>
                </div>
            )}

            {/* NOTIFICATIONS */}
            <div className="fixed top-24 right-8 z-50 space-y-4 pointer-events-none">
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl min-w-[300px]"
                        >
                            <div className="font-bold text-lg">{n.loketName}</div>
                            <div className="text-2xl font-black">{n.code}</div>
                            <div className="text-sm uppercase opacity-75">{n.type}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* HEADER */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-2xl relative z-10">
                <div className="container mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 p-[2px]">
                            <div className="w-full h-full bg-gray-950 rounded-2xl flex items-center justify-center">
                                <Radio className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                                ANTRIAN DIGITAL
                            </h1>
                            <p className="text-gray-400 font-medium">Dinas Perhubungan</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                            <span className="font-bold">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-mono font-bold">{currentTime}</div>
                            <div className="text-gray-400 text-sm">{currentDate}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 container mx-auto px-8 py-8 relative z-10 flex flex-col">

                {/* FOCUSED DISPLAY OVERLAY */}
                <AnimatePresence mode="wait">
                    {displayData.isActive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="absolute inset-0 z-40 bg-gray-950/90 backdrop-blur-3xl flex items-center justify-center p-8"
                        >
                            <div className="w-full max-w-6xl text-center space-y-12">
                                <motion.div
                                    initial={{ y: -50 }}
                                    animate={{ y: 0 }}
                                    className="text-6xl font-black text-white tracking-tight"
                                >
                                    SILAKAN MENUJU
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className="py-8"
                                >
                                    <div className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 drop-shadow-[0_0_50px_rgba(56,189,248,0.5)]">
                                        LOKET {displayData.counterNumber}
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-2 gap-16 max-w-5xl mx-auto">
                                    <div className="bg-white/5 rounded-3xl p-10 border border-white/10">
                                        <div className="text-2xl font-bold text-white/50 mb-4 uppercase tracking-widest">Kode Angkutan</div>
                                        <div className="text-7xl font-black text-yellow-400">{displayData.transportCode}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-3xl p-10 border border-white/10">
                                        <div className="text-2xl font-bold text-white/50 mb-4 uppercase tracking-widest">Nomor Antrian</div>
                                        <div className="text-7xl font-black text-white">{displayData.queueNumber}</div>
                                    </div>
                                </div>

                                {displayData.passengerData && (
                                    <motion.div
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white/5 rounded-3xl p-8 border border-white/10 max-w-5xl mx-auto"
                                    >
                                        <div className="flex justify-around items-center text-left">
                                            <div>
                                                <div className="text-xl font-bold text-white/50 mb-1">Nama Penumpang</div>
                                                <div className="text-4xl font-bold text-white">{displayData.passengerData.name}</div>
                                            </div>
                                            <div className="w-px h-16 bg-white/10" />
                                            <div>
                                                <div className="text-xl font-bold text-white/50 mb-1">Rute Perjalanan</div>
                                                <div className="text-4xl font-bold text-white">{displayData.passengerData.route}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* GRID DISPLAY */}
                <div className={`grid gap-8 h-full ${getGridCols()}`}>
                    {lokets.map((loket) => {
                        const queue = activeQueues[loket.id];
                        const colors = getLoketColor(loket.id);

                        return (
                            <motion.div
                                key={loket.id}
                                layout
                                className={`relative rounded-3xl border overflow-hidden flex flex-col transition-all duration-500 ${queue
                                    ? queue.isRecall
                                        ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.3)]'
                                        : `bg-gradient-to-br ${colors.from}/20 ${colors.to}/20 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]`
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                {/* Loket Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                    <div className="text-2xl font-black tracking-wide">{loket.name.toUpperCase()}</div>
                                    {queue && (
                                        <div className="flex items-center gap-2">
                                            {queue.isRecall && (
                                                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/30 animate-pulse">
                                                    PANGGILAN ULANG
                                                </span>
                                            )}
                                            <Volume2 className="w-6 h-6 text-white/80" />
                                        </div>
                                    )}
                                </div>

                                {/* Loket Body */}
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <AnimatePresence mode="wait">
                                        {queue ? (
                                            <motion.div
                                                key={queue.code}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                className="w-full"
                                            >
                                                <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-2">Nomor Antrian</div>
                                                <div className="text-7xl font-black mb-6 drop-shadow-2xl">{queue.code}</div>

                                                {(queue.transportCode || queue.passengerRoute) && (
                                                    <div className="space-y-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                                                        {queue.transportCode && (
                                                            <div className="text-2xl font-bold text-yellow-400">{queue.transportCode}</div>
                                                        )}
                                                        {queue.passengerRoute && (
                                                            <div className="text-lg font-medium text-white/80">{queue.passengerRoute}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <div className="text-8xl font-black text-white/5 mb-4">—</div>
                                                <div className="text-gray-500 font-medium">Menunggu</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* FOOTER MARQUEE */}
            <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl py-4">
                <div className="overflow-hidden relative flex">
                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="whitespace-nowrap flex gap-8"
                    >
                        {[...Array(4)].map((_, i) => (
                            <span key={i} className="text-xl font-medium text-white/60">
                                ✨ Selamat Datang di Dinas Perhubungan • Mohon Menunggu Panggilan • Terima Kasih Atas Kunjungan Anda •
                            </span>
                        ))}
                    </motion.div>
                </div>
            </footer>
        </div>
    );
}
