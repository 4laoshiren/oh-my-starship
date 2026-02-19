import { getCurrentWindow } from '@tauri-apps/api/window';

export function get_current_window() {
    return getCurrentWindow();
}
