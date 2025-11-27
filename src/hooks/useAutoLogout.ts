'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseAutoLogoutOptions {
    timeoutMs?: number; // Default 60000 (1 minute)
    onLogout?: () => void;
    enabled?: boolean;
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
    const {
        timeoutMs = 60000, // 1 minute default
        onLogout,
        enabled = true
    } = options;

    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const logout = useCallback(async () => {
        console.log('🚪 [AUTO-LOGOUT] Logging out due to inactivity...');

        // Call custom logout handler if provided
        if (onLogout) {
            onLogout();
        }

        // Clear auth token
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout API error:', error);
        }

        // Redirect to login
        router.push('/login?reason=inactivity');
    }, [onLogout, router]);

    const resetTimer = useCallback(() => {
        // Clear existing timer
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timer
        timeoutRef.current = setTimeout(() => {
            logout();
        }, timeoutMs);
    }, [logout, timeoutMs]);

    useEffect(() => {
        if (!enabled) return;

        console.log(`⏱️ [AUTO-LOGOUT] Inactivity timer enabled (${timeoutMs / 1000}s)`);

        // Activity events to monitor
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Start initial timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                document.removeEventListener(event, resetTimer, true);
            });
        };
    }, [enabled, resetTimer, timeoutMs]);

    return { logout };
}
