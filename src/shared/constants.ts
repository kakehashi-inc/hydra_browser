import os from 'os';
import path from 'path';
import type { ResolutionPreset, PartitionId } from './types';

// Application directory name
export const APP_DIR_NAME = 'Hydra';

// Get home directory
export function getHomeDir(): string {
    return os.homedir();
}

// Get app data directory based on OS
export function getAppDataDir(): string {
    const platform = process.platform;

    if (platform === 'win32') {
        // Windows: %APPDATA%\Hydra\
        const appData = process.env.APPDATA || path.join(getHomeDir(), 'AppData', 'Roaming');
        return path.join(appData, APP_DIR_NAME);
    } else if (platform === 'darwin') {
        // macOS: ~/Library/Application Support/Hydra/
        return path.join(getHomeDir(), 'Library', 'Application Support', APP_DIR_NAME);
    } else {
        // Linux: $XDG_CONFIG_HOME/Hydra/ or ~/.config/Hydra/
        const configHome = process.env.XDG_CONFIG_HOME || path.join(getHomeDir(), '.config');
        return path.join(configHome, APP_DIR_NAME);
    }
}

// Get default download directory
export function getDefaultDownloadDir(): string {
    return path.join(getHomeDir(), 'Downloads');
}

// Data file names
export const DATA_FILES = {
    WORKSPACES: 'workspaces.json',
    WINDOW_STATE: 'window-state.json',
    SETTINGS: 'settings.json',
} as const;

// Get data file path
export function getDataFilePath(filename: string): string {
    return path.join(getAppDataDir(), filename);
}

// Partition identifiers (A-Z)
export const PARTITION_IDS: PartitionId[] = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
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

// Default values
export const DEFAULTS = {
    SCALE: 100,
    PARTITION: 'A' as PartitionId,
    RESOLUTION: { width: 1366, height: 768, presetName: 'Laptop' },
    URL: 'about:blank',
    WORKSPACE_NAME: 'Workspace 1',
} as const;

// Window defaults
export const WINDOW_DEFAULTS = {
    WIDTH: 1400,
    HEIGHT: 900,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
} as const;

// Pane constraints
export const PANE_CONSTRAINTS = {
    MIN_SCALE: 10,
    MAX_SCALE: 200,
} as const;

// IPC channel definitions
export const IPC_CHANNELS = {
    // App
    APP_GET_INFO: 'app:getInfo',
    APP_SET_THEME: 'app:setTheme',
    APP_SET_LANGUAGE: 'app:setLanguage',
    // Window
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE_OR_RESTORE: 'window:maximizeOrRestore',
    WINDOW_CLOSE: 'window:close',
    WINDOW_IS_MAXIMIZED: 'window:isMaximized',
    // Console bridge
    MAIN_CONSOLE: 'main:console',
    // Pane management
    PANE_CREATE: 'pane:create',
    PANE_CLOSE: 'pane:close',
    PANE_UPDATE: 'pane:update',
    PANE_NAVIGATE: 'pane:navigate',
    PANE_GO_BACK: 'pane:goBack',
    PANE_GO_FORWARD: 'pane:goForward',
    PANE_RELOAD: 'pane:reload',
    PANE_TOGGLE_DEVTOOLS: 'pane:toggleDevTools',
    PANE_GET_ALL: 'pane:getAll',
    PANE_SET_FOCUS: 'pane:setFocus',
    // Pane events (main -> renderer)
    PANE_STATE_UPDATED: 'pane:stateUpdated',
    PANE_FOCUS_CHANGED: 'pane:focusChanged',
    PANE_CREATED: 'pane:created',
    PANE_CLOSED: 'pane:closed',
    // Workspace management
    WORKSPACE_CREATE: 'workspace:create',
    WORKSPACE_DELETE: 'workspace:delete',
    WORKSPACE_RENAME: 'workspace:rename',
    WORKSPACE_SWITCH: 'workspace:switch',
    WORKSPACE_GET_ALL: 'workspace:getAll',
    WORKSPACE_GET_ACTIVE: 'workspace:getActive',
    // Download management
    DOWNLOAD_GET_ALL: 'download:getAll',
    DOWNLOAD_CANCEL: 'download:cancel',
    DOWNLOAD_OPEN_FILE: 'download:openFile',
    DOWNLOAD_OPEN_FOLDER: 'download:openFolder',
    DOWNLOAD_CLEAR: 'download:clear',
    // Download events (main -> renderer)
    DOWNLOAD_STARTED: 'download:started',
    DOWNLOAD_PROGRESS: 'download:progress',
    DOWNLOAD_COMPLETED: 'download:completed',
    DOWNLOAD_FAILED: 'download:failed',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_SELECT_DOWNLOAD_PATH: 'settings:selectDownloadPath',
    SETTINGS_CLEAR_AUTOFILL: 'settings:clearAutofill',
} as const;

// Session partition prefix
export const SESSION_PARTITION_PREFIX = 'persist:partition-';

// Get session partition name
export function getSessionPartitionName(partition: PartitionId): string {
    return `${SESSION_PARTITION_PREFIX}${partition}`;
}
