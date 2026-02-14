import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ColorPickerInput } from '@/components/ui/color-picker-input';
import { useStarshipToml, useSaveStarshipToml } from '@/lib/query';
import { parseTomlSection, updateTomlSection } from '../toml-utils';

interface CharacterFormData {
    success_symbol: string;
    error_symbol: string;
    vimcmd_symbol: string;
    vimcmd_replace_symbol: string;
    vimcmd_visual_symbol: string;
    disabled: boolean;
}

const defaults: CharacterFormData = {
    success_symbol: '[❯]( #22c55e)',
    error_symbol: '[❯]( #ef4444)',
    vimcmd_symbol: '[❮]( #22c55e)',
    vimcmd_replace_symbol: '[❮]( #a855f7)',
    vimcmd_visual_symbol: '[❮]( #eab308)',
    disabled: false,
};

export function CharacterModule() {
    const { t } = useTranslation();
    const { data: toml, isLoading } = useStarshipToml();
    const { mutate: saveToml, isPending } = useSaveStarshipToml();

    const { handleSubmit, reset, watch, setValue } = useForm<CharacterFormData>({
        defaultValues: defaults,
    });

    const disabled = watch('disabled');

    useEffect(() => {
        if (toml) {
            const section = parseTomlSection<CharacterFormData>(toml, 'character');
            reset({ ...defaults, ...section });
        }
    }, [toml, reset]);

    const onSubmit = (data: CharacterFormData) => {
        if (!toml) return;

        const updatedToml = updateTomlSection(toml, 'character', data);
        saveToml(updatedToml, {
            onSuccess: () => toast.success(t('starship.modules.character.saveSuccess')),
            onError: (error) =>
                toast.error(t('starship.modules.saveFailed', { message: error.message })),
        });
    };

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex gap-3 flex-row items-start justify-between">
                <div>
                    <h3 className="text-lg font-medium">{t('starship.modules.character.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('starship.modules.character.subtitle')}
                    </p>
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? t('common.saving') : t('common.saveChanges')}
                </Button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                <div className="space-y-0.5">
                    <Label htmlFor="disabled">
                        {t('starship.modules.character.hideCharacter')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.character.hideDescription')}
                    </p>
                </div>
                <Switch
                    id="disabled"
                    checked={disabled}
                    onCheckedChange={(checked) => setValue('disabled', checked)}
                />
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="success_symbol">
                        {t('starship.modules.character.successSymbol')}
                    </Label>
                    <ColorPickerInput
                        id="success_symbol"
                        value={watch('success_symbol')}
                        onChange={(value) => setValue('success_symbol', value)}
                        placeholder="[❯](bold #22c55e)"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.character.successSymbolDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="error_symbol">
                        {t('starship.modules.character.errorSymbol')}
                    </Label>
                    <ColorPickerInput
                        id="error_symbol"
                        value={watch('error_symbol')}
                        onChange={(value) => setValue('error_symbol', value)}
                        placeholder="[❯](bold #ef4444)"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.character.errorSymbolDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vimcmd_symbol">
                        {t('starship.modules.character.vimcmdSymbol')}
                    </Label>
                    <ColorPickerInput
                        id="vimcmd_symbol"
                        value={watch('vimcmd_symbol')}
                        onChange={(value) => setValue('vimcmd_symbol', value)}
                        placeholder="[❮](bold #22c55e)"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.character.vimcmdSymbolDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vimcmd_replace_symbol">
                        {t('starship.modules.character.vimcmdReplaceSymbol')}
                    </Label>
                    <ColorPickerInput
                        id="vimcmd_replace_symbol"
                        value={watch('vimcmd_replace_symbol')}
                        onChange={(value) => setValue('vimcmd_replace_symbol', value)}
                        placeholder="[❮](bold #a855f7)"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.character.vimcmdReplaceSymbolDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vimcmd_visual_symbol">
                        {t('starship.modules.character.vimcmdVisualSymbol')}
                    </Label>
                    <ColorPickerInput
                        id="vimcmd_visual_symbol"
                        value={watch('vimcmd_visual_symbol')}
                        onChange={(value) => setValue('vimcmd_visual_symbol', value)}
                        placeholder="[❮](bold #eab308)"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.character.vimcmdVisualSymbolDesc')}
                    </p>
                </div>
            </div>
        </form>
    );
}
