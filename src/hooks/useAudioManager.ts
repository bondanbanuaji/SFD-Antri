'use client';

import { useEffect, useRef, useState } from 'react';

interface UseAudioManagerOptions {
    enabled?: boolean;
}

export function useAudioManager(options: UseAudioManagerOptions = {}) {
    const [audioEnabled, setAudioEnabled] = useState(options.enabled ?? false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const audioContextRef = useRef<AudioContext>();

    // Initialize AudioContext (singleton)
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    // Load TTS voices
    useEffect(() => {
        if ('speechSynthesis' in window) {
            const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Enable audio on user interaction
    useEffect(() => {
        const enableAudio = () => {
            const ctx = audioContextRef.current;
            if (ctx && ctx.state === 'suspended') {
                ctx.resume();
            }
            setAudioEnabled(true);
        };

        ['click', 'touchstart', 'keydown'].forEach(event =>
            document.addEventListener(event, enableAudio, { once: true })
        );

        return () => {
            ['click', 'touchstart', 'keydown'].forEach(event =>
                document.removeEventListener(event, enableAudio)
            );
        };
    }, []);

    const playBeep = (frequency: number = 800, duration: number = 0.3) => {
        if (!audioEnabled || !audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (error) {
            console.error('Error playing beep:', error);
        }
    };

    const speak = (text: string, lang: string = 'id-ID') => {
        if (!audioEnabled || !('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;

            // Try to find language-specific voice
            const langVoice = voices.find(v => v.lang.includes(lang.split('-')[0]));
            if (langVoice) {
                utterance.voice = langVoice;
            }

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Error in text-to-speech:', error);
        }
    };

    const playQueueNotification = (code: string, loketName: string, isRecall: boolean = false) => {
        if (!audioEnabled) return;

        // Play beep sound
        const frequency = isRecall ? 1000 : 800;
        playBeep(frequency);

        if (isRecall) {
            setTimeout(() => playBeep(frequency), 400);
        }

        // Speak announcement
        const text = isRecall
            ? `Panggilan ulang. Nomor antrian ${code.replace('-', ' ')}. Silakan segera ke ${loketName}`
            : `Nomor antrian ${code.replace('-', ' ')}. Silakan ke ${loketName}`;

        setTimeout(() => speak(text, 'id-ID'), isRecall ? 1000 : 600);
    };

    return {
        audioEnabled,
        setAudioEnabled,
        voices,
        playBeep,
        speak,
        playQueueNotification,
    };
}
