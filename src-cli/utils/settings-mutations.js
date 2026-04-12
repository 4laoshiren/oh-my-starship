import {
    END_CAP_PRESETS,
    MODULE_ORDER,
    SEPARATOR_PRESETS,
    START_CAP_PRESETS,
    createPromptItem,
    normalizeSettings,
} from '../types/settings.js';
import { normalizeCircularIndex, normalizeModuleIndex } from './prompt-format.js';

export function addPromptLine(settings, insertAfterLineIndex) {
    const next = cloneSettings(settings);
    const insertIndex = clamp(insertAfterLineIndex + 1, 0, next.prompt.lines.length);

    next.prompt.lines.splice(insertIndex, 0, []);
    return {
        settings: normalizeSettings(next),
        lineIndex: insertIndex,
    };
}

export function removePromptLine(settings, lineIndex) {
    const next = cloneSettings(settings);
    if (next.prompt.lines.length <= 1) {
        next.prompt.lines[0] = [];
        return {
            settings: normalizeSettings(next),
            lineIndex: 0,
        };
    }

    const safeIndex = clamp(lineIndex, 0, next.prompt.lines.length - 1);
    next.prompt.lines.splice(safeIndex, 1);
    return {
        settings: normalizeSettings(next),
        lineIndex: clamp(safeIndex, 0, next.prompt.lines.length - 1),
    };
}

export function addPromptItem(settings, lineIndex, insertAfterIndex, type) {
    const next = cloneSettings(settings);
    const line = next.prompt.lines[lineIndex] || [];
    const insertIndex = clamp(insertAfterIndex + 1, 0, line.length);
    const item = createDefaultPromptItem(type);

    line.splice(insertIndex, 0, item);
    next.prompt.lines[lineIndex] = line;

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

    return {
        settings: normalizeSettings(next),
        itemIndex: nextIndex,
    };
}

export function cyclePromptModule(settings, lineIndex, itemIndex, step) {
    const next = cloneSettings(settings);
    const item = next.prompt.lines[lineIndex]?.[itemIndex];
    if (!item || item.type !== 'module') {
        return normalizeSettings(next);
    }

    item.module = normalizeModuleIndex(item.module, step);
    return normalizeSettings(next);
}

export function updatePromptItem(settings, lineIndex, itemIndex, patch) {
    const next = cloneSettings(settings);
    const item = next.prompt.lines[lineIndex]?.[itemIndex];
    if (!item) {
        return normalizeSettings(next);
    }

    Object.assign(item, patch);
    return normalizeSettings(next);
}

export function togglePromptItemMerge(settings, lineIndex, itemIndex) {
    const next = cloneSettings(settings);
    const line = next.prompt.lines[lineIndex] || [];
    const item = line[itemIndex];
    if (!item || itemIndex >= line.length - 1) {
        return normalizeSettings(next);
    }

    item.merge = !item.merge;
    return normalizeSettings(next);
}

export function togglePowerlineEnabled(settings) {
    const next = cloneSettings(settings);
    next.powerline.enabled = !Boolean(next.powerline.enabled);
    return normalizeSettings(next);
}

export function cyclePowerlineSeparator(settings, slotIndex, step) {
    return cyclePowerlineArrayEntry(settings, 'separators', slotIndex, SEPARATOR_PRESETS, step);
}

export function cyclePowerlineStartCap(settings, lineIndex, step) {
    return cyclePowerlineArrayEntry(
        settings,
        'startCaps',
        lineIndex,
        [''].concat(START_CAP_PRESETS),
        step
    );
}

export function cyclePowerlineEndCap(settings, lineIndex, step) {
    return cyclePowerlineArrayEntry(
        settings,
        'endCaps',
        lineIndex,
        [''].concat(END_CAP_PRESETS),
        step
    );
}

