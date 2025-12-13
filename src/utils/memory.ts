/**
 * Aurora OS Memory Management Utilities
 * 
 * Organizes storage into two tiers:
 * - Soft Memory: Preferences and UI state (safe to reset)
 * - Hard Memory: Core data like filesystem (dangerous to reset)
 */

// Storage key prefixes/names
export const STORAGE_KEYS = {
    // Soft memory keys (preferences, safe to forget)
    SETTINGS: 'aurora-os-settings',
    DESKTOP_ICONS: 'aurora-os-desktop-positions',
    SOUND: 'aurora-os-sound-settings',
    APP_PREFIX: 'aurora-os-app-', // Pattern for app-specific storage

    // Hard memory keys (core data, dangerous to forget)
    FILESYSTEM: 'aurora-filesystem',
    USERS: 'aurora-users',
} as const;

/**
 * Soft Reset - Clears all preferences and app states
 * User will need to reconfigure settings, but no data is lost
 */
export function softReset(): void {
    const keysToRemove: string[] = [];

    // Collect all soft memory keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            // Settings, desktop icons, and sound
            if (
                key === STORAGE_KEYS.SETTINGS ||
                key === STORAGE_KEYS.DESKTOP_ICONS ||
                key === STORAGE_KEYS.SOUND
            ) {
                keysToRemove.push(key);
            }
            // App-specific storage
            if (key.startsWith(STORAGE_KEYS.APP_PREFIX)) {
                keysToRemove.push(key);
            }
        }
    }

    // Remove collected keys
    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Failed to remove ${key}:`, e);
        }
    });

    console.log(`Soft reset: Cleared ${keysToRemove.length} preference keys`);
}

/**
 * Hard Reset - Clears everything including the filesystem
 * This is destructive and will wipe all user data
 */
export function hardReset(): void {
    const keysToRemove: string[] = [];

    // Collect all Aurora OS keys (both soft and hard)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            if (
                key === STORAGE_KEYS.SETTINGS ||
                key === STORAGE_KEYS.DESKTOP_ICONS ||
                key === STORAGE_KEYS.SOUND ||
                key === STORAGE_KEYS.FILESYSTEM ||
                key === STORAGE_KEYS.USERS ||
                key.startsWith(STORAGE_KEYS.APP_PREFIX)
            ) {
                keysToRemove.push(key);
            }
        }
    }

    // Remove collected keys
    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Failed to remove ${key}:`, e);
        }
    });

    console.log(`Hard reset: Cleared ${keysToRemove.length} total keys (including filesystem)`);
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
    softMemory: { keys: number; bytes: number };
    hardMemory: { keys: number; bytes: number };
    total: { keys: number; bytes: number };
} {
    let softKeys = 0;
    let softBytes = 0;
    let hardKeys = 0;
    let hardBytes = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const value = localStorage.getItem(key) || '';
            const bytes = new Blob([key + value]).size;

            if (key === STORAGE_KEYS.FILESYSTEM || key === STORAGE_KEYS.USERS) {
                hardKeys++;
                hardBytes += bytes;
            } else if (
                key === STORAGE_KEYS.SETTINGS ||
                key === STORAGE_KEYS.DESKTOP_ICONS ||
                key === STORAGE_KEYS.SOUND ||
                key.startsWith(STORAGE_KEYS.APP_PREFIX)
            ) {
                softKeys++;
                softBytes += bytes;
            }
        }
    }

    return {
        softMemory: { keys: softKeys, bytes: softBytes },
        hardMemory: { keys: hardKeys, bytes: hardBytes },
        total: { keys: softKeys + hardKeys, bytes: softBytes + hardBytes },
    };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
