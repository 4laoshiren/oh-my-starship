export const APP_SCHEMA_VERSION = 3;

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
        powerline: createDefaultPowerline(),
        modules: structuredClone(DEFAULT_MODULES),
    };
}

export function createPromptItem(type, data = {}) {
    return {
        id: data.id || createId(),
        type,
        merge: Boolean(data.merge),
        ...data,
    };
}

export const createToken = createPromptItem;

export function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSettings(input) {
    const fallback = createDefaultSettings();
    const record = isRecord(input) ? input : {};
    const prompt = normalizePrompt(record.prompt, fallback.prompt.lines);

    return {
        version: APP_SCHEMA_VERSION,
        schemaUrl:
            typeof record.schemaUrl === 'string' && record.schemaUrl
                ? record.schemaUrl
                : STARSHIP_SCHEMA_URL,
        prompt,
        powerline: normalizePowerline(record.powerline, prompt.lines.length),
        modules: normalizeModules(record.modules),
    };
}

function createDefaultPromptLines() {
    return [
        [
            createPromptItem('styledText', {
                text: '░▒▓',
                style: '#a3aed2',
                merge: true,
            }),
            createPromptItem('styledText', {
                text: '  ',
                style: 'fg:#090c0c bg:#a3aed2',
            }),
            createPromptItem('module', { module: 'hostname' }),
            createPromptItem('module', { module: 'directory' }),
            createPromptItem('module', { module: 'git_branch', merge: true }),
            createPromptItem('module', { module: 'git_status' }),
            createPromptItem('module', { module: 'nodejs', merge: true }),
            createPromptItem('module', { module: 'python', merge: true }),
            createPromptItem('module', { module: 'rust', merge: true }),
            createPromptItem('module', { module: 'golang', merge: true }),
            createPromptItem('module', { module: 'php', merge: true }),
            createPromptItem('module', { module: 'java', merge: true }),
            createPromptItem('module', { module: 'ruby', merge: true }),
            createPromptItem('module', { module: 'c', merge: true }),
            createPromptItem('module', { module: 'swift' }),
            createPromptItem('module', { module: 'time' }),
        ],
        [createPromptItem('module', { module: 'character' })],
    ];
}

function createDefaultPowerline() {
    return {
        enabled: true,
        separators: [''],
        separatorInvertBackground: [false],
        startCaps: ['', ''],
        endCaps: [' ', ''],
    };
}

function normalizePrompt(prompt, fallbackLines) {
    if (isRecord(prompt) && Array.isArray(prompt.lines)) {
        return {
            lines: normalizePromptLines(prompt.lines),
        };
    }

    if (isRecord(prompt) && Array.isArray(prompt.tokens)) {
        return {
            lines: normalizePromptLines(convertLegacyTokensToLines(prompt.tokens)),
        };
    }

    return {
        lines: normalizePromptLines(fallbackLines),
    };
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
            merge: Boolean(item.merge),
        });
    }

    if (item.type === 'styledText') {
        return createPromptItem('styledText', {
            id: item.id,
            text: typeof item.text === 'string' ? item.text : '',
            style: typeof item.style === 'string' ? item.style : 'none',
            merge: Boolean(item.merge),
        });
    }

    if (item.type === 'rawText') {
        return createPromptItem('rawText', {
            id: item.id,
            text: typeof item.text === 'string' ? item.text : '',
            merge: Boolean(item.merge),
        });
    }

    return null;
}

function normalizePowerline(powerline, lineCount) {
    const fallback = createDefaultPowerline();
    const record = isRecord(powerline) ? powerline : {};

    return {
        enabled: typeof record.enabled === 'boolean' ? record.enabled : fallback.enabled,
        separators: normalizeStringArray(record.separators, fallback.separators, 1),
        separatorInvertBackground: normalizeBooleanArray(
            record.separatorInvertBackground,
            fallback.separatorInvertBackground,
            1
        ),
        startCaps: normalizeStringArray(record.startCaps, fallback.startCaps, lineCount),
        endCaps: normalizeStringArray(record.endCaps, fallback.endCaps, lineCount),
    };
}

function normalizeModules(modules) {
    const next = structuredClone(DEFAULT_MODULES);
    if (!isRecord(modules)) {
        return next;
    }

    for (const [moduleKey, moduleConfig] of Object.entries(modules)) {
        if (!isRecord(moduleConfig)) {
            continue;
        }
        next[moduleKey] = {
            ...(next[moduleKey] || {}),
            ...moduleConfig,
        };
    }

    return next;
}

function normalizeStringArray(value, fallback, minLength) {
    const source = Array.isArray(value) ? value : fallback;
    const next = source.filter((entry) => typeof entry === 'string').map((entry) => entry);

    while (next.length < minLength) {
        next.push(fallback[next.length] ?? '');
    }

    return next;
}

function normalizeBooleanArray(value, fallback, minLength) {
    const source = Array.isArray(value) ? value : fallback;
    const next = source.filter((entry) => typeof entry === 'boolean').map((entry) => entry);

    while (next.length < minLength) {
        next.push(Boolean(fallback[next.length]));
    }

    return next;
}

function convertLegacyTokensToLines(tokens) {
    const lines = [[]];
    let currentLine = lines[0];
    let hadExplicitFrameSinceLastItem = false;

    for (const token of tokens) {
        if (!isRecord(token) || typeof token.type !== 'string') {
            continue;
        }

        if (token.type === 'newline') {
            currentLine = [];
            lines.push(currentLine);
            hadExplicitFrameSinceLastItem = false;
            continue;
        }

        if (isLegacyFrameToken(token)) {
            if (currentLine.length > 0) {
                hadExplicitFrameSinceLastItem = true;
            }
            continue;
        }

        const item = normalizePromptItem(token);
        if (!item) {
            continue;
        }

        if (currentLine.length > 0 && !hadExplicitFrameSinceLastItem) {
            const previous = currentLine[currentLine.length - 1];
            if (previous) {
                previous.merge = true;
            }
        }

        currentLine.push(item);
        hadExplicitFrameSinceLastItem = false;
    }

    return lines;
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
