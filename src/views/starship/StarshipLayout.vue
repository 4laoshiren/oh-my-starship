<script setup>
import { reactive } from 'vue';
import { ArchiveRestore } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import DialogContent from '@/components/ui/DialogContent.vue';
import DialogFooter from '@/components/ui/DialogFooter.vue';
import DialogHeader from '@/components/ui/DialogHeader.vue';
import DialogTitle from '@/components/ui/DialogTitle.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import { set_backup_name } from '@/lib/backup-names';
import { use_create_starship_backup } from '@/composables/use-starship';

const { t } = useI18n();
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
            toast.success(t('starship.backupSuccess'));
            state.name_dialog_open = false;
            state.backup_name = '';
        },
        onError: (error) => {
            toast.error(t('starship.backupError', { error: error.message }));
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
            <Button
                v-bind:variant="'outline'"
                v-bind:size="'sm'"
                v-on:click="open_name_dialog"
                v-bind:disabled="is_pending"
            >
                <ArchiveRestore class="mr-2 h-4 w-4" />
                {{ t('starship.backup') }}
            </Button>
        </div>

        <div class="flex-1">
            <slot />
        </div>

        <Dialog v-model:open="state.name_dialog_open">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{{ t('backups.nameTitle') }}</DialogTitle>
                </DialogHeader>
                <div class="space-y-4 py-4">
                    <div class="space-y-2">
                        <Label v-bind:for="'backup-name'">{{ t('backups.nameLabel') }}</Label>
                        <Input
                            v-bind:id="'backup-name'"
                            v-model:modelValue="state.backup_name"
                            v-bind:placeholder="t('backups.namePlaceholder')"
                            v-on:keydown="handle_key"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button v-bind:variant="'outline'" v-on:click="state.name_dialog_open = false">
                        {{ t('common.cancel') }}
                    </Button>
                    <Button
                        v-on:click="handle_create_backup"
                        v-bind:disabled="is_pending || !can_save_name()"
                    >
                        {{ t('common.save') }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
