import {
    MODULE_ORDER,
    SEPARATOR_PRESETS,
    createPromptItem,
    normalizeSettings,
} from '../types/settings.js';
import { normalizeCircularIndex, normalizeModuleIndex } from './prompt-format.js';

export function addPromptLine(settings, insertAfterLineIndex) {
    const next = cloneSettings(settings);
    const insertIndex = clamp(insertAfterLineIndex + 1, 0, next.prompt.lines.length);

    next.prompt.lines.splice(insertIndex, 0, []);
    markPromptFormatDirty(next);
    return {
        settings: normalizeSettings(next),
        lineIndex: insertIndex,
    };
}

export function removePromptLine(settings, lineIndex) {
    const next = cloneSettings(settings);
    if (next.prompt.lines.length <= 1) {
        next.prompt.lines[0] = [];
        markPromptFormatDirty(next);
        return {
            settings: normalizeSettings(next),
            lineIndex: 0,
        };
    }

    const safeIndex = clamp(lineIndex, 0, next.prompt.lines.length - 1);
    next.prompt.lines.splice(safeIndex, 1);
    markPromptFormatDirty(next);
    return {
        settings: normalizeSettings(next),
        lineIndex: clamp(safeIndex, 0, next.prompt.lines.length - 1),
    };
}

export function addPromptItem(settings, lineIndex, insertAfterIndex, type, patch = {}) {
    const next = cloneSettings(settings);
    const line = next.prompt.lines[lineIndex] || [];
    const insertIndex = clamp(insertAfterIndex + 1, 0, line.length);
    const item = createDefaultPromptItem(type);
    Object.assign(item, patch);

    line.splice(insertIndex, 0, item);
    next.prompt.lines[lineIndex] = line;
    markPromptFormatDirty(next);

    return {
        settings: normalizeSettings(next),
        itemIndex: insertIndex,
    };
}

export function removePromptItem(settings, lineIndex, itemIndex) {
    const next = cloneSettings(settings);
    const line = next.prompt.lines[lineIndex] || [];
    if (line.length === 0) {
        return {
            settings: normalizeSettings(next),
            itemIndex: 0,
        };
    }

    const safeIndex = clamp(itemIndex, 0, line.length - 1);
    line.splice(safeIndex, 1);
    next.prompt.lines[lineIndex] = line;
    markPromptFormatDirty(next);

    return {
        settings: normalizeSettings(next),
        itemIndex: clamp(safeIndex, 0, line.length - 1),
    };
}

export function movePromptItem(settings, lineIndex, itemIndex, step) {
    const next = cloneSettings(settings);
    const line = next.prompt.lines[lineIndex] || [];
    const safeIndex = clamp(itemIndex, 0, line.length - 1);
    const nextIndex = clamp(safeIndex + step, 0, line.length - 1);

    if (safeIndex === nextIndex) {
        return {
            settings: normalizeSettings(next),
            itemIndex: safeIndex,
        };
    }

    const [item] = line.splice(safeIndex, 1);
    line.splice(nextIndex, 0, item);
    next.prompt.lines[lineIndex] = line;
    markPromptFormatDirty(next);

    return {
        settings: normalizeSettings(next),
        itemIndex: nextIndex,
    };
}

export function replacePromptLine(settings, lineIndex, lineItems) {
    const next = cloneSettings(settings);
    next.prompt.lines[lineIndex] = Array.isArray(lineItems)
        ? JSON.parse(JSON.stringify(lineItems))
        : [];
    markPromptFormatDirty(next);

    return normalizeSettings(next);
}

export function cyclePromptModule(settings, lineIndex, itemIndex, step) {
    const next = cloneSettings(settings);
    const item = next.prompt.lines[lineIndex]?.[itemIndex];
    if (!item || item.type !== 'module') {
        return normalizeSettings(next);
    }

    item.module = normalizeModuleIndex(item.module, step);
    markPromptFormatDirty(next);
    return normalizeSettings(next);
}

export function updatePromptItem(settings, lineIndex, itemIndex, patch) {
    const next = cloneSettings(settings);
    const item = next.prompt.lines[lineIndex]?.[itemIndex];
    if (!item) {
        return normalizeSettings(next);
    }

    Object.assign(item, patch);
    markPromptFormatDirty(next);
    return normalizeSettings(next);
}

