import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '../shared/ipc';

// IPC channel definitions (local copy to avoid runtime import from shared)
const IPC_CHANNELS = {
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
    // Pane events
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
    // Download events
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

// Helper to create event listener that returns unsubscribe function
function createEventListener<T>(channel: string, callback: (data: T) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, data: T) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => {
        ipcRenderer.removeListener(channel, handler);
    };
}

const api: IpcApi = {
    // App info/settings
    async getAppInfo() {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO);
    },
    async setTheme(theme) {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_SET_THEME, theme);
    },
    async setLanguage(language) {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_SET_LANGUAGE, language);
    },

    // Window control
    async minimize() {
        return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE);
    },
    async maximizeOrRestore() {
        return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE_OR_RESTORE);
    },
    async isMaximized() {
        return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED);
    },
    async close() {
        return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE);
    },

    // Pane management
    async createPane(options) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_CREATE, options);
    },
    async closePane(paneId) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_CLOSE, paneId);
    },
    async updatePane(paneId, options) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_UPDATE, paneId, options);
    },
    async navigatePane(paneId, url) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_NAVIGATE, paneId, url);
    },
    async goBack(paneId) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_GO_BACK, paneId);
    },
    async goForward(paneId) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_GO_FORWARD, paneId);
    },
    async reload(paneId) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_RELOAD, paneId);
    },
    async toggleDevTools(paneId) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_TOGGLE_DEVTOOLS, paneId);
    },
    async getAllPanes() {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_GET_ALL);
    },
    async setFocus(paneId) {
        return ipcRenderer.invoke(IPC_CHANNELS.PANE_SET_FOCUS, paneId);
    },

    // Pane event listeners
    onPaneStateUpdated(callback) {
        return createEventListener(IPC_CHANNELS.PANE_STATE_UPDATED, callback);
    },
    onPaneFocusChanged(callback) {
        return createEventListener(IPC_CHANNELS.PANE_FOCUS_CHANGED, callback);
    },
    onPaneCreated(callback) {
        return createEventListener(IPC_CHANNELS.PANE_CREATED, callback);
    },
    onPaneClosed(callback) {
        return createEventListener(IPC_CHANNELS.PANE_CLOSED, callback);
    },

    // Workspace management
    async createWorkspace(name) {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_CREATE, name);
    },
    async deleteWorkspace(workspaceId) {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_DELETE, workspaceId);
    },
    async renameWorkspace(workspaceId, newName) {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_RENAME, workspaceId, newName);
    },
    async switchWorkspace(workspaceId) {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_SWITCH, workspaceId);
    },
    async getAllWorkspaces() {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_GET_ALL);
    },
    async getActiveWorkspace() {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_GET_ACTIVE);
    },

    // Download management
    async getAllDownloads() {
        return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_GET_ALL);
    },
    async cancelDownload(downloadId) {
        return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CANCEL, downloadId);
    },
    async openDownloadedFile(downloadId) {
        return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_OPEN_FILE, downloadId);
    },
    async openDownloadFolder(downloadId) {
        return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_OPEN_FOLDER, downloadId);
    },
    async clearDownloads() {
        return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CLEAR);
    },

    // Download event listeners
    onDownloadStarted(callback) {
        return createEventListener(IPC_CHANNELS.DOWNLOAD_STARTED, callback);
    },
    onDownloadProgress(callback) {
        return createEventListener(IPC_CHANNELS.DOWNLOAD_PROGRESS, callback);
    },
    onDownloadCompleted(callback) {
        return createEventListener(IPC_CHANNELS.DOWNLOAD_COMPLETED, callback);
    },
    onDownloadFailed(callback) {
        return createEventListener(IPC_CHANNELS.DOWNLOAD_FAILED, callback);
    },

    // Settings
    async getSettings() {
        return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET);
    },
    async setSettings(settings) {
        return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings);
    },
    async selectDownloadPath() {
        return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SELECT_DOWNLOAD_PATH);
    },
    async clearAutofill() {
        return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_CLEAR_AUTOFILL);
    },
};

contextBridge.exposeInMainWorld('hydra', api);

// Receive and forward main process console messages to DevTools
ipcRenderer.on(
    IPC_CHANNELS.MAIN_CONSOLE,
    (
        _event,
        data: {
            level: string;
            args: Array<{ type: string; value?: string; message?: string; stack?: string; name?: string }>;
        }
    ) => {
        const { level, args } = data;
        // Deserialize arguments for DevTools output
        const deserializedArgs = args.map(arg => {
            if (arg.type === 'error') {
                const error = new Error(arg.message || 'Unknown error');
                if (arg.stack) error.stack = arg.stack;
                if (arg.name) error.name = arg.name;
                return error;
            } else if (arg.type === 'object') {
                try {
                    return JSON.parse(arg.value || '{}');
                } catch {
                    return arg.value;
                }
            } else {
                return arg.value;
            }
        });

        // Forward to renderer console (appears in DevTools)
        switch (level) {
            case 'log':
                console.log('[Main]', ...deserializedArgs);
                break;
            case 'error':
                console.error('[Main]', ...deserializedArgs);
                break;
            case 'warn':
                console.warn('[Main]', ...deserializedArgs);
                break;
            case 'info':
                console.info('[Main]', ...deserializedArgs);
                break;
            case 'debug':
                console.debug('[Main]', ...deserializedArgs);
                break;
            default:
                console.log('[Main]', ...deserializedArgs);
        }
    }
);
