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
