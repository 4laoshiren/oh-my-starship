import fs from 'node:fs';

import { MODULE_KEYS } from '../types/settings.js';
import { getStarshipTomlPath } from './paths.js';
import { ensureParentDir } from './file-store.js';
import { buildPromptFormat } from './renderer.js';

const BASE_SECTION_ORDER = ['prompt', ...MODULE_KEYS];

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

export function saveStarshipToml(content) {
    const tomlPath = getStarshipTomlPath();
    ensureParentDir(tomlPath);
    fs.writeFileSync(tomlPath, content, 'utf8');
}

export function applyTomlIntoSettings(settings, tomlContent) {
    const merged = structuredClone(settings);

    for (const key of MODULE_KEYS) {
        const sectionData = parseTomlSection(tomlContent, key);
        merged.modules[key] = {
            ...merged.modules[key],
            ...sectionData,
        };
    }

    const promptData = parseTomlSection(tomlContent, 'prompt');
    if (typeof promptData.add_newline === 'boolean') {
        merged.prompt.add_newline = promptData.add_newline;
    }

    return merged;
}

export function mergeSettingsIntoToml(settings, currentTomlContent) {
    let nextToml = currentTomlContent || '';

    nextToml = updateTomlSection(nextToml, 'prompt', {
        format: buildPromptFormat(settings),
        add_newline: settings.prompt.add_newline ?? false,
    });

    for (const key of MODULE_KEYS) {
        nextToml = updateTomlSection(nextToml, key, settings.modules[key]);
    }

    return sortPrimarySections(nextToml);
}

export function parseTomlSection(tomlContent, sectionName) {
    const result = {};
    const lines = tomlContent.split('\n');

    const sectionHeader = `[${sectionName}]`;
    let inSection = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            inSection = trimmed === sectionHeader;
            continue;
        }

        if (!inSection || !trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const equalIndex = trimmed.indexOf('=');
        if (equalIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, equalIndex).trim();
        const value = trimmed.slice(equalIndex + 1).trim();
        result[key] = parseTomlValue(value);
    }

    return result;
}

export function updateTomlSection(tomlContent, sectionName, data) {
    const lines = tomlContent.split('\n');
    const sectionHeader = `[${sectionName}]`;

    let sectionStart = -1;
    let sectionEnd = -1;

    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim();
        if (trimmed === sectionHeader) {
            sectionStart = index;
            continue;
        }

        if (sectionStart !== -1 && trimmed.startsWith('[') && trimmed.endsWith(']')) {
            sectionEnd = index;
            break;
        }
    }

    if (sectionStart !== -1 && sectionEnd === -1) {
        sectionEnd = lines.length;
    }

    const entries = Object.entries(data).filter(
        ([, value]) => value !== undefined && value !== null
    );
    const newLines = [sectionHeader];
    for (const [key, value] of entries) {
        newLines.push(`${key} = ${toTomlValue(value)}`);
    }

    if (sectionStart === -1) {
        const trimmed = tomlContent.trimEnd();
        if (!trimmed) {
            return `${newLines.join('\n')}\n`;
        }
        return `${trimmed}\n\n${newLines.join('\n')}\n`;
    }

    const before = lines.slice(0, sectionStart);
    const after = lines.slice(sectionEnd);
    const merged = [...before, ...newLines];
    if (after.length > 0 && after[0].trim() !== '') {
        merged.push('');
    }
    merged.push(...after);
    return `${merged.join('\n').trimEnd()}\n`;
}

function parseTomlValue(rawValue) {
    let value = rawValue;
    const commentIndex = value.indexOf('#');
    if (commentIndex >= 0 && !value.startsWith('"') && !value.startsWith("'")) {
        value = value.slice(0, commentIndex).trim();
    }

    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (/^-?\d+$/.test(value)) {
        return Number.parseInt(value, 10);
    }
    if (/^-?\d+\.\d+$/.test(value)) {
        return Number.parseFloat(value);
    }
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1).replace(/\\"/g, '"');
    }
    return value;
}

function toTomlValue(value) {
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'string') {
        return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
    }
    return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function sortPrimarySections(tomlContent) {
    const sectionBlocks = splitSectionBlocks(tomlContent);
    if (sectionBlocks.length === 0) {
        return tomlContent;
    }

    const picked = [];
    const rest = [];
    for (const block of sectionBlocks) {
        if (BASE_SECTION_ORDER.includes(block.name)) {
            picked.push(block);
        } else {
            rest.push(block);
        }
    }

    picked.sort(
        (left, right) =>
            BASE_SECTION_ORDER.indexOf(left.name) - BASE_SECTION_ORDER.indexOf(right.name)
    );
    const ordered = [...picked, ...rest].map((block) => block.content.trimEnd());
    return `${ordered.join('\n\n')}\n`;
}

function splitSectionBlocks(tomlContent) {
    const lines = tomlContent.split('\n');
    const blocks = [];
    let currentName = null;
    let currentLines = [];

    for (const line of lines) {
        const trimmed = line.trim();
        const isHeader = trimmed.startsWith('[') && trimmed.endsWith(']');

        if (isHeader) {
            if (currentName !== null) {
                blocks.push({
                    name: currentName,
                    content: currentLines.join('\n'),
                });
            }
            currentName = trimmed.slice(1, -1);
            currentLines = [line];
            continue;
        }

        if (currentName !== null) {
            currentLines.push(line);
        }
    }

    if (currentName !== null) {
        blocks.push({
            name: currentName,
            content: currentLines.join('\n'),
        });
    }

    return blocks;
}
