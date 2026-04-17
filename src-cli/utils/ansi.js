import { ansi256ToHex, sgr16ToHex } from './colors.js';

export function parseAnsiLines(input) {
    const lines = [[]];
    const style = {
        color: undefined,
        backgroundColor: undefined,
        bold: false,
    };
    const pattern = /\x1B\[([0-9;]*)m/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(input)) !== null) {
        pushText(lines, input.slice(cursor, match.index), style);
        applySgr(style, match[1]);
        cursor = pattern.lastIndex;
    }

    pushText(lines, input.slice(cursor), style);
    return lines;
}

export function stripAnsi(value) {
    return String(value).replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

function pushText(lines, text, style) {
    if (!text) {
        return;
    }

    const parts = String(text).split('\n');

    for (let index = 0; index < parts.length; index += 1) {
        if (index > 0) {
            lines.push([]);
        }

        if (parts[index]) {
            lines[lines.length - 1].push({
                text: parts[index],
                color: style.color,
                backgroundColor: style.backgroundColor,
                bold: style.bold,
            });
        }
    }
}

function applySgr(style, rawCodes) {
    const codes = rawCodes
        .split(';')
        .filter((code) => code !== '')
        .map((code) => Number.parseInt(code, 10));

    if (codes.length === 0) {
        resetStyle(style);
        return;
    }

    for (let index = 0; index < codes.length; index += 1) {
        const code = codes[index];

        if (code === 0) {
            resetStyle(style);
            continue;
        }
        if (code === 1) {
            style.bold = true;
            continue;
        }
        if (code === 22) {
            style.bold = false;
            continue;
        }
        if (code === 39) {
            style.color = undefined;
            continue;
        }
        if (code === 49) {
            style.backgroundColor = undefined;
            continue;
        }
        const basicColor = sgr16ToHex(code);
        if (basicColor) {
            if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
                style.color = basicColor;
            } else {
                style.backgroundColor = basicColor;
            }
            continue;
        }
        if ((code === 38 || code === 48) && codes[index + 1] === 5) {
            const color = ansi256ToHex(codes[index + 2]);
            if (code === 38) {
                style.color = color;
            } else {
                style.backgroundColor = color;
            }
            index += 2;
            continue;
        }
        if ((code === 38 || code === 48) && codes[index + 1] === 2) {
            const color = rgbToHex(codes[index + 2], codes[index + 3], codes[index + 4]);
            if (code === 38) {
                style.color = color;
            } else {
                style.backgroundColor = color;
            }
            index += 4;
        }
    }
}

function resetStyle(style) {
    style.color = undefined;
    style.backgroundColor = undefined;
    style.bold = false;
}

function rgbToHex(red = 255, green = 255, blue = 255) {
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value) {
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
}
