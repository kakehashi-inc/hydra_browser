import fs from 'fs';
import path from 'path';
import { getAppDataDir, getDefaultDownloadDir, DATA_FILES, DEFAULTS } from '../../shared/constants';
import type { WorkspaceConfig, WindowState, AppSettings } from '../../shared/types';

// Ensure directory exists
function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Generic JSON file read
function readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content) as T;
        }
    } catch (error) {
        console.error(`Failed to read ${filePath}:`, error);
    }
    return defaultValue;
}

// Generic JSON file write
function writeJsonFile<T>(filePath: string, data: T): void {
    try {
        ensureDir(path.dirname(filePath));
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Failed to write ${filePath}:`, error);
    }
}

// Workspaces data structure
interface WorkspacesData {
    workspaces: WorkspaceConfig[];
    activeWorkspaceId: string;
}

// Default workspace
function createDefaultWorkspace(): WorkspaceConfig {
    return {
        id: generateId(),
        name: DEFAULTS.WORKSPACE_NAME,
        panes: [],
    };
}

// Generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Storage service class
class StorageService {
    private appDataDir: string;
    private workspacesPath: string;
    private windowStatePath: string;
    private settingsPath: string;

    constructor() {
        this.appDataDir = getAppDataDir();
        this.workspacesPath = path.join(this.appDataDir, DATA_FILES.WORKSPACES);
        this.windowStatePath = path.join(this.appDataDir, DATA_FILES.WINDOW_STATE);
        this.settingsPath = path.join(this.appDataDir, DATA_FILES.SETTINGS);
    }

    // Initialize storage directory
    initialize(): void {
        ensureDir(this.appDataDir);
    }

    // Workspaces
    loadWorkspaces(): WorkspacesData {
        const defaultWorkspace = createDefaultWorkspace();
        const defaultData: WorkspacesData = {
            workspaces: [defaultWorkspace],
            activeWorkspaceId: defaultWorkspace.id,
        };

        const data = readJsonFile<WorkspacesData>(this.workspacesPath, defaultData);

        // Ensure at least one workspace exists
        if (data.workspaces.length === 0) {
            const newWorkspace = createDefaultWorkspace();
            data.workspaces.push(newWorkspace);
            data.activeWorkspaceId = newWorkspace.id;
        }

        // Ensure active workspace exists
        if (!data.workspaces.find(w => w.id === data.activeWorkspaceId)) {
            data.activeWorkspaceId = data.workspaces[0].id;
        }

        return data;
    }

    saveWorkspaces(data: WorkspacesData): void {
        writeJsonFile(this.workspacesPath, data);
    }

    // Window state
    loadWindowState(): WindowState | null {
        return readJsonFile<WindowState | null>(this.windowStatePath, null);
    }

    saveWindowState(state: WindowState): void {
        writeJsonFile(this.windowStatePath, state);
    }

    // Settings
    loadSettings(): AppSettings {
        const defaultSettings: AppSettings = {
            downloadPath: getDefaultDownloadDir(),
            activeWorkspaceId: '',
            theme: 'system',
            language: 'en',
        };

        return readJsonFile<AppSettings>(this.settingsPath, defaultSettings);
    }

    saveSettings(settings: AppSettings): void {
        writeJsonFile(this.settingsPath, settings);
    }

    // Get autofill data directory
    getAutofillDir(): string {
        return path.join(this.appDataDir, 'autofill');
    }

    // Clear autofill data
    clearAutofillData(): void {
        const autofillDir = this.getAutofillDir();
        if (fs.existsSync(autofillDir)) {
            fs.rmSync(autofillDir, { recursive: true, force: true });
        }
    }
}

// Singleton instance
export const storageService = new StorageService();
