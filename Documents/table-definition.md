# Table Definition

This document defines the data structures (models) used in Hydra Browser.

## 1. PaneConfig

Pane configuration data stored in workspace.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| url | string | Current URL |
| resolution | PaneResolution | Resolution settings |
| scale | number | Display scale (percentage, 10-200) |
| partition | PartitionId | Session partition identifier (A-Z) |

## 2. PaneResolution

Resolution settings for a pane.

| Field | Type | Description |
|-------|------|-------------|
| width | number | Viewport width (pixels) |
| height | number | Viewport height (pixels) |
| presetName | string? | Preset device name (optional) |

## 3. PaneState

Runtime state of a pane (extends PaneConfig).

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| url | string | Current URL |
| resolution | PaneResolution | Resolution settings |
| scale | number | Display scale (percentage) |
| partition | PartitionId | Session partition identifier |
| title | string | Page title |
| consoleState | ConsoleState | Console state (normal/warning/error) |
| isLoading | boolean | Loading state |
| canGoBack | boolean | Can navigate back |
| canGoForward | boolean | Can navigate forward |

## 4. WorkspaceConfig

Workspace configuration stored in workspaces.json.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Workspace name |
| panes | PaneConfig[] | List of pane configurations |

## 5. WindowState

Window state stored in window-state.json.

| Field | Type | Description |
|-------|------|-------------|
| x | number? | Window X position |
| y | number? | Window Y position |
| width | number | Window width |
| height | number | Window height |
| isMaximized | boolean | Maximized state |

## 6. AppSettings

Application settings stored in settings.json.

| Field | Type | Description |
|-------|------|-------------|
| downloadPath | string | Download directory path |
| activeWorkspaceId | string | Currently active workspace ID |
| theme | AppTheme | Theme setting (light/dark/system) |
| language | AppLanguage | Language setting (ja/en) |

## 7. DownloadItem

Download item state.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| filename | string | Downloaded filename |
| savePath | string | Full save path |
| url | string | Download URL |
| totalBytes | number | Total file size |
| receivedBytes | number | Downloaded bytes |
| state | DownloadState | Download state |
| startTime | number | Download start timestamp |
| paneId | string? | Source pane ID (optional) |

## 8. ResolutionPreset

Resolution preset definition.

| Field | Type | Description |
|-------|------|-------------|
| category | ResolutionCategory | Category (Mobile/Tablet/Desktop) |
| deviceName | string | Device name |
| width | number | Screen width |
| height | number | Screen height |

## Enum Types

### PartitionId
`'A' | 'B' | 'C' | ... | 'Z'`

26 partition identifiers for session isolation.

### ConsoleState
`'normal' | 'warning' | 'error'`

Console message state for title bar color indication.

### DownloadState
`'progressing' | 'completed' | 'cancelled' | 'interrupted'`

Download progress state.

### AppTheme
`'light' | 'dark' | 'system'`

Application theme setting.

### AppLanguage
`'ja' | 'en'`

Application language setting.

### ResolutionCategory
`'Mobile' | 'Tablet' | 'Desktop' | 'Custom'`

Resolution preset category.
