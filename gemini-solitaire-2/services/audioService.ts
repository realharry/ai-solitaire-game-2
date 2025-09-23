
let audioContext: AudioContext | null = null;
let isInitialized = false;

// Function to initialize the AudioContext on user gesture.
// Browsers require a user interaction to start an AudioContext.
const initializeAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitialized = true;
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
    }
};

// A generic function to play a synthesized tone.
const playTone = (freq: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
};

export type SoundEffect = 'flip' | 'move' | 'deal' | 'win' | 'lose' | 'invalid' | 'undo' | 'redo';

export const playSound = (sound: SoundEffect) => {
    // Attempt to initialize on the first sound played. This will be triggered by a user action.
    if (!isInitialized) {
        initializeAudio();
    }
    // If context is suspended (e.g., after a page is backgrounded), try to resume it.
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (!audioContext) return;

    switch (sound) {
        case 'flip':
            playTone(800, 0.1, 0.1, 'square');
            break;
        case 'move':
            playTone(440, 0.15, 0.15, 'sine');
            playTone(550, 0.1, 0.1, 'sine');
            break;
        case 'deal':
            playTone(600, 0.1, 0.06, 'triangle');
            break;
        case 'invalid':
            playTone(220, 0.2, 0.15, 'sawtooth');
            break;
        case 'undo':
            playTone(400, 0.1, 0.1, 'triangle');
            setTimeout(() => playTone(300, 0.15, 0.1, 'triangle'), 80);
            break;
        case 'redo':
            playTone(300, 0.1, 0.1, 'triangle');
            setTimeout(() => playTone(400, 0.15, 0.1, 'triangle'), 80);
            break;
        case 'win':
            playTone(523.25, 0.2, 0.2); // C5
            setTimeout(() => playTone(659.25, 0.2, 0.2), 150); // E5
            setTimeout(() => playTone(783.99, 0.2, 0.2), 300); // G5
            setTimeout(() => playTone(1046.50, 0.3, 0.2), 450); // C6
            break;
        case 'lose':
            playTone(300, 0.4, 0.2, 'sawtooth');
            setTimeout(() => playTone(200, 0.5, 0.2, 'sawtooth'), 200);
            break;
    }
};