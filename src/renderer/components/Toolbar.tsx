import React from 'react';
import {
    Box,
    Button,
    IconButton,
    TextField,
    Select,
    MenuItem,
    Tooltip,
    Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/useAppStore';

export default function Toolbar() {
    const { t } = useTranslation();
    const {
        urlBarValue,
        setUrlBarValue,
        focusedPaneId,
        workspaces,
        activeWorkspace,
        downloads,
        setShowAddPaneDialog,
        setShowSettingsDialog,
        setShowDownloadPanel,
        showDownloadPanel,
    } = useAppStore();

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!focusedPaneId || !urlBarValue.trim()) return;

        let url = urlBarValue.trim();
        // Add protocol if missing
        if (!/^https?:\/\//i.test(url) && !/^about:/i.test(url)) {
            url = `https://${url}`;
        }
        await window.hydra.navigatePane(focusedPaneId, url);
    };

    const handleCreateWorkspace = async () => {
        const name = prompt(t('workspaceName'), `Workspace ${workspaces.length + 1}`);
        if (name) {
            const workspace = await window.hydra.createWorkspace(name);
            useAppStore.getState().setWorkspaces([...workspaces, workspace]);
            useAppStore.getState().setActiveWorkspace(workspace);
        }
    };

    const handleRenameWorkspace = async () => {
        if (!activeWorkspace) return;
        const name = prompt(t('workspaceName'), activeWorkspace.name);
        if (name && name !== activeWorkspace.name) {
            await window.hydra.renameWorkspace(activeWorkspace.id, name);
            const updated = { ...activeWorkspace, name };
            useAppStore.getState().setActiveWorkspace(updated);
            useAppStore.getState().setWorkspaces(
                workspaces.map(w => (w.id === updated.id ? updated : w))
            );
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!activeWorkspace) return;
        if (!confirm(t('deleteWorkspaceConfirm'))) return;

        await window.hydra.deleteWorkspace(activeWorkspace.id);
        const allWorkspaces = await window.hydra.getAllWorkspaces();
        const active = await window.hydra.getActiveWorkspace();
        useAppStore.getState().setWorkspaces(allWorkspaces);
        useAppStore.getState().setActiveWorkspace(active);
    };

    const handleWorkspaceChange = async (workspaceId: string) => {
        await window.hydra.switchWorkspace(workspaceId);
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
            useAppStore.getState().setActiveWorkspace(workspace);
        }
        // Reload panes
        const panes = await window.hydra.getAllPanes();
        useAppStore.getState().setPanes(panes);
    };

    const activeDownloadsCount = downloads.filter(d => d.state === 'progressing').length;
    const completedDownloadsCount = downloads.filter(d => d.state === 'completed').length;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.5,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                flexShrink: 0,
                height: 48,
            }}
        >
            {/* Add Pane Button */}
            <Tooltip title={t('addPane')}>
                <IconButton
                    size='small'
                    onClick={() => setShowAddPaneDialog(true)}
                    color='primary'
                >
                    <AddIcon />
                </IconButton>
            </Tooltip>

            {/* URL Bar */}
            <Box
                component='form'
                onSubmit={handleUrlSubmit}
                sx={{ flexGrow: 1, maxWidth: 600 }}
            >
                <TextField
                    size='small'
                    fullWidth
                    placeholder={t('urlPlaceholder')}
                    value={urlBarValue}
                    onChange={(e) => setUrlBarValue(e.target.value)}
                    disabled={!focusedPaneId}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            height: 32,
                            fontSize: '0.875rem',
                        },
                    }}
                />
            </Box>

            {/* Downloads Button */}
            <Tooltip title={t('downloads')}>
                <IconButton
                    size='small'
                    onClick={() => setShowDownloadPanel(!showDownloadPanel)}
                    color={showDownloadPanel ? 'primary' : 'default'}
                >
                    <Badge
                        badgeContent={activeDownloadsCount || completedDownloadsCount || undefined}
                        color={activeDownloadsCount > 0 ? 'primary' : 'success'}
                    >
                        <DownloadIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Workspace Controls */}
            <Button
                size='small'
                variant='outlined'
                onClick={handleCreateWorkspace}
                sx={{ minWidth: 'auto', px: 1 }}
            >
                {t('newWorkspace')}
            </Button>

            <Select
                size='small'
                value={activeWorkspace?.id || ''}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                sx={{ minWidth: 150, height: 32 }}
                displayEmpty
            >
                {workspaces.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                        {w.name}
                    </MenuItem>
                ))}
            </Select>

            <Button
                size='small'
                variant='text'
                onClick={handleRenameWorkspace}
                disabled={!activeWorkspace}
                sx={{ minWidth: 'auto', px: 1 }}
            >
                {t('renameWorkspace')}
            </Button>

            <Button
                size='small'
                variant='text'
                color='error'
                onClick={handleDeleteWorkspace}
                disabled={!activeWorkspace}
                sx={{ minWidth: 'auto', px: 1 }}
            >
                {t('deleteWorkspace')}
            </Button>

            {/* Settings Button */}
            <Tooltip title={t('settings')}>
                <IconButton
                    size='small'
                    onClick={() => setShowSettingsDialog(true)}
                >
                    <SettingsIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
}
