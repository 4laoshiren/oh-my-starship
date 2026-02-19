<script setup>
import { reactive, watch } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Switch from '@/components/ui/Switch.vue';
import Button from '@/components/ui/Button.vue';
import Tabs from '@/components/ui/Tabs.vue';
import TabsList from '@/components/ui/TabsList.vue';
import TabsTrigger from '@/components/ui/TabsTrigger.vue';
import TabsContent from '@/components/ui/TabsContent.vue';
import ColorPickerInput from '@/components/ui/ColorPickerInput.vue';
import StarshipLayout from '@/views/starship/StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';
import { parse_toml_section, update_toml_section } from '@/lib/toml-utils';

const { t } = useI18n();
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
        onSuccess: () => toast.success(t('starship.modules.git.branch.saveSuccess')),
        onError: (error) =>
            toast.error(t('starship.modules.saveFailed', { message: error.message })),
    });
}

function on_status_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'git_status', { ...status });
    save_toml(updated_toml, {
        onSuccess: () => toast.success(t('starship.modules.git.status.saveSuccess')),
        onError: (error) =>
            toast.error(t('starship.modules.saveFailed', { message: error.message })),
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
        <div v-if="is_loading" class="text-sm text-muted-foreground">{{ t('common.loading') }}</div>

        <div v-else class="space-y-6">
            <div class="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 class="text-lg font-medium">{{ t('starship.modules.git.title') }}</h3>
                    <p class="text-sm text-muted-foreground">
                        {{ t('starship.modules.git.subtitle') }}
                    </p>
                </div>
                <Button v-on:click="on_save" v-bind:disabled="is_pending" class="sm:self-start">
                    {{ is_pending ? t('common.saving') : t('common.saveChanges') }}
                </Button>
            </div>

            <Tabs v-model:modelValue="state.active_tab">
                <TabsList>
                    <TabsTrigger v-bind:value="'branch'">{{
                        t('starship.modules.git.branch.tab')
                    }}</TabsTrigger>
                    <TabsTrigger v-bind:value="'status'">{{
                        t('starship.modules.git.status.tab')
                    }}</TabsTrigger>
                </TabsList>

                <TabsContent v-bind:value="'branch'" class="mt-4">
                    <form v-on:submit.prevent="on_branch_submit" class="space-y-4">
                        <div
                            class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                        >
                            <div class="space-y-0.5">
                                <Label v-bind:for="'branch-disabled'">{{
                                    t('starship.modules.git.branch.hide')
                                }}</Label>
                                <p class="text-xs text-muted-foreground">
                                    {{ t('starship.modules.git.branch.hideDesc') }}
                                </p>
                            </div>
                            <Switch
                                v-bind:id="'branch-disabled'"
                                v-model:modelValue="branch.disabled"
                            />
                        </div>

                        <div class="grid gap-4">
                            <div class="space-y-2">
                                <Label v-bind:for="'branch-symbol'">{{
                                    t('starship.modules.git.branch.symbol')
                                }}</Label>
                                <Input
                                    v-bind:id="'branch-symbol'"
                                    v-model:modelValue="branch.symbol"
                                    v-bind:placeholder="' '"
                                    v-bind:disabled="branch.disabled"
                                    v-bind:class="'font-nerd'"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'branch-style'">{{
                                    t('starship.modules.git.branch.style')
                                }}</Label>
                                <ColorPickerInput
                                    v-bind:id="'branch-style'"
                                    v-model:modelValue="branch.style"
                                    v-bind:placeholder="'#a855f7'"
                                    v-bind:disabled="branch.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'branch-format'">{{
                                    t('starship.modules.git.branch.format')
                                }}</Label>
                                <Input
                                    v-bind:id="'branch-format'"
                                    v-model:modelValue="branch.format"
                                    v-bind:placeholder="'[$symbol$branch(:$remote_branch)]($style) '"
                                    v-bind:disabled="branch.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'branch-truncation_length'">{{
                                    t('starship.modules.git.branch.truncationLength')
                                }}</Label>
                                <Input
                                    v-bind:id="'branch-truncation_length'"
                                    v-bind:type="'number'"
                                    v-model:modelValue="branch.truncation_length"
                                    v-bind:placeholder="'9999'"
                                    v-bind:disabled="branch.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'branch-truncation_symbol'">{{
                                    t('starship.modules.git.branch.truncationSymbol')
                                }}</Label>
                                <Input
                                    v-bind:id="'branch-truncation_symbol'"
                                    v-model:modelValue="branch.truncation_symbol"
                                    v-bind:placeholder="'…'"
                                    v-bind:disabled="branch.disabled"
                                />
                            </div>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent v-bind:value="'status'" class="mt-4">
                    <form v-on:submit.prevent="on_status_submit" class="space-y-4">
                        <div
                            class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                        >
                            <div class="space-y-0.5">
                                <Label v-bind:for="'status-disabled'">{{
                                    t('starship.modules.git.status.hide')
                                }}</Label>
                                <p class="text-xs text-muted-foreground">
                                    {{ t('starship.modules.git.status.hideDesc') }}
                                </p>
                            </div>
                            <Switch
                                v-bind:id="'status-disabled'"
                                v-model:modelValue="status.disabled"
                            />
                        </div>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div class="space-y-2">
                                <Label v-bind:for="'status-style'">{{
                                    t('starship.modules.git.status.style')
                                }}</Label>
                                <ColorPickerInput
                                    v-bind:id="'status-style'"
                                    v-model:modelValue="status.style"
                                    v-bind:placeholder="'#ef4444'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-format'">{{
                                    t('starship.modules.git.status.format')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-format'"
                                    v-model:modelValue="status.format"
                                    v-bind:placeholder="'([$all_status$ahead_behind]($style)) '"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-ahead'">{{
                                    t('starship.modules.git.status.ahead')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-ahead'"
                                    v-model:modelValue="status.ahead"
                                    v-bind:placeholder="'⇡${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-behind'">{{
                                    t('starship.modules.git.status.behind')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-behind'"
                                    v-model:modelValue="status.behind"
                                    v-bind:placeholder="'⇣${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-diverged'">{{
                                    t('starship.modules.git.status.diverged')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-diverged'"
                                    v-model:modelValue="status.diverged"
                                    v-bind:placeholder="'⇕⇡${ahead_count}⇣${behind_count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-conflicted'">{{
                                    t('starship.modules.git.status.conflicted')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-conflicted'"
                                    v-model:modelValue="status.conflicted"
                                    v-bind:placeholder="'=${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-untracked'">{{
                                    t('starship.modules.git.status.untracked')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-untracked'"
                                    v-model:modelValue="status.untracked"
                                    v-bind:placeholder="'?${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-stashed'">{{
                                    t('starship.modules.git.status.stashed')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-stashed'"
                                    v-model:modelValue="status.stashed"
                                    v-bind:placeholder="'$${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-modified'">{{
                                    t('starship.modules.git.status.modified')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-modified'"
                                    v-model:modelValue="status.modified"
                                    v-bind:placeholder="'!${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-staged'">{{
                                    t('starship.modules.git.status.staged')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-staged'"
                                    v-model:modelValue="status.staged"
                                    v-bind:placeholder="'+${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-renamed'">{{
                                    t('starship.modules.git.status.renamed')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-renamed'"
                                    v-model:modelValue="status.renamed"
                                    v-bind:placeholder="'»${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label v-bind:for="'status-deleted'">{{
                                    t('starship.modules.git.status.deleted')
                                }}</Label>
                                <Input
                                    v-bind:id="'status-deleted'"
                                    v-model:modelValue="status.deleted"
                                    v-bind:placeholder="'✘${count}'"
                                    v-bind:disabled="status.disabled"
                                />
                            </div>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    </StarshipLayout>
</template>
