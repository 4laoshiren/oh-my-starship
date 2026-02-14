// Export two components:
//  getBackupName(for config-list.tsx to show backup names)
//  and
//  setBackupName(for index.tsx and config-list.tsx to name and rename).
const BACKUP_NAMES_KEY = 'starship-backup-names';

function getAllBackupNames(): Record<string, string> {
    try {
        const stored = localStorage.getItem(BACKUP_NAMES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

export function getBackupName(backupPath: string): string {
    const names = getAllBackupNames();
    return names[backupPath] || '';
}

export function setBackupName(backupPath: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;

    const names = getAllBackupNames();
    names[backupPath] = trimmed;
    localStorage.setItem(BACKUP_NAMES_KEY, JSON.stringify(names));
}
