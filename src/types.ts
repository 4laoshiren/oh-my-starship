export const Themes = {
    Light: 'light',
    Dark: 'dark',
    System: 'system',
} as const;

export type Theme = (typeof Themes)[keyof typeof Themes];

export const ThemeColors = {
    Zinc: 'zinc',
    Slate: 'slate',
    Red: 'red',
    Rose: 'rose',
    Orange: 'orange',
    Green: 'green',
    Blue: 'blue',
    Yellow: 'yellow',
    Violet: 'violet',
} as const;

export type ThemeColor = (typeof ThemeColors)[keyof typeof ThemeColors];

export interface Settings {
    theme: Theme;
    themeColor: ThemeColor;
    language: string;
}

export interface StarshipPreset {
    id: string;
    name: string;
    description: string;
    previewImage?: string;
    toml: string;
}

export interface CharacterConfig {
    success_symbol: string;
    error_symbol: string;
    vimcmd_symbol: string;
    vimcmd_replace_symbol: string;
    vimcmd_visual_symbol: string;
    disabled: boolean;
}

export interface DirectoryConfig {
    truncation_length: number;
    truncation_symbol: string;
    truncate_to_repo: boolean;
    style: string;
    read_only: string;
    read_only_style: string;
    home_symbol: string;
    disabled: boolean;
    substitutions: Record<string, string>;
}

export interface GitBranchConfig {
    symbol: string;
    style: string;
    truncation_length: number;
    truncation_symbol: string;
    disabled: boolean;
}

export interface GitStatusConfig {
    style: string;
    ahead: string;
    behind: string;
    diverged: string;
    conflicted: string;
    untracked: string;
    stashed: string;
    modified: string;
    staged: string;
    renamed: string;
    deleted: string;
    disabled: boolean;
}

export interface LanguageModuleConfig {
    symbol: string;
    style: string;
    format: string;
    version_format: string;
    disabled: boolean;
}

export interface TimeConfig {
    disabled: boolean;
    time_format: string;
    style: string;
    use_12hr: boolean;
}

export interface PromptConfig {
    format: string;
    right_format: string;
    continuation_prompt: string;
    scan_timeout: number;
    command_timeout: number;
    add_newline: boolean;
    palette: string;
}

export interface StarshipModuleConfig {
    prompt: Partial<PromptConfig>;
    character: Partial<CharacterConfig>;
    directory: Partial<DirectoryConfig>;
    git_branch: Partial<GitBranchConfig>;
    git_status: Partial<GitStatusConfig>;
    time: Partial<TimeConfig>;
    nodejs: Partial<LanguageModuleConfig>;
    python: Partial<LanguageModuleConfig>;
    rust: Partial<LanguageModuleConfig>;
    golang: Partial<LanguageModuleConfig>;
    java: Partial<LanguageModuleConfig>;
    php: Partial<LanguageModuleConfig>;
    ruby: Partial<LanguageModuleConfig>;
    docker_context: Partial<LanguageModuleConfig>;
    [key: string]: Partial<Record<string, unknown>>;
}
