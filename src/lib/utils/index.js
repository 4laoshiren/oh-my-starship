import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 定义utility function: cn
// 具体说明见: https://www.youtube.com/watch?v=re2JFITR7TI
// Define the cn utility function.
// For more guidance, see: https://www.youtube.com/watch?v=re2JFITR7TI
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function apply_theme(theme) {
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

export function apply_theme_color(color) {
    const root = document.documentElement;

    const theme_classes = Array.from(root.classList).filter((cls) => cls.startsWith('theme-'));
    theme_classes.forEach((cls) => root.classList.remove(cls));

    if (color !== 'zinc') {
        root.classList.add(`theme-${color}`);
    }
}
