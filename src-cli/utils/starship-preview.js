import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { colorToInk } from './colors.js';
import { resolveModuleColors } from './color-targets.js';
import { parseStyle, resolveFramePreviewColors } from './prompt-format.js';
import { settingsToToml } from './settings-service.js';

const DEFAULT_MODULE_SYMBOLS = {
    aws: ' ',
    azure: ' ',
    battery: '󰁹 ',
    buf: ' ',
    bun: ' ',
    c: ' ',
    cmake: ' ',
    cobol: ' ',
    conda: ' ',
    container: ' ',
    cpp: ' ',
    crystal: ' ',
    daml: 'Λ ',
    dart: ' ',
    deno: ' ',
    direnv: ' ',
    docker_context: ' ',
    dotnet: ' ',
    elixir: ' ',
    elm: ' ',
    erlang: ' ',
    fennel: ' ',
    fortran: ' ',
    fossil_branch: ' ',
    gcloud: '󱇶 ',
    git_branch: ' ',
    git_commit: ' ',
    gleam: ' ',
    golang: ' ',
    gradle: ' ',
    guix_shell: ' ',
    haskell: ' ',
    haxe: ' ',
    helm: ' ',
    hg_branch: ' ',
    hostname: ' ',
    java: ' ',
    jobs: '✦',
    julia: ' ',
    kotlin: ' ',
    kubernetes: '󱃾 ',
    lua: ' ',
    maven: ' ',
    memory_usage: '󰍛 ',
    meson: '󰔷 ',
    mise: 'mise ',
    mojo: '󰈸 ',
    nats: ' ',
    netns: '󰛳 ',
    nim: ' ',
    nix_shell: ' ',
    nodejs: ' ',
    ocaml: ' ',
    odin: '󰟢 ',
    opa: ' ',
    openstack: ' ',
    os: '󰍲 ',
    package: '󰏗 ',
    perl: ' ',
    php: ' ',
    pijul_channel: ' ',
    pixi: '󰏗 ',
    pulumi: ' ',
    purescript: ' ',
    python: ' ',
    quarto: ' ',
    raku: '󱖊 ',
    red: '󱍼 ',
    rlang: '󰟔 ',
    ruby: ' ',
    rust: '󱘗 ',
    scala: ' ',
    shell: ' ',
    shlvl: '󰹍 ',
    singularity: ' ',
    solidity: ' ',
    spack: ' ',
    status: ' ',
    sudo: ' ',
    swift: ' ',
    terraform: ' ',
    time: ' ',
    typst: ' ',
    vagrant: ' ',
    vlang: ' ',
    xmake: ' ',
    zig: ' ',
};

const DEFAULT_MODULE_STYLES = {
    username: 'yellow bold',
    hostname: 'green dimmed bold',
    localip: 'yellow bold',
    shlvl: 'bold yellow',
    singularity: 'blue bold dimmed',
    kubernetes: 'cyan bold',
    nats: 'bold purple',
    directory: 'cyan bold',
    vcsh: 'bold yellow',
    fossil_branch: 'bold purple',
    fossil_metrics: 'bold green',
    git_branch: 'bold purple',
    git_commit: 'green bold',
    git_state: 'bold yellow',
    git_metrics: 'bold green',
    git_status: 'red bold',
    hg_branch: 'bold purple',
    pijul_channel: 'bold purple',
    docker_context: 'blue bold',
    package: '208 bold',
    bun: 'bold red',
    c: '149 bold',
    cmake: 'bold blue',
    cobol: 'bold blue',
    cpp: '149 bold',
    daml: 'bold cyan',
    dart: 'bold blue',
    deno: 'green bold',
    dotnet: 'blue bold',
    elixir: 'bold purple',
    elm: 'cyan bold',
    erlang: 'bold red',
    fennel: 'bold green',
    gleam: 'bold #FFAFF3',
    golang: 'bold cyan',
    gradle: 'bold bright-cyan',
    haskell: 'bold purple',
    haxe: 'bold fg:202',
    helm: 'bold white',
    java: 'red dimmed',
    julia: 'bold purple',
    kotlin: 'bold blue',
    lua: 'bold blue',
    maven: 'bold bright-cyan',
    mojo: 'bold 208',
    nim: 'yellow bold',
    nodejs: 'bold green',
    ocaml: 'bold yellow',
    odin: 'bold bright-blue',
    opa: 'bold blue',
    perl: '149 bold',
    php: '147 bold',
    pulumi: 'bold 5',
    purescript: 'bold white',
    python: 'yellow bold',
    quarto: 'bold #75AADB',
    rlang: 'blue bold',
    red: 'red bold',
    ruby: 'bold red',
    rust: 'bold red',
    scala: 'red bold',
    solidity: 'bold blue',
    swift: 'bold 202',
    terraform: 'bold 105',
    typst: 'bold #0093A7',
    vlang: 'blue bold',
    vagrant: 'cyan bold',
    xmake: 'bold green',
    zig: 'bold yellow',
    buf: 'bold blue',
    guix_shell: 'yellow bold',
    nix_shell: 'bold blue',
    conda: 'green bold',
    pixi: 'yellow bold',
    meson: 'blue bold',
    spack: 'blue bold',
    memory_usage: 'white bold dimmed',
    aws: 'bold yellow',
    gcloud: 'bold blue',
    openstack: 'bold yellow',
    azure: 'blue bold',
    direnv: 'bold bright-yellow',
    env_var: 'black bold dimmed',
    mise: 'bold purple',
    crystal: 'bold red',
    custom: 'green bold',
    sudo: 'bold blue',
    cmd_duration: 'yellow bold',
    jobs: 'bold blue',
    battery: 'red bold',
    time: 'bold yellow',
    status: 'bold red',
    container: 'red bold dimmed',
    netns: 'blue bold dimmed',
    os: 'bold white',
    shell: 'white bold',
    character: 'bold green',
};

