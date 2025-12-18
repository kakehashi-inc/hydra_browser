import { ipcMain, dialog, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { paneService, workspaceService, downloadService, storageService } from '../services';
import type { CreatePaneOptions, UpdatePaneOptions, AppSettings } from '../../shared/types';

// Register all IPC handlers
export function registerIpcHandlers() {
    // Pane management
    ipcMain.handle(IPC_CHANNELS.PANE_CREATE, (_e, options: CreatePaneOptions) => {
        const pane = paneService.createPane(options);
        // Auto-save workspace
        workspaceService.autoSave();
        return pane;
    });

    ipcMain.handle(IPC_CHANNELS.PANE_CLOSE, (_e, paneId: string) => {
        const result = paneService.closePane(paneId);
        // Auto-save workspace
        workspaceService.autoSave();
        return result;
    });

    ipcMain.handle(IPC_CHANNELS.PANE_UPDATE, (_e, paneId: string, options: UpdatePaneOptions) => {
        const result = paneService.updatePane(paneId, options);
        // Auto-save workspace
        workspaceService.autoSave();
        return result;
    });

    ipcMain.handle(IPC_CHANNELS.PANE_NAVIGATE, (_e, paneId: string, url: string) => {
        const result = paneService.navigatePane(paneId, url);
        // Auto-save workspace
        workspaceService.autoSave();
        return result;
    });

    ipcMain.handle(IPC_CHANNELS.PANE_GO_BACK, (_e, paneId: string) => {
        return paneService.goBack(paneId);
    });

    ipcMain.handle(IPC_CHANNELS.PANE_GO_FORWARD, (_e, paneId: string) => {
        return paneService.goForward(paneId);
    });

    ipcMain.handle(IPC_CHANNELS.PANE_RELOAD, (_e, paneId: string) => {
        return paneService.reload(paneId);
    });

    ipcMain.handle(IPC_CHANNELS.PANE_TOGGLE_DEVTOOLS, (_e, paneId: string) => {
        return paneService.toggleDevTools(paneId);
    });

    ipcMain.handle(IPC_CHANNELS.PANE_GET_ALL, () => {
        return paneService.getAllPaneStates();
    });

    ipcMain.handle(IPC_CHANNELS.PANE_SET_FOCUS, (_e, paneId: string) => {
        return paneService.setFocus(paneId);
    });

    // Workspace management
    ipcMain.handle(IPC_CHANNELS.WORKSPACE_CREATE, (_e, name: string) => {
        return workspaceService.create(name);
    });

    ipcMain.handle(IPC_CHANNELS.WORKSPACE_DELETE, (_e, workspaceId: string) => {
        return workspaceService.delete(workspaceId);
    });

    ipcMain.handle(IPC_CHANNELS.WORKSPACE_RENAME, (_e, workspaceId: string, newName: string) => {
        return workspaceService.rename(workspaceId, newName);
    });

    ipcMain.handle(IPC_CHANNELS.WORKSPACE_SWITCH, (_e, workspaceId: string) => {
        return workspaceService.switchTo(workspaceId);
    });

    ipcMain.handle(IPC_CHANNELS.WORKSPACE_GET_ALL, () => {
        return workspaceService.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.WORKSPACE_GET_ACTIVE, () => {
        return workspaceService.getActive();
    });

    // Download management
    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_ALL, () => {
        return downloadService.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, (_e, downloadId: string) => {
        return downloadService.cancel(downloadId);
    });

    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_OPEN_FILE, (_e, downloadId: string) => {
        return downloadService.openFile(downloadId);
    });

    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_OPEN_FOLDER, (_e, downloadId: string) => {
        return downloadService.openFolder(downloadId);
    });

    ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CLEAR, () => {
        downloadService.clear();
        return true;
    });

    // Settings management
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
        return storageService.loadSettings();
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_e, settings: Partial<AppSettings>) => {
        const current = storageService.loadSettings();
        const updated = { ...current, ...settings };
        storageService.saveSettings(updated);

        // Update download path if changed
        if (settings.downloadPath) {
            downloadService.setDownloadPath(settings.downloadPath);
        }

        return updated;
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_SELECT_DOWNLOAD_PATH, async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Download Folder',
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const newPath = result.filePaths[0];
            const settings = storageService.loadSettings();
            settings.downloadPath = newPath;
            storageService.saveSettings(settings);
            downloadService.setDownloadPath(newPath);
            return newPath;
        }

        return null;
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_CLEAR_AUTOFILL, () => {
        storageService.clearAutofillData();
        // Restart app to apply changes
        app.relaunch();
        app.exit(0);
        return true;
    });
}
