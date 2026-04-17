const NAMED_COLOR_OPTIONS = [
    { value: 'black', label: 'Black', hex: '#000000' },
    { value: 'red', label: 'Red', hex: '#800000' },
    { value: 'green', label: 'Green', hex: '#008000' },
    { value: 'yellow', label: 'Yellow', hex: '#808000' },
    { value: 'blue', label: 'Blue', hex: '#000080' },
    { value: 'purple', label: 'Purple', hex: '#800080' },
    { value: 'cyan', label: 'Cyan', hex: '#008080' },
    { value: 'white', label: 'White', hex: '#c0c0c0' },
    { value: 'bright-black', label: 'Bright Black', hex: '#808080' },
    { value: 'bright-red', label: 'Bright Red', hex: '#ff0000' },
    { value: 'bright-green', label: 'Bright Green', hex: '#00ff00' },
    { value: 'bright-yellow', label: 'Bright Yellow', hex: '#ffff00' },
    { value: 'bright-blue', label: 'Bright Blue', hex: '#0000ff' },
    { value: 'bright-purple', label: 'Bright Purple', hex: '#ff00ff' },
    { value: 'bright-cyan', label: 'Bright Cyan', hex: '#00ffff' },
    { value: 'bright-white', label: 'Bright White', hex: '#ffffff' },
];

const NAMED_COLOR_MAP = new Map(NAMED_COLOR_OPTIONS.map((entry) => [entry.value, entry]));

const ANSI_16_HEX = [
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

export function getNamedColorOptions() {
    return NAMED_COLOR_OPTIONS;
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
    const namedColor = NAMED_COLOR_MAP.get(normalized);
    if (namedColor) {
        return namedColor.label;
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

    const namedColor = NAMED_COLOR_MAP.get(normalized);
    if (namedColor) {
        return namedColor.hex;
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

    if (safeCode < 16) {
        return ANSI_16_HEX[safeCode];
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
    if (code >= 30 && code <= 37) {
        return ANSI_16_HEX[code - 30];
    }

    if (code >= 90 && code <= 97) {
        return ANSI_16_HEX[code - 90 + 8];
    }

    if (code >= 40 && code <= 47) {
        return ANSI_16_HEX[code - 40];
    }

    if (code >= 100 && code <= 107) {
        return ANSI_16_HEX[code - 100 + 8];
    }

    return undefined;
}

export function normalizeColorValue(value) {
    return String(value || '').trim();
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
