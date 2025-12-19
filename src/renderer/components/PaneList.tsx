import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Paper,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/useAppStore';
import { CONSOLE_STATE_COLORS, SCALE_CONSTRAINTS } from '../constants';
import type { PaneState } from '@shared/types';

// Resize handle component
interface ResizeHandleProps {
    pane: PaneState;
    onScaleChange: (newScale: number) => void;
}

function ResizeHandle({ pane, onScaleChange }: ResizeHandleProps) {
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startScale = pane.scale;
        const aspectRatio = pane.resolution.width / pane.resolution.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            // Calculate delta based on diagonal movement (preserves aspect ratio)
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            // Use the larger of the two deltas, weighted by aspect ratio
            const delta = (deltaX + deltaY * aspectRatio) / 2;

            // Convert pixel delta to scale change (1px = 0.5% scale change)
            const scaleChange = delta * 0.5;
            let newScale = Math.round(startScale + scaleChange);

            // Clamp to valid range
            newScale = Math.max(SCALE_CONSTRAINTS.MIN, Math.min(SCALE_CONSTRAINTS.MAX, newScale));

            onScaleChange(newScale);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <Box
            onMouseDown={handleMouseDown}
            sx={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 16,
                height: 16,
                cursor: 'nwse-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                borderTopLeftRadius: 4,
                '&:hover': {
                    bgcolor: 'action.selected',
                },
                '&::before': {
                    content: '""',
                    width: 8,
                    height: 8,
                    borderRight: '2px solid',
                    borderBottom: '2px solid',
                    borderColor: 'text.secondary',
                },
            }}
        />
    );
}

interface PaneTitleBarProps {
    pane: PaneState;
    isFocused: boolean;
    onFocus: () => void;
    onClose: () => void;
    onToggleDevTools: () => void;
    onSettings: () => void;
}

function PaneTitleBar({ pane, isFocused, onFocus, onClose, onToggleDevTools, onSettings }: PaneTitleBarProps) {
    const { t } = useTranslation();

    const displayWidth = Math.round((pane.resolution.width * pane.scale) / 100);
    const bgColor = CONSOLE_STATE_COLORS[pane.consoleState] || 'transparent';

    return (
        <Box
            onClick={onFocus}
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                bgcolor: isFocused ? 'primary.main' : bgColor !== 'transparent' ? bgColor : 'action.selected',
                color: isFocused ? 'primary.contrastText' : 'text.primary',
                cursor: 'pointer',
                minWidth: 0,
                width: displayWidth,
                maxWidth: displayWidth,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
            }}
        >
            <Typography
                variant='caption'
                sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                }}
            >
                {pane.title || t('newTab')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5, flexShrink: 0 }}>
                <Tooltip title={t('devTools')}>
                    <IconButton
                        size='small'
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleDevTools();
                        }}
                        sx={{
                            p: 0.25,
                            color: 'inherit',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        <BugReportIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('paneSettings')}>
                    <IconButton
                        size='small'
                        onClick={(e) => {
                            e.stopPropagation();
                            onSettings();
                        }}
                        sx={{
                            p: 0.25,
                            color: 'inherit',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        <SettingsIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t('closePane')}>
                    <IconButton
                        size='small'
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        sx={{
                            p: 0.25,
                            color: 'inherit',
                            '&:hover': { bgcolor: 'rgba(255,0,0,0.3)' },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

interface PaneCardProps {
    pane: PaneState;
    isFocused: boolean;
    onOpenSettings: (pane: PaneState) => void;
}

function PaneCard({ pane, isFocused, onOpenSettings }: PaneCardProps) {
    const { setFocusedPaneId, removePane, updatePane } = useAppStore();

    const displayWidth = Math.round((pane.resolution.width * pane.scale) / 100);
    const displayHeight = Math.round((pane.resolution.height * pane.scale) / 100);

    const handleFocus = async () => {
        setFocusedPaneId(pane.id);
        await window.hydra.setFocus(pane.id);
    };

    const handleClose = async () => {
        await window.hydra.closePane(pane.id);
        removePane(pane.id);
    };

    const handleToggleDevTools = async () => {
        await window.hydra.toggleDevTools(pane.id);
    };

    const handleSettings = () => {
        onOpenSettings(pane);
    };

    const handleScaleChange = async (newScale: number) => {
        // Update local state immediately for responsive UI
        updatePane({ ...pane, scale: newScale });
        // Sync with main process
        await window.hydra.updatePane(pane.id, { scale: newScale });
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                m: 0.5,
            }}
        >
            <PaneTitleBar
                pane={pane}
                isFocused={isFocused}
                onFocus={handleFocus}
                onClose={handleClose}
                onToggleDevTools={handleToggleDevTools}
                onSettings={handleSettings}
            />
            <Paper
                elevation={isFocused ? 4 : 1}
                sx={{
                    position: 'relative',
                    width: displayWidth,
                    height: displayHeight,
                    bgcolor: 'background.default',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: isFocused ? 2 : 1,
                    borderColor: isFocused ? 'primary.main' : 'divider',
                    borderTop: 0,
                }}
            >
                {/* Pane info overlay */}
                <Box
                    sx={{
                        p: 1,
                        bgcolor: 'rgba(0,0,0,0.03)',
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${pane.resolution.width}x${pane.resolution.height}`}
                            size='small'
                            variant='outlined'
                            sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Chip
                            label={`${pane.scale}%`}
                            size='small'
                            variant='outlined'
                            sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Chip
                            label={`Partition ${pane.partition}`}
                            size='small'
                            variant='outlined'
                            sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                    </Box>
                </Box>
                {/* Content area - actual browser view is rendered by main process */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled',
                    }}
                >
                    <Typography variant='caption'>
                        {pane.isLoading ? 'Loading...' : pane.url || 'about:blank'}
                    </Typography>
                </Box>
                {/* Resize handle */}
                <ResizeHandle pane={pane} onScaleChange={handleScaleChange} />
            </Paper>
        </Box>
    );
}

interface PaneListProps {
    onOpenPaneSettings: (pane: PaneState) => void;
}

export default function PaneList({ onOpenPaneSettings }: PaneListProps) {
    const { panes, focusedPaneId } = useAppStore();

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                p: 1,
                overflow: 'auto',
                flexGrow: 1,
                bgcolor: 'background.default',
            }}
        >
            {panes.map((pane) => (
                <PaneCard
                    key={pane.id}
                    pane={pane}
                    isFocused={pane.id === focusedPaneId}
                    onOpenSettings={onOpenPaneSettings}
                />
            ))}
            {panes.length === 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: 'text.disabled',
                    }}
                >
                    <Typography variant='body2'>
                        Click "Add Pane" to create a new browser pane
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
