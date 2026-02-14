import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ColorPickerInput } from '@/components/ui/color-picker-input';
import { useStarshipToml, useSaveStarshipToml } from '@/lib/query';
import { parseTomlSection, updateTomlSection } from '../toml-utils';

interface DirectoryFormData {
    truncation_length: number;
    truncation_symbol: string;
    truncate_to_repo: boolean;
    style: string;
    format: string;
    read_only: string;
    read_only_style: string;
    home_symbol: string;
    disabled: boolean;
}

const defaults: DirectoryFormData = {
    truncation_length: 3,
    truncation_symbol: '…',
    truncate_to_repo: true,
    style: '#06b6d4',
    format: '[$path]($style)[$read_only]($read_only_style) ',
    read_only: '🔒',
    read_only_style: '#ef4444',
    home_symbol: '~',
    disabled: false,
};

export function DirectoryModule() {
    const { t } = useTranslation();
    const { data: toml, isLoading } = useStarshipToml();
    const { mutate: saveToml, isPending } = useSaveStarshipToml();

    const { register, handleSubmit, reset, watch, setValue } = useForm<DirectoryFormData>({
        defaultValues: defaults,
    });

    const disabled = watch('disabled');

    useEffect(() => {
        if (toml) {
            const section = parseTomlSection<DirectoryFormData>(toml, 'directory');
            reset({ ...defaults, ...section });
        }
    }, [toml, reset]);

    const onSubmit = (data: DirectoryFormData) => {
        if (!toml) return;

        const updatedToml = updateTomlSection(toml, 'directory', data);
        saveToml(updatedToml, {
            onSuccess: () => toast.success(t('starship.modules.directory.saveSuccess')),
            onError: (error) =>
                toast.error(t('starship.modules.saveFailed', { message: error.message })),
        });
    };

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-lg font-medium">{t('starship.modules.directory.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('starship.modules.directory.subtitle')}
                    </p>
                </div>
                <Button type="submit" disabled={isPending} className="sm:self-start">
                    {isPending ? t('common.saving') : t('common.saveChanges')}
                </Button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                <div className="space-y-0.5">
                    <Label htmlFor="disabled">
                        {t('starship.modules.directory.hideDirectory')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.hideDescription')}
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
                    <Label htmlFor="truncation_length">
                        {t('starship.modules.directory.truncationLength')}
                    </Label>
                    <Input
                        id="truncation_length"
                        type="number"
                        {...register('truncation_length', { valueAsNumber: true })}
                        placeholder="3"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.truncationLengthDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="truncation_symbol">
                        {t('starship.modules.directory.truncationSymbol')}
                    </Label>
                    <Input
                        id="truncation_symbol"
                        {...register('truncation_symbol')}
                        placeholder="…"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.truncationSymbolDesc')}
                    </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="truncate_to_repo">
                            {t('starship.modules.directory.truncateToRepo')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {t('starship.modules.directory.truncateToRepoDesc')}
                        </p>
                    </div>
                    <Switch
                        id="truncate_to_repo"
                        checked={watch('truncate_to_repo')}
                        onCheckedChange={(checked) => setValue('truncate_to_repo', checked)}
                        disabled={disabled}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="style">{t('starship.modules.directory.style')}</Label>
                    <ColorPickerInput
                        id="style"
                        value={watch('style')}
                        onChange={(value) => setValue('style', value)}
                        placeholder="#06b6d4"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.styleDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="format">{t('starship.modules.directory.format')}</Label>
                    <Input
                        id="format"
                        {...register('format')}
                        placeholder="[$path]($style)[$read_only]($read_only_style) "
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.formatDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="home_symbol">
                        {t('starship.modules.directory.homeSymbol')}
                    </Label>
                    <Input
                        id="home_symbol"
                        {...register('home_symbol')}
                        placeholder="~"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.homeSymbolDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="read_only">
                        {t('starship.modules.directory.readOnlySymbol')}
                    </Label>
                    <Input
                        id="read_only"
                        {...register('read_only')}
                        placeholder="🔒"
                        disabled={disabled}
                        className="font-nerd"
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.readOnlySymbolDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="read_only_style">
                        {t('starship.modules.directory.readOnlyStyle')}
                    </Label>
                    <ColorPickerInput
                        id="read_only_style"
                        value={watch('read_only_style')}
                        onChange={(value) => setValue('read_only_style', value)}
                        placeholder="#ef4444"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.directory.readOnlyStyleDesc')}
                    </p>
                </div>
            </div>
        </form>
    );
}
