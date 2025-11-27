'use client';

import { useSocket } from '@/hooks/useSocket';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
    const { isConnected } = useSocket();

    return (
        <div className="flex items-center gap-2 text-sm">
            <div
                className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-full border',
                    isConnected && 'bg-green-100 text-green-900 border-green-300 dark:bg-green-800 dark:text-green-100 dark:border-green-600',
                    !isConnected && 'bg-red-100 text-red-900 border-red-300 dark:bg-red-800 dark:text-red-100 dark:border-red-600'
                )}
            >
                {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}

                <span className="font-medium">
                    {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
            </div>
        </div>
    );
}
