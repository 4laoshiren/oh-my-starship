import {
    DEFAULT_FORMAT,
    END_CAP_PRESETS,
    MODULE_ORDER,
    SEPARATOR_PRESETS,
    START_CAP_PRESETS,
    createPromptItem,
} from '../types/settings.js';

const MODULE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*/;
const FRAME_GLYPHS = new Set([...SEPARATOR_PRESETS, ...START_CAP_PRESETS, ...END_CAP_PRESETS]);

export function parsePromptFormat(format = DEFAULT_FORMAT, modules = {}) {
    const rawTokens = tokenizePromptFormat(format);
    const lineTokens = splitTokensByNewline(rawTokens);
    const lines = [];

    for (const tokens of lineTokens) {
        const lineItems = [];

        for (let index = 0; index < tokens.length; index += 1) {
            const token = tokens[index];
            const item = convertTokenToPromptItem(token, tokens, index, modules);

            if (item) {
                lineItems.push(item);
            }
        }

        lines.push(lineItems);
    }

    return { lines };
}

export function buildPromptFormat(settings) {
    const lines = settings.prompt.lines || [];
    const lineParts = lines.map((line) => buildPromptLineFormat(line || [], settings));
    return lineParts.join('\n') || '$character';
}

export function formatPromptItemLabel(item, index) {
    const slot = String(index + 1).padStart(2, '0');

    if (item.type === 'module') {
        return `${slot}  $${item.module}`;
    }

    if (item.type === 'frame') {
        return `${slot}  Frame "${printableText(item.glyph)}"`;
    }

    const styleLabel = item.type === 'styledText' ? item.style || 'none' : 'none';
    return `${slot}  "${printableText(item.text)}"  (${styleLabel})`;
}

export function formatPromptLineSummary(line) {
    if (!Array.isArray(line) || line.length === 0) {
        return '(empty)';
    }

    return line
        .map((item) => {
            if (item.type === 'module') {
                return `$${item.module}`;
            }

            if (item.type === 'frame') {
                return printableText(item.glyph || '');
            }

            return printableText(item.text || '');
        })
        .join(' ');
}

export function parseStyle(style = '') {
    const result = {
        fg: '',
        bg: '',
        flags: [],
        unknown: [],
    };

    for (const part of String(style).trim().split(/\s+/).filter(Boolean)) {
        if (part.startsWith('fg:')) {
            result.fg = part.slice(3);
            continue;
        }
        if (part.startsWith('bg:')) {
            result.bg = part.slice(3);
            continue;
        }
        if (part === 'bold' || part === 'italic' || part === 'dimmed' || part === 'none') {
            result.flags.push(part);
            continue;
        }
        if (!result.fg && (part.startsWith('#') || /^\d+$/.test(part) || /^[a-z-]+$/i.test(part))) {
            result.fg = part;
            continue;
        }
        result.unknown.push(part);
    }

    return result;
}

export function stringifyStyle(styleParts) {
    const parts = [];

    if (styleParts.fg) {
        parts.push(`fg:${styleParts.fg}`);
    }
    if (styleParts.bg) {
        parts.push(`bg:${styleParts.bg}`);
    }

    parts.push(...styleParts.flags.filter((flag) => flag !== 'none'));
    parts.push(...styleParts.unknown);

    return parts.join(' ') || 'none';
}

export function updateStyleColor(style, channel, value) {
    const parsed = parseStyle(style);
    parsed[channel] = value.trim();
    return stringifyStyle(parsed);
}

export function normalizeCircularIndex(index, length) {
    if (length <= 0) {
        return 0;
    }
    return ((index % length) + length) % length;
}

export function normalizeModuleIndex(module, step) {
    const currentIndex = MODULE_ORDER.indexOf(module);
    const start = currentIndex === -1 ? 0 : currentIndex;
    return MODULE_ORDER[normalizeCircularIndex(start + step, MODULE_ORDER.length)];
}

export function resolvePromptItemBackground(item, modules = {}) {
    if (!item) {
        return '';
    }

    if (item.type === 'module') {
        const moduleConfig = modules[item.module] || {};
        return parseStyle(moduleConfig.style || '').bg || '';
    }

    if (item.type === 'styledText') {
        return parseStyle(item.style || '').bg || '';
    }

    return '';
}

