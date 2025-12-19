import { storageService, generateId } from './storage-service';
import { paneService } from './pane-service';
import { DEFAULTS } from '../../shared/constants';
import type { WorkspaceConfig, PaneConfig } from '../../shared/types';

// Workspace service class
class WorkspaceService {
    private workspaces: WorkspaceConfig[] = [];
    private activeWorkspaceId: string = '';

    // Initialize from storage
    initialize(): void {
        const data = storageService.loadWorkspaces();
        this.workspaces = data.workspaces;
        this.activeWorkspaceId = data.activeWorkspaceId;
    }

    // Save to storage
    save(): void {
        // Update active workspace panes before saving
        this.saveActiveWorkspacePanes();

        storageService.saveWorkspaces({
            workspaces: this.workspaces,
            activeWorkspaceId: this.activeWorkspaceId,
        });
    }

    // Save current panes to active workspace
    private saveActiveWorkspacePanes(): void {
        const activeWorkspace = this.workspaces.find(w => w.id === this.activeWorkspaceId);
        if (activeWorkspace) {
            activeWorkspace.panes = paneService.getPaneConfigs();
        }
    }

    // Get all workspaces
    getAll(): WorkspaceConfig[] {
        return this.workspaces;
    }

    // Get active workspace
    getActive(): WorkspaceConfig | null {
        return this.workspaces.find(w => w.id === this.activeWorkspaceId) ?? null;
    }

    // Get active workspace ID
    getActiveId(): string {
        return this.activeWorkspaceId;
    }

    // Create new workspace
    create(name: string): WorkspaceConfig {
        // Save current workspace state first
        this.saveActiveWorkspacePanes();

        const workspace: WorkspaceConfig = {
            id: generateId(),
            name: name || `Workspace ${this.workspaces.length + 1}`,
            panes: [],
        };

        this.workspaces.push(workspace);
        this.switchTo(workspace.id);

        return workspace;
    }

    // Delete workspace
    delete(workspaceId: string): boolean {
        const index = this.workspaces.findIndex(w => w.id === workspaceId);
        if (index < 0) return false;

        this.workspaces.splice(index, 1);

        // If deleted workspace was active, switch to another
        if (this.activeWorkspaceId === workspaceId) {
            if (this.workspaces.length === 0) {
                // Create default workspace if none left
                const newWorkspace = this.create(DEFAULTS.WORKSPACE_NAME);
                this.activeWorkspaceId = newWorkspace.id;
            } else {
                // Switch to first available workspace
                this.switchTo(this.workspaces[0].id);
            }
        }

        this.save();
        return true;
    }

    // Rename workspace
    rename(workspaceId: string, newName: string): boolean {
        const workspace = this.workspaces.find(w => w.id === workspaceId);
        if (!workspace) return false;

        workspace.name = newName;
        this.save();
        return true;
    }

    // Switch to workspace
    switchTo(workspaceId: string): boolean {
        const workspace = this.workspaces.find(w => w.id === workspaceId);
        if (!workspace) return false;

        // Save current workspace panes before switching
        if (this.activeWorkspaceId && this.activeWorkspaceId !== workspaceId) {
            this.saveActiveWorkspacePanes();
        }

        this.activeWorkspaceId = workspaceId;

        // Load panes for new workspace
        paneService.loadPanes(workspace.panes);

        this.save();
        return true;
    }

    // Update active workspace panes (called when panes change)
    updateActivePanes(panes: PaneConfig[]): void {
        const activeWorkspace = this.workspaces.find(w => w.id === this.activeWorkspaceId);
        if (activeWorkspace) {
            activeWorkspace.panes = panes;
            this.save();
        }
    }

    // Auto-save current state (called on pane changes)
    autoSave(): void {
        this.saveActiveWorkspacePanes();
        this.save();
    }
}

// Singleton instance
export const workspaceService = new WorkspaceService();
