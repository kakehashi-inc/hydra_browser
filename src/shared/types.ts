// Platform identifier
export type PlatformId = 'win32' | 'darwin' | 'linux';

// App theme setting
export type AppTheme = 'light' | 'dark' | 'system';

// App language setting
export type AppLanguage = 'ja' | 'en';

// App info
export type AppInfo = {
    name: string;
    version: string;
    language: AppLanguage;
    theme: AppTheme;
    os: PlatformId;
};

// Partition identifier (A-Z)
export type PartitionId =
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'S'
    | 'T'
    | 'U'
    | 'V'
    | 'W'
    | 'X'
    | 'Y'
    | 'Z';

// Console state for title bar color
export type ConsoleState = 'normal' | 'warning' | 'error';

// Resolution preset category
export type ResolutionCategory = 'Mobile' | 'Tablet' | 'Desktop' | 'Custom';

// Resolution preset
export type ResolutionPreset = {
    category: ResolutionCategory;
    deviceName: string;
    width: number;
    height: number;
};

// Pane resolution (custom or preset)
export type PaneResolution = {
    width: number;
    height: number;
    presetName?: string;
};

// Pane configuration
export type PaneConfig = {
    id: string;
    url: string;
    resolution: PaneResolution;
    scale: number; // Display scale in percent (e.g., 100 = 100%)
    partition: PartitionId;
};

// Pane state (runtime state)
export type PaneState = PaneConfig & {
    title: string;
    consoleState: ConsoleState;
    isLoading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
};

// Workspace configuration
export type WorkspaceConfig = {
    id: string;
    name: string;
    panes: PaneConfig[];
};

// Window state for persistence
export type WindowState = {
    x?: number;
    y?: number;
    width: number;
    height: number;
    isMaximized: boolean;
};

// App settings
export type AppSettings = {
    downloadPath: string;
    activeWorkspaceId: string;
    theme: AppTheme;
    language: AppLanguage;
};

// Download item state
export type DownloadState = 'progressing' | 'completed' | 'cancelled' | 'interrupted';

// Download item
export type DownloadItem = {
    id: string;
    filename: string;
    savePath: string;
    url: string;
    totalBytes: number;
    receivedBytes: number;
    state: DownloadState;
    startTime: number;
    paneId?: string;
};

// Pane creation options
export type CreatePaneOptions = {
    url?: string;
    resolution?: PaneResolution;
    scale?: number;
    partition?: PartitionId;
    insertAfterPaneId?: string;
};

// Pane update options
export type UpdatePaneOptions = {
    resolution?: PaneResolution;
    scale?: number;
    partition?: PartitionId;
};
