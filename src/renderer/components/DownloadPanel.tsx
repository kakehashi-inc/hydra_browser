import {
    Box,
    Typography,
    IconButton,
    LinearProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/useAppStore';
import type { DownloadItem } from '@shared/types';

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function DownloadItemRow({ download }: { download: DownloadItem }) {
    const { t } = useTranslation();

    const progress = download.totalBytes > 0
        ? (download.receivedBytes / download.totalBytes) * 100
        : 0;

    const handleOpenFile = () => {
        window.hydra.openDownloadedFile(download.id);
    };

    const handleOpenFolder = () => {
        window.hydra.openDownloadFolder(download.id);
    };

    const handleCancel = () => {
        window.hydra.cancelDownload(download.id);
    };

    const getStatusText = () => {
        switch (download.state) {
            case 'progressing':
                return `${formatBytes(download.receivedBytes)} / ${formatBytes(download.totalBytes)}`;
            case 'completed':
                return t('completed');
            case 'cancelled':
                return t('cancelled');
            case 'interrupted':
                return t('failed');
            default:
                return '';
        }
    };

    return (
        <ListItem
            sx={{
                borderBottom: 1,
                borderColor: 'divider',
                flexDirection: 'column',
                alignItems: 'stretch',
                py: 1,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <InsertDriveFileIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <ListItemText
                    primary={download.filename}
                    secondary={getStatusText()}
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                    sx={{ flexGrow: 1, minWidth: 0 }}
                />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {download.state === 'progressing' && (
                        <Tooltip title={t('cancelDownload')}>
                            <IconButton size='small' onClick={handleCancel}>
                                <CancelIcon fontSize='small' />
                            </IconButton>
                        </Tooltip>
                    )}
                    {download.state === 'completed' && (
                        <>
                            <Tooltip title={t('openFile')}>
                                <IconButton size='small' onClick={handleOpenFile}>
                                    <InsertDriveFileIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('openFolder')}>
                                <IconButton size='small' onClick={handleOpenFolder}>
                                    <FolderOpenIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            </Box>
            {download.state === 'progressing' && (
                <LinearProgress
                    variant='determinate'
                    value={progress}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
            )}
        </ListItem>
    );
}

export default function DownloadPanel() {
    const { t } = useTranslation();
    const { downloads, showDownloadPanel, setShowDownloadPanel, setDownloads } = useAppStore();

    if (!showDownloadPanel) return null;

    const handleClear = async () => {
        await window.hydra.clearDownloads();
        const remaining = downloads.filter(d => d.state === 'progressing');
        setDownloads(remaining);
    };

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'fixed',
                right: 16,
                top: 100,
                width: 320,
                maxHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Typography variant='subtitle2'>{t('downloadPanelTitle')}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={t('clearAll')}>
                        <IconButton size='small' onClick={handleClear}>
                            <DeleteSweepIcon fontSize='small' />
                        </IconButton>
                    </Tooltip>
                    <IconButton size='small' onClick={() => setShowDownloadPanel(false)}>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </Box>
            </Box>
            <List sx={{ overflow: 'auto', flexGrow: 1, py: 0 }}>
                {downloads.length === 0 ? (
                    <ListItem>
                        <ListItemText
                            primary={t('noDownloads')}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                    </ListItem>
                ) : (
                    downloads.map((download) => (
                        <DownloadItemRow key={download.id} download={download} />
                    ))
                )}
            </List>
        </Paper>
    );
}
