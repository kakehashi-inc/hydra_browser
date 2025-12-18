# System Specification

## 1. Overview

Hydra Browser is a developer-focused browser designed for simultaneously testing systems with multiple roles and device sizes. It enables independent session management for different user roles while supporting various device viewport simulations.

### 1.1 Key Features

- **Multi-pane browsing**: Display multiple browser panes simultaneously
- **Device emulation**: Simulate various device resolutions
- **Session isolation**: 26 independent session partitions (A-Z)
- **Workspace management**: Save and restore pane configurations
- **Download management**: Built-in download manager
- **Console monitoring**: Visual indication of console warnings/errors

### 1.2 Technology Stack

- **Framework**: Electron
- **Rendering Engine**: Chromium (via WebContentsView)
- **Frontend**: React, TypeScript, MUI v7
- **State Management**: Zustand
- **Internationalization**: i18next

## 2. Architecture

### 2.1 Process Architecture

```
Main Process
├── StorageService      - Data persistence
├── SessionService      - Session/partition management
├── PaneService         - WebContentsView management
├── WorkspaceService    - Workspace management
├── DownloadService     - Download handling
└── IPC Handlers        - Communication with renderer

Renderer Process
├── App                 - Main application component
├── Stores (Zustand)    - UI state management
├── Components          - React UI components
└── IPC Bridge          - Communication with main
```

### 2.2 Data Flow

1. User interacts with UI (Renderer)
2. Action dispatched via IPC to Main process
3. Main process updates state/performs action
4. Main process sends update event to Renderer
5. Renderer updates UI via Zustand store

## 3. Feature Specifications

### 3.1 Pane Management

#### Creating Panes
- User clicks "Add Pane" button
- Dialog opens with resolution, scale, partition options
- On confirm, new WebContentsView is created in Main process
- Pane is added to active workspace and rendered

#### Pane Properties
- **Resolution**: Viewport size (e.g., 375x667 for iPhone SE)
- **Scale**: Display scale (10-200%)
- **Partition**: Session identifier (A-Z)

#### Device Emulation
```javascript
webContents.enableDeviceEmulation({
    screenPosition: 'mobile',
    screenSize: { width, height },
    viewSize: { width, height },
    deviceScaleFactor: 1,
    scale: scaleFactor
});
```

#### New Window Handling
- Shift+click, Ctrl+click, middle-click, target="_blank"
- New pane created with same properties as source
- Inserted after source pane in order

### 3.2 Session Partitions

#### Implementation
```javascript
session.fromPartition('persist:partition-X')
```

#### Isolation Scope
| Data Type | Isolation |
|-----------|-----------|
| Cookies | Per partition |
| localStorage | Per partition |
| sessionStorage | Per partition |
| IndexedDB | Per partition |
| Autofill | Shared |
| Passwords | Shared |

### 3.3 Workspace Management

#### Operations
- **New**: Create empty workspace
- **Switch**: Change active workspace, load panes
- **Rename**: Change workspace name
- **Delete**: Remove workspace (auto-create if last)

#### Auto-save
- Pane changes automatically saved to active workspace
- Saved on: add/remove pane, settings change, navigation

### 3.4 Console State Monitoring

#### Detection
```javascript
webContents.on('console-message', (event, level) => {
    // level: 0=verbose, 1=info, 2=warning, 3=error
});
```

#### Visual Indication
- **Normal**: Default title bar color
- **Warning**: Yellow title bar
- **Error**: Red title bar (highest priority)

#### Reset
- Resets to normal on main frame navigation

### 3.5 Download Management

#### Flow
1. Session captures download request
2. Save path determined (with auto-rename for duplicates)
3. Progress tracked and sent to renderer
4. Completion/failure notified

#### Features
- No save dialog (auto-save)
- Progress indicator in toolbar
- Download panel with file list
- Open file/folder actions

## 4. Data Persistence

### 4.1 Storage Location

| OS | Path |
|----|------|
| Windows | %APPDATA%\Hydra\ |
| macOS | ~/Library/Application Support/Hydra/ |
| Linux | $XDG_CONFIG_HOME/Hydra/ or ~/.config/Hydra/ |

### 4.2 Files

| File | Content |
|------|---------|
| workspaces.json | Workspace configurations |
| window-state.json | Window position/size |
| settings.json | Application settings |

### 4.3 Window State

- Saved on application close
- Restored on startup
- Handles maximized state separately

## 5. IPC Communication

### 5.1 Channels

#### App
- `app:getInfo` - Get app information
- `app:setTheme` - Set theme
- `app:setLanguage` - Set language

#### Pane
- `pane:create` - Create new pane
- `pane:close` - Close pane
- `pane:update` - Update pane settings
- `pane:navigate` - Navigate to URL
- `pane:toggleDevTools` - Toggle DevTools

#### Workspace
- `workspace:create` - Create workspace
- `workspace:delete` - Delete workspace
- `workspace:rename` - Rename workspace
- `workspace:switch` - Switch workspace

#### Download
- `download:getAll` - Get all downloads
- `download:cancel` - Cancel download
- `download:openFile` - Open downloaded file
- `download:openFolder` - Open containing folder

### 5.2 Events (Main -> Renderer)

- `pane:stateUpdated` - Pane state changed
- `pane:focusChanged` - Focus changed
- `pane:created` - New pane created
- `pane:closed` - Pane closed
- `download:started` - Download started
- `download:progress` - Download progress
- `download:completed` - Download completed
- `download:failed` - Download failed

## 6. Resolution Presets

| Category | Device | Resolution |
|----------|--------|------------|
| Mobile | iPhone SE | 375x667 |
| Mobile | iPhone 14 | 390x844 |
| Mobile | iPhone 14 Pro Max | 430x932 |
| Mobile | Pixel 7 | 412x915 |
| Mobile | Galaxy S20 | 360x800 |
| Tablet | iPad Mini | 768x1024 |
| Tablet | iPad Air | 820x1180 |
| Tablet | iPad Pro 12.9 | 1024x1366 |
| Desktop | Laptop | 1366x768 |
| Desktop | Desktop | 1920x1080 |
| Desktop | Desktop Large | 2560x1440 |

## 7. Supported Platforms

| OS | Architecture |
|----|--------------|
| Windows | x64, arm64 |
| macOS | x64, arm64 |
| Linux | x64, arm64 |
