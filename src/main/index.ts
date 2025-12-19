import path from 'path';
import { app, BrowserWindow, nativeTheme, ipcMain, BaseWindow, WebContentsView } from 'electron';
import { setupConsoleBridge, setMainWindow } from './utils/console-bridge';
import { registerIpcHandlers } from './ipc/index';
import {
    storageService,
    sessionService,
    paneService,
    workspaceService,
    downloadService,
} from './services';
import { IPC_CHANNELS, WINDOW_DEFAULTS, PARTITION_IDS, getDefaultDownloadDir } from '../shared/constants';
import type { WindowState } from '../shared/types';

let mainWindow: BaseWindow | null = null;
let toolbarView: WebContentsView | null = null;

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// Toolbar height
const TOOLBAR_HEIGHT = 96;

function createWindow() {
    // Initialize storage
    storageService.initialize();

    // Load window state
    const savedWindowState = storageService.loadWindowState();

    // Create base window (frameless)
    mainWindow = new BaseWindow({
        width: savedWindowState?.width ?? WINDOW_DEFAULTS.WIDTH,
        height: savedWindowState?.height ?? WINDOW_DEFAULTS.HEIGHT,
        x: savedWindowState?.x,
        y: savedWindowState?.y,
        minWidth: WINDOW_DEFAULTS.MIN_WIDTH,
        minHeight: WINDOW_DEFAULTS.MIN_HEIGHT,
        show: false,
    });

    // Restore maximized state
    if (savedWindowState?.isMaximized) {
        mainWindow.maximize();
    }

    // Create toolbar view
    const preloadPath = path.join(__dirname, '../preload/index.js');
    toolbarView = new WebContentsView({
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.contentView.addChildView(toolbarView);

    // Set preload path for pane service
    paneService.setPreloadPath(preloadPath);
    paneService.setMainWindow(mainWindow as any);

    // Load settings
    const settings = storageService.loadSettings();
    downloadService.setDownloadPath(settings.downloadPath || getDefaultDownloadDir());
    downloadService.setMainWindow(mainWindow as any);

    // Setup download handlers for all partitions
    for (const partition of PARTITION_IDS) {
        const session = sessionService.getSession(partition);
        downloadService.setupSession(session);
    }

    // Initialize workspace service
    workspaceService.initialize();

    // Set toolbar bounds
    const updateToolbarBounds = () => {
        if (!mainWindow || !toolbarView) return;
        const bounds = mainWindow.getContentBounds();
        toolbarView.setBounds({
            x: 0,
            y: 0,
            width: bounds.width,
            height: TOOLBAR_HEIGHT,
        });
    };

    updateToolbarBounds();
    mainWindow.on('resize', updateToolbarBounds);

    // Load toolbar
    if (isDev) {
        toolbarView.webContents.loadURL('http://localhost:3001');
        // Open DevTools for toolbar in development
        try {
            toolbarView.webContents.openDevTools({ mode: 'detach' });
        } catch {
            // Ignore DevTools open errors
        }
        // Keyboard shortcut for DevTools toggle
        toolbarView.webContents.on('before-input-event', (event, input) => {
            const isToggleCombo =
                (input.key?.toLowerCase?.() === 'i' && (input.control || input.meta) && input.shift) ||
                input.key === 'F12';
            if (isToggleCombo) {
                event.preventDefault();
                toolbarView?.webContents.toggleDevTools();
            }
        });
    } else {
        toolbarView.webContents.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Console bridge
    setMainWindow(mainWindow as any);

    // Show window after toolbar is ready
    toolbarView.webContents.once('did-finish-load', () => {
        mainWindow?.show();
        // Load active workspace panes
        const activeWorkspace = workspaceService.getActive();
        if (activeWorkspace) {
            paneService.loadPanes(activeWorkspace.panes);
        }
    });

    // Save window state on close
    mainWindow.on('close', () => {
        if (!mainWindow) return;

        // If minimized, restore first to get the actual state
        const isMinimized = mainWindow.isMinimized();
        if (isMinimized) {
            mainWindow.restore();
        }

        const isMaximized = mainWindow.isMaximized();
        let windowState: WindowState;

        if (isMaximized) {
            // For maximized, just save the flag
            const lastBounds = storageService.loadWindowState();
            windowState = {
                width: lastBounds?.width ?? WINDOW_DEFAULTS.WIDTH,
                height: lastBounds?.height ?? WINDOW_DEFAULTS.HEIGHT,
                x: lastBounds?.x,
                y: lastBounds?.y,
                isMaximized: true,
            };
        } else {
            const bounds = mainWindow.getBounds();
            windowState = {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                isMaximized: false,
            };
        }

        storageService.saveWindowState(windowState);
        workspaceService.save();
    });

    mainWindow.on('closed', () => {
        setMainWindow(null);
        mainWindow = null;
        toolbarView = null;
    });
}

app.whenReady().then(async () => {
    // Setup console bridge
    setupConsoleBridge();

    // Register IPC handlers
    registerIpcHandlers();

    // App info and window control IPC
    ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require('../../package.json');
        const settings = storageService.loadSettings();
        return {
            name: app.getName() || pkg.name || 'Hydra Browser',
            version: pkg.version || app.getVersion(),
            language: settings.language || (app.getLocale().startsWith('ja') ? 'ja' : 'en'),
            theme: settings.theme || (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'),
            os: process.platform as 'win32' | 'darwin' | 'linux',
        };
    });

    ipcMain.handle(IPC_CHANNELS.APP_SET_THEME, (_e, theme: 'light' | 'dark' | 'system') => {
        nativeTheme.themeSource = theme;
        const settings = storageService.loadSettings();
        settings.theme = theme;
        storageService.saveSettings(settings);
        return { theme };
    });

    ipcMain.handle(IPC_CHANNELS.APP_SET_LANGUAGE, (_e, lang: 'ja' | 'en') => {
        const settings = storageService.loadSettings();
        settings.language = lang;
        storageService.saveSettings(settings);
        return { language: lang };
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
        mainWindow?.minimize();
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE_OR_RESTORE, () => {
        if (!mainWindow) return false;
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
            return false;
        }
        mainWindow.maximize();
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => mainWindow?.isMaximized() ?? false);

    ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
        mainWindow?.close();
    });

    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
