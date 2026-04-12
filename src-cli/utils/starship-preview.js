import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { settingsToToml } from './settings-service.js';
import { buildFallbackPreviewText } from './prompt-format.js';

const MODULE_SAMPLES = {
    hostname: ' LAPTOP-D84SE2MG ',
    directory: ' …\\oh-my-starship ',
    git_branch: '  react-ink ',
    git_status: '! ',
    nodejs: '  v24.11.0 ',
    python: '  v3.14.0 ',
    rust: '  1.92.0 ',
    golang: '  1.25.0 ',
    php: '  8.4.0 ',
    java: '  24 ',
    ruby: '  3.4.0 ',
    c: '  clang ',
    swift: ' \ue755 6.0 ',
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

export function stripAnsi(value) {
    return String(value).replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}
