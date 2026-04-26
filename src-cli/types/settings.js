export const APP_SCHEMA_VERSION = 4;

export const STARSHIP_SCHEMA_URL = 'https://starship.rs/config-schema.json';

export const MODULE_ORDER = [
    'hostname',
    'directory',
    'git_branch',
    'git_status',
    'nodejs',
    'python',
    'rust',
    'golang',
    'php',
    'java',
    'ruby',
    'c',
    'swift',
    'time',
    'character',
];

export const LANGUAGE_MODULES = [
    'nodejs',
    'python',
    'rust',
    'golang',
    'php',
    'java',
    'ruby',
    'c',
    'swift',
];

export const MODULE_GROUPS = [
    { key: 'identity', label: 'Identity', modules: ['hostname', 'directory'] },
    { key: 'git', label: 'Git', modules: ['git_branch', 'git_status'] },
    { key: 'languages', label: 'Languages', modules: LANGUAGE_MODULES },
    { key: 'prompt', label: 'Prompt End', modules: ['time', 'character'] },
];

export const MODULE_SCHEMAS = {
    hostname: {
        label: 'Hostname',
        fields: [
            { key: 'ssh_only', label: 'ssh_only', type: 'boolean' },
            { key: 'style', label: 'style', type: 'string' },
            { key: 'format', label: 'format', type: 'long-string' },
            { key: 'disabled', label: 'disabled', type: 'boolean' },
        ],
    },
    directory: {
        label: 'Directory',
        fields: [
            { key: 'style', label: 'style', type: 'string' },
            { key: 'format', label: 'format', type: 'long-string' },
            { key: 'truncation_length', label: 'truncation_length', type: 'number' },
            { key: 'truncation_symbol', label: 'truncation_symbol', type: 'string' },
            { key: 'substitutions', label: 'substitutions', type: 'map' },
            { key: 'disabled', label: 'disabled', type: 'boolean' },
        ],
    },
    git_branch: {
        label: 'Git Branch',
        fields: [
            { key: 'symbol', label: 'symbol', type: 'string' },
            { key: 'style', label: 'style', type: 'string' },
            { key: 'format', label: 'format', type: 'long-string' },
            { key: 'disabled', label: 'disabled', type: 'boolean' },
        ],
    },
    git_status: {
        label: 'Git Status',
        fields: [
            { key: 'style', label: 'style', type: 'string' },
            { key: 'format', label: 'format', type: 'long-string' },
            { key: 'ahead', label: 'ahead', type: 'string' },
            { key: 'behind', label: 'behind', type: 'string' },
            { key: 'modified', label: 'modified', type: 'string' },
            { key: 'staged', label: 'staged', type: 'string' },
            { key: 'deleted', label: 'deleted', type: 'string' },
            { key: 'untracked', label: 'untracked', type: 'string' },
            { key: 'disabled', label: 'disabled', type: 'boolean' },
        ],
    },
    time: {
        label: 'Time',
        fields: [
            { key: 'disabled', label: 'disabled', type: 'boolean' },
            { key: 'time_format', label: 'time_format', type: 'string' },
            { key: 'style', label: 'style', type: 'string' },
            { key: 'format', label: 'format', type: 'long-string' },
            { key: 'use_12hr', label: 'use_12hr', type: 'boolean' },
        ],
    },
    character: {
        label: 'Character',
        fields: [
            { key: 'success_symbol', label: 'success_symbol', type: 'string' },
            { key: 'error_symbol', label: 'error_symbol', type: 'string' },
            { key: 'disabled', label: 'disabled', type: 'boolean' },
        ],
    },
};

for (const moduleKey of LANGUAGE_MODULES) {
    MODULE_SCHEMAS[moduleKey] = {
        label: moduleKey,
        fields: [
            { key: 'symbol', label: 'symbol', type: 'string' },
            { key: 'style', label: 'style', type: 'string' },
            { key: 'format', label: 'format', type: 'long-string' },
            { key: 'disabled', label: 'disabled', type: 'boolean' },
        ],
    };
}

