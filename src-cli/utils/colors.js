import fs from 'node:fs';
import path from 'node:path';

const NAMED_COLOR_DEFINITIONS = [
    { value: 'black', label: 'Black', index: 0 },
    { value: 'red', label: 'Red', index: 1 },
    { value: 'green', label: 'Green', index: 2 },
    { value: 'yellow', label: 'Yellow', index: 3 },
    { value: 'blue', label: 'Blue', index: 4 },
    { value: 'purple', label: 'Purple', index: 5 },
    { value: 'cyan', label: 'Cyan', index: 6 },
    { value: 'white', label: 'White', index: 7 },
    { value: 'bright-black', label: 'Bright Black', index: 8 },
    { value: 'bright-red', label: 'Bright Red', index: 9 },
    { value: 'bright-green', label: 'Bright Green', index: 10 },
    { value: 'bright-yellow', label: 'Bright Yellow', index: 11 },
    { value: 'bright-blue', label: 'Bright Blue', index: 12 },
    { value: 'bright-purple', label: 'Bright Purple', index: 13 },
    { value: 'bright-cyan', label: 'Bright Cyan', index: 14 },
    { value: 'bright-white', label: 'Bright White', index: 15 },
];

const NAMED_COLOR_LABELS = new Map(
    NAMED_COLOR_DEFINITIONS.map((entry) => [entry.value, entry.label])
);

const DEFAULT_ANSI_16_HEX = [
    '#000000',
    '#800000',
    '#008000',
    '#808000',
    '#000080',
    '#800080',
    '#008080',
    '#c0c0c0',
    '#808080',
    '#ff0000',
    '#00ff00',
    '#ffff00',
    '#0000ff',
    '#ff00ff',
    '#00ffff',
    '#ffffff',
];

const WINDOWS_TERMINAL_COLOR_KEYS = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'purple',
    'cyan',
    'white',
    'brightBlack',
    'brightRed',
    'brightGreen',
    'brightYellow',
    'brightBlue',
    'brightPurple',
    'brightCyan',
    'brightWhite',
];

let cachedAnsi16HexPalette;

export function getNamedColorOptions() {
    const palette = getAnsi16HexPalette();
    return NAMED_COLOR_DEFINITIONS.map((entry) => ({
        value: entry.value,
        label: entry.label,
        hex: palette[entry.index],
    }));
}

export function cycleNamedColor(currentValue, step) {
    const options = getNamedColorOptions();
    const currentIndex = options.findIndex((option) => option.value === currentValue);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    return options[normalizeCircularIndex(startIndex + step, options.length)]?.value || 'white';
}

export function displayColorName(value) {
    if (!value) {
        return '(none)';
    }

    const normalized = normalizeColorValue(value);
    const namedColorLabel = NAMED_COLOR_LABELS.get(normalized);
    if (namedColorLabel) {
        return namedColorLabel;
    }

    if (normalized.startsWith('#')) {
        return normalized.toUpperCase();
    }

    if (/^\d+$/.test(normalized)) {
        return `ANSI ${normalized}`;
    }

    if (normalized.startsWith('ansi256:')) {
        return `ANSI ${normalized.slice('ansi256:'.length)}`;
    }

    if (normalized.startsWith('hex:')) {
        return `#${normalized.slice('hex:'.length).toUpperCase()}`;
    }

    return normalized;
}

export function colorToInk(value) {
    const normalized = normalizeColorValue(value);
    if (!normalized) {
        return undefined;
    }

    const namedColorHex = namedColorValueToHex(normalized);
    if (namedColorHex) {
        return namedColorHex;
    }

    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
        return normalized;
    }

    if (/^\d+$/.test(normalized)) {
        return ansi256ToHex(Number.parseInt(normalized, 10));
    }

    if (normalized.startsWith('ansi256:')) {
        return ansi256ToHex(Number.parseInt(normalized.slice('ansi256:'.length), 10));
    }

    if (/^hex:[0-9a-f]{6}$/i.test(normalized)) {
        return `#${normalized.slice('hex:'.length)}`;
    }

    return undefined;
}

