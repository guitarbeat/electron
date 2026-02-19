import { useCallback, useEffect, useRef } from 'react';

export const useSnakeAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on first user interaction if possible, 
        // but here we just set it up. Browsers might block it until interaction.
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
        }

        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
        if (!audioContextRef.current) return;

        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);

        gain.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);

        osc.start();
        osc.stop(audioContextRef.current.currentTime + duration);
    }, []);

    const playEatSound = useCallback(() => {
        // High pitched "coin" sound
        playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(900, 'sine', 0.2, 0.1), 50);
    }, [playTone]);

    const playGameOverSound = useCallback(() => {
        // Descending "crash" sound
        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }, []);

    const playMoveSound = useCallback(() => {
        // Very subtle click
        playTone(200, 'triangle', 0.05, 0.02);
    }, [playTone]);

    return { playEatSound, playGameOverSound, playMoveSound };
};