export function resolveFramePreviewColors(line, itemIndex, modules = {}) {
    const item = line[itemIndex];
    const previousItem = findPreviousContentItem(line, itemIndex);
    const nextItem = findNextContentItem(line, itemIndex);
    const previousBg = resolvePromptItemBackground(previousItem, modules);
    const nextBg = resolvePromptItemBackground(nextItem, modules);

    if (previousBg && nextBg) {
        return {
            fg: item?.invert ? nextBg : previousBg,
            bg: item?.invert ? previousBg : nextBg,
        };
    }

    return {
        fg: previousBg || nextBg || '',
        bg: '',
    };
}

export function buildFallbackPreviewText(settings, samples = {}) {
    const lines = (settings.prompt.lines || []).map((line) =>
        buildPreviewLine(line || [], settings, samples)
    );

    return lines.join('\n').trimEnd();
}

function buildPromptLineFormat(line, settings) {
    return line.map((item, index) => formatPromptItem(item, line, index, settings)).join('');
}

function formatPromptItem(item, line, index, settings) {
    if (item.type === 'module') {
        return `$${item.module}`;
    }

    if (item.type === 'frame') {
        const colors = resolveFramePreviewColors(line, index, settings.modules);
        return formatStyledText(item.glyph || '', buildFrameStyle(colors));
    }

    if (item.type === 'styledText') {
        return formatStyledText(item.text, item.style);
    }

    return escapeRawText(item.text);
}

function buildFrameStyle(colors) {
    const parts = [];

    if (colors.fg) {
        parts.push(`fg:${colors.fg}`);
    }
    if (colors.bg) {
        parts.push(`bg:${colors.bg}`);
    }

    return parts.join(' ') || 'none';
}

function buildPreviewLine(line, settings, samples) {
    const parts = [];

    for (const item of line) {
        if (item.type === 'module') {
            const moduleConfig = settings.modules[item.module];
            if (!moduleConfig?.disabled) {
                parts.push(samples[item.module] || `$${item.module}`);
            }
            continue;
        }

        if (item.type === 'frame') {
            parts.push(item.glyph || '');
            continue;
        }

        parts.push(item.text || '');
    }

    return parts.join('');
}

function tokenizePromptFormat(format) {
    const tokens = [];
    let index = 0;

    while (index < format.length) {
        const char = format[index];

        if (char === '\n') {
            tokens.push({ type: 'newline' });
            index += 1;
            continue;
        }

        if (char === '$') {
            const rest = format.slice(index + 1);
            const match = rest.match(MODULE_NAME_PATTERN);
            if (match) {
                tokens.push({ type: 'module', module: match[0] });
                index += match[0].length + 1;
                continue;
            }
        }

        if (char === '[') {
            const styled = readStyledText(format, index);
            if (styled) {
                tokens.push({
                    type: 'styledText',
                    text: styled.text,
                    style: styled.style,
                });
                index = styled.nextIndex;
                continue;
            }
        }

        const raw = readRawText(format, index);
        tokens.push({ type: 'rawText', text: raw.text });
        index = raw.nextIndex;
    }

    return combineAdjacentRawText(tokens);
}

function splitTokensByNewline(tokens) {
    const lines = [[]];
    let currentLine = lines[0];

    for (const token of tokens) {
        if (token.type === 'newline') {
            currentLine = [];
            lines.push(currentLine);
            continue;
        }

        currentLine.push(token);
    }

    return lines;
}

function convertTokenToPromptItem(token, tokens, index, modules) {
    if (isFrameToken(token)) {
        return createPromptItem('frame', {
            glyph: token.text,
            invert: inferFrameInversion(token, tokens, index, modules),
        });
    }

    if (token.type === 'module') {
        return createPromptItem('module', { module: token.module });
    }

    if (token.type === 'styledText') {
        return createPromptItem('styledText', {
            text: token.text,
            style: token.style || 'none',
        });
    }

    if (token.type === 'rawText') {
        return createPromptItem('rawText', { text: token.text });
    }

    return null;
}

