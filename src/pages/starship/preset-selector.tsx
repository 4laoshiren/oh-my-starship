import { Check, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { presets } from '@/lib/presets';
import { useApplyPreset, useStarshipToml } from '@/lib/query';
import { cn } from '@/lib/utils';

export function PresetSelector() {
    const { t } = useTranslation();
    const { data: currentToml } = useStarshipToml();
    const applyPreset = useApplyPreset();

    const handleApplyPreset = async (presetId: string) => {
        const preset = presets.find((p) => p.id === presetId);
        if (!preset) return;

        try {
            await applyPreset.mutateAsync(preset.toml);
            toast.success(t('starship.presets.applySuccess', { name: preset.name }));
        } catch {
            toast.error(t('starship.presets.applyFailed'));
        }
    };

    const isPresetActive = (presetToml: string) => {
        if (!currentToml) return false;
        const normalizedCurrent = currentToml.trim().replace(/\r\n/g, '\n');
        const normalizedPreset = presetToml.trim().replace(/\r\n/g, '\n');
        return normalizedCurrent === normalizedPreset;
    };

    return (
        <div className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground">{t('starship.presets.description')}</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {presets.map((preset) => {
                    const isActive = isPresetActive(preset.toml);

                    return (
                        <div
                            key={preset.id}
                            className={cn(
                                'group relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-sm transition-all duration-200',
                                isActive
                                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-border hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md'
                            )}
                        >
                            <div className="mb-3 flex items-center gap-2.5">
                                <div
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                        isActive ? 'bg-primary/10' : 'bg-muted'
                                    )}
                                >
                                    <Palette
                                        className={cn(
                                            'h-4 w-4',
                                            isActive ? 'text-primary' : 'text-muted-foreground'
                                        )}
                                    />
                                </div>
                                <h3 className="font-medium">{preset.name}</h3>
                                {isActive && (
                                    <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                )}
                            </div>

                            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                                {preset.description}
                            </p>

                            <Button
                                variant={isActive ? 'secondary' : 'default'}
                                size="sm"
                                onClick={() => handleApplyPreset(preset.id)}
                                disabled={applyPreset.isPending || isActive}
                                className="w-full"
                            >
                                {isActive ? t('common.active') : t('common.apply')}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
