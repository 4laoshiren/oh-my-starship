import { Moon, Sun, Monitor, Languages, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/app-context';
import { Themes, ThemeColors, type Theme, type ThemeColor } from '@/types';
import { cn } from '@/lib/utils';

// 定义每种主题色的显示颜色
const themeColorDisplayColors: Record<ThemeColor, string> = {
    zinc: '#27272a',
    slate: '#64748b',
    red: '#dc2626',
    rose: '#e11d48',
    orange: '#f97316',
    green: '#16a34a',
    blue: '#2563eb',
    yellow: '#eab308',
    violet: '#7c3aed',
};

export function Component() {
    const { t, i18n } = useTranslation();
    const { settings, updateSetting } = useAppContext();

    const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
        {
            value: Themes.Light,
            label: t('settings.themes.light'),
            icon: <Sun className="h-4 w-4" />,
        },
        {
            value: Themes.Dark,
            label: t('settings.themes.dark'),
            icon: <Moon className="h-4 w-4" />,
        },
        {
            value: Themes.System,
            label: t('settings.themes.system'),
            icon: <Monitor className="h-4 w-4" />,
        },
    ];

    const themeColorOptions: { value: ThemeColor; label: string }[] = [
        { value: ThemeColors.Zinc, label: t('settings.themeColors.zinc') },
        { value: ThemeColors.Slate, label: t('settings.themeColors.slate') },
        { value: ThemeColors.Red, label: t('settings.themeColors.red') },
        { value: ThemeColors.Rose, label: t('settings.themeColors.rose') },
        { value: ThemeColors.Orange, label: t('settings.themeColors.orange') },
        { value: ThemeColors.Green, label: t('settings.themeColors.green') },
        { value: ThemeColors.Blue, label: t('settings.themeColors.blue') },
        { value: ThemeColors.Yellow, label: t('settings.themeColors.yellow') },
        { value: ThemeColors.Violet, label: t('settings.themeColors.violet') },
    ];

    const languageOptions = [
        { value: 'en', label: t('settings.languages.en') },
        { value: 'zh-TW', label: t('settings.languages.zh-TW') },
        { value: 'zh', label: t('settings.languages.zh') },
    ];

    const handleLanguageChange = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">{t('settings.title')}</h2>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">{t('settings.theme')}</label>
                    <div className="mt-3 flex gap-2">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updateSetting('theme', option.value)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                    settings.theme === option.value
                                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                        : 'border-border bg-card hover:border-primary/30 hover:bg-accent active:scale-[0.98]'
                                )}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">{t('settings.themeColor')}</label>
                    <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-9">
                        {themeColorOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updateSetting('themeColor', option.value)}
                                className={cn(
                                    'group flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-card p-2.5 transition-all duration-200',
                                    settings.themeColor === option.value
                                        ? 'border-primary/50 ring-2 ring-primary/20 shadow-sm'
                                        : 'border-border hover:border-primary/30 hover:shadow-sm active:scale-[0.98]'
                                )}
                                title={option.label}
                            >
                                <div
                                    className={cn(
                                        'relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200',
                                        settings.themeColor !== option.value &&
                                            'group-hover:scale-110'
                                    )}
                                    style={{
                                        backgroundColor: themeColorDisplayColors[option.value],
                                    }}
                                >
                                    {settings.themeColor === option.value && (
                                        <Check className="h-4 w-4 text-white drop-shadow-sm" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-xs transition-colors',
                                        settings.themeColor === option.value
                                            ? 'font-medium text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">{t('settings.language')}</label>
                    <div className="mt-3 flex gap-2">
                        {languageOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleLanguageChange(option.value)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                    i18n.language === option.value
                                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                        : 'border-border bg-card hover:border-primary/30 hover:bg-accent active:scale-[0.98]'
                                )}
                            >
                                <Languages className="h-4 w-4" />
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
