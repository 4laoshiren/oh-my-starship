import os from 'node:os';
import path from 'node:path';

export function getHomeDirectory() {
    const overrideHome = process.env.OH_MY_STARSHIP_HOME;
    if (overrideHome && overrideHome.trim()) {
        return path.resolve(overrideHome.trim());
    }
    return os.homedir();
}

export function getStarshipTomlPath() {
    return path.join(getHomeDirectory(), '.config', 'starship.toml');
}

export function getAppConfigDir() {
    return path.join(getHomeDirectory(), '.config', 'oh-my-starship');
}

export function getInkStatePath() {
    return path.join(getAppConfigDir(), 'ink-state.json');
}
