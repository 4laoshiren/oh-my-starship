import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
const STARSHIP_ALL_SHORTHAND_PREFIX = '# $all is shorthand for ';
const STARSHIP_ALL_EXPANSION_FALLBACK =
    '$username$hostname$localip$shlvl$singularity$kubernetes$nats$directory$vcsh$fossil_branch$fossil_metrics$git_branch$git_commit$git_state$git_metrics$git_status$hg_branch$hg_state$pijul_channel$docker_context$package$bun$c$cmake$cobol$cpp$daml$dart$deno$dotnet$elixir$elm$erlang$fennel$fortran$gleam$golang$gradle$haskell$haxe$helm$java$julia$kotlin$lua$mojo$nim$nodejs$ocaml$odin$opa$perl$php$pulumi$purescript$python$quarto$raku$rlang$red$ruby$rust$scala$solidity$swift$terraform$typst$vlang$vagrant$xmake$zig$buf$guix_shell$nix_shell$conda$pixi$meson$spack$memory_usage$aws$gcloud$openstack$azure$direnv$env_var$mise$crystal$custom$sudo$cmd_duration$line_break$jobs$battery$time$status$container$netns$os$shell$character';

let cachedStarshipAllExpansion = null;

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

    const rootLines = [`"$schema" = ${toTomlString(normalized.schemaUrl || STARSHIP_SCHEMA_URL)}`];
    const sourceFormat = resolvePromptSourceFormat(normalized.prompt);
    if (sourceFormat !== null) {
        rootLines.push(
            `format = ${toTomlString(
                typeof sourceFormat === 'string' ? sourceFormat : buildPromptFormat(normalized)
            )}`
        );
    }
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
    const sourceFormat = typeof tomlObject.format === 'string' ? tomlObject.format : null;
    const modules = {};

    settings.schemaUrl =
        typeof tomlObject.$schema === 'string' ? tomlObject.$schema : STARSHIP_SCHEMA_URL;

    for (const [key, value] of Object.entries(tomlObject)) {
        if (ROOT_KEYS.has(key) || !isRecord(value)) {
            continue;
        }
        modules[key] = clonePlainValue(value);
    }

    const parsedPrompt = parsePromptFormat(resolveFormatForParsing(sourceFormat), modules);
    settings.prompt.lines = parsedPrompt.lines;
    settings.prompt.sourceFormat = sourceFormat;
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

function resolveFormatForParsing(sourceFormat) {
    if (typeof sourceFormat === 'string') {
        return expandSpecialFormatTokens(sourceFormat);
    }

    return resolveStarshipDefaultPromptFormat();
}

function expandSpecialFormatTokens(format) {
    return String(format || '').replace(/\$all\b/g, resolveStarshipAllExpansion());
}

function resolveStarshipDefaultPromptFormat() {
    return expandSpecialFormatTokens('$all');
}

function resolveStarshipAllExpansion() {
    if (cachedStarshipAllExpansion) {
        return cachedStarshipAllExpansion;
    }

    try {
        const tempPath = path.join(
            os.tmpdir(),
            `oh-my-starship-default-format-${process.pid}.toml`
        );
        fs.writeFileSync(tempPath, `"$schema" = ${toTomlString(STARSHIP_SCHEMA_URL)}\n`, 'utf8');

        try {
            const output = execFileSync('starship', ['print-config', '--default', 'format'], {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    STARSHIP_CONFIG: tempPath,
                },
                timeout: 2500,
                windowsHide: true,
            });
            const parsed = parseStarshipAllExpansion(output);
            if (parsed) {
                cachedStarshipAllExpansion = parsed;
                return cachedStarshipAllExpansion;
            }
        } finally {
            fs.rmSync(tempPath, { force: true });
        }
    } catch {
        // Fall back to a baked-in expansion when starship is unavailable.
    }

    cachedStarshipAllExpansion = STARSHIP_ALL_EXPANSION_FALLBACK;
    return cachedStarshipAllExpansion;
}

function parseStarshipAllExpansion(output) {
    const lines = String(output || '').split(/\r?\n/);
    const shorthandLine = lines.find((line) => line.startsWith(STARSHIP_ALL_SHORTHAND_PREFIX));

    if (!shorthandLine) {
        return '';
    }

    return shorthandLine.slice(STARSHIP_ALL_SHORTHAND_PREFIX.length).trim();
}

function resolvePromptSourceFormat(prompt) {
    if (!prompt || !Object.prototype.hasOwnProperty.call(prompt, 'sourceFormat')) {
        return undefined;
    }

    return prompt.sourceFormat;
}
