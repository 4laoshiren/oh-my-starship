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
    const separators = [];
    const separatorInvertBackground = [];
    const startCaps = [];
    const endCaps = [];
    let sawFrame = false;

    for (let lineIndex = 0; lineIndex < lineTokens.length; lineIndex += 1) {
        const tokens = lineTokens[lineIndex] || [];
        const lineItems = [];
        let hadExplicitFrameSinceLastItem = false;

        for (let index = 0; index < tokens.length; index += 1) {
            const token = tokens[index];

            if (isFrameToken(token)) {
                sawFrame = true;
                const previousItem = lineItems[lineItems.length - 1];
                const nextContentToken = findNextContentToken(tokens, index + 1);

                if (!previousItem && nextContentToken) {
                    startCaps[lineIndex] = token.text;
                    continue;
                }

                if (previousItem && nextContentToken) {
                    separators.push(token.text);
                    separatorInvertBackground.push(
                        inferSeparatorInversion(
                            token.style,
                            resolvePromptItemBackground(previousItem, modules),
                            resolveTokenBackground(nextContentToken, modules)
                        )
                    );
                    hadExplicitFrameSinceLastItem = true;
                    continue;
                }

                if (previousItem && !nextContentToken) {
                    endCaps[lineIndex] = token.text;
                }
                continue;
            }

            const item = convertTokenToPromptItem(token);
            if (!item) {
                continue;
            }

            // 中文注释：原格式里两个内容 token 中间没有 frame，就把它们视为同一个段落链。
            if (lineItems.length > 0 && !hadExplicitFrameSinceLastItem) {
                const previous = lineItems[lineItems.length - 1];
                if (previous) {
                    previous.merge = true;
                }
            }

            lineItems.push(item);
            hadExplicitFrameSinceLastItem = false;
        }

        lines.push(lineItems);
        startCaps[lineIndex] = startCaps[lineIndex] || '';
        endCaps[lineIndex] = endCaps[lineIndex] || '';
    }

    const normalizedSeparators = collapseRepeatedValues(separators);
    const normalizedInvert = collapseRepeatedValues(separatorInvertBackground);

    return {
        lines,
        powerline: {
            enabled: sawFrame,
            separators:
                normalizedSeparators.length > 0
                    ? normalizedSeparators
                    : [SEPARATOR_PRESETS[0] || ''],
            separatorInvertBackground: normalizedInvert.length > 0 ? normalizedInvert : [false],
            startCaps,
            endCaps,
        },
    };
}

export function buildPromptFormat(settings) {
    const lines = settings.prompt.lines;
    const lineParts = [];
    let globalSeparatorIndex = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex] || [];
        lineParts.push(buildPromptLineFormat(line, settings, lineIndex, globalSeparatorIndex));
        globalSeparatorIndex += countPowerlineSlots(line);
    }

    return lineParts.join('\n') || '$character';
}

export function formatPromptItemLabel(item, index) {
    const slot = String(index + 1).padStart(2, '0');
    const suffix = item.merge ? '  (merge→)' : '';

    if (item.type === 'module') {
        return `${slot}  module      $${item.module}${suffix}`;
    }

    if (item.type === 'styledText') {
        return `${slot}  styled      "${printableText(item.text)}"  (${item.style || 'none'})${suffix}`;
    }

    return `${slot}  raw         "${printableText(item.text)}"${suffix}`;
}

export function formatPromptLineSummary(line) {
    if (!Array.isArray(line) || line.length === 0) {
        return '(empty)';
    }

    return line
        .map((item) => {
            const base =
                item.type === 'module' ? `$${item.module}` : printableText(item.text || '');
            return item.merge ? `${base}·` : base;
        })
        .join(' ');
}

