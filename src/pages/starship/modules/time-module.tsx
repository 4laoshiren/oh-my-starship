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
import { openExternal } from '@/services/cmds';

interface TimeFormData {
    disabled: boolean;
    time_format: string;
    format: string;
    style: string;
    use_12hr: boolean;
}

const defaults: TimeFormData = {
    disabled: true,
    time_format: '%T',
    format: '[$time]($style) ',
    style: '#eab308',
    use_12hr: false,
};

const timeFormatExamples = [
    { label: '24-hour (14:30:00)', value: '%T' },
    { label: '12-hour (02:30:00 PM)', value: '%r' },
    { label: 'Hour:Minute (14:30)', value: '%R' },
    { label: 'Custom (2:30 PM)', value: '%-I:%M %p' },
];

export function TimeModule() {
    const { t } = useTranslation();
    const { data: toml, isLoading } = useStarshipToml();
    const { mutate: saveToml, isPending } = useSaveStarshipToml();

    const { register, handleSubmit, reset, watch, setValue } = useForm<TimeFormData>({
        defaultValues: defaults,
    });

    const disabled = watch('disabled');

    useEffect(() => {
        if (toml) {
            const section = parseTomlSection<TimeFormData>(toml, 'time');
            reset({ ...defaults, ...section });
        }
    }, [toml, reset]);

    const onSubmit = (data: TimeFormData) => {
        if (!toml) return;

        const updatedToml = updateTomlSection(toml, 'time', data);
        saveToml(updatedToml, {
            onSuccess: () => toast.success(t('starship.modules.time.saveSuccess')),
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
                    <h3 className="text-lg font-medium">{t('starship.modules.time.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('starship.modules.time.subtitle')}
                    </p>
                </div>
                <Button type="submit" disabled={isPending} className="sm:self-start">
                    {isPending ? t('common.saving') : t('common.saveChanges')}
                </Button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                <div className="space-y-0.5">
                    <Label htmlFor="disabled">{t('starship.modules.time.hideTime')}</Label>
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.time.hideDescription')}
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
                    <Label htmlFor="time_format">{t('starship.modules.time.timeFormat')}</Label>
                    <Input
                        id="time_format"
                        {...register('time_format')}
                        placeholder="%T"
                        disabled={disabled}
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>{t('starship.modules.time.timeFormatDesc')}</p>
                        <ul className="list-inside list-disc ml-2">
                            {timeFormatExamples.map((example) => (
                                <li key={example.value}>
                                    <code className="bg-muted px-1 rounded">{example.value}</code> -{' '}
                                    {example.label}
                                </li>
                            ))}
                        </ul>
                        {/* 链接：调用系统默认浏览器打开 chrono strftime 文档 */}
                        <p>
                            <Button
                                variant="link"
                                onClick={() =>
                                    openExternal(
                                        'https://docs.rs/chrono/0.4.7/chrono/format/strftime/index.html'
                                    )
                                }
                            >
                                {t('starship.modules.time.chronoStrftimeDoc')}
                            </Button>
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="format">{t('starship.modules.time.displayFormat')}</Label>
                    <Input
                        id="format"
                        {...register('format')}
                        placeholder="[$time]($style) "
                        disabled={disabled}
                        className="font-nerd"
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.time.displayFormatDesc')}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="style">{t('starship.modules.time.style')}</Label>
                    <ColorPickerInput
                        id="style"
                        value={watch('style')}
                        onChange={(value) => setValue('style', value)}
                        placeholder="#eab308"
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('starship.modules.time.styleDesc')}
                    </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                    <div className="space-y-0.5">
                        <Label htmlFor="use_12hr">{t('starship.modules.time.use12hr')}</Label>
                        <p className="text-xs text-muted-foreground">
                            {t('starship.modules.time.use12hrDesc')}
                        </p>
                    </div>
                    <Switch
                        id="use_12hr"
                        checked={watch('use_12hr')}
                        onCheckedChange={(checked) => setValue('use_12hr', checked)}
                        disabled={disabled}
                    />
                </div>
            </div>
        </form>
    );
}
