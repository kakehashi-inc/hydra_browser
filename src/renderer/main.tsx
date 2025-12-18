import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import TitleBar from './components/TitleBar';
import Toolbar from './components/Toolbar';
import PaneList from './components/PaneList';
import AddPaneDialog from './components/AddPaneDialog';
import DownloadPanel from './components/DownloadPanel';
import SettingsDialog from './components/SettingsDialog';
import { useAppStore } from './stores/useAppStore';
import type { PaneState, DownloadItem } from '@shared/types';

function App() {
    const { i18n } = useTranslation();
    const {
        appInfo,
        setAppInfo,
        setPanes,
        updatePane,
        addPane,
        removePane,
        setFocusedPaneId,
        setWorkspaces,
        setActiveWorkspace,
        setDownloads,
        updateDownload,
        addDownload,
        setSettings,
        setUrlBarValue,
    } = useAppStore();

    // Initialize app
    React.useEffect(() => {
        const init = async () => {
            // Get app info
            const info = await window.hydra.getAppInfo();
            setAppInfo(info);
            i18n.changeLanguage(info.language);

            // Get settings
            const settings = await window.hydra.getSettings();
            setSettings(settings);

            // Get workspaces
            const workspaces = await window.hydra.getAllWorkspaces();
            setWorkspaces(workspaces);

            // Get active workspace
            const activeWorkspace = await window.hydra.getActiveWorkspace();
            setActiveWorkspace(activeWorkspace);

            // Get panes
            const panes = await window.hydra.getAllPanes();
            setPanes(panes);

            // Get downloads
            const downloads = await window.hydra.getAllDownloads();
            setDownloads(downloads);
        };

        init();
    }, [i18n, setAppInfo, setPanes, setWorkspaces, setActiveWorkspace, setDownloads, setSettings]);

    // Setup event listeners
    React.useEffect(() => {
        const unsubPaneStateUpdated = window.hydra.onPaneStateUpdated((pane: PaneState) => {
            updatePane(pane);
            // Update URL bar if this is the focused pane
            const { focusedPaneId } = useAppStore.getState();
            if (pane.id === focusedPaneId) {
                setUrlBarValue(pane.url);
            }
        });

        const unsubPaneFocusChanged = window.hydra.onPaneFocusChanged((paneId: string | null) => {
            setFocusedPaneId(paneId);
        });

        const unsubPaneCreated = window.hydra.onPaneCreated((pane: PaneState) => {
            addPane(pane);
        });

        const unsubPaneClosed = window.hydra.onPaneClosed((paneId: string) => {
            removePane(paneId);
        });

        const unsubDownloadStarted = window.hydra.onDownloadStarted((download: DownloadItem) => {
            addDownload(download);
        });

        const unsubDownloadProgress = window.hydra.onDownloadProgress((download: DownloadItem) => {
            updateDownload(download);
        });

        const unsubDownloadCompleted = window.hydra.onDownloadCompleted((download: DownloadItem) => {
            updateDownload(download);
        });

        const unsubDownloadFailed = window.hydra.onDownloadFailed((download: DownloadItem) => {
            updateDownload(download);
        });

        return () => {
            unsubPaneStateUpdated();
            unsubPaneFocusChanged();
            unsubPaneCreated();
            unsubPaneClosed();
            unsubDownloadStarted();
            unsubDownloadProgress();
            unsubDownloadCompleted();
            unsubDownloadFailed();
        };
    }, [updatePane, setFocusedPaneId, addPane, removePane, addDownload, updateDownload, setUrlBarValue]);

    const muiTheme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: (appInfo?.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
                },
            }),
        [appInfo?.theme]
    );

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <TitleBar info={appInfo ?? undefined} />
                <Toolbar />
                <PaneList />
            </Box>
            <AddPaneDialog />
            <DownloadPanel />
            <SettingsDialog />
        </ThemeProvider>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
