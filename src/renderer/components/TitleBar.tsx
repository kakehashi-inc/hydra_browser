import { Box, Typography, IconButton } from '@mui/material';
import type { AppInfo } from '@shared/types';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
    info: AppInfo | undefined;
};

export default function TitleBar({ info }: Props) {
    const isMac = info?.os === 'darwin';

    return (
        <Box
            sx={{
                WebkitAppRegion: 'drag',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                height: 36,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                userSelect: 'none',
                flexShrink: 0,
            }}
        >
            <Box sx={{ flexGrow: 1, ml: isMac ? 10 : 0, display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                    Hydra Browser
                </Typography>
                {info?.version && (
                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        v{info.version}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
                {!isMac && (
                    <>
                        <IconButton
                            size='small'
                            onClick={() => window.hydra.minimize()}
                            sx={{
                                borderRadius: 0,
                                width: 36,
                                height: 36,
                                color: 'text.primary',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <MinimizeIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                            size='small'
                            onClick={async () => {
                                await window.hydra.maximizeOrRestore();
                            }}
                            sx={{
                                borderRadius: 0,
                                width: 36,
                                height: 36,
                                color: 'text.primary',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <CropSquareIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                            size='small'
                            onClick={() => window.hydra.close()}
                            sx={{
                                borderRadius: 0,
                                width: 36,
                                height: 36,
                                color: 'text.primary',
                                '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' },
                            }}
                        >
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </>
                )}
            </Box>
        </Box>
    );
}