export function replacePromptItem(settings, lineIndex, itemIndex, type, patch = {}) {
    const next = cloneSettings(settings);
    const line = next.prompt.lines[lineIndex] || [];
    const currentItem = line[itemIndex];
    if (!currentItem) {
        return normalizeSettings(next);
    }

    const nextItem = createDefaultPromptItem(type);
    nextItem.id = currentItem.id || nextItem.id;
    Object.assign(nextItem, patch);

    line[itemIndex] = nextItem;
    next.prompt.lines[lineIndex] = line;
    markPromptFormatDirty(next);

    return normalizeSettings(next);
}

export function togglePromptFrameInvert(settings, lineIndex, itemIndex) {
    const next = cloneSettings(settings);
    const item = next.prompt.lines[lineIndex]?.[itemIndex];
    if (!item || item.type !== 'frame') {
        return normalizeSettings(next);
    }

    item.invert = !Boolean(item.invert);
    markPromptFormatDirty(next);
    return normalizeSettings(next);
}

export function cyclePromptFrameGlyph(settings, lineIndex, itemIndex, step) {
    const next = cloneSettings(settings);
    const item = next.prompt.lines[lineIndex]?.[itemIndex];
    if (!item || item.type !== 'frame') {
        return normalizeSettings(next);
    }

    const currentGlyph = item.glyph || SEPARATOR_PRESETS[0] || '';
    const currentIndex = SEPARATOR_PRESETS.indexOf(currentGlyph);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    item.glyph =
        SEPARATOR_PRESETS[normalizeCircularIndex(startIndex + step, SEPARATOR_PRESETS.length)] ||
        SEPARATOR_PRESETS[0] ||
        '';
    markPromptFormatDirty(next);

    return normalizeSettings(next);
}

export function toggleLanguageModule(settings, selectedIndex, step) {
    return MODULE_ORDER[normalizeCircularIndex(selectedIndex + step, MODULE_ORDER.length)];
}

export function updateModuleField(settings, moduleKey, fieldKey, rawValue, type) {
    const next = cloneSettings(settings);
    const moduleConfig = next.modules[moduleKey] || {};

    if (type === 'boolean') {
        moduleConfig[fieldKey] = Boolean(rawValue);
    } else if (type === 'number') {
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) {
            return normalizeSettings(next);
        }
        moduleConfig[fieldKey] = parsed;
    } else {
        moduleConfig[fieldKey] = rawValue;
    }

    next.modules[moduleKey] = moduleConfig;
    return normalizeSettings(next);
}

export function toggleModuleField(settings, moduleKey, fieldKey) {
    const next = cloneSettings(settings);
    const moduleConfig = next.modules[moduleKey] || {};
    moduleConfig[fieldKey] = !Boolean(moduleConfig[fieldKey]);
    next.modules[moduleKey] = moduleConfig;
    return normalizeSettings(next);
}

export function upsertMapEntry(settings, moduleKey, fieldKey, entryKey, entryValue) {
    const next = cloneSettings(settings);
    const moduleConfig = next.modules[moduleKey] || {};
    const valueMap = isRecord(moduleConfig[fieldKey]) ? { ...moduleConfig[fieldKey] } : {};

    if (!entryKey.trim()) {
        return normalizeSettings(next);
    }

    valueMap[entryKey] = entryValue;
    moduleConfig[fieldKey] = valueMap;
    next.modules[moduleKey] = moduleConfig;

    return normalizeSettings(next);
}

export function removeMapEntry(settings, moduleKey, fieldKey, entryKey) {
    const next = cloneSettings(settings);
    const moduleConfig = next.modules[moduleKey] || {};
    const valueMap = isRecord(moduleConfig[fieldKey]) ? { ...moduleConfig[fieldKey] } : {};

    delete valueMap[entryKey];
    moduleConfig[fieldKey] = valueMap;
    next.modules[moduleKey] = moduleConfig;

    return normalizeSettings(next);
}

function createDefaultPromptItem(type) {
    if (type === 'module') {
        return createPromptItem('module', { module: 'hostname' });
    }

    if (type === 'frame') {
        return createPromptItem('frame', { glyph: SEPARATOR_PRESETS[0] || '', invert: false });
    }

    if (type === 'rawText') {
        return createPromptItem('rawText', { text: '' });
    }

    return createPromptItem('styledText', { text: '', style: 'none' });
}

function cloneSettings(settings) {
    return JSON.parse(JSON.stringify(settings));
}

function markPromptFormatDirty(settings) {
    if (!settings?.prompt) {
        return;
    }

    delete settings.prompt.sourceFormat;
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
