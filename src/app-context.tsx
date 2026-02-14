import { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from '@/hooks/use-theme';
import type { Settings } from '@/types';
import { updateSettings } from '@/services/cmds';

interface AppContextType {
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
    settings: defaultSettings,
    children,
}: {
    settings: Settings;
    children: React.ReactNode;
}) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useTheme(settings.theme, settings.themeColor);

    const updateSetting = useCallback(
        async <K extends keyof Settings>(key: K, value: Settings[K]) => {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            await updateSettings(newSettings);
        },
        [settings]
    );

    return <AppContext value={{ settings, updateSetting }}>{children}</AppContext>;
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
}
