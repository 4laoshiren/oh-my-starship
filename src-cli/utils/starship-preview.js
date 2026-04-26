import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { colorToInk } from './colors.js';
import { resolveModuleColors } from './color-targets.js';
import {
    buildFallbackPreviewText,
    parseStyle,
    resolveFramePreviewColors,
} from './prompt-format.js';
import { settingsToToml } from './settings-service.js';

const MODULE_SAMPLES = {
    os: ' 󰍲 ',
    username: ` ${resolveUsernameSample()} `,
    hostname: ' LAPTOP-D84SE2MG ',
    directory: ' …\\oh-my-starship ',
    git_branch: '  react-ink ',
    git_state: ' REBASING ',
    git_status: '! ',
    nodejs: '  v24.11.0 ',
    python: '  v3.14.0 ',
    rust: '  1.92.0 ',
    golang: '  1.25.0 ',
    php: '  8.4.0 ',
    java: '  24 ',
    kotlin: '  2.2.0 ',
    elixir: '  1.18.0 ',
    elm: '  0.19.1 ',
    gradle: '  8.14 ',
    haskell: '  9.10.1 ',
    julia: '  1.12.0 ',
    nim: ' 󰆥 2.2.4 ',
    scala: '  3.7.0 ',
    ruby: '  3.4.0 ',
    c: '  clang ',
    cpp: '  clang++ ',
    swift: ' \ue755 6.0 ',
    docker_context: '  docker-desktop ',
    conda: '  base ',
    pixi: ' 󰏗 dev ',
    cmd_duration: ' ⏱ 12ms ',
    line_break: '',
    time: '  Saturday 04-11 12:16 ',
    character: '👻👻',
};

export function renderStarshipPreview(settings, options = {}) {
    const width = Number(options.width || process.stdout.columns || 120);
    const cwd = options.cwd || process.cwd();
    const status = Number.isInteger(options.status) ? options.status : 0;
    const toml = settingsToToml(settings);
    const tempPath = path.join(os.tmpdir(), `oh-my-starship-preview-${process.pid}.toml`);

    try {
        fs.writeFileSync(tempPath, toml, 'utf8');
        const output = execFileSync(
            'starship',
            [
                'prompt',
                '--path',
                cwd,
                '--terminal-width',
                String(width),
                '--status',
                String(status),
            ],
            {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    STARSHIP_CONFIG: tempPath,
                },
                timeout: 2500,
                windowsHide: true,
            }
        );

        return {
            text: output.trimEnd(),
            source: 'starship',
            error: null,
        };
    } catch (error) {
        return {
            text: renderFallbackPreview(settings),
            source: 'fallback',
            error: error instanceof Error ? error.message : String(error),
        };
    } finally {
        try {
            fs.rmSync(tempPath, { force: true });
        } catch {
            // The preview should never fail because temp cleanup failed.
        }
    }
}

export function renderFallbackPreview(settings) {
    return buildFallbackPreviewText(settings, MODULE_SAMPLES);
}

export function buildFastPreviewLines(settings) {
    // 本地草稿预览只做轻量渲染，不走 starship 子进程，保证 move mode 下的连续按键足够跟手
    return (settings.prompt.lines || []).map((line) => buildFastPreviewLine(line || [], settings));
}

export function stripAnsi(value) {
    return String(value).replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

function buildFastPreviewLine(line, settings) {
    const segments = [];

    for (let index = 0; index < line.length; index += 1) {
        const item = line[index];
        if (!item) {
            continue;
        }

        if (item.type === 'module') {
            const moduleConfig = settings.modules[item.module] || {};
            if (moduleConfig.disabled) {
                continue;
            }

            const colors = resolveModuleColors(moduleConfig);
            segments.push({
                text: resolveModuleSample(item.module),
                color: colorToInk(colors.fg),
                backgroundColor: colorToInk(colors.bg),
                bold: false,
            });
            continue;
        }

        if (item.type === 'frame') {
            const colors = resolveFramePreviewColors(line, index, settings.modules);
            segments.push({
                text: item.glyph || '',
                color: colorToInk(colors.fg),
                backgroundColor: colorToInk(colors.bg),
                bold: false,
            });
            continue;
        }

        const parsedStyle =
            item.type === 'styledText' ? parseStyle(item.style || 'none') : createEmptyStyle();

        segments.push({
            text: item.text || '',
            color: colorToInk(parsedStyle.fg),
            backgroundColor: colorToInk(parsedStyle.bg),
            bold: parsedStyle.flags.includes('bold'),
        });
    }

    return segments;
}

function createEmptyStyle() {
    return {
        fg: '',
        bg: '',
        flags: [],
        unknown: [],
    };
}

function resolveUsernameSample() {
    try {
        return os.userInfo().username || 'user';
    } catch {
        return 'user';
    }
}

function resolveModuleSample(moduleKey) {
    if (Object.prototype.hasOwnProperty.call(MODULE_SAMPLES, moduleKey)) {
        return MODULE_SAMPLES[moduleKey];
    }

    return `$${moduleKey}`;
}
