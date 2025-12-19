# Hydra Browser

## 1. Overview

Hydra Browser is a developer-focused browser designed for simultaneously testing systems with multiple roles and device sizes.

### Key Features

- **Multi-pane Browsing**: Display multiple browser panes simultaneously
- **Device Emulation**: Simulate various device resolutions
- **Session Isolation**: 26 independent session partitions (A-Z)
- **Workspace Management**: Save and restore pane configurations
- **Download Management**: Built-in download manager
- **Console Monitoring**: Visual indication of console warnings/errors

### Technology Stack

- **Framework**: Electron
- **Rendering Engine**: Chromium (via WebContentsView)
- **Frontend**: React, TypeScript, MUI v7
- **State Management**: Zustand
- **Internationalization**: i18next

## 2. Supported OS

- Windows 10/11 (x64, arm64)
- macOS 10.15+ (x64, arm64)
- Linux (Debian-based/RHEL-based) (x64, arm64)

Note: This project is not code-signed for Windows. If SmartScreen shows a warning, select "More info" -> "Run anyway".

## 3. Developer Reference

### Development Rules

- Developer documentation (except `README.md`, `README-ja.md`) should be placed in the `Documents` directory.
- Always run the linter after changes and make appropriate fixes. If intentionally allowing linter errors, clearly state so in comments. **Builds are for releases - linter is sufficient for debugging.**
- When implementing models, place files per table.
- Reusable components should be implemented in files under `modules`.
- Temporary scripts (e.g., investigation scripts) should be placed in `scripts` directory.
- When creating or modifying models, update `Documents/table-definition.md`. Express table definitions as tables with columns, types, and relations.
- When system behavior changes, update `Documents/system-specification.md`.

### Requirements

- Node.js 22.x or higher
- yarn 4
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd hydra-browser

# Install dependencies
yarn install

# Start development
yarn dev
```

DevTools in development:

- DevTools opens automatically in detached mode
- Toggle with F12 or Ctrl+Shift+I (Cmd+Option+I on macOS)

### Build/Distribution

- All platforms: `yarn dist`
- Windows: `yarn dist:win`
- macOS: `yarn dist:mac`
- Linux: `yarn dist:linux`

Development uses BrowserRouter with `http://localhost:3001`, while production builds use HashRouter with `dist/renderer/index.html`.

### Windows Preparation: Developer Mode

To run/test unsigned local builds on Windows, enable Developer Mode:

1. Settings -> Privacy & Security -> For developers
2. Turn on "Developer Mode"
3. Restart OS

### Project Structure

```text
src/
├── main/                  # Electron Main: IPC/Services
│   ├── index.ts           # Startup, window creation, service initialization
│   ├── ipc/               # IPC handlers
│   ├── services/          # Services
│   │   ├── storage-service.ts    # Data persistence
│   │   ├── session-service.ts    # Session/partition management
│   │   ├── pane-service.ts       # Pane (WebContentsView) management
│   │   ├── workspace-service.ts  # Workspace management
│   │   └── download-service.ts   # Download management
│   └── utils/             # Utilities
├── preload/               # Secure API bridge to renderer
├── renderer/              # React + MUI UI
│   ├── components/        # UI components
│   ├── stores/            # Zustand state management
│   ├── i18n/              # Internationalization
│   └── constants.ts       # Constants
├── shared/                # Type definitions, constants (defaults/paths)
│   ├── types.ts           # Type definitions
│   ├── constants.ts       # Constants
│   └── ipc.ts             # IPC type definitions
└── public/                # Icons etc.
```

### Technologies Used

- **Electron 38**
- **React 19 (MUI v7)**
- **TypeScript 5**
- **Zustand**
- **i18next**
- **Vite 7**

### Creating Windows Icon

```exec
magick public/icon.png -define icon:auto-resize=256,128,96,64,48,32,24,16 public/icon.ico
```

## 4. Feature Details

### 4.1 Pane Management

- Add new panes from toolbar
- Resolution presets (Mobile/Tablet/Desktop) or custom input
- Display scale setting (10-200%)
- Partition selection (A-Z)

### 4.2 Resolution Presets

| Category | Device Name | Resolution |
|----------|-------------|------------|
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

### 4.3 Session Isolation

Same partition shares cookies, different partitions are completely isolated.

| Data Type | Isolation |
|-----------|-----------|
| Cookie | Isolated per partition |
| localStorage | Isolated per partition |
| sessionStorage | Isolated per partition |
| IndexedDB | Isolated per partition |
| Autocomplete | Shared across all partitions |

### 4.4 Workspaces

- Create/delete/rename
- Automatic pane configuration saving
- Restore previous workspace on startup

### 4.5 Console State Display

| State | Title Bar Color |
|-------|-----------------|
| Normal | Default |
| Warning detected | Yellow |
| Error detected | Red |

Resets on page navigation. Priority: Error > Warning.

### 4.6 Data Storage Location

| OS | Path |
|----|------|
| Windows | %APPDATA%\Hydra\ |
| macOS | ~/Library/Application Support/Hydra/ |
| Linux | $XDG_CONFIG_HOME/Hydra/ or ~/.config/Hydra/ |
