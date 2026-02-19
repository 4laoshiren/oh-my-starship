import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import {
    get_starship_toml,
    save_starship_toml,
    apply_preset,
    get_backup_list,
    restore_from_backup,
    create_starship_backup,
} from '@/services/cmds';

const query_keys = {
    starship_toml: ['starshipToml'],
    backup_list: ['backupList'],
};

export function use_starship_toml() {
    return useQuery({
        queryKey: query_keys.starship_toml,
        queryFn: get_starship_toml,
    });
}

export function use_save_starship_toml() {
    const query_client = useQueryClient();

    return useMutation({
        mutationFn: (content) => save_starship_toml(content),
        onSuccess: () => {
            query_client.invalidateQueries({ queryKey: query_keys.starship_toml });
        },
    });
}

export function use_apply_preset() {
    const query_client = useQueryClient();

    return useMutation({
        mutationFn: (toml_content) => apply_preset(toml_content),
        onSuccess: () => {
            query_client.invalidateQueries({ queryKey: query_keys.starship_toml });
            query_client.invalidateQueries({ queryKey: query_keys.backup_list });
        },
    });
}

export function use_backup_list() {
    return useQuery({
        queryKey: query_keys.backup_list,
        queryFn: get_backup_list,
    });
}

export function use_restore_from_backup() {
    const query_client = useQueryClient();

    return useMutation({
        mutationFn: (backup_path) => restore_from_backup(backup_path),
        onSuccess: () => {
            query_client.invalidateQueries({ queryKey: query_keys.starship_toml });
        },
    });
}

export function use_create_starship_backup() {
    const query_client = useQueryClient();

    return useMutation({
        mutationFn: () => create_starship_backup(),
        onSuccess: () => {
            query_client.invalidateQueries({ queryKey: query_keys.backup_list });
        },
    });
}
