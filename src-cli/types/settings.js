export const APP_SCHEMA_VERSION = 1;

export const MODULE_KEYS = ['directory', 'git_branch', 'git_status', 'time', 'character'];

export function createDefaultSettings() {
    return {
        version: APP_SCHEMA_VERSION,
        prompt: {
            items: [
                createModuleItem('directory'),
                createSeparatorItem(0),
                createModuleItem('git_branch'),
                createSeparatorItem(0),
                createModuleItem('git_status'),
                createSeparatorItem(0),
                createModuleItem('character'),
            ],
        },
        separator: {
            presets: ['|', '❯', '', ''],
            activeIndex: 0,
        },
        modules: {
            character: {
                success_symbol: '❯',
                error_symbol: '❯',
                disabled: false,
            },
            directory: {
                truncation_length: 3,
                truncation_symbol: '…',
                style: 'cyan',
                disabled: false,
            },
            git_branch: {
                symbol: ' ',
                style: 'magenta',
                disabled: false,
            },
            git_status: {
                style: 'red',
                ahead: '⇡${count}',
                behind: '⇣${count}',
                modified: '!${count}',
                staged: '+${count}',
                deleted: '✘${count}',
                untracked: '?${count}',
                disabled: false,
            },
            time: {
                disabled: true,
                time_format: '%T',
                style: 'yellow',
                use_12hr: false,
            },
        },
    };
}

export function createModuleItem(module) {
    return {
        id: createItemId(),
        type: 'module',
        module,
    };
}

export function createSeparatorItem(separatorIndex = 0) {
    return {
        id: createItemId(),
        type: 'separator',
        separatorIndex,
        invertBackground: false,
    };
}

export function createTextItem(value = ' ') {
    return {
        id: createItemId(),
        type: 'text',
        value,
    };
}

export function createItemId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSettings(input) {
    const fallback = createDefaultSettings();
    if (!input || typeof input !== 'object') {
        return fallback;
    }

    const normalized = {
        ...fallback,
        ...input,
        prompt: {
            ...fallback.prompt,
            ...(isRecord(input.prompt) ? input.prompt : {}),
        },
        separator: {
            ...fallback.separator,
            ...(isRecord(input.separator) ? input.separator : {}),
        },
        modules: {
            ...fallback.modules,
            ...(isRecord(input.modules) ? input.modules : {}),
        },
    };

    normalized.prompt.items = normalizePromptItems(normalized.prompt.items, fallback);
    normalized.separator.presets = normalizeSeparatorPresets(
        normalized.separator.presets,
        fallback
    );
    normalized.separator.activeIndex = normalizeActiveSeparatorIndex(
        normalized.separator.activeIndex,
        normalized.separator.presets.length
    );
    normalized.modules = normalizeModules(normalized.modules, fallback.modules);
    normalized.version = APP_SCHEMA_VERSION;

    return normalized;
}

function normalizePromptItems(items, fallbackSettings) {
    if (!Array.isArray(items) || items.length === 0) {
        return fallbackSettings.prompt.items;
    }

    const next = [];
    for (const item of items) {
        if (!isRecord(item) || typeof item.type !== 'string') {
            continue;
        }

        if (item.type === 'module' && MODULE_KEYS.includes(item.module)) {
            next.push({
                id: typeof item.id === 'string' ? item.id : createItemId(),
                type: 'module',
                module: item.module,
            });
            continue;
        }

        if (item.type === 'separator') {
            next.push({
                id: typeof item.id === 'string' ? item.id : createItemId(),
                type: 'separator',
                separatorIndex: Number.isInteger(item.separatorIndex) ? item.separatorIndex : 0,
                invertBackground: Boolean(item.invertBackground),
            });
            continue;
        }

        if (item.type === 'text') {
            next.push({
                id: typeof item.id === 'string' ? item.id : createItemId(),
                type: 'text',
                value: typeof item.value === 'string' ? item.value : '',
            });
        }
    }

    return next.length > 0 ? next : fallbackSettings.prompt.items;
}

function normalizeSeparatorPresets(presets, fallbackSettings) {
    if (!Array.isArray(presets)) {
        return fallbackSettings.separator.presets;
    }

    const next = presets
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

    return next.length > 0 ? next : fallbackSettings.separator.presets;
}

function normalizeActiveSeparatorIndex(activeIndex, presetLength) {
    if (!Number.isInteger(activeIndex)) {
        return 0;
    }

    if (presetLength <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(activeIndex, presetLength - 1));
}

function normalizeModules(modules, fallbackModules) {
    const next = { ...fallbackModules };
    for (const key of MODULE_KEYS) {
        if (!isRecord(modules[key])) {
            continue;
        }
        next[key] = {
            ...fallbackModules[key],
            ...modules[key],
        };
    }
    return next;
}

function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
