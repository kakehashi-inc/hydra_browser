import { create } from 'zustand';
import type {
    AppInfo,
    PaneState,
    WorkspaceConfig,
    DownloadItem,
    AppSettings,
} from '@shared/types';

interface AppState {
    // App info
    appInfo: AppInfo | null;
    setAppInfo: (info: AppInfo) => void;

    // Panes
    panes: PaneState[];
    focusedPaneId: string | null;
    setPanes: (panes: PaneState[]) => void;
    updatePane: (pane: PaneState) => void;
    addPane: (pane: PaneState) => void;
    removePane: (paneId: string) => void;
    setFocusedPaneId: (paneId: string | null) => void;

    // Workspaces
    workspaces: WorkspaceConfig[];
    activeWorkspace: WorkspaceConfig | null;
    setWorkspaces: (workspaces: WorkspaceConfig[]) => void;
    setActiveWorkspace: (workspace: WorkspaceConfig | null) => void;

    // Downloads
    downloads: DownloadItem[];
    setDownloads: (downloads: DownloadItem[]) => void;
    updateDownload: (download: DownloadItem) => void;
    addDownload: (download: DownloadItem) => void;

    // Settings
    settings: AppSettings | null;
    setSettings: (settings: AppSettings) => void;

    // UI state
    showAddPaneDialog: boolean;
    setShowAddPaneDialog: (show: boolean) => void;
    showSettingsDialog: boolean;
    setShowSettingsDialog: (show: boolean) => void;
    showDownloadPanel: boolean;
    setShowDownloadPanel: (show: boolean) => void;

    // URL bar
    urlBarValue: string;
    setUrlBarValue: (url: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // App info
    appInfo: null,
    setAppInfo: (info) => set({ appInfo: info }),

    // Panes
    panes: [],
    focusedPaneId: null,
    setPanes: (panes) => set({ panes }),
    updatePane: (pane) =>
        set((state) => ({
            panes: state.panes.map((p) => (p.id === pane.id ? pane : p)),
        })),
    addPane: (pane) =>
        set((state) => ({
            panes: [...state.panes, pane],
        })),
    removePane: (paneId) =>
        set((state) => ({
            panes: state.panes.filter((p) => p.id !== paneId),
        })),
    setFocusedPaneId: (paneId) =>
        set((state) => {
            const pane = state.panes.find((p) => p.id === paneId);
            return {
                focusedPaneId: paneId,
                urlBarValue: pane?.url || '',
            };
        }),

    // Workspaces
    workspaces: [],
    activeWorkspace: null,
    setWorkspaces: (workspaces) => set({ workspaces }),
    setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

    // Downloads
    downloads: [],
    setDownloads: (downloads) => set({ downloads }),
    updateDownload: (download) =>
        set((state) => ({
            downloads: state.downloads.map((d) =>
                d.id === download.id ? download : d
            ),
        })),
    addDownload: (download) =>
        set((state) => ({
            downloads: [download, ...state.downloads],
        })),

    // Settings
    settings: null,
    setSettings: (settings) => set({ settings }),

    // UI state
    showAddPaneDialog: false,
    setShowAddPaneDialog: (show) => set({ showAddPaneDialog: show }),
    showSettingsDialog: false,
    setShowSettingsDialog: (show) => set({ showSettingsDialog: show }),
    showDownloadPanel: false,
    setShowDownloadPanel: (show) => set({ showDownloadPanel: show }),

    // URL bar
    urlBarValue: '',
    setUrlBarValue: (url) => set({ urlBarValue: url }),
}));
