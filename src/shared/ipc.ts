import type {
    AppInfo,
    AppLanguage,
    AppTheme,
    AppSettings,
    PaneState,
    CreatePaneOptions,
    UpdatePaneOptions,
    WorkspaceConfig,
    DownloadItem,
} from './types';

// IPC API type definitions
export type IpcApi = {
    // App info/settings
    getAppInfo(): Promise<AppInfo>;
    setTheme(theme: AppTheme): Promise<{ theme: AppTheme }>;
    setLanguage(language: AppLanguage): Promise<{ language: AppLanguage }>;

    // Window control
    minimize(): Promise<void>;
    maximizeOrRestore(): Promise<boolean>;
    isMaximized(): Promise<boolean>;
    close(): Promise<void>;

    // Pane management
    createPane(options?: CreatePaneOptions): Promise<PaneState | null>;
    closePane(paneId: string): Promise<boolean>;
    updatePane(paneId: string, options: UpdatePaneOptions): Promise<PaneState | null>;
    navigatePane(paneId: string, url: string): Promise<boolean>;
    goBack(paneId: string): Promise<boolean>;
    goForward(paneId: string): Promise<boolean>;
    reload(paneId: string): Promise<boolean>;
    toggleDevTools(paneId: string): Promise<boolean>;
    getAllPanes(): Promise<PaneState[]>;
    setFocus(paneId: string): Promise<boolean>;

    // Pane event listeners
    onPaneStateUpdated(callback: (state: PaneState) => void): () => void;
    onPaneFocusChanged(callback: (paneId: string | null) => void): () => void;
    onPaneCreated(callback: (state: PaneState) => void): () => void;
    onPaneClosed(callback: (paneId: string) => void): () => void;

    // Workspace management
    createWorkspace(name: string): Promise<WorkspaceConfig>;
    deleteWorkspace(workspaceId: string): Promise<boolean>;
    renameWorkspace(workspaceId: string, newName: string): Promise<boolean>;
    switchWorkspace(workspaceId: string): Promise<boolean>;
    getAllWorkspaces(): Promise<WorkspaceConfig[]>;
    getActiveWorkspace(): Promise<WorkspaceConfig | null>;

    // Download management
    getAllDownloads(): Promise<DownloadItem[]>;
    cancelDownload(downloadId: string): Promise<boolean>;
    openDownloadedFile(downloadId: string): Promise<boolean>;
    openDownloadFolder(downloadId: string): Promise<boolean>;
    clearDownloads(): Promise<boolean>;

    // Download event listeners
    onDownloadStarted(callback: (download: DownloadItem) => void): () => void;
    onDownloadProgress(callback: (download: DownloadItem) => void): () => void;
    onDownloadCompleted(callback: (download: DownloadItem) => void): () => void;
    onDownloadFailed(callback: (download: DownloadItem) => void): () => void;

    // Settings
    getSettings(): Promise<AppSettings>;
    setSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
    selectDownloadPath(): Promise<string | null>;
    clearAutofill(): Promise<boolean>;
};

declare global {
    interface Window {
        hydra: IpcApi;
    }
}
