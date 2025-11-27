import { useState, useEffect, useCallback } from 'react';

interface UseTTSOptions {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}

export function useTTS(options: UseTTSOptions = {}) {
    const {
        lang = 'id-ID',
        rate = 0.9,
        pitch = 1.0,
        volume = 1.0
    } = options;

    const [supported, setSupported] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSupported(true);

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;

            return () => {
                window.speechSynthesis.onvoiceschanged = null;
            };
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!supported) return;

        // Cancel any current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Try to find a specific Indonesian voice if available
        const indonesianVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = (event) => {
            // Ignore errors caused by canceling (common when rapid firing)
            if (event.error === 'canceled' || event.error === 'interrupted') {
                setSpeaking(false);
                return;
            }

            console.error('TTS Error:', {
                error: event.error,
                elapsedTime: event.elapsedTime,
                charIndex: event.charIndex
            });
            setSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [supported, lang, rate, pitch, volume, voices]);

    const cancel = useCallback(() => {
        if (supported) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
        }
    }, [supported]);

    return {
        supported,
        speaking,
        speak,
        cancel,
        voices
    };
}