export function countPowerlineSlots(line) {
    let total = 0;

    for (let index = 0; index < line.length - 1; index += 1) {
        if (!line[index]?.merge) {
            total += 1;
        }
    }

    return total;
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
        if (!result.fg && (part.startsWith('#') || /^[a-z]+$/i.test(part))) {
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

export function buildFallbackPreviewText(settings, samples = {}) {
    let globalSeparatorIndex = 0;
    const lines = settings.prompt.lines.map((line, lineIndex) => {
        const previewLine = buildPreviewLine(
            line,
            settings,
            lineIndex,
            globalSeparatorIndex,
            samples
        );
        globalSeparatorIndex += countPowerlineSlots(line);
        return previewLine;
    });
    return lines.join('\n').trimEnd();
}

function buildPromptLineFormat(line, settings, lineIndex, globalSeparatorIndex) {
    const parts = [];
    const powerline = settings.powerline;

    if (!Array.isArray(line) || line.length === 0) {
        return '';
    }

    if (powerline.enabled) {
        const startCap = powerline.startCaps[lineIndex] || '';
        const firstBg = resolvePromptItemBackground(line[0], settings.modules);
        if (startCap) {
            parts.push(formatStyledText(startCap, buildSingleColorStyle(firstBg)));
        }
    }

    let separatorSlotIndex = globalSeparatorIndex;

    for (let index = 0; index < line.length; index += 1) {
        const item = line[index];
        const nextItem = line[index + 1];

        parts.push(formatPromptItem(item));

        if (powerline.enabled && nextItem && !item.merge) {
            parts.push(buildImplicitSeparator(item, nextItem, settings, separatorSlotIndex));
            separatorSlotIndex += 1;
        }
    }

    if (powerline.enabled) {
        const endCap = powerline.endCaps[lineIndex] || '';
        const lastBg = resolvePromptItemBackground(line[line.length - 1], settings.modules);
        if (endCap) {
            parts.push(formatStyledText(endCap, buildSingleColorStyle(lastBg)));
        }
    }

    return parts.join('');
}

function buildImplicitSeparator(currentItem, nextItem, settings, separatorSlotIndex) {
    const powerline = settings.powerline;
    const separatorChar =
        powerline.separators[Math.min(separatorSlotIndex, powerline.separators.length - 1)] ||
        powerline.separators[0] ||
        '';
    const invert =
        powerline.separatorInvertBackground[
            Math.min(separatorSlotIndex, powerline.separatorInvertBackground.length - 1)
        ] || false;
    const currentBg = resolvePromptItemBackground(currentItem, settings.modules);
    const nextBg = resolvePromptItemBackground(nextItem, settings.modules);

    return formatStyledText(separatorChar, buildDualColorStyle(currentBg, nextBg, invert));
}

function buildPreviewLine(line, settings, lineIndex, globalSeparatorIndex, samples) {
    const parts = [];
    const powerline = settings.powerline;
    let separatorSlotIndex = globalSeparatorIndex;

    if (!Array.isArray(line) || line.length === 0) {
        return '';
    }

    if (powerline.enabled) {
        const startCap = powerline.startCaps[lineIndex] || '';
        if (startCap) {
            parts.push(startCap);
        }
    }

    for (let index = 0; index < line.length; index += 1) {
        const item = line[index];
        const nextItem = line[index + 1];

        if (item.type === 'module') {
            const moduleConfig = settings.modules[item.module];
            if (!moduleConfig?.disabled) {
                parts.push(samples[item.module] || `$${item.module}`);
            }
        } else {
            parts.push(item.text || '');
        }

        if (powerline.enabled && nextItem && !item.merge) {
            parts.push(
                powerline.separators[
                    Math.min(separatorSlotIndex, powerline.separators.length - 1)
                ] ||
                    powerline.separators[0] ||
                    ''
            );
            separatorSlotIndex += 1;
        }
    }

    if (powerline.enabled) {
        const endCap = powerline.endCaps[lineIndex] || '';
        if (endCap) {
            parts.push(endCap);
        }
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

    return mergeAdjacentRawText(tokens);
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

function findNextContentToken(tokens, startIndex) {
    for (let index = startIndex; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (!isFrameToken(token)) {
            return token;
        }
    }

    return null;
}

function convertTokenToPromptItem(token) {
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

function inferSeparatorInversion(style, previousBg, nextBg) {
    const parsed = parseStyle(style || '');
    return Boolean(previousBg && nextBg && parsed.fg === nextBg && parsed.bg === previousBg);
}

function formatPromptItem(item) {
    if (item.type === 'module') {
        return `$${item.module}`;
    }

    if (item.type === 'styledText') {
        return formatStyledText(item.text, item.style);
    }

    return escapeRawText(item.text);
}

function buildSingleColorStyle(color) {
    return color ? `fg:${color}` : 'none';
}

function buildDualColorStyle(previousBg, nextBg, invert) {
    const parts = [];
    const fg = invert ? nextBg : previousBg;
    const bg = invert ? previousBg : nextBg;

    if (fg) {
        parts.push(`fg:${fg}`);
    }
    if (bg) {
        parts.push(`bg:${bg}`);
    }

    return parts.join(' ') || 'none';
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

function mergeAdjacentRawText(tokens) {
    const merged = [];

    for (const token of tokens) {
        const previous = merged[merged.length - 1];
        if (token.type === 'rawText' && previous?.type === 'rawText') {
            previous.text += token.text;
            continue;
        }
        merged.push(token);
    }

    return merged;
}

function collapseRepeatedValues(values) {
    if (values.length <= 1) {
        return values;
    }

    const first = values[0];
    if (values.every((value) => value === first)) {
        return [first];
    }

    return values;
}

function printableText(text) {
    return String(text).replaceAll('\n', '\\n');
}