const VERSION_MODULES = new Set([
    'buf',
    'bun',
    'c',
    'cmake',
    'cobol',
    'cpp',
    'crystal',
    'daml',
    'dart',
    'deno',
    'dotnet',
    'elixir',
    'elm',
    'erlang',
    'fennel',
    'fortran',
    'gleam',
    'golang',
    'gradle',
    'haskell',
    'haxe',
    'helm',
    'java',
    'julia',
    'kotlin',
    'lua',
    'maven',
    'mojo',
    'nim',
    'nodejs',
    'ocaml',
    'odin',
    'opa',
    'perl',
    'php',
    'purescript',
    'python',
    'quarto',
    'raku',
    'red',
    'rlang',
    'ruby',
    'rust',
    'scala',
    'solidity',
    'swift',
    'typst',
    'vagrant',
    'vlang',
    'xmake',
    'zig',
]);

const MODULE_SAMPLE_BUILDERS = {
    username: () => ' user ',
    hostname: (symbol) => ` ${symbol}host `,
    localip: () => ' 0.0.0.0 ',
    shlvl: (symbol) => ` ${symbol}0 `,
    singularity: (symbol) => ` ${symbol}[0] `,
    kubernetes: (symbol) => ` ${symbol}0 (0) `,
    nats: (symbol) => ` ${symbol}0 `,
    directory: (_symbol, moduleConfig) => ` ~/starship${moduleConfig.read_only || ''} `,
    vcsh: () => ' vcsh 0 ',
    fossil_branch: (symbol) => ` ${symbol}0 `,
    fossil_metrics: () => ' +0 -0 ',
    git_branch: (symbol) => ` ${symbol}master `,
    git_commit: (symbol) => ` 0000000 ${symbol}0 `,
    git_state: () => ' 0 (0/0) ',
    git_metrics: () => ' +0 -0 ',
    git_status: () => '⇣',
    hg_branch: (symbol) => ` ${symbol}0 `,
    hg_state: () => ' 0 ',
    pijul_channel: (symbol) => ` ${symbol}0 `,
    docker_context: (symbol) => ` ${symbol}0 `,
    package: (symbol) => ` ${symbol}v0.0.0 `,
    dotnet: (symbol) => ` ${symbol}v0.0.0 target 0 `,
    conda: (symbol) => ` ${symbol}0 `,
    pixi: (symbol) => ` ${symbol}v0.0.0 0 `,
    guix_shell: (symbol) => ` ${symbol}0 `,
    nix_shell: (symbol) => ` ${symbol}0 `,
    meson: (symbol) => ` ${symbol}0 `,
    spack: (symbol) => ` ${symbol}0 `,
    memory_usage: (symbol) => ` ${symbol}0B | 0B `,
    aws: (symbol) => ` ${symbol}0 (0) [0s] `,
    gcloud: (symbol) => ` ${symbol}0 (0) `,
    openstack: (symbol) => ` ${symbol}0(0) `,
    azure: (symbol) => ` ${symbol}0 `,
    direnv: (symbol) => ` ${symbol}0/0 `,
    env_var: () => ' 0 ',
    mise: (symbol) => ` ${symbol}0 `,
    custom: () => ' custom 0 ',
    sudo: (symbol) => ` as ${symbol}`,
    cmd_duration: () => ' ⏱ 0ms ',
    line_break: () => '\n',
    jobs: (symbol) => ` ${symbol}0 `,
    battery: (symbol) => ` ${symbol}0% `,
    time: (symbol) => ` ${symbol}Sunday 00-00 00:00 `,
    status: (symbol) => ` ${symbol}0 `,
    container: (symbol) => ` ${symbol}[0] `,
    netns: (symbol) => ` ${symbol}[0] `,
    os: (symbol) => ` ${symbol}`,
    shell: (symbol) => ` ${symbol}0 `,
    character: (symbol) => `${symbol || '❯'}`,
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
    return buildFastPreviewLines(settings)
        .map((line) => line.map((segment) => segment.text).join(''))
        .join('\n')
        .trimEnd();
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

            const style = resolveModulePreviewStyle(item.module, moduleConfig);
            const parsedStyle = parseStyle(style);
            const colors = resolveModuleColors(moduleConfig);
            segments.push({
                text: resolveModuleSample(item.module, moduleConfig),
                color: colorToInk(colors.fg || parsedStyle.fg),
                backgroundColor: colorToInk(colors.bg || parsedStyle.bg),
                bold: parsedStyle.flags.includes('bold'),
                dimColor: parsedStyle.flags.includes('dimmed'),
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
            dimColor: parsedStyle.flags.includes('dimmed'),
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

function resolveModuleSample(moduleKey, moduleConfig = {}) {
    const symbol = normalizeSampleSymbol(resolveModuleSymbol(moduleKey, moduleConfig));
    const builder = MODULE_SAMPLE_BUILDERS[moduleKey];

    if (builder) {
        return builder(symbol, moduleConfig);
    }

    if (VERSION_MODULES.has(moduleKey)) {
        return ` ${symbol}v0.0.0 `;
    }

    return ` ${symbol}0 `;
}

function resolveModulePreviewStyle(moduleKey, moduleConfig = {}) {
    const directStyle = typeof moduleConfig.style === 'string' ? moduleConfig.style.trim() : '';
    if (directStyle) {
        return directStyle;
    }

    const usernameStyle = resolveUsernamePreviewStyle(moduleConfig);
    if (usernameStyle) {
        return usernameStyle;
    }

    return DEFAULT_MODULE_STYLES[moduleKey] || 'none';
}

function resolveUsernamePreviewStyle(moduleConfig = {}) {
    if (typeof moduleConfig.style_user === 'string' && moduleConfig.style_user.trim()) {
        return moduleConfig.style_user.trim();
    }

    if (typeof moduleConfig.style_root === 'string' && moduleConfig.style_root.trim()) {
        return moduleConfig.style_root.trim();
    }

    return '';
}

function resolveModuleSymbol(moduleKey, moduleConfig = {}) {
    if (moduleKey === 'os') {
        return cleanSymbol(
            moduleConfig.symbols?.Windows ||
                moduleConfig.symbols?.Unknown ||
                DEFAULT_MODULE_SYMBOLS.os ||
                ''
        );
    }

    if (moduleKey === 'battery') {
        return cleanSymbol(
            moduleConfig.full_symbol ||
                moduleConfig.charging_symbol ||
                moduleConfig.discharging_symbol ||
                DEFAULT_MODULE_SYMBOLS.battery ||
                ''
        );
    }

    if (moduleKey === 'character') {
        return cleanSymbol(
            moduleConfig.success_symbol ||
                moduleConfig.vimcmd_symbol ||
                DEFAULT_MODULE_SYMBOLS.character ||
                '❯'
        );
    }

    return cleanSymbol(
        moduleConfig.symbol ||
            moduleConfig.ssh_symbol ||
            moduleConfig.tag_symbol ||
            DEFAULT_MODULE_SYMBOLS[moduleKey] ||
            ''
    );
}

function normalizeSampleSymbol(symbol) {
    const text = String(symbol || '').trim();
    return text ? `${text} ` : '';
}

function cleanSymbol(value) {
    const text = String(value || '');
    const styledText = text.match(/^\[(.*)]\([^)]*\)$/s);
    return unescapeStarshipText(styledText ? styledText[1] : text);
}

function unescapeStarshipText(value) {
    return String(value).replace(/\\([\\$[\]()])/g, '$1');
}