function inferFrameInversion(token, tokens, index, modules) {
    const previousToken = findPreviousContentToken(tokens, index);
    const nextToken = findNextContentToken(tokens, index);
    const previousBg = resolveTokenBackground(previousToken, modules);
    const nextBg = resolveTokenBackground(nextToken, modules);
    const parsed = parseStyle(token.style || '');

    return Boolean(previousBg && nextBg && parsed.fg === nextBg && parsed.bg === previousBg);
}

function findPreviousContentToken(tokens, startIndex) {
    for (let index = startIndex - 1; index >= 0; index -= 1) {
        const token = tokens[index];
        if (!isFrameToken(token)) {
            return token;
        }
    }

    return null;
}

function findNextContentToken(tokens, startIndex) {
    for (let index = startIndex + 1; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (!isFrameToken(token)) {
            return token;
        }
    }

    return null;
}

function findPreviousContentItem(line, startIndex) {
    for (let index = startIndex - 1; index >= 0; index -= 1) {
        const item = line[index];
        if (item?.type !== 'frame') {
            return item;
        }
    }

    return null;
}

function findNextContentItem(line, startIndex) {
    for (let index = startIndex + 1; index < line.length; index += 1) {
        const item = line[index];
        if (item?.type !== 'frame') {
            return item;
        }
    }

    return null;
}

function resolveTokenBackground(token, modules) {
    if (!token) {
        return '';
    }

    if (token.type === 'module') {
        const moduleConfig = modules[token.module] || {};
        return parseStyle(moduleConfig.style || '').bg || '';
    }

    if (token.type === 'styledText') {
        return parseStyle(token.style || '').bg || '';
    }

    return '';
}

function isFrameToken(token) {
    if (!token || token.type !== 'styledText' || typeof token.text !== 'string') {
        return false;
    }

    const trimmed = token.text.trim();
    if (!trimmed) {
        return false;
    }

    for (const char of trimmed) {
        if (!FRAME_GLYPHS.has(char)) {
            return false;
        }
    }

    return true;
}

function readStyledText(format, startIndex) {
    const textEnd = findClosing(format, startIndex + 1, ']');
    if (textEnd === -1 || format[textEnd + 1] !== '(') {
        return null;
    }

    const styleEnd = findClosing(format, textEnd + 2, ')');
    if (styleEnd === -1) {
        return null;
    }

    return {
        text: unescapeFormatText(format.slice(startIndex + 1, textEnd)),
        style: format.slice(textEnd + 2, styleEnd),
        nextIndex: styleEnd + 1,
    };
}

function readRawText(format, startIndex) {
    let index = startIndex;
    while (index < format.length) {
        const char = format[index];
        if (char === '\n' || char === '$' || char === '[') {
            break;
        }
        index += 1;
    }

    return {
        text: unescapeFormatText(format.slice(startIndex, index || startIndex + 1)),
        nextIndex: Math.max(index, startIndex + 1),
    };
}

function findClosing(value, startIndex, closeChar) {
    let escaped = false;
    for (let index = startIndex; index < value.length; index += 1) {
        const char = value[index];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === '\\') {
            escaped = true;
            continue;
        }
        if (char === closeChar) {
            return index;
        }
    }
    return -1;
}

function formatStyledText(text, style) {
    return `[${escapeBracketText(text)}](${style || 'none'})`;
}

function escapeRawText(text = '') {
    return String(text).replaceAll('\\', '\\\\').replaceAll('$', '\\$').replaceAll('[', '\\[');
}

function escapeBracketText(text = '') {
    return String(text).replaceAll('\\', '\\\\').replaceAll(']', '\\]');
}

function unescapeFormatText(text = '') {
    return String(text).replace(/\\(.)/g, '$1');
}

function combineAdjacentRawText(tokens) {
    const combined = [];

    for (const token of tokens) {
        const previous = combined[combined.length - 1];
        if (token.type === 'rawText' && previous?.type === 'rawText') {
            previous.text += token.text;
            continue;
        }
        combined.push(token);
    }

    return combined;
}

function printableText(text) {
    return String(text).replaceAll('\n', '\\n');
}