export function togglePowerlineSeparatorInvert(settings, slotIndex) {
    const next = cloneSettings(settings);
    const safeIndex = clamp(slotIndex, 0, next.powerline.separatorInvertBackground.length - 1);
    next.powerline.separatorInvertBackground[safeIndex] =
        !next.powerline.separatorInvertBackground[safeIndex];
    return normalizeSettings(next);
}

export function insertPowerlineSeparator(settings, slotIndex, placement = 'after') {
    const next = cloneSettings(settings);
    const defaultSeparator = SEPARATOR_PRESETS[0] || '';
    const safeIndex = clamp(slotIndex, 0, Math.max(0, next.powerline.separators.length - 1));
    const insertIndex =
        placement === 'before'
            ? safeIndex
            : next.powerline.separators.length === 0
              ? 0
              : safeIndex + 1;

    next.powerline.separators.splice(insertIndex, 0, defaultSeparator);
    next.powerline.separatorInvertBackground.splice(insertIndex, 0, false);

    return {
        settings: normalizeSettings(next),
        slotIndex: insertIndex,
    };
}

export function removePowerlineSeparator(settings, slotIndex) {
    const next = cloneSettings(settings);

    if (next.powerline.separators.length <= 1) {
        next.powerline.separators = [SEPARATOR_PRESETS[0] || ''];
        next.powerline.separatorInvertBackground = [false];
        return {
            settings: normalizeSettings(next),
            slotIndex: 0,
        };
    }

    const safeIndex = clamp(slotIndex, 0, next.powerline.separators.length - 1);
    next.powerline.separators.splice(safeIndex, 1);
    next.powerline.separatorInvertBackground.splice(safeIndex, 1);

    return {
        settings: normalizeSettings(next),
        slotIndex: clamp(safeIndex, 0, next.powerline.separators.length - 1),
    };
}

export function resetPowerlineSeparators(settings) {
    const next = cloneSettings(settings);
    next.powerline.separators = [SEPARATOR_PRESETS[0] || ''];
    next.powerline.separatorInvertBackground = [false];
    return normalizeSettings(next);
}

export function updatePowerlineArrayEntry(settings, key, index, value) {
    const next = cloneSettings(settings);
    ensurePowerlineArray(next, key, index);
    next.powerline[key][index] = value;
    return normalizeSettings(next);
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

export function toggleLanguageModule(settings, selectedIndex, step) {
    return MODULE_ORDER[normalizeCircularIndex(selectedIndex + step, MODULE_ORDER.length)];
}

function createDefaultPromptItem(type) {
    if (type === 'module') {
        return createPromptItem('module', { module: 'hostname' });
    }

    if (type === 'rawText') {
        return createPromptItem('rawText', { text: 'text' });
    }

    return createPromptItem('styledText', { text: 'segment', style: 'none' });
}

function cyclePowerlineArrayEntry(settings, key, index, presets, step) {
    const next = cloneSettings(settings);
    ensurePowerlineArray(next, key, index);

    const currentValue = next.powerline[key][index] || '';
    const currentIndex = presets.indexOf(currentValue);
    const start = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = normalizeCircularIndex(start + step, presets.length);
    next.powerline[key][index] = presets[nextIndex] || presets[0] || '';

    if (key === 'separators') {
        const safeIndex = clamp(index, 0, next.powerline.separatorInvertBackground.length - 1);
        const current = next.powerline[key][index];
        const leftFacing = current === '' || current === '';
        next.powerline.separatorInvertBackground[safeIndex] = leftFacing;
    }

    return normalizeSettings(next);
}

function ensurePowerlineArray(settings, key, index) {
    const fallback = key === 'separators' ? '' : '';

    while (settings.powerline[key].length <= index) {
        settings.powerline[key].push(fallback);
    }

    if (key === 'separators') {
        while (settings.powerline.separatorInvertBackground.length <= index) {
            settings.powerline.separatorInvertBackground.push(false);
        }
    }
}

function cloneSettings(settings) {
    return JSON.parse(JSON.stringify(settings));
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
