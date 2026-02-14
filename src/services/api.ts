import { getCurrentWindow } from '@tauri-apps/api/window';

export function getCurrent() {
    return getCurrentWindow();
}
