import fs from 'node:fs';
import path from 'node:path';

import { createDefaultSettings, normalizeSettings } from '../types/settings.js';
import { getInkStatePath } from './paths.js';

export function loadInkState() {
    const statePath = getInkStatePath();
    if (!fs.existsSync(statePath)) {
        return createDefaultSettings();
    }

    try {
        const content = fs.readFileSync(statePath, 'utf8');
        const parsed = JSON.parse(content);
        return normalizeSettings(parsed);
    } catch {
        return createDefaultSettings();
    }
}

export function saveInkState(settings) {
    const statePath = getInkStatePath();
    ensureParentDir(statePath);
    fs.writeFileSync(statePath, `${JSON.stringify(settings, null, 4)}\n`, 'utf8');
}

export function ensureParentDir(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
}
