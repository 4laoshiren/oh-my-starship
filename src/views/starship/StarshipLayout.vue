<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { set_backup_name } from '@/lib/backup-names';
import { use_create_starship_backup } from '@/composables/use-starship';

const { t } = useI18n();
const toast = useToast();
const { mutate: create_backup, isPending: is_pending } = use_create_starship_backup();

const state = reactive({
    name_dialog_open: false,
    backup_name: '',
});

const can_save_name = () => state.backup_name.trim().length > 0;

function handle_create_backup() {
    if (!can_save_name()) return;
    create_backup(undefined, {
        onSuccess: (backup_path) => {
            set_backup_name(backup_path, state.backup_name);
            toast.add({ title: t('starship.backupSuccess'), color: 'success' });
            state.name_dialog_open = false;
            state.backup_name = '';
        },
        onError: (error) => {
            toast.add({
                title: t('starship.backupError', { error: error.message }),
                color: 'error',
            });
        },
    });
}

function open_name_dialog() {
    state.backup_name = '';
    state.name_dialog_open = true;
}

function handle_key(event) {
    if (event.key === 'Enter' && can_save_name()) {
        handle_create_backup();
    }
}
</script>

<template>
    <div class="flex h-full flex-col gap-4">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">{{ t('starship.title') }}</h2>
            <UButton
                v-bind:variant="'outline'"
                v-bind:size="'sm'"
                v-bind:icon="'i-lucide-archive-restore'"
                v-on:click="open_name_dialog"
                v-bind:disabled="is_pending"
            >
                {{ t('starship.backup') }}
            </UButton>
        </div>

        <div class="flex-1">
            <slot />
        </div>

        <UModal v-model:open="state.name_dialog_open" v-bind:title="t('backups.nameTitle')">
            <template #body>
                <div class="space-y-4">
                    <UFormField v-bind:label="t('backups.nameLabel')">
                        <UInput
                            v-model:model-value="state.backup_name"
                            v-bind:placeholder="t('backups.namePlaceholder')"
                            v-on:keydown="handle_key"
                        />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton v-bind:variant="'outline'" v-on:click="state.name_dialog_open = false">
                        {{ t('common.cancel') }}
                    </UButton>
                    <UButton
                        v-on:click="handle_create_backup"
                        v-bind:disabled="is_pending || !can_save_name()"
                    >
                        {{ t('common.save') }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>