export function normalizeHexInput(input) {
    const cleaned = String(input || '')
        .trim()
        .replace(/^#/, '')
        .toUpperCase();

    if (!/^[0-9A-F]{6}$/.test(cleaned)) {
        return null;
    }

    return `#${cleaned}`;
}

export function normalizeAnsiInput(input) {
    if (!/^\d{1,3}$/.test(String(input || ''))) {
        return null;
    }

    const code = Number.parseInt(input, 10);
    if (!Number.isInteger(code) || code < 0 || code > 255) {
        return null;
    }

    return String(code);
}

export function ansi256ToHex(code) {
    const safeCode = clamp(Number.isFinite(code) ? code : 15, 0, 255);
    const ansi16Hex = getAnsi16HexPalette();

    if (safeCode < 16) {
        return ansi16Hex[safeCode];
    }

    if (safeCode >= 232) {
        const level = 8 + (safeCode - 232) * 10;
        return rgbToHex(level, level, level);
    }

    const paletteIndex = safeCode - 16;
    const red = Math.floor(paletteIndex / 36);
    const green = Math.floor((paletteIndex % 36) / 6);
    const blue = paletteIndex % 6;

    return rgbToHex(ansiCubeLevel(red), ansiCubeLevel(green), ansiCubeLevel(blue));
}

export function sgr16ToHex(code) {
    const ansi16Hex = getAnsi16HexPalette();

    if (code >= 30 && code <= 37) {
        return ansi16Hex[code - 30];
    }

    if (code >= 90 && code <= 97) {
        return ansi16Hex[code - 90 + 8];
    }

    if (code >= 40 && code <= 47) {
        return ansi16Hex[code - 40];
    }

    if (code >= 100 && code <= 107) {
        return ansi16Hex[code - 100 + 8];
    }

    return undefined;
}

export function normalizeColorValue(value) {
    return String(value || '').trim();
}

function namedColorValueToHex(value) {
    const definition = NAMED_COLOR_DEFINITIONS.find((entry) => entry.value === value);
    if (!definition) {
        return undefined;
    }

    return getAnsi16HexPalette()[definition.index];
}

function getAnsi16HexPalette() {
    if (!cachedAnsi16HexPalette) {
        cachedAnsi16HexPalette = resolveAnsi16HexPalette();
    }

    return cachedAnsi16HexPalette;
}

function resolveAnsi16HexPalette() {
    return resolveWindowsTerminalAnsiPalette() || DEFAULT_ANSI_16_HEX;
}

function resolveWindowsTerminalAnsiPalette() {
    if (process.platform !== 'win32') {
        return null;
    }

    const settings = readWindowsTerminalSettings();
    if (!settings) {
        return null;
    }

    const schemeName = resolveWindowsTerminalSchemeName(settings);
    if (!schemeName) {
        return null;
    }

    const scheme = Array.isArray(settings.schemes)
        ? settings.schemes.find((entry) => entry?.name === schemeName)
        : null;
    if (!scheme || typeof scheme !== 'object') {
        return null;
    }

    return WINDOWS_TERMINAL_COLOR_KEYS.map(
        (key, index) => normalizeHexValue(scheme[key]) || DEFAULT_ANSI_16_HEX[index]
    );
}

function resolveWindowsTerminalSchemeName(settings) {
    const activeProfileId = normalizeGuid(process.env.WT_PROFILE_ID);
    const defaultProfileId = normalizeGuid(settings.defaultProfile);

    return (
        resolveProfileSchemeName(settings, activeProfileId) ||
        resolveProfileSchemeName(settings, defaultProfileId) ||
        normalizeNonEmptyString(settings?.profiles?.defaults?.colorScheme)
    );
}

function resolveProfileSchemeName(settings, profileId) {
    if (!profileId) {
        return null;
    }

    const defaultsSchemeName = normalizeNonEmptyString(settings?.profiles?.defaults?.colorScheme);
    const profile = findWindowsTerminalProfile(settings, profileId);
    if (!profile) {
        return defaultsSchemeName;
    }

    return normalizeNonEmptyString(profile.colorScheme) || defaultsSchemeName;
}

function findWindowsTerminalProfile(settings, profileId) {
    const profiles = Array.isArray(settings?.profiles?.list) ? settings.profiles.list : [];
    return profiles.find((profile) => normalizeGuid(profile?.guid) === profileId) || null;
}

function readWindowsTerminalSettings() {
    for (const filePath of getWindowsTerminalSettingsPaths()) {
        const contents = tryReadFile(filePath);
        if (!contents) {
            continue;
        }

        const parsed = tryParseJsonc(contents);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    }

    return null;
}

function getWindowsTerminalSettingsPaths() {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
        return [];
    }

    return [
        path.join(
            localAppData,
            'Packages',
            'Microsoft.WindowsTerminal_8wekyb3d8bbwe',
            'LocalState',
            'settings.json'
        ),
        path.join(
            localAppData,
            'Packages',
            'Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe',
            'LocalState',
            'settings.json'
        ),
        path.join(localAppData, 'Microsoft', 'Windows Terminal', 'settings.json'),
    ];
}

function tryReadFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
}

function tryParseJsonc(value) {
    try {
        const normalized = String(value || '').replace(/^\uFEFF/, '');
        return JSON.parse(removeTrailingCommas(stripJsonComments(normalized)));
    } catch {
        return null;
    }
}

function stripJsonComments(value) {
    let result = '';
    let inString = false;
    let escaped = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let index = 0; index < value.length; index += 1) {
        const current = value[index];
        const next = value[index + 1];

        if (inLineComment) {
            if (current === '\n') {
                inLineComment = false;
                result += current;
            }
            continue;
        }

        if (inBlockComment) {
            if (current === '*' && next === '/') {
                inBlockComment = false;
                index += 1;
            }
            continue;
        }

        if (inString) {
            result += current;
            if (escaped) {
                escaped = false;
                continue;
            }

            if (current === '\\') {
                escaped = true;
                continue;
            }

            if (current === '"') {
                inString = false;
            }
            continue;
        }

        if (current === '"') {
            inString = true;
            result += current;
            continue;
        }

        if (current === '/' && next === '/') {
            inLineComment = true;
            index += 1;
            continue;
        }

        if (current === '/' && next === '*') {
            inBlockComment = true;
            index += 1;
            continue;
        }

        result += current;
    }

    return result;
}

function removeTrailingCommas(value) {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let index = 0; index < value.length; index += 1) {
        const current = value[index];

        if (inString) {
            result += current;
            if (escaped) {
                escaped = false;
                continue;
            }

            if (current === '\\') {
                escaped = true;
                continue;
            }

            if (current === '"') {
                inString = false;
            }
            continue;
        }

        if (current === '"') {
            inString = true;
            result += current;
            continue;
        }

        if (current === ',') {
            const nextIndex = findNextMeaningfulIndex(value, index + 1);
            const nextChar = nextIndex === -1 ? '' : value[nextIndex];

            if (nextChar === '}' || nextChar === ']') {
                continue;
            }
        }

        result += current;
    }

    return result;
}

function findNextMeaningfulIndex(value, startIndex) {
    for (let index = startIndex; index < value.length; index += 1) {
        if (!/\s/.test(value[index])) {
            return index;
        }
    }

    return -1;
}

function normalizeGuid(value) {
    const normalized = normalizeNonEmptyString(value);
    return normalized ? normalized.toLowerCase() : null;
}

function normalizeNonEmptyString(value) {
    const normalized = String(value || '').trim();
    return normalized || null;
}

function normalizeHexValue(value) {
    const normalized = normalizeNonEmptyString(value);
    if (!normalized) {
        return null;
    }

    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
        return normalized;
    }

    return null;
}

function ansiCubeLevel(value) {
    return value === 0 ? 0 : 55 + value * 40;
}

function rgbToHex(red, green, blue) {
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value) {
    return clamp(value, 0, 255).toString(16).padStart(2, '0');
}

function normalizeCircularIndex(index, length) {
    if (length <= 0) {
        return 0;
    }

    return ((index % length) + length) % length;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
