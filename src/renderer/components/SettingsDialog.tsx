import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Typography,
    Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/useAppStore';
import type { AppTheme, AppLanguage } from '@shared/types';

export default function SettingsDialog() {
    const { t, i18n } = useTranslation();
    const { showSettingsDialog, setShowSettingsDialog, settings, setSettings } = useAppStore();

    const handleThemeChange = async (theme: AppTheme) => {
        await window.hydra.setTheme(theme);
        if (settings) {
            setSettings({ ...settings, theme });
        }
    };

    const handleLanguageChange = async (language: AppLanguage) => {
        await window.hydra.setLanguage(language);
        i18n.changeLanguage(language);
        if (settings) {
            setSettings({ ...settings, language });
        }
    };

    const handleSelectDownloadPath = async () => {
        const newPath = await window.hydra.selectDownloadPath();
        if (newPath && settings) {
            setSettings({ ...settings, downloadPath: newPath });
        }
    };

    const handleClearAutofill = async () => {
        if (confirm(t('clearAutofillConfirm'))) {
            await window.hydra.clearAutofill();
        }
    };

    const handleClose = () => {
        setShowSettingsDialog(false);
    };

    return (
        <Dialog open={showSettingsDialog} onClose={handleClose} maxWidth='xs' fullWidth>
            <DialogTitle>{t('settingsTitle')}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                    {/* Theme */}
                    <FormControl size='small' fullWidth>
                        <InputLabel>{t('theme')}</InputLabel>
                        <Select
                            value={settings?.theme || 'system'}
                            onChange={(e) => handleThemeChange(e.target.value as AppTheme)}
                            label={t('theme')}
                        >
                            <MenuItem value='light'>{t('light')}</MenuItem>
                            <MenuItem value='dark'>{t('dark')}</MenuItem>
                            <MenuItem value='system'>{t('system')}</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Language */}
                    <FormControl size='small' fullWidth>
                        <InputLabel>{t('language')}</InputLabel>
                        <Select
                            value={settings?.language || 'en'}
                            onChange={(e) => handleLanguageChange(e.target.value as AppLanguage)}
                            label={t('language')}
                        >
                            <MenuItem value='en'>English</MenuItem>
                            <MenuItem value='ja'>Japanese</MenuItem>
                        </Select>
                    </FormControl>

                    <Divider />

                    {/* Download Path */}
                    <Box>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                            {t('downloadPath')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size='small'
                                fullWidth
                                value={settings?.downloadPath || ''}
                                InputProps={{ readOnly: true }}
                            />
                            <Button
                                variant='outlined'
                                size='small'
                                onClick={handleSelectDownloadPath}
                            >
                                {t('browse')}
                            </Button>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Clear Autofill */}
                    <Box>
                        <Button
                            variant='outlined'
                            color='error'
                            size='small'
                            onClick={handleClearAutofill}
                        >
                            {t('clearAutofill')}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{t('cancel')}</Button>
            </DialogActions>
        </Dialog>
    );
}
