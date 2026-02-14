import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Theme, ThemeColor } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    if (OS_PLATFORM !== 'darwin') {
        root.classList.add('beauty-scrollbar');
    }
}

export function applyThemeColor(color: ThemeColor) {
    const root = document.documentElement;

    // 移除所有现有的主题色类
    const themeClasses = Array.from(root.classList).filter((cls) => cls.startsWith('theme-'));
    themeClasses.forEach((cls) => root.classList.remove(cls));

    // 添加新的主题色类 (zinc 是默认主题，不需要额外的类)
    if (color !== 'zinc') {
        root.classList.add(`theme-${color}`);
    }
}
