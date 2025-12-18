import { shell, BrowserWindow, Session, DownloadItem as ElectronDownloadItem } from 'electron';
import path from 'path';
import fs from 'fs';
import { generateId } from './storage-service';
import { IPC_CHANNELS } from '../../shared/constants';
import type { DownloadItem } from '../../shared/types';

// Download service class
class DownloadService {
    private downloads: Map<string, DownloadItem> = new Map();
    private electronItems: Map<string, ElectronDownloadItem> = new Map();
    private mainWindow: BrowserWindow | null = null;
    private downloadPath: string = '';

    // Set main window reference
    setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }

    // Set download path
    setDownloadPath(downloadPath: string): void {
        this.downloadPath = downloadPath;
    }

    // Get download path
    getDownloadPath(): string {
        return this.downloadPath;
    }

    // Setup download handler for a session
    setupSession(session: Session): void {
        session.on('will-download', (_event, item, webContents) => {
            this.handleDownload(item, webContents?.id?.toString());
        });
    }

    // Handle download
    private handleDownload(item: ElectronDownloadItem, paneId?: string): void {
        const id = generateId();
        const filename = item.getFilename();
        const savePath = this.getUniqueSavePath(filename);

        item.setSavePath(savePath);

        const downloadItem: DownloadItem = {
            id,
            filename,
            savePath,
            url: item.getURL(),
            totalBytes: item.getTotalBytes(),
            receivedBytes: 0,
            state: 'progressing',
            startTime: Date.now(),
            paneId,
        };

        this.downloads.set(id, downloadItem);
        this.electronItems.set(id, item);

        // Notify renderer
        this.notifyDownloadStarted(downloadItem);

        // Progress updates
        item.on('updated', (_event, state) => {
            const download = this.downloads.get(id);
            if (!download) return;

            download.receivedBytes = item.getReceivedBytes();
            download.totalBytes = item.getTotalBytes();

            if (state === 'interrupted') {
                download.state = 'interrupted';
                this.notifyDownloadFailed(download);
            } else {
                this.notifyDownloadProgress(download);
            }
        });

        // Completion
        item.once('done', (_event, state) => {
            const download = this.downloads.get(id);
            if (!download) return;

            this.electronItems.delete(id);

            if (state === 'completed') {
                download.state = 'completed';
                download.receivedBytes = download.totalBytes;
                this.notifyDownloadCompleted(download);
            } else if (state === 'cancelled') {
                download.state = 'cancelled';
                this.notifyDownloadFailed(download);
            } else {
                download.state = 'interrupted';
                this.notifyDownloadFailed(download);
            }
        });
    }

    // Get unique save path (auto-rename if exists)
    private getUniqueSavePath(filename: string): string {
        let savePath = path.join(this.downloadPath, filename);

        if (!fs.existsSync(savePath)) {
            return savePath;
        }

        const ext = path.extname(filename);
        const name = path.basename(filename, ext);
        let counter = 1;

        while (fs.existsSync(savePath)) {
            savePath = path.join(this.downloadPath, `${name}(${counter})${ext}`);
            counter++;
        }

        return savePath;
    }

    // Get all downloads
    getAll(): DownloadItem[] {
        return Array.from(this.downloads.values()).sort((a, b) => b.startTime - a.startTime);
    }

    // Cancel download
    cancel(downloadId: string): boolean {
        const item = this.electronItems.get(downloadId);
        if (item) {
            item.cancel();
            return true;
        }
        return false;
    }

    // Open downloaded file
    openFile(downloadId: string): boolean {
        const download = this.downloads.get(downloadId);
        if (!download || download.state !== 'completed') return false;

        shell.openPath(download.savePath);
        return true;
    }

    // Open containing folder
    openFolder(downloadId: string): boolean {
        const download = this.downloads.get(downloadId);
        if (!download) return false;

        shell.showItemInFolder(download.savePath);
        return true;
    }

    // Clear completed/failed downloads from list
    clear(): void {
        const toRemove: string[] = [];
        for (const [id, download] of this.downloads) {
            if (download.state !== 'progressing') {
                toRemove.push(id);
            }
        }
        for (const id of toRemove) {
            this.downloads.delete(id);
        }
    }

    // Check if there are active downloads
    hasActiveDownloads(): boolean {
        for (const download of this.downloads.values()) {
            if (download.state === 'progressing') {
                return true;
            }
        }
        return false;
    }

    // Check if there are unchecked completed downloads
    hasUnseenCompletedDownloads(): boolean {
        for (const download of this.downloads.values()) {
            if (download.state === 'completed') {
                return true;
            }
        }
        return false;
    }

    // Notification helpers
    private notifyDownloadStarted(download: DownloadItem): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_STARTED, download);
        }
    }

    private notifyDownloadProgress(download: DownloadItem): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS, download);
        }
    }

    private notifyDownloadCompleted(download: DownloadItem): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_COMPLETED, download);
        }
    }

    private notifyDownloadFailed(download: DownloadItem): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_FAILED, download);
        }
    }
}

// Singleton instance
export const downloadService = new DownloadService();
