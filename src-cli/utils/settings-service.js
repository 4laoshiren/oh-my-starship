import { normalizeSettings } from '../types/settings.js';
import { loadInkState, saveInkState } from './file-store.js';
import {
    applyTomlIntoSettings,
    loadStarshipToml,
    mergeSettingsIntoToml,
    saveStarshipToml,
} from './starship-toml.js';

export function loadInitialSettings() {
    const inkState = loadInkState();
    const tomlContent = loadStarshipToml();
    const merged = applyTomlIntoSettings(inkState, tomlContent);
    return normalizeSettings(merged);
}

export function persistSettings(settings) {
    const normalized = normalizeSettings(settings);
    saveInkState(normalized);

    const currentToml = loadStarshipToml();
    const nextToml = mergeSettingsIntoToml(normalized, currentToml);
    saveStarshipToml(nextToml);
}
