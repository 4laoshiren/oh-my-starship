import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getStarshipToml,
    saveStarshipToml,
    applyPreset,
    getBackupList,
    restoreFromBackup,
    createStarshipBackup,
} from '@/services/cmds';

export const queryKeys = {
    starshipToml: ['starshipToml'] as const,
    backupList: ['backupList'] as const,
};

export function useStarshipToml() {
    return useQuery({
        queryKey: queryKeys.starshipToml,
        queryFn: getStarshipToml,
    });
}

export function useSaveStarshipToml() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (content: string) => saveStarshipToml(content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.starshipToml });
        },
    });
}

export function useApplyPreset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tomlContent: string) => applyPreset(tomlContent),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.starshipToml });
            queryClient.invalidateQueries({ queryKey: queryKeys.backupList });
        },
    });
}

export function useBackupList() {
    return useQuery({
        queryKey: queryKeys.backupList,
        queryFn: getBackupList,
    });
}

export function useRestoreFromBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (backupPath: string) => restoreFromBackup(backupPath),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.starshipToml });
        },
    });
}

export function useCreateStarshipBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => createStarshipBackup(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.backupList });
        },
    });
}
