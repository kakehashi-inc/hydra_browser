import { WebContentsView, BrowserWindow } from 'electron';
import path from 'path';
import { sessionService } from './session-service';
import { generateId } from './storage-service';
import { DEFAULTS, IPC_CHANNELS, PANE_CONSTRAINTS } from '../../shared/constants';
import type {
    PaneConfig,
    PaneState,
    CreatePaneOptions,
    UpdatePaneOptions,
    ConsoleState,
    PartitionId,
} from '../../shared/types';

// Internal pane data
interface PaneData {
    id: string;
    view: WebContentsView;
    config: PaneConfig;
    consoleState: ConsoleState;
}

// Pane service class
class PaneService {
    private panes: Map<string, PaneData> = new Map();
    private paneOrder: string[] = [];
    private focusedPaneId: string | null = null;
    private mainWindow: BrowserWindow | null = null;
    private preloadPath: string = '';

    // Set main window reference
    setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }

    // Set preload script path
    setPreloadPath(preloadPath: string): void {
        this.preloadPath = preloadPath;
    }

    // Create a new pane
    createPane(options: CreatePaneOptions = {}): PaneState | null {
        if (!this.mainWindow) {
            console.error('Main window not set');
            return null;
        }

        const id = generateId();
        const partition = options.partition ?? DEFAULTS.PARTITION;
        const partitionSession = sessionService.getSession(partition);

        const config: PaneConfig = {
            id,
            url: options.url ?? DEFAULTS.URL,
            resolution: options.resolution ?? { ...DEFAULTS.RESOLUTION },
            scale: Math.max(
                PANE_CONSTRAINTS.MIN_SCALE,
                Math.min(PANE_CONSTRAINTS.MAX_SCALE, options.scale ?? DEFAULTS.SCALE)
            ),
            partition,
        };

        // Create WebContentsView with session
        const view = new WebContentsView({
            webPreferences: {
                preload: this.preloadPath ? path.join(this.preloadPath) : undefined,
                session: partitionSession,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });

        // Apply device emulation
        this.applyDeviceEmulation(view, config);

        // Setup event handlers
        this.setupPaneEventHandlers(id, view);

        // Store pane data
        const paneData: PaneData = {
            id,
            view,
            config,
            consoleState: 'normal',
        };
        this.panes.set(id, paneData);

        // Insert at correct position
        if (options.insertAfterPaneId) {
            const insertIndex = this.paneOrder.indexOf(options.insertAfterPaneId);
            if (insertIndex >= 0) {
                this.paneOrder.splice(insertIndex + 1, 0, id);
            } else {
                this.paneOrder.push(id);
            }
        } else {
            this.paneOrder.push(id);
        }

        // Add view to window
        this.mainWindow.contentView.addChildView(view);

        // Load URL
        if (config.url && config.url !== 'about:blank') {
            view.webContents.loadURL(config.url);
        }

        // Set focus to new pane
        this.setFocus(id);

        // Notify renderer
        this.notifyPaneCreated(this.getPaneState(id)!);

        return this.getPaneState(id);
    }

    // Close a pane
    closePane(paneId: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData) return false;

        // Remove from window
        if (this.mainWindow) {
            this.mainWindow.contentView.removeChildView(paneData.view);
        }

        // Destroy webcontents
        paneData.view.webContents.close();

        // Remove from maps
        this.panes.delete(paneId);
        const orderIndex = this.paneOrder.indexOf(paneId);
        if (orderIndex >= 0) {
            this.paneOrder.splice(orderIndex, 1);
        }

        // Update focus if needed
        if (this.focusedPaneId === paneId) {
            // Focus the next pane or previous if no next
            const newFocusIndex = Math.min(orderIndex, this.paneOrder.length - 1);
            if (newFocusIndex >= 0) {
                this.setFocus(this.paneOrder[newFocusIndex]);
            } else {
                this.focusedPaneId = null;
                this.notifyFocusChanged(null);
            }
        }

        // Notify renderer
        this.notifyPaneClosed(paneId);

        return true;
    }

    // Update pane configuration
    updatePane(paneId: string, options: UpdatePaneOptions): PaneState | null {
        const paneData = this.panes.get(paneId);
        if (!paneData) return null;

        let needsRecreate = false;

        // Check if partition changed (requires recreate)
        if (options.partition && options.partition !== paneData.config.partition) {
            needsRecreate = true;
        }

        if (needsRecreate && options.partition) {
            // Need to recreate view with new session
            return this.recreatePaneWithNewPartition(paneId, options.partition, options);
        }

        // Update config
        if (options.resolution) {
            paneData.config.resolution = options.resolution;
        }
        if (options.scale !== undefined) {
            paneData.config.scale = Math.max(
                PANE_CONSTRAINTS.MIN_SCALE,
                Math.min(PANE_CONSTRAINTS.MAX_SCALE, options.scale)
            );
        }

        // Apply updated device emulation
        this.applyDeviceEmulation(paneData.view, paneData.config);

        // Notify renderer
        this.notifyPaneStateUpdated(this.getPaneState(paneId)!);

        return this.getPaneState(paneId);
    }

    // Recreate pane with new partition
    private recreatePaneWithNewPartition(
        paneId: string,
        newPartition: PartitionId,
        options: UpdatePaneOptions
    ): PaneState | null {
        const paneData = this.panes.get(paneId);
        if (!paneData) return null;

        const currentUrl = paneData.view.webContents.getURL() || paneData.config.url;
        const orderIndex = this.paneOrder.indexOf(paneId);

        // Close old pane
        if (this.mainWindow) {
            this.mainWindow.contentView.removeChildView(paneData.view);
        }
        paneData.view.webContents.close();
        this.panes.delete(paneId);
        this.paneOrder.splice(orderIndex, 1);

        // Create new pane with same position
        const newOptions: CreatePaneOptions = {
            url: currentUrl,
            resolution: options.resolution ?? paneData.config.resolution,
            scale: options.scale ?? paneData.config.scale,
            partition: newPartition,
            insertAfterPaneId: orderIndex > 0 ? this.paneOrder[orderIndex - 1] : undefined,
        };

        return this.createPane(newOptions);
    }

    // Navigate pane to URL
    navigatePane(paneId: string, url: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData) return false;

        paneData.config.url = url;
        paneData.view.webContents.loadURL(url);
        return true;
    }

    // Go back
    goBack(paneId: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData || !paneData.view.webContents.canGoBack()) return false;

        paneData.view.webContents.goBack();
        return true;
    }

    // Go forward
    goForward(paneId: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData || !paneData.view.webContents.canGoForward()) return false;

        paneData.view.webContents.goForward();
        return true;
    }

    // Reload
    reload(paneId: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData) return false;

        paneData.view.webContents.reload();
        return true;
    }

    // Toggle DevTools
    toggleDevTools(paneId: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData) return false;

        if (paneData.view.webContents.isDevToolsOpened()) {
            paneData.view.webContents.closeDevTools();
        } else {
            paneData.view.webContents.openDevTools({ mode: 'detach' });
        }
        return true;
    }

    // Set focus to pane
    setFocus(paneId: string): boolean {
        const paneData = this.panes.get(paneId);
        if (!paneData) return false;

        this.focusedPaneId = paneId;
        paneData.view.webContents.focus();
        this.notifyFocusChanged(paneId);
        return true;
    }

    // Get focused pane ID
    getFocusedPaneId(): string | null {
        return this.focusedPaneId;
    }

    // Get all pane states
    getAllPaneStates(): PaneState[] {
        return this.paneOrder.map(id => this.getPaneState(id)!).filter(Boolean);
    }

    // Get pane state
    getPaneState(paneId: string): PaneState | null {
        const paneData = this.panes.get(paneId);
        if (!paneData) return null;

        return {
            ...paneData.config,
            title: paneData.view.webContents.getTitle() || 'New Tab',
            consoleState: paneData.consoleState,
            isLoading: paneData.view.webContents.isLoading(),
            canGoBack: paneData.view.webContents.canGoBack(),
            canGoForward: paneData.view.webContents.canGoForward(),
        };
    }

    // Get pane configs for saving
    getPaneConfigs(): PaneConfig[] {
        return this.paneOrder.map(id => {
            const paneData = this.panes.get(id);
            if (!paneData) return null;
            return {
                ...paneData.config,
                url: paneData.view.webContents.getURL() || paneData.config.url,
            };
        }).filter(Boolean) as PaneConfig[];
    }

    // Load panes from workspace config
    loadPanes(paneConfigs: PaneConfig[]): void {
        // Close all existing panes
        this.closeAllPanes();

        // Create panes from config
        for (const config of paneConfigs) {
            this.createPane({
                url: config.url,
                resolution: config.resolution,
                scale: config.scale,
                partition: config.partition,
            });
        }
    }

    // Close all panes
    closeAllPanes(): void {
        const paneIds = [...this.paneOrder];
        for (const paneId of paneIds) {
            this.closePane(paneId);
        }
    }

    // Get pane view bounds (for layout)
    getPaneViewBounds(paneId: string): { x: number; y: number; width: number; height: number } | null {
        const paneData = this.panes.get(paneId);
        if (!paneData) return null;

        const displayWidth = Math.round((paneData.config.resolution.width * paneData.config.scale) / 100);
        const displayHeight = Math.round((paneData.config.resolution.height * paneData.config.scale) / 100);

        return {
            x: 0,
            y: 0,
            width: displayWidth,
            height: displayHeight,
        };
    }

    // Update pane view bounds
    updatePaneViewBounds(
        paneId: string,
        bounds: { x: number; y: number; width: number; height: number }
    ): void {
        const paneData = this.panes.get(paneId);
        if (!paneData) return;

        paneData.view.setBounds(bounds);
    }

    // Apply device emulation to view
    private applyDeviceEmulation(view: WebContentsView, config: PaneConfig): void {
        const scaleFactor = config.scale / 100;

        view.webContents.enableDeviceEmulation({
            screenPosition: 'mobile',
            screenSize: {
                width: config.resolution.width,
                height: config.resolution.height,
            },
            viewPosition: { x: 0, y: 0 },
            viewSize: {
                width: config.resolution.width,
                height: config.resolution.height,
            },
            deviceScaleFactor: 1,
            scale: scaleFactor,
        });
    }

    // Setup event handlers for pane
    private setupPaneEventHandlers(paneId: string, view: WebContentsView): void {
        const webContents = view.webContents;

        // Page title changed
        webContents.on('page-title-updated', () => {
            const state = this.getPaneState(paneId);
            if (state) {
                this.notifyPaneStateUpdated(state);
            }
        });

        // URL changed
        webContents.on('did-navigate', () => {
            const paneData = this.panes.get(paneId);
            if (paneData) {
                paneData.config.url = webContents.getURL();
                paneData.consoleState = 'normal'; // Reset console state on navigation
                this.notifyPaneStateUpdated(this.getPaneState(paneId)!);
            }
        });

        webContents.on('did-navigate-in-page', () => {
            const paneData = this.panes.get(paneId);
            if (paneData) {
                paneData.config.url = webContents.getURL();
                this.notifyPaneStateUpdated(this.getPaneState(paneId)!);
            }
        });

        // Loading state changed
        webContents.on('did-start-loading', () => {
            const state = this.getPaneState(paneId);
            if (state) {
                this.notifyPaneStateUpdated(state);
            }
        });

        webContents.on('did-stop-loading', () => {
            const state = this.getPaneState(paneId);
            if (state) {
                this.notifyPaneStateUpdated(state);
            }
        });

        // Main frame navigation started - reset console state
        webContents.on('did-start-navigation', (_event, _url, isInPlace, isMainFrame) => {
            if (isMainFrame && !isInPlace) {
                const paneData = this.panes.get(paneId);
                if (paneData) {
                    paneData.consoleState = 'normal';
                    this.notifyPaneStateUpdated(this.getPaneState(paneId)!);
                }
            }
        });

        // Console message - update console state
        webContents.on('console-message', (_event, level) => {
            const paneData = this.panes.get(paneId);
            if (!paneData) return;

            // level: 0=verbose, 1=info, 2=warning, 3=error
            if (level === 3) {
                // Error takes highest priority
                paneData.consoleState = 'error';
                this.notifyPaneStateUpdated(this.getPaneState(paneId)!);
            } else if (level === 2 && paneData.consoleState !== 'error') {
                // Warning only if not already error
                paneData.consoleState = 'warning';
                this.notifyPaneStateUpdated(this.getPaneState(paneId)!);
            }
        });

        // Handle new window requests
        webContents.setWindowOpenHandler(({ url }) => {
            // Create new pane with same properties
            const paneData = this.panes.get(paneId);
            if (paneData) {
                this.createPane({
                    url,
                    resolution: { ...paneData.config.resolution },
                    scale: paneData.config.scale,
                    partition: paneData.config.partition,
                    insertAfterPaneId: paneId,
                });
            }
            return { action: 'deny' };
        });

        // Focus handling
        webContents.on('focus', () => {
            if (this.focusedPaneId !== paneId) {
                this.focusedPaneId = paneId;
                this.notifyFocusChanged(paneId);
            }
        });
    }

    // Notification helpers
    private notifyPaneStateUpdated(state: PaneState): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.PANE_STATE_UPDATED, state);
        }
    }

    private notifyFocusChanged(paneId: string | null): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.PANE_FOCUS_CHANGED, paneId);
        }
    }

    private notifyPaneCreated(state: PaneState): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.PANE_CREATED, state);
        }
    }

    private notifyPaneClosed(paneId: string): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(IPC_CHANNELS.PANE_CLOSED, paneId);
        }
    }
}

// Singleton instance
export const paneService = new PaneService();
