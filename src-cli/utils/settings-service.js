import { createDefaultSettings, normalizeSettings } from '../types/settings.js';
import { saveInkState } from './file-store.js';
import {
    loadStarshipToml,
    parseStarshipToml,
    saveStarshipSettings,
    serializeStarshipSettings,
} from './starship-toml.js';

export function loadInitialSettings() {
    const tomlContent = loadStarshipToml();

    try {
        return normalizeSettings(parseStarshipToml(tomlContent));
    } catch {
        return createDefaultSettings();
    }
}

export function persistSettings(settings) {
    const normalized = normalizeSettings(settings);
    saveInkState(normalized);
    saveStarshipSettings(normalized);
}

export function settingsToToml(settings) {
    return serializeStarshipSettings(normalizeSettings(settings));
}
