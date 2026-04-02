import {
    createModuleItem,
    createSeparatorItem,
    createTextItem,
    MODULE_KEYS,
} from '../types/settings.js';

export function addPromptItem(settings, insertIndex, type) {
    const next = structuredClone(settings);
    const safeIndex = normalizeInsertIndex(insertIndex, next.prompt.items.length);

    let newItem;
    if (type === 'separator') {
        newItem = createSeparatorItem(next.separator.activeIndex);
    } else if (type === 'text') {
        newItem = createTextItem(' ');
    } else {
        newItem = createModuleItem('character');
    }

    next.prompt.items.splice(safeIndex, 0, newItem);
    return { settings: next, index: safeIndex };
}

export function removePromptItem(settings, removeIndex) {
    const next = structuredClone(settings);
    if (next.prompt.items.length === 0) {
        return { settings: next, index: 0 };
    }

    const safeIndex = Math.max(0, Math.min(removeIndex, next.prompt.items.length - 1));
    next.prompt.items.splice(safeIndex, 1);
    return {
        settings: next,
        index: Math.max(0, Math.min(safeIndex, next.prompt.items.length - 1)),
    };
}

export function cyclePromptItemType(settings, itemIndex, step) {
    const next = structuredClone(settings);
    const item = next.prompt.items[itemIndex];
    if (!item || item.type !== 'module') {
        return next;
    }

    const current = MODULE_KEYS.indexOf(item.module);
    const start = current === -1 ? 0 : current;
    const nextIndex = normalizeCircularIndex(start + step, MODULE_KEYS.length);
    item.module = MODULE_KEYS[nextIndex];
    return next;
}

export function cyclePromptSeparator(settings, itemIndex, step) {
    const next = structuredClone(settings);
    const item = next.prompt.items[itemIndex];
    if (!item || item.type !== 'separator') {
        return next;
    }

    const size = next.separator.presets.length;
    item.separatorIndex = normalizeCircularIndex(item.separatorIndex + step, size);
    return next;
}

export function togglePromptSeparatorInvert(settings, itemIndex) {
    const next = structuredClone(settings);
    const item = next.prompt.items[itemIndex];
    if (!item || item.type !== 'separator') {
        return next;
    }
    item.invertBackground = !item.invertBackground;
    return next;
}

export function updateTextPromptItem(settings, itemIndex, value) {
    const next = structuredClone(settings);
    const item = next.prompt.items[itemIndex];
    if (!item || item.type !== 'text') {
        return next;
    }
    item.value = value;
    return next;
}

export function addSeparatorPreset(settings, value) {
    const next = structuredClone(settings);
    const normalized = value.trim();
    if (!normalized) {
        return next;
    }
    next.separator.presets.push(normalized);
    return next;
}

export function updateSeparatorPreset(settings, presetIndex, value) {
    const next = structuredClone(settings);
    if (presetIndex < 0 || presetIndex >= next.separator.presets.length) {
        return next;
    }
    const normalized = value.trim();
    if (!normalized) {
        return next;
    }
    next.separator.presets[presetIndex] = normalized;
    return next;
}

export function removeSeparatorPreset(settings, presetIndex) {
    const next = structuredClone(settings);
    if (next.separator.presets.length <= 1) {
        return { settings: next, index: 0 };
    }

    const safeIndex = Math.max(0, Math.min(presetIndex, next.separator.presets.length - 1));
    next.separator.presets.splice(safeIndex, 1);
    next.separator.activeIndex = normalizeCircularIndex(
        next.separator.activeIndex,
        next.separator.presets.length
    );

    for (const item of next.prompt.items) {
        if (item.type !== 'separator') {
            continue;
        }
        if (item.separatorIndex === safeIndex) {
            item.separatorIndex = next.separator.activeIndex;
            continue;
        }
        if (item.separatorIndex > safeIndex) {
            item.separatorIndex -= 1;
        }
    }

    return {
        settings: next,
        index: Math.max(0, Math.min(safeIndex, next.separator.presets.length - 1)),
    };
}

export function setSeparatorActiveIndex(settings, index) {
    const next = structuredClone(settings);
    next.separator.activeIndex = normalizeCircularIndex(index, next.separator.presets.length);
    return next;
}

function normalizeInsertIndex(index, length) {
    if (!Number.isInteger(index)) {
        return length;
    }
    return Math.max(0, Math.min(index, length));
}

function normalizeCircularIndex(index, length) {
    if (length <= 0) {
        return 0;
    }
    if (!Number.isInteger(index)) {
        return 0;
    }
    return ((index % length) + length) % length;
}
