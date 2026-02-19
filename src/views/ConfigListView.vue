<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { get_backup_name, set_backup_name } from '@/lib/backup-names';
import { use_backup_list, use_restore_from_backup } from '@/composables/use-starship';
import { delete_backup } from '@/services/cmds';

const { t } = useI18n();
const toast = useToast();
const { data: backups, isLoading: is_loading, refetch } = use_backup_list();
const { mutate: restore_backup, isPending: is_restoring } = use_restore_from_backup();

const state = reactive({
    rename_dialog_open: false,
    rename_target: null,
    rename_name: '',
    force_key: 0,
});

const can_save_rename = () => state.rename_name.trim().length > 0;

function handle_restore(backup_path) {
    restore_backup(backup_path, {
        onSuccess: () => {
            toast.add({ title: t('backups.applySuccess'), color: 'success' });
        },
        onError: (error) => {
            toast.add({ title: t('backups.applyError', { error: error.message }), color: 'error' });
        },
    });
}

async function handle_delete(backup_path) {
    try {
        await delete_backup(backup_path);
        toast.add({ title: t('backups.deleteSuccess'), color: 'success' });
        refetch();
    } catch (error) {
        toast.add({ title: t('backups.deleteError', { error: error.message }), color: 'error' });
    }
}

function open_rename_dialog(backup_path) {
    state.rename_target = backup_path;
    state.rename_name = get_backup_name(backup_path);
    state.rename_dialog_open = true;
}

function handle_rename() {
    if (!can_save_rename()) return;
    if (state.rename_target) {
        set_backup_name(state.rename_target, state.rename_name);
        toast.add({ title: t('backups.renameSuccess'), color: 'success' });
        state.rename_dialog_open = false;
        state.rename_target = null;
        state.rename_name = '';
        state.force_key++;
    }
}

function handle_rename_key(event) {
    if (event.key === 'Enter' && can_save_rename()) {
        handle_rename();
    }
}

function get_dropdown_items(backup_path) {
    return [
        [
            {
                label: t('backups.apply'),
                icon: 'i-lucide-mouse-pointer-click',
                click: () => handle_restore(backup_path),
            },
            {
                label: t('backups.rename'),
                icon: 'i-lucide-pencil',
                click: () => open_rename_dialog(backup_path),
            },
        ],
        [
            {
                label: t('backups.delete'),
                icon: 'i-lucide-trash-2',
                color: 'error',
                click: () => handle_delete(backup_path),
            },
        ],
    ];
}
</script>

<template>
    <div v-if="is_loading" class="flex h-full items-center justify-center">
        <span class="text-(--ui-text-muted)">{{ t('common.loading') }}</span>
    </div>

    <div
        v-else-if="!backups?.length"
        class="flex h-full flex-col items-center justify-center gap-3"
    >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--ui-bg-accented)">
            <UIcon v-bind:name="'i-lucide-archive'" class="h-8 w-8 text-(--ui-text-muted)" />
        </div>
        <p class="text-(--ui-text-muted)">{{ t('backups.noBackups') }}</p>
    </div>

    <div v-else class="space-y-4" v-bind:key="state.force_key">
        <h2 class="text-xl font-semibold">{{ t('backups.title') }}</h2>
        <div class="grid gap-3">
            <div
                v-for="backup_path in backups"
                v-bind:key="backup_path"
                class="group flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4 shadow-sm transition-all duration-200 hover:border-(--ui-primary)/20 hover:shadow-md"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-(--ui-bg-accented) transition-colors group-hover:bg-(--ui-primary)/10"
                    >
                        <UIcon
                            v-bind:name="'i-lucide-archive'"
                            class="h-5 w-5 text-(--ui-text-muted) transition-colors group-hover:text-(--ui-primary)"
                        />
                    </div>
                    <div>
                        <p class="font-medium">
                            {{ get_backup_name(backup_path) || backup_path }}
                        </p>
                        <p class="text-sm text-(--ui-text-muted)">{{ backup_path }}</p>
                    </div>
                </div>

                <UDropdownMenu
                    v-bind:items="get_dropdown_items(backup_path)"
                    v-bind:content="{ align: 'end' }"
                >
                    <UButton
                        v-bind:variant="'outline'"
                        v-bind:size="'sm'"
                        v-bind:disabled="is_restoring"
                        v-bind:trailing-icon="'i-lucide-chevron-down'"
                    >
                        {{ t('backups.more') }}
                    </UButton>
                </UDropdownMenu>
            </div>
        </div>

        <UModal v-model:open="state.rename_dialog_open" v-bind:title="t('backups.renameTitle')">
            <template #body>
                <div class="space-y-4">
                    <UFormField v-bind:label="t('backups.nameLabel')">
                        <UInput
                            v-model:model-value="state.rename_name"
                            v-bind:placeholder="t('backups.namePlaceholder')"
                            v-on:keydown="handle_rename_key"
                        />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        v-bind:variant="'outline'"
                        v-on:click="state.rename_dialog_open = false"
                    >
                        {{ t('common.cancel') }}
                    </UButton>
                    <UButton v-on:click="handle_rename" v-bind:disabled="!can_save_rename()">
                        {{ t('common.save') }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>
