import fs from 'node:fs';

import TOML from '@iarna/toml';

import {
    createDefaultSettings,
    MODULE_ORDER,
    normalizeSettings,
    STARSHIP_SCHEMA_URL,
} from '../types/settings.js';
import { buildPromptFormat, parsePromptFormat } from './prompt-format.js';
import { getStarshipTomlPath } from './paths.js';
import { ensureParentDir } from './file-store.js';

const ROOT_KEYS = new Set(['$schema', 'format', 'right_format', 'continuation_prompt']);

export function loadStarshipToml() {
    const tomlPath = getStarshipTomlPath();
    if (!fs.existsSync(tomlPath)) {
        return '';
    }

    try {
        return fs.readFileSync(tomlPath, 'utf8');
    } catch {
        return '';
    }
}

export function parseStarshipToml(tomlContent) {
    if (!tomlContent.trim()) {
        return createDefaultSettings();
    }

    const parsed = TOML.parse(tomlContent);
    return tomlObjectToSettings(parsed);
}

export function serializeStarshipSettings(settings) {
    const normalized = normalizeSettings(settings);
    const moduleDocument = {};

    const moduleKeys = [
        ...MODULE_ORDER,
        ...Object.keys(normalized.modules)
            .filter((key) => !MODULE_ORDER.includes(key))
            .sort(),
    ];

    for (const moduleKey of moduleKeys) {
        const moduleConfig = cleanTomlValue(normalized.modules[moduleKey]);
        if (moduleConfig && Object.keys(moduleConfig).length > 0) {
            moduleDocument[moduleKey] = moduleConfig;
        }
    }

    const rootLines = [
        `"$schema" = ${toTomlString(normalized.schemaUrl || STARSHIP_SCHEMA_URL)}`,
        `format = ${toTomlString(buildPromptFormat(normalized))}`,
    ];
    const modulesToml = TOML.stringify(moduleDocument).trimEnd();

    return `${rootLines.join('\n')}\n\n${modulesToml}\n`;
}

export function saveStarshipSettings(settings) {
    const tomlPath = getStarshipTomlPath();
    ensureParentDir(tomlPath);
    fs.writeFileSync(tomlPath, serializeStarshipSettings(settings), 'utf8');
}

function tomlObjectToSettings(tomlObject) {
    const settings = createDefaultSettings();
    const format = typeof tomlObject.format === 'string' ? tomlObject.format : '';
    const modules = {};

    settings.schemaUrl =
        typeof tomlObject.$schema === 'string' ? tomlObject.$schema : STARSHIP_SCHEMA_URL;

    for (const [key, value] of Object.entries(tomlObject)) {
        if (ROOT_KEYS.has(key) || !isRecord(value)) {
            continue;
        }
        modules[key] = clonePlainValue(value);
    }

    const parsedPrompt = parsePromptFormat(format, modules);
    settings.prompt.lines = parsedPrompt.lines;
    settings.modules = modules;

    return normalizeSettings(settings);
}

function cleanTomlValue(value) {
    if (Array.isArray(value)) {
        return value.map(cleanTomlValue).filter((item) => item !== undefined);
    }

    if (isRecord(value)) {
        const next = {};
        for (const [key, child] of Object.entries(value)) {
            const cleaned = cleanTomlValue(child);
            if (cleaned !== undefined && cleaned !== null) {
                next[key] = cleaned;
            }
        }
        return next;
    }

    if (value === undefined || value === null) {
        return undefined;
    }

    return value;
}

function clonePlainValue(value) {
    if (value === undefined || value === null) {
        return value;
    }
    return JSON.parse(JSON.stringify(value));
}

function toTomlString(value) {
    return JSON.stringify(String(value));
}

function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
