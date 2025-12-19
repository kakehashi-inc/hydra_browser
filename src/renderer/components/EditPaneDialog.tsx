import React from 'react';
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
    Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/useAppStore';
import { RESOLUTION_PRESETS, PRESETS_BY_CATEGORY, PARTITION_IDS, SCALE_CONSTRAINTS } from '../constants';
import type { PaneState, PaneResolution, PartitionId, ResolutionCategory } from '@shared/types';

interface EditPaneDialogProps {
    pane: PaneState | null;
    open: boolean;
    onClose: () => void;
}

export default function EditPaneDialog({ pane, open, onClose }: EditPaneDialogProps) {
    const { t } = useTranslation();
    const { updatePane } = useAppStore();

    const [selectedPreset, setSelectedPreset] = React.useState<string>('custom');
    const [customWidth, setCustomWidth] = React.useState(1366);
    const [customHeight, setCustomHeight] = React.useState(768);
    const [scale, setScale] = React.useState(100);
    const [partition, setPartition] = React.useState<PartitionId>('A');

    // Initialize form when pane changes
    React.useEffect(() => {
        if (pane) {
            setCustomWidth(pane.resolution.width);
            setCustomHeight(pane.resolution.height);
            setScale(pane.scale);
            setPartition(pane.partition);

            // Find matching preset
            const matchingPreset = RESOLUTION_PRESETS.find(
                p => p.width === pane.resolution.width && p.height === pane.resolution.height
            );
            setSelectedPreset(matchingPreset?.deviceName || 'custom');
        }
    }, [pane]);

    const isCustom = selectedPreset === 'custom';

    const handlePresetChange = (value: string) => {
        setSelectedPreset(value);
        if (value !== 'custom') {
            const preset = RESOLUTION_PRESETS.find(p => p.deviceName === value);
            if (preset) {
                setCustomWidth(preset.width);
                setCustomHeight(preset.height);
            }
        }
    };

    const handleSave = async () => {
        if (!pane) return;

        const resolution: PaneResolution = {
            width: customWidth,
            height: customHeight,
            presetName: isCustom ? undefined : selectedPreset,
        };

        // Update via IPC
        await window.hydra.updatePane(pane.id, {
            resolution,
            scale,
            partition,
        });

        // Update local state
        updatePane({
            ...pane,
            resolution,
            scale,
            partition,
        });

        onClose();
    };

    const categories: ResolutionCategory[] = ['Mobile', 'Tablet', 'Desktop'];

    return (
        <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
            <DialogTitle>{t('editPaneTitle')}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Resolution */}
                    <FormControl size='small' fullWidth>
                        <InputLabel>{t('resolution')}</InputLabel>
                        <Select
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                            label={t('resolution')}
                        >
                            {categories.map((category) => [
                                <MenuItem key={`header-${category}`} disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
                                    {t(category.toLowerCase())}
                                </MenuItem>,
                                ...PRESETS_BY_CATEGORY[category].map((preset) => (
                                    <MenuItem key={preset.deviceName} value={preset.deviceName} sx={{ pl: 3 }}>
                                        {preset.deviceName} ({preset.width}x{preset.height})
                                    </MenuItem>
                                )),
                            ])}
                            <Divider />
                            <MenuItem value='custom'>{t('custom')}</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Custom Resolution */}
                    {isCustom && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label={t('width')}
                                type='number'
                                size='small'
                                value={customWidth}
                                onChange={(e) => setCustomWidth(Number(e.target.value))}
                                inputProps={{ min: 320, max: 3840 }}
                            />
                            <TextField
                                label={t('height')}
                                type='number'
                                size='small'
                                value={customHeight}
                                onChange={(e) => setCustomHeight(Number(e.target.value))}
                                inputProps={{ min: 200, max: 2160 }}
                            />
                        </Box>
                    )}

                    {/* Scale */}
                    <TextField
                        label={t('scale') + ' (%)'}
                        type='number'
                        size='small'
                        fullWidth
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        inputProps={{ min: SCALE_CONSTRAINTS.MIN, max: SCALE_CONSTRAINTS.MAX }}
                    />

                    {/* Partition */}
                    <FormControl size='small' fullWidth>
                        <InputLabel>{t('partition')}</InputLabel>
                        <Select
                            value={partition}
                            onChange={(e) => setPartition(e.target.value as PartitionId)}
                            label={t('partition')}
                        >
                            {PARTITION_IDS.map((p) => (
                                <MenuItem key={p} value={p}>
                                    {p}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handleSave} variant='contained'>
                    {t('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
