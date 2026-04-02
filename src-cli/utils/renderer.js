import chalk from 'chalk';

const SAMPLE_MODULE_OUTPUT = {
    directory: '~/oh-my-starship',
    git_branch: ' react-ink',
    git_status: '!1 +2 ?3',
    time: '14:30:25',
    character: '❯',
};

export function renderPreviewLine(settings) {
    const parts = [];
    for (const item of settings.prompt.items) {
        const text = renderPreviewItem(item, settings);
        if (!text) {
            continue;
        }
        parts.push(text);
    }

    return compactSpaces(parts.join('')).trim();
}

export function buildPromptFormat(settings) {
    const parts = [];
    for (const item of settings.prompt.items) {
        if (item.type === 'module') {
            parts.push(`$${item.module}`);
            continue;
        }

        if (item.type === 'separator') {
            const char = resolveSeparatorChar(item, settings);
            parts.push(` ${char} `);
            continue;
        }

        if (item.type === 'text') {
            parts.push(item.value);
        }
    }

    const line = compactSpaces(parts.join('')).trim();
    return line || '$character';
}

export function resolveSeparatorChar(item, settings) {
    const presets = settings.separator.presets;
    const fallbackIndex = settings.separator.activeIndex ?? 0;
    const index = Number.isInteger(item.separatorIndex) ? item.separatorIndex : fallbackIndex;
    const safeIndex = normalizeIndex(index, presets.length);
    return presets[safeIndex] ?? '|';
}

function renderPreviewItem(item, settings) {
    if (item.type === 'separator') {
        const separator = resolveSeparatorChar(item, settings);
        if (item.invertBackground) {
            return ` ${chalk.inverse(separator)} `;
        }
        return ` ${chalk.gray(separator)} `;
    }

    if (item.type === 'text') {
        return item.value;
    }

    if (item.type === 'module') {
        const moduleConfig = settings.modules[item.module];
        if (moduleConfig?.disabled) {
            return '';
        }
        return colorizeModule(
            item.module,
            SAMPLE_MODULE_OUTPUT[item.module] ?? item.module,
            moduleConfig
        );
    }

    return '';
}

function colorizeModule(moduleKey, text, config) {
    const color = typeof config?.style === 'string' ? config.style.trim() : '';
    if (!color) {
        return text;
    }

    if (color.startsWith('#') && color.length >= 4) {
        try {
            return chalk.hex(color)(text);
        } catch {
            return text;
        }
    }

    if (typeof chalk[color] === 'function') {
        return chalk[color](text);
    }

    if (moduleKey === 'character') {
        return chalk.green(text);
    }

    return text;
}

function normalizeIndex(index, length) {
    if (!Number.isInteger(index) || length <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(index, length - 1));
}

function compactSpaces(text) {
    return text.replace(/\s{2,}/g, ' ');
}