export const SEPARATOR_PRESETS = ['', '', '', '', '', '', '', ''];
export const START_CAP_PRESETS = ['', '', '', ''];
export const END_CAP_PRESETS = ['', '', '', ''];

export const DEFAULT_FORMAT = [
    '[░▒▓](#a3aed2)',
    '[  ](fg:#090c0c bg:#a3aed2)',
    '[](fg:#a3aed2 bg:#8fa7dc)',
    '$hostname',
    '[](fg:#8fa7dc bg:#769ff0)',
    '$directory',
    '[](fg:#769ff0 bg:#394260)',
    '$git_branch',
    '$git_status',
    '[](fg:#394260 bg:#212736)',
    '$nodejs',
    '$python',
    '$rust',
    '$golang',
    '$php',
    '$java',
    '$ruby',
    '$c',
    '$swift',
    '[](fg:#212736 bg:#1d2230)',
    '$time',
    '[ ](fg:#1d2230)',
    '\n',
    '$character',
].join('');

export const DEFAULT_MODULES = {
    hostname: {
        ssh_only: false,
        style: 'bg:#8fa7dc',
        format: '[[ $hostname ](fg:#e3e5e5 bg:#8fa7dc)]($style)',
    },
    directory: {
        style: 'fg:#e3e5e5 bg:#769ff0',
        format: '[ $path ]($style)',
        truncation_length: 3,
        truncation_symbol: '…/',
        substitutions: {
            Documents: '󰈙 ',
            Downloads: ' ',
            Music: ' ',
            Pictures: ' ',
        },
    },
    git_branch: {
        symbol: '',
        style: 'bg:#394260',
        format: '[[ $symbol $branch ](fg:#769ff0 bg:#394260)]($style)',
    },
    git_status: {
        style: 'bg:#394260',
        format: '[[($all_status$ahead_behind )](fg:#769ff0 bg:#394260)]($style)',
    },
    nodejs: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    python: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    rust: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    golang: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    php: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    java: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    ruby: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    c: {
        symbol: '',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    swift: {
        symbol: '\ue755',
        style: 'bg:#212736',
        format: '[[ $symbol ($version) ](fg:#769ff0 bg:#212736)]($style)',
    },
    time: {
        disabled: false,
        time_format: '%A %m-%d %H:%M',
        style: 'bg:#1d2230',
        format: '[[  $time ](fg:#a0a9cb bg:#1d2230)]($style)',
    },
    character: {
        success_symbol: '👻👻',
        error_symbol: '💦💦',
    },
};

export function createDefaultSettings() {
    return {
        version: APP_SCHEMA_VERSION,
        schemaUrl: STARSHIP_SCHEMA_URL,
        prompt: {
            lines: createDefaultPromptLines(),
        },
        modules: structuredClone(DEFAULT_MODULES),
    };
}

export function createPromptItem(type, data = {}) {
    const { id, merge, ...rest } = data;

    if (type === 'frame') {
        return {
            id: id || createId(),
            type,
            glyph: typeof data.glyph === 'string' ? data.glyph : data.text || '',
            invert: Boolean(data.invert),
        };
    }

    return {
        id: id || createId(),
        type,
        ...rest,
    };
}

export const createToken = createPromptItem;

export function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSettings(input) {
    const fallback = createDefaultSettings();
    const record = isRecord(input) ? input : {};
    const prompt = normalizePrompt(record.prompt, fallback.prompt.lines, record.powerline);

    return {
        version: APP_SCHEMA_VERSION,
        schemaUrl:
            typeof record.schemaUrl === 'string' && record.schemaUrl
                ? record.schemaUrl
                : STARSHIP_SCHEMA_URL,
        prompt,
        modules: normalizeModules(record.modules),
    };
}

function createDefaultPromptLines() {
    return [
        [
            createPromptItem('styledText', {
                text: '░▒▓',
                style: '#a3aed2',
            }),
            createPromptItem('styledText', {
                text: '  ',
                style: 'fg:#090c0c bg:#a3aed2',
            }),
            createPromptItem('frame', { glyph: '' }),
            createPromptItem('module', { module: 'hostname' }),
            createPromptItem('frame', { glyph: '' }),
            createPromptItem('module', { module: 'directory' }),
            createPromptItem('frame', { glyph: '' }),
            createPromptItem('module', { module: 'git_branch' }),
            createPromptItem('module', { module: 'git_status' }),
            createPromptItem('frame', { glyph: '' }),
            createPromptItem('module', { module: 'nodejs' }),
            createPromptItem('module', { module: 'python' }),
            createPromptItem('module', { module: 'rust' }),
            createPromptItem('module', { module: 'golang' }),
            createPromptItem('module', { module: 'php' }),
            createPromptItem('module', { module: 'java' }),
            createPromptItem('module', { module: 'ruby' }),
            createPromptItem('module', { module: 'c' }),
            createPromptItem('module', { module: 'swift' }),
            createPromptItem('frame', { glyph: '' }),
            createPromptItem('module', { module: 'time' }),
            createPromptItem('frame', { glyph: ' ' }),
        ],
        [createPromptItem('module', { module: 'character' })],
    ];
}

function normalizePrompt(prompt, fallbackLines, legacyPowerline) {
    const sourceFormat = resolvePromptSourceFormat(prompt);

    if (isRecord(prompt) && Array.isArray(prompt.lines)) {
        if (shouldMigrateLegacyPowerline(prompt.lines, legacyPowerline)) {
            return createPromptState(
                normalizePromptLines(
                    convertLegacyPowerlineLinesToExplicitFrames(prompt.lines, legacyPowerline)
                ),
                sourceFormat
            );
        }

        return createPromptState(normalizePromptLines(prompt.lines), sourceFormat);
    }

    if (isRecord(prompt) && Array.isArray(prompt.tokens)) {
        return createPromptState(normalizePromptLines(convertLegacyTokensToLines(prompt.tokens)));
    }

    return createPromptState(normalizePromptLines(fallbackLines));
}

function normalizePromptLines(lines) {
    const nextLines = [];

    for (const line of Array.isArray(lines) ? lines : []) {
        if (!Array.isArray(line)) {
            continue;
        }

        const nextLine = [];
        for (const item of line) {
            const normalizedItem = normalizePromptItem(item);
            if (normalizedItem) {
                nextLine.push(normalizedItem);
            }
        }

        nextLines.push(nextLine);
    }

    return nextLines.length > 0 ? nextLines : createDefaultPromptLines();
}

function normalizePromptItem(item) {
    if (!isRecord(item) || typeof item.type !== 'string') {
        return null;
    }

    if (item.type === 'module' && typeof item.module === 'string') {
        return createPromptItem('module', {
            id: item.id,
            module: item.module,
        });
    }

    if (item.type === 'styledText') {
        return createPromptItem('styledText', {
            id: item.id,
            text: typeof item.text === 'string' ? item.text : '',
            style: typeof item.style === 'string' ? item.style : 'none',
        });
    }

    if (item.type === 'rawText') {
        return createPromptItem('rawText', {
            id: item.id,
            text: typeof item.text === 'string' ? item.text : '',
        });
    }

    if (item.type === 'frame') {
        const glyph =
            typeof item.glyph === 'string'
                ? item.glyph
                : typeof item.text === 'string'
                  ? item.text
                  : '';

        return createPromptItem('frame', {
            id: item.id,
            glyph,
            invert: Boolean(item.invert),
        });
    }

    return null;
}

function normalizeModules(modules) {
    const next = {};
    if (!isRecord(modules)) {
        return next;
    }

    for (const [moduleKey, moduleConfig] of Object.entries(modules)) {
        if (!isRecord(moduleConfig)) {
            continue;
        }
        next[moduleKey] = {
            ...moduleConfig,
        };
    }

    return next;
}

function convertLegacyTokensToLines(tokens) {
    const lines = [[]];
    let currentLine = lines[0];

    for (const token of tokens) {
        if (!isRecord(token) || typeof token.type !== 'string') {
            continue;
        }

        if (token.type === 'newline') {
            currentLine = [];
            lines.push(currentLine);
            continue;
        }

        if (isLegacyFrameToken(token)) {
            currentLine.push(
                createPromptItem('frame', {
                    id: token.id,
                    glyph: token.text,
                    invert: Boolean(token.invert),
                })
            );
            continue;
        }

        const item = normalizePromptItem(token);
        if (!item) {
            continue;
        }

        currentLine.push(item);
    }

    return lines;
}

function shouldMigrateLegacyPowerline(lines, legacyPowerline) {
    if (!Array.isArray(lines)) {
        return false;
    }

    const hasExplicitFrame = lines.some((line) =>
        Array.isArray(line) ? line.some((item) => item?.type === 'frame') : false
    );
    if (hasExplicitFrame) {
        return false;
    }

    const hasLegacyMerge = lines.some((line) =>
        Array.isArray(line) ? line.some((item) => isRecord(item) && 'merge' in item) : false
    );

    return hasLegacyMerge || isRecord(legacyPowerline);
}

function convertLegacyPowerlineLinesToExplicitFrames(lines, legacyPowerline) {
    const powerline = normalizeLegacyPowerline(legacyPowerline);
    const nextLines = [];
    let separatorSlotIndex = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = Array.isArray(lines[lineIndex]) ? lines[lineIndex] : [];
        const nextLine = [];

        if (powerline.enabled && powerline.startCaps[lineIndex]) {
            nextLine.push(createPromptItem('frame', { glyph: powerline.startCaps[lineIndex] }));
        }

        for (let itemIndex = 0; itemIndex < line.length; itemIndex += 1) {
            const rawItem = line[itemIndex];
            const item = normalizePromptItem(rawItem);
            if (!item) {
                continue;
            }

            nextLine.push(item);

            if (!powerline.enabled || itemIndex >= line.length - 1 || rawItem?.merge) {
                continue;
            }

            const glyph = resolveLegacyPowerlineEntry(
                powerline.separators,
                separatorSlotIndex,
                ''
            );
            const invert = Boolean(
                resolveLegacyPowerlineEntry(
                    powerline.separatorInvertBackground,
                    separatorSlotIndex,
                    false
                )
            );

            nextLine.push(createPromptItem('frame', { glyph, invert }));
            separatorSlotIndex += 1;
        }

        if (powerline.enabled && powerline.endCaps[lineIndex]) {
            nextLine.push(createPromptItem('frame', { glyph: powerline.endCaps[lineIndex] }));
        }

        nextLines.push(nextLine);
    }

    return nextLines;
}

