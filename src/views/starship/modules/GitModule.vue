<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ColorPickerInput from '@/components/ui/ColorPickerInput.vue';
import StarshipLayout from '@/views/starship/StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';
import { parse_toml_section, update_toml_section } from '@/lib/toml-utils';

const { t } = useI18n();
const toast = useToast();
const { data: toml, isLoading: is_loading } = use_starship_toml();
const { mutate: save_toml, isPending: is_pending } = use_save_starship_toml();

const state = reactive({ active_tab: 'branch' });

const branch_defaults = {
    symbol: ' ',
    style: '#a855f7',
    format: '[$symbol$branch(:$remote_branch)]($style) ',
    truncation_length: 9999,
    truncation_symbol: '…',
    disabled: false,
};

const status_defaults = {
    style: '#ef4444',
    format: '([$all_status$ahead_behind]($style)) ',
    ahead: '⇡${count}',
    behind: '⇣${count}',
    diverged: '⇕⇡${ahead_count}⇣${behind_count}',
    conflicted: '=${count}',
    untracked: '?${count}',
    stashed: '$${count}',
    modified: '!${count}',
    staged: '+${count}',
    renamed: '»${count}',
    deleted: '✘${count}',
    disabled: false,
};

const branch = reactive({ ...branch_defaults });
const status = reactive({ ...status_defaults });

const tab_items = [
    { label: t('starship.modules.git.branch.tab'), value: 'branch', slot: 'branch' },
    { label: t('starship.modules.git.status.tab'), value: 'status', slot: 'status' },
];

watch(
    toml,
    (val) => {
        if (val) {
            const branch_section = parse_toml_section(val, 'git_branch');
            const status_section = parse_toml_section(val, 'git_status');
            Object.assign(branch, { ...branch_defaults, ...branch_section });
            Object.assign(status, { ...status_defaults, ...status_section });
        }
    },
    { immediate: true }
);

function on_branch_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'git_branch', { ...branch });
    save_toml(updated_toml, {
        onSuccess: () =>
            toast.add({
                title: t('starship.modules.git.branch.saveSuccess'),
                color: 'success',
            }),
        onError: (error) =>
            toast.add({
                title: t('starship.modules.saveFailed', { message: error.message }),
                color: 'error',
            }),
    });
}

function on_status_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'git_status', { ...status });
    save_toml(updated_toml, {
        onSuccess: () =>
            toast.add({
                title: t('starship.modules.git.status.saveSuccess'),
                color: 'success',
            }),
        onError: (error) =>
            toast.add({
                title: t('starship.modules.saveFailed', { message: error.message }),
                color: 'error',
            }),
    });
}

function on_save() {
    if (state.active_tab === 'branch') {
        on_branch_submit();
    } else {
        on_status_submit();
    }
}
</script>

