import { invoke } from '@tauri-apps/api/core';

export async function get_settings() {
    return invoke('get_settings');
}

export async function update_settings(payload) {
    return invoke('update_settings', { payload });
}

export async function get_starship_toml() {
    return invoke('get_starship_toml');
}

export async function save_starship_toml(content) {
    return invoke('save_starship_toml', { content });
}

export async function apply_preset(toml_content) {
    return invoke('apply_preset', { tomlContent: toml_content });
}

export async function get_backup_list() {
    return invoke('get_backup_list');
}

export async function restore_from_backup(backup_path) {
    return invoke('restore_from_backup', { backupPath: backup_path });
}

export async function delete_backup(backup_path) {
    return invoke('delete_backup', { backupPath: backup_path });
}

export async function create_starship_backup() {
    return invoke('create_starship_backup');
}

export async function open_external(url) {
    return invoke('open_external', { url });
}
