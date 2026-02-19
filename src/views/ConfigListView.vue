<script setup>
import { reactive } from 'vue';
import { Archive, ChevronDown, MousePointerClick, Pencil, Trash2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import Button from '@/components/ui/Button.vue';
import Dialog from '@/components/ui/Dialog.vue';
import DialogContent from '@/components/ui/DialogContent.vue';
import DialogFooter from '@/components/ui/DialogFooter.vue';
import DialogHeader from '@/components/ui/DialogHeader.vue';
import DialogTitle from '@/components/ui/DialogTitle.vue';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';
import DropdownMenuContent from '@/components/ui/DropdownMenuContent.vue';
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue';
import DropdownMenuTrigger from '@/components/ui/DropdownMenuTrigger.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import { get_backup_name, set_backup_name } from '@/lib/backup-names';
import { use_backup_list, use_restore_from_backup } from '@/composables/use-starship';
import { delete_backup } from '@/services/cmds';

const { t } = useI18n();
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
            toast.success(t('backups.applySuccess'));
        },
        onError: (error) => {
            toast.error(t('backups.applyError', { error: error.message }));
        },
    });
}

async function handle_delete(backup_path) {
    try {
        await delete_backup(backup_path);
        toast.success(t('backups.deleteSuccess'));
        refetch();
    } catch (error) {
        toast.error(t('backups.deleteError', { error: error.message }));
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
        toast.success(t('backups.renameSuccess'));
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
</script>

<template>
    <div v-if="is_loading" class="flex h-full items-center justify-center">
        <span class="text-muted-foreground">{{ t('common.loading') }}</span>
    </div>

    <div
        v-else-if="!backups?.length"
        class="flex h-full flex-col items-center justify-center gap-3"
    >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Archive class="h-8 w-8 text-muted-foreground" />
        </div>
        <p class="text-muted-foreground">{{ t('backups.noBackups') }}</p>
    </div>

    <div v-else class="space-y-4" v-bind:key="state.force_key">
        <h2 class="text-xl font-semibold">{{ t('backups.title') }}</h2>
        <div class="grid gap-3">
            <div
                v-for="backup_path in backups"
                v-bind:key="backup_path"
                class="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10"
                    >
                        <Archive
                            class="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary"
                        />
                    </div>
                    <div>
                        <p class="font-medium">
                            {{ get_backup_name(backup_path) || backup_path }}
                        </p>
                        <p class="text-sm text-muted-foreground">{{ backup_path }}</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button
                            v-bind:variant="'outline'"
                            v-bind:size="'sm'"
                            v-bind:disabled="is_restoring"
                        >
                            {{ t('backups.more') }}
                            <ChevronDown class="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent v-bind:align="'end'">
                        <DropdownMenuItem v-on:click="handle_restore(backup_path)">
                            <MousePointerClick class="text-primary" />
                            <span>{{ t('backups.apply') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem v-on:click="open_rename_dialog(backup_path)">
                            <Pencil class="text-primary" />
                            <span>{{ t('backups.rename') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            v-on:click="handle_delete(backup_path)"
                            class="text-destructive focus:text-destructive"
                        >
                            <Trash2 />
                            <span>{{ t('backups.delete') }}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <Dialog v-model:open="state.rename_dialog_open">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{{ t('backups.renameTitle') }}</DialogTitle>
                </DialogHeader>
                <div class="space-y-4 py-4">
                    <div class="space-y-2">
                        <Label v-bind:for="'backup-name'">{{ t('backups.nameLabel') }}</Label>
                        <Input
                            v-bind:id="'backup-name'"
                            v-model:modelValue="state.rename_name"
                            v-bind:placeholder="t('backups.namePlaceholder')"
                            v-on:keydown="handle_rename_key"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        v-bind:variant="'outline'"
                        v-on:click="state.rename_dialog_open = false"
                    >
                        {{ t('common.cancel') }}
                    </Button>
                    <Button v-on:click="handle_rename" v-bind:disabled="!can_save_rename()">
                        {{ t('common.save') }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