<template>
    <StarshipLayout>
        <div v-if="is_loading" class="text-sm text-(--ui-text-muted)">
            {{ t('common.loading') }}
        </div>

        <div v-else class="space-y-6">
            <div class="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 class="text-lg font-medium">{{ t('starship.modules.git.title') }}</h3>
                    <p class="text-sm text-(--ui-text-muted)">
                        {{ t('starship.modules.git.subtitle') }}
                    </p>
                </div>
                <UButton v-on:click="on_save" v-bind:disabled="is_pending" class="sm:self-start">
                    {{ is_pending ? t('common.saving') : t('common.saveChanges') }}
                </UButton>
            </div>

            <UTabs v-model:model-value="state.active_tab" v-bind:items="tab_items">
                <template #branch>
                    <form v-on:submit.prevent="on_branch_submit" class="mt-4 space-y-4">
                        <div
                            class="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-accented)/30 p-4 transition-colors hover:bg-(--ui-bg-accented)/50"
                        >
                            <div class="space-y-0.5">
                                <label v-bind:for="'branch-disabled'" class="text-sm font-medium">
                                    {{ t('starship.modules.git.branch.hide') }}
                                </label>
                                <p class="text-xs text-(--ui-text-muted)">
                                    {{ t('starship.modules.git.branch.hideDesc') }}
                                </p>
                            </div>
                            <USwitch
                                v-bind:id="'branch-disabled'"
                                v-model:model-value="branch.disabled"
                            />
                        </div>

                        <div class="grid gap-4">
                            <UFormField v-bind:label="t('starship.modules.git.branch.symbol')">
                                <UInput
                                    v-bind:id="'branch-symbol'"
                                    v-model:model-value="branch.symbol"
                                    v-bind:placeholder="' '"
                                    v-bind:disabled="branch.disabled"
                                    v-bind:class="'font-nerd'"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.branch.style')">
                                <ColorPickerInput
                                    v-bind:id="'branch-style'"
                                    v-model:modelValue="branch.style"
                                    v-bind:placeholder="'#a855f7'"
                                    v-bind:disabled="branch.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.branch.format')">
                                <UInput
                                    v-bind:id="'branch-format'"
                                    v-model:model-value="branch.format"
                                    v-bind:placeholder="'[$symbol$branch(:$remote_branch)]($style) '"
                                    v-bind:disabled="branch.disabled"
                                />
                            </UFormField>
                            <UFormField
                                v-bind:label="t('starship.modules.git.branch.truncationLength')"
                            >
                                <UInput
                                    v-bind:id="'branch-truncation_length'"
                                    v-bind:type="'number'"
                                    v-model:model-value="branch.truncation_length"
                                    v-bind:placeholder="'9999'"
                                    v-bind:disabled="branch.disabled"
                                />
                            </UFormField>
                            <UFormField
                                v-bind:label="t('starship.modules.git.branch.truncationSymbol')"
                            >
                                <UInput
                                    v-bind:id="'branch-truncation_symbol'"
                                    v-model:model-value="branch.truncation_symbol"
                                    v-bind:placeholder="'…'"
                                    v-bind:disabled="branch.disabled"
                                />
                            </UFormField>
                        </div>
                    </form>
                </template>

                <template #status>
                    <form v-on:submit.prevent="on_status_submit" class="mt-4 space-y-4">
                        <div
                            class="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-accented)/30 p-4 transition-colors hover:bg-(--ui-bg-accented)/50"
                        >
                            <div class="space-y-0.5">
                                <label v-bind:for="'status-disabled'" class="text-sm font-medium">
                                    {{ t('starship.modules.git.status.hide') }}
                                </label>
                                <p class="text-xs text-(--ui-text-muted)">
                                    {{ t('starship.modules.git.status.hideDesc') }}
                                </p>
                            </div>
                            <USwitch
                                v-bind:id="'status-disabled'"
                                v-model:model-value="status.disabled"
                            />
                        </div>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <UFormField v-bind:label="t('starship.modules.git.status.style')">
                                <ColorPickerInput
                                    v-bind:id="'status-style'"
                                    v-model:modelValue="status.style"
                                    v-bind:placeholder="'#ef4444'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.format')">
                                <UInput
                                    v-bind:id="'status-format'"
                                    v-model:model-value="status.format"
                                    v-bind:placeholder="'([$all_status$ahead_behind]($style)) '"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.ahead')">
                                <UInput
                                    v-bind:id="'status-ahead'"
                                    v-model:model-value="status.ahead"
                                    v-bind:placeholder="'⇡${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.behind')">
                                <UInput
                                    v-bind:id="'status-behind'"
                                    v-model:model-value="status.behind"
                                    v-bind:placeholder="'⇣${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.diverged')">
                                <UInput
                                    v-bind:id="'status-diverged'"
                                    v-model:model-value="status.diverged"
                                    v-bind:placeholder="'⇕⇡${ahead_count}⇣${behind_count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.conflicted')">
                                <UInput
                                    v-bind:id="'status-conflicted'"
                                    v-model:model-value="status.conflicted"
                                    v-bind:placeholder="'=${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.untracked')">
                                <UInput
                                    v-bind:id="'status-untracked'"
                                    v-model:model-value="status.untracked"
                                    v-bind:placeholder="'?${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.stashed')">
                                <UInput
                                    v-bind:id="'status-stashed'"
                                    v-model:model-value="status.stashed"
                                    v-bind:placeholder="'$${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.modified')">
                                <UInput
                                    v-bind:id="'status-modified'"
                                    v-model:model-value="status.modified"
                                    v-bind:placeholder="'!${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.staged')">
                                <UInput
                                    v-bind:id="'status-staged'"
                                    v-model:model-value="status.staged"
                                    v-bind:placeholder="'+${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.renamed')">
                                <UInput
                                    v-bind:id="'status-renamed'"
                                    v-model:model-value="status.renamed"
                                    v-bind:placeholder="'»${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                            <UFormField v-bind:label="t('starship.modules.git.status.deleted')">
                                <UInput
                                    v-bind:id="'status-deleted'"
                                    v-model:model-value="status.deleted"
                                    v-bind:placeholder="'✘${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </UFormField>
                        </div>
                    </form>
                </template>
            </UTabs>
        </div>
    </StarshipLayout>
</template>
