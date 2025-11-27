/**
 * App-wide constants
 */

export const APP_NAME = 'Sistem Antrian Angkutan';
export const APP_VERSION = '2.0.0';

// Queue Settings
export const QUEUE_SETTINGS = {
    AUTO_RESET_TIME: 5000, // 5 seconds to show queue number
    MAX_QUEUE_PER_DAY: 999,
    CALL_TIMEOUT: 300000, // 5 minutes before auto-skip
} as const;

// Audio Settings
export const AUDIO_SETTINGS = {
    VOLUME_DEFAULT: 0.8,
    LANGUAGE: 'id-ID',
    RATE: 0.9,
    PITCH: 1.0,
} as const;

// API Settings
export const API_SETTINGS = {
    RATE_LIMIT_PER_MINUTE: 100,
    RATE_LIMIT_PER_SECOND: 10,
    REQUEST_TIMEOUT: 30000,
} as const;

// Socket.io Settings
export const SOCKET_SETTINGS = {
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    HEARTBEAT_INTERVAL: 25000,
    TIMEOUT: 20000,
} as const;

// Service Types
export const SERVICE_TYPES = {
    UMUM: {
        label: 'Angkutan Umum',
        prefix: 'U',
        color: 'gray',
        icon: 'Bus',
    },
    BARANG: {
        label: 'Angkutan Barang',
        prefix: 'B',
        color: 'gray',
        icon: 'Package',
    },
} as const;

// Queue Status
export const QUEUE_STATUS = {
    WAITING: {
        label: 'Menunggu',
        color: 'gray',
    },
    CALLED: {
        label: 'Dipanggil',
        color: 'gray',
    },
    COMPLETED: {
        label: 'Selesai',
        color: 'gray',
    },
    SKIPPED: {
        label: 'Dibatalkan',
        color: 'gray',
    },
} as const;

// Loket Status
export const LOKET_STATUS = {
    OPEN: {
        label: 'Buka',
        color: 'gray',
    },
    CLOSED: {
        label: 'Tutup',
        color: 'gray',
    },
    BREAK: {
        label: 'Istirahat',
        color: 'gray',
    },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    THEME: 'antrian-theme',
    SOUND_ENABLED: 'antrian-sound',
    LAST_LOGIN: 'antrian-last-login',
} as const;

// Routes
export const ROUTES = {
    HOME: '/',
    KIOSK: '/kiosk',
    DISPLAY: '/display',
    LOKET: '/loket',
    ADMIN: '/admin',
    LOGIN: '/login',
} as const;
