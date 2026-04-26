import { normalizeSettings } from '../types/settings.js';
import { parseStyle, resolveModuleStyle, stringifyStyle } from './prompt-format.js';

export function buildColorTargets(settings) {
    const targets = [];
    const seenModules = new Set();

    for (let lineIndex = 0; lineIndex < settings.prompt.lines.length; lineIndex += 1) {
        const line = settings.prompt.lines[lineIndex] || [];

        for (let itemIndex = 0; itemIndex < line.length; itemIndex += 1) {
            const item = line[itemIndex];

            if (item?.type === 'styledText') {
                const style = parseStyle(item.style || 'none');
                targets.push({
                    id: createPromptTargetId(lineIndex, itemIndex),
                    type: 'prompt-item',
                    lineIndex,
                    itemIndex,
                    label: `L${lineIndex + 1} S${String(itemIndex + 1).padStart(2, '0')} Text`,
                    hint: shortenText(item.text || ''),
                    fg: style.fg || '',
                    bg: style.bg || '',
                });
                continue;
            }

            if (
                item?.type === 'module' &&
                !seenModules.has(item.module) &&
                isColorableModule(settings.modules[item.module])
            ) {
                seenModules.add(item.module);
                const colors = resolveModuleColors(settings.modules[item.module] || {});
                targets.push({
                    id: createModuleTargetId(item.module),
                    type: 'module',
                    moduleKey: item.module,
                    label: `$${item.module}`,
                    hint: `first seen at Line ${lineIndex + 1}, Slot ${itemIndex + 1}`,
                    fg: colors.fg,
                    bg: colors.bg,
                });
            }
        }
    }

    return targets;
}

function isColorableModule(moduleConfig) {
    return Boolean(
        moduleConfig &&
        (typeof moduleConfig.style === 'string' || typeof moduleConfig.format === 'string')
    );
}

export function updateColorTarget(settings, targetId, channel, value) {
    const next = JSON.parse(JSON.stringify(settings));

    if (targetId.startsWith('prompt:')) {
        const location = parsePromptTargetId(targetId);
        if (!location) {
            return normalizeSettings(next);
        }

        const item = next.prompt.lines[location.lineIndex]?.[location.itemIndex];
        if (!item || item.type !== 'styledText') {
            return normalizeSettings(next);
        }

        item.style = patchStyleColor(item.style, channel, value);
        markPromptFormatDirty(next);
        return normalizeSettings(next);
    }

    if (targetId.startsWith('module:')) {
        const moduleKey = targetId.slice('module:'.length);
        const moduleConfig = next.modules[moduleKey];
        if (!moduleConfig) {
            return normalizeSettings(next);
        }

        next.modules[moduleKey] = patchModuleColor(moduleConfig, channel, value);
        return normalizeSettings(next);
    }

    return normalizeSettings(next);
}

export function clearColorTargetChannel(settings, targetId, channel) {
    return updateColorTarget(settings, targetId, channel, '');
}

export function resolveModuleColors(moduleConfig) {
    const outerStyle = resolveModuleStyle(moduleConfig);
    const inlineStyle = extractEditableFormatStyle(moduleConfig.format || '');

    return {
        fg: inlineStyle?.parsed.fg || outerStyle.fg || '',
        bg: inlineStyle?.parsed.bg || outerStyle.bg || '',
    };
}

function patchModuleColor(moduleConfig, channel, value) {
    const nextConfig = {
        ...moduleConfig,
    };

    if (usesUsernameVariantStyles(nextConfig)) {
        return patchUsernameVariantColor(nextConfig, channel, value);
    }

    const nextOuterStyle = parseStyle(nextConfig.style || 'none');
    const editableStyle = extractEditableFormatStyle(nextConfig.format || '');

    if (editableStyle) {
        editableStyle.parsed[channel] = value;
        nextConfig.format = replaceSlice(
            nextConfig.format,
            editableStyle.start,
            editableStyle.end,
            stringifyStyle(editableStyle.parsed)
        );

        if (channel === 'bg') {
            nextOuterStyle.bg = value;
            nextConfig.style = stringifyStyle(nextOuterStyle);
        } else if (!nextOuterStyle.bg && nextOuterStyle.fg) {
            nextOuterStyle.fg = value;
            nextConfig.style = stringifyStyle(nextOuterStyle);
        }

        return nextConfig;
    }

    nextOuterStyle[channel] = value;
    nextConfig.style = stringifyStyle(nextOuterStyle);
    return nextConfig;
}

function extractEditableFormatStyle(format) {
    const pattern = /\]\(([^)]*)\)/g;
    let match;

    while ((match = pattern.exec(String(format || ''))) !== null) {
        const styleText = match[1] || '';
        if (styleText.includes('$')) {
            continue;
        }

        return {
            parsed: parseStyle(styleText),
            start: match.index + 2,
            end: match.index + 2 + styleText.length,
        };
    }

    return null;
}

function patchStyleColor(style, channel, value) {
    const parsed = parseStyle(style || 'none');
    parsed[channel] = value;
    return stringifyStyle(parsed);
}

function patchUsernameVariantColor(moduleConfig, channel, value) {
    const nextConfig = {
        ...moduleConfig,
    };
    const activeStyle = resolveModuleStyle(nextConfig);
    activeStyle[channel] = value;
    const nextStyleText = stringifyStyle(activeStyle);

    if (typeof nextConfig.style_user === 'string') {
        nextConfig.style_user = nextStyleText;
    }

    if (typeof nextConfig.style_root === 'string') {
        nextConfig.style_root = nextStyleText;
    }

    return nextConfig;
}

function replaceSlice(value, start, end, replacement) {
    return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}

function createPromptTargetId(lineIndex, itemIndex) {
    return `prompt:${lineIndex}:${itemIndex}`;
}

function createModuleTargetId(moduleKey) {
    return `module:${moduleKey}`;
}

function parsePromptTargetId(targetId) {
    const parts = String(targetId || '').split(':');
    if (parts.length !== 3) {
        return null;
    }

    const lineIndex = Number.parseInt(parts[1], 10);
    const itemIndex = Number.parseInt(parts[2], 10);
    if (!Number.isInteger(lineIndex) || !Number.isInteger(itemIndex)) {
        return null;
    }

    return { lineIndex, itemIndex };
}

function shortenText(value) {
    const text = String(value || '').replaceAll('\n', '\\n');
    if (text.length <= 24) {
        return `"${text}"`;
    }

    return `"${text.slice(0, 21)}..."`;
}

function usesUsernameVariantStyles(moduleConfig) {
    return Boolean(
        moduleConfig &&
        (typeof moduleConfig.style_user === 'string' || typeof moduleConfig.style_root === 'string')
    );
}

function markPromptFormatDirty(settings) {
    if (!settings?.prompt) {
        return;
    }

    delete settings.prompt.sourceFormat;
}
