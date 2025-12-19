import type { ResolutionPreset, PartitionId, ResolutionCategory } from '@shared/types';

// Partition identifiers (A-Z)
export const PARTITION_IDS: PartitionId[] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// Resolution presets
export const RESOLUTION_PRESETS: ResolutionPreset[] = [
    // Mobile
    { category: 'Mobile', deviceName: 'iPhone SE', width: 375, height: 667 },
    { category: 'Mobile', deviceName: 'iPhone 14', width: 390, height: 844 },
    { category: 'Mobile', deviceName: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { category: 'Mobile', deviceName: 'Pixel 7', width: 412, height: 915 },
    { category: 'Mobile', deviceName: 'Galaxy S20', width: 360, height: 800 },
    // Tablet
    { category: 'Tablet', deviceName: 'iPad Mini', width: 768, height: 1024 },
    { category: 'Tablet', deviceName: 'iPad Air', width: 820, height: 1180 },
    { category: 'Tablet', deviceName: 'iPad Pro 12.9', width: 1024, height: 1366 },
    // Desktop
    { category: 'Desktop', deviceName: 'Laptop', width: 1366, height: 768 },
    { category: 'Desktop', deviceName: 'Desktop', width: 1920, height: 1080 },
    { category: 'Desktop', deviceName: 'Desktop Large', width: 2560, height: 1440 },
];

// Group presets by category
export const PRESETS_BY_CATEGORY: Record<ResolutionCategory, ResolutionPreset[]> = {
    Mobile: RESOLUTION_PRESETS.filter(p => p.category === 'Mobile'),
    Tablet: RESOLUTION_PRESETS.filter(p => p.category === 'Tablet'),
    Desktop: RESOLUTION_PRESETS.filter(p => p.category === 'Desktop'),
    Custom: [],
};

// Default values
export const DEFAULTS = {
    SCALE: 100,
    PARTITION: 'A' as PartitionId,
    RESOLUTION: { width: 1366, height: 768, presetName: 'Laptop' },
    URL: 'about:blank',
};

// Scale constraints
export const SCALE_CONSTRAINTS = {
    MIN: 10,
    MAX: 200,
};

// Console state colors
export const CONSOLE_STATE_COLORS = {
    normal: 'transparent',
    warning: '#f59e0b',
    error: '#ef4444',
};