function normalizeLegacyPowerline(powerline) {
    const record = isRecord(powerline) ? powerline : {};

    return {
        enabled: typeof record.enabled === 'boolean' ? record.enabled : false,
        separators: normalizeLegacyArray(record.separators, ['']),
        separatorInvertBackground: normalizeLegacyArray(record.separatorInvertBackground, [false]),
        startCaps: normalizeLegacyArray(record.startCaps, []),
        endCaps: normalizeLegacyArray(record.endCaps, []),
    };
}

function normalizeLegacyArray(value, fallback) {
    return (Array.isArray(value) ? value : fallback).slice();
}

function resolveLegacyPowerlineEntry(values, index, fallback) {
    if (!Array.isArray(values) || values.length === 0) {
        return fallback;
    }

    return values[Math.min(index, values.length - 1)] ?? values[0] ?? fallback;
}

function isLegacyFrameToken(token) {
    if (token.type !== 'styledText' || typeof token.text !== 'string') {
        return false;
    }

    const trimmed = token.text.trim();
    if (!trimmed) {
        return false;
    }

    for (const char of trimmed) {
        if (!SEPARATOR_PRESETS.includes(char) && !START_CAP_PRESETS.includes(char)) {
            return false;
        }
    }

    return true;
}

function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function createPromptState(lines, sourceFormat) {
    if (sourceFormat === undefined) {
        return { lines };
    }

    return {
        lines,
        sourceFormat,
    };
}

function resolvePromptSourceFormat(prompt) {
    if (!isRecord(prompt) || !('sourceFormat' in prompt)) {
        return undefined;
    }

    if (prompt.sourceFormat === null) {
        return null;
    }

    return typeof prompt.sourceFormat === 'string' ? prompt.sourceFormat : undefined;
}
