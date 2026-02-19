const BACKUP_NAMES_KEY = 'starship-backup-names';

function get_all_backup_names() {
    try {
        const stored = localStorage.getItem(BACKUP_NAMES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

export function get_backup_name(backup_path) {
    const names = get_all_backup_names();
    return names[backup_path] || '';
}

export function set_backup_name(backup_path, name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const names = get_all_backup_names();
    names[backup_path] = trimmed;
    localStorage.setItem(BACKUP_NAMES_KEY, JSON.stringify(names));
}
