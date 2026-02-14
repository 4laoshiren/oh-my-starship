import { useEffect } from 'react';
import { applyTheme, applyThemeColor } from '@/lib/utils';
import type { Theme, ThemeColor } from '@/types';

export function useTheme(theme: Theme, themeColor: ThemeColor) {
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        applyThemeColor(themeColor);
    }, [themeColor]);
}
